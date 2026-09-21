# Infrastructure Architecture & Deep Audit Report

## 1. Executive Summary
An exhaustive read-only audit of the `between-us` codebase was conducted to diagnose the Stripe routing loop and map the current infrastructure. The audit confirms that the core Next.js routing, Stripe webhook logic, and Supabase database triggers are fundamentally sound. 

The **root cause of the OTP routing loop** is a fatal column mismatch in the Post-OTP profile query, which silently fails and defaults to unauthenticated routing paths.

---

## 2. Granular Audit Findings

### A. Post-OTP Handshake & Routing Loop (Root Cause)
- **Target Files**: `app/login/page.tsx` and `app/onboarding/page.tsx`
- **Mechanism**: After `supabase.auth.verifyOtp` succeeds, the client explicitly forces a session read (`getSession`) and then queries the `profiles` table to check the user's `is_active` status.
- **The Disconnect**: The query executed is `.select('is_active, nickname')`. However, the `profiles` table schema (defined in `00_init_schema.sql`) **does not contain a `nickname` column**. The actual column name is `anonymous_alias`.
- **The Result**: Because `nickname` does not exist, the Supabase PostgREST API throws a 400 error and returns `data: null`. The frontend code ignores the `error` object and evaluates `profile?.is_active`. Since `profile` is null, this evaluates to `false`, trapping the user in the Stripe checkout loop even after paying.

### B. Stripe Webhook Endpoint Lifecycle
- **Target File**: `app/api/webhooks/stripe/route.ts`
- **Mechanism**: The endpoint correctly isolates `STRIPE_WEBHOOK_SECRET` and utilizes `SUPABASE_SERVICE_ROLE_KEY` to securely bypass Row Level Security.
- **Data Flow**: 
  - On `checkout.session.completed`, it maps the `client_reference_id` (which was passed correctly from the frontend) to the Supabase User ID.
  - It executes a successful `UPDATE` on `profiles` to set `is_active = true`.
  - It successfully queries `group_members` to activate `connection_groups`. *(Note: If the user is brand new and has no group associations, the group activation is silently bypassed, which is acceptable at this stage).*

### C. Database Triggers & Security Policies (RLS)
- **Target Files**: `supabase/migrations/00000000000006_auto_profile_trigger.sql` and `00000000000005_profiles_update.sql`
- **Mechanism**:
  - The `on_auth_user_created` trigger executing `public.handle_new_user()` is configured correctly. Upon OTP creation in `auth.users`, a `public.profiles` row is automatically inserted with `is_active` defaulting to `false`.
  - The Row Level Security (RLS) policy `"Users can read own profile"` correctly maps `auth.uid() = id`, allowing the frontend query to retrieve the row (if the column names matched).

### D. Middleware & Caching Architecture
- **Target Files**: `middleware.ts` and `src/utils/supabase/middleware.ts`
- **Mechanism**: 
  - Webhooks, Auth Callbacks, `/login`, and `/onboarding` are explicitly bypassed using `NextResponse.next()`, meaning they are not prematurely booted by the middleware.
  - The `@supabase/supabase-js` client uses `cache: 'no-store'`, successfully bypassing aggressive Next.js caching.
- **Vulnerability Note**: The `middleware.ts` routes all non-bypassed traffic through `updateSession(request)`. While this refreshes the cookie, it **does not** redirect unauthenticated users away from `/dashboard`. The current dashboard is relying solely on Client Components rendering empty states when `session.user` is absent, rather than server-side route protection.

---

## 3. Required Modifications
To permanently resolve the login loop and align the database queries:

1. **Modify `app/login/page.tsx` & `app/onboarding/page.tsx`**:
   - Change `.select('is_active, nickname')` to `.select('is_active, anonymous_alias')`.
   - Update the conditional logic to evaluate `!profile.anonymous_alias` instead of `!profile.nickname`.
2. **Implement Server-Side Protection (Optional but Recommended)**:
   - Update `src/utils/supabase/middleware.ts` to actively redirect to `/login` if `await supabase.auth.getUser()` returns no user on protected routes like `/dashboard`.
