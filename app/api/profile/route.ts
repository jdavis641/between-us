import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[API /api/profile] Warning: SUPABASE_SERVICE_ROLE_KEY is not set in environment!');
  }

  return createAdminSupabase(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function resolveUser(req: Request) {
  const admin = getAdminClient();
  let user: any = null;

  // 1. Try Authorization header Bearer token first
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const { data: jwtData, error: jwtError } = await admin.auth.getUser(token);
        if (jwtData?.user && !jwtError) {
          user = jwtData.user;
        }
      } catch (e) {
        console.warn('[API /api/profile] admin.auth.getUser(token) failed:', e);
      }
    }
  }

  // 2. Try cookie-based session via createServerSupabase()
  if (!user) {
    try {
      const supabase = await createServerSupabase();
      const { data: cookieUserData, error: cookieAuthError } = await supabase.auth.getUser();
      if (cookieUserData?.user && !cookieAuthError) {
        user = cookieUserData.user;
      }
    } catch (e) {
      console.warn('[API /api/profile] Cookie-based getUser() failed:', e);
    }
  }

  return user;
}

/**
 * GET /api/profile
 * Returns the authenticated user's fresh profile with un-cached service-role authority.
 */
export async function GET(req: Request) {
  try {
    const user = await resolveUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[API /api/profile GET] Error fetching profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { profile, user: { id: user.id, email: user.email } },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('[API /api/profile GET] Exception:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/profile
 * Permanently updates user profile columns (including mobile_number) using service-role authority,
 * bypassing PostgreSQL column-level grant omissions and RLS restrictions.
 */
export async function POST(req: Request) {
  try {
    const user = await resolveUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const updatePayload: Record<string, any> = {};

    if ('mobile_number' in body) {
      updatePayload.mobile_number = body.mobile_number ? String(body.mobile_number).trim() : null;
    }
    if ('nickname' in body && body.nickname !== undefined) {
      updatePayload.nickname = String(body.nickname).trim();
    }
    if ('anonymous_alias' in body && body.anonymous_alias !== undefined) {
      updatePayload.anonymous_alias = String(body.anonymous_alias).trim();
    }
    if ('pronouns' in body) {
      updatePayload.pronouns = body.pronouns ? String(body.pronouns).trim() : null;
    }
    if ('base_tolerance' in body) {
      updatePayload.base_tolerance = body.base_tolerance || null;
    }
    if ('last_survey_prompted_at' in body) {
      updatePayload.last_survey_prompted_at = body.last_survey_prompted_at;
    }
    if ('onboarding_completed' in body) {
      updatePayload.onboarding_completed = Boolean(body.onboarding_completed);
    }
    if ('literature_prompt_status' in body) {
      updatePayload.literature_prompt_status = body.literature_prompt_status;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid profile fields provided for update' }, { status: 400 });
    }

    console.log(`[API /api/profile POST] Committing profile update for user ${user.id}:`, updatePayload);

    const admin = getAdminClient();

    // 1. Attempt UPDATE
    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('[API /api/profile POST] Database rejected profile update:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. If row did not exist yet, UPSERT
    if (!updatedProfile) {
      console.log(`[API /api/profile POST] Profile row not found for user ${user.id}, performing upsert...`);
      const { data: upsertedProfile, error: upsertError } = await admin
        .from('profiles')
        .upsert(
          { id: user.id, email: user.email, ...updatePayload },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error('[API /api/profile POST] Upsert error:', upsertError);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Profile created and updated successfully',
        profile: upsertedProfile
      });
    }

    console.log(`[API /api/profile POST] Successfully updated profile for user ${user.id}:`, updatedProfile);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (err: any) {
    console.error('[API /api/profile POST] Exception:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
