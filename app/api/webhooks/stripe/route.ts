import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia',
});

// Use the Service Role key to securely bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const email = session.customer_details?.email;
      let targetUserId = userId;

      if (!targetUserId && email) {
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (!authError) {
          const user = users.find(u => u.email === email);
          if (user) targetUserId = user.id;
        }
      }

      if (targetUserId) {
        // a) Update profiles table to activate the user
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ is_active: true })
          .eq('id', targetUserId);
          
        if (profileError) {
          console.error('[Stripe Webhook] Error updating profile:', profileError);
        }

        // b) Activate connection groups
        const { data: memberships } = await supabaseAdmin
          .from('group_members')
          .select('group_id')
          .eq('user_id', targetUserId);

        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map(m => m.group_id);
          const { error: groupError } = await supabaseAdmin
            .from('connection_groups')
            .update({ status: 'active' })
            .in('id', groupIds);
          
          if (groupError) throw groupError;
          console.log(`[Stripe Webhook] Successfully activated subscription for user: ${targetUserId}`);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      // In a real scenario we'd map subscription.customer -> customer ID -> our users.
      // But we can fallback to extracting customer email if available, or finding user by stripe_customer_id
      // Assuming we stored stripe_customer_id in profiles, we'd query by that.
      // For this implementation, we handle it if metadata exists.
      
      let customerEmail = '';
      if (typeof subscription.customer === 'string') {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (!customer.deleted) {
           customerEmail = customer.email || '';
        }
      }

      if (customerEmail) {
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (!authError) {
          const user = users.find(u => u.email === customerEmail);
          if (user) {
             await supabaseAdmin
               .from('profiles')
               .update({ is_active: false })
               .eq('id', user.id);

             const { data: memberships } = await supabaseAdmin
               .from('group_members')
               .select('group_id')
               .eq('user_id', user.id);

             if (memberships && memberships.length > 0) {
               const groupIds = memberships.map(m => m.group_id);
               await supabaseAdmin
                 .from('connection_groups')
                 .update({ status: 'inactive' })
                 .in('id', groupIds);
               console.log(`[Stripe Webhook] Successfully deactivated subscription for user: ${user.id}`);
             }
          }
        }
      }
    }

  } catch (err) {
    console.error('Error processing Stripe event:', err);
  }

  // Acknowledge receipt
  return NextResponse.json({ received: true });
}
