import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { 
      selectedBoundaries, 
      kinkSummary, 
      instructions, 
      contactMethod, 
      contactInfo 
    } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user id from auth headers if possible, or just generate the token
    // For this context we'll create the token directly
    const inviteToken = crypto.randomUUID();
    
    // Store the structured JSON payload securely attached to the token
    const payload = JSON.stringify({
      selectedBoundaries,
      kinkSummary,
      instructions
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from("invitations").insert({
      invite_token: inviteToken,
      invite_type: "guest_pass",
      expires_at: expiresAt.toISOString(),
      preferences: payload // Assuming preferences column can store this JSON string
    });

    if (error) throw error;

    const signupLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenus.app'}/signup?pass=${inviteToken}`;
    const messageBody = `You've been invited to a secure Between Us Guest Pass! Create your account to view instructions and shared boundaries here: ${signupLink}`;

    // Dispatch via Resend SMTP
    if (contactMethod === 'email' && contactInfo) {
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Between Us <invites@betweenus.app>',
            to: contactInfo,
            subject: 'You have a Between Us Guest Pass Waiting',
            html: `<p>You've been invited to a secure Between Us Guest Pass.</p><p>The sender has shared specific desires, kinks, and instructions for a memorable experience.</p><p><a href="${signupLink}">Create your account here to view the pass</a>.</p>`
          })
        });
      } else {
        console.warn("RESEND_API_KEY not configured. Email not sent.");
      }
    } 
    // Dispatch via Twilio SMS
    else if (contactMethod === 'sms' && contactInfo) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', contactInfo);
        formData.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        formData.append('Body', messageBody);

        await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });
      } else {
        console.warn("Twilio credentials not configured. SMS not sent.");
      }
    }

    return NextResponse.json({ success: true, token: inviteToken });
  } catch (error: any) {
    console.error("Invite Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
