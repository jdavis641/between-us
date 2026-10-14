import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createClientBase } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      selectedBoundaries, 
      kinkSummary, 
      instructions, 
      contactMethod = 'email', 
      contactInfo,
      phoneNumber,
      mobileNumber,
      expirationHours = 24,
      groupId,
      inviteType = 'guest_pass'
    } = body;

    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    const supabase = createClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const inviteToken = crypto.randomUUID();
    
    // Store structured JSON payload attached to the token
    const payload = JSON.stringify({
      selectedBoundaries: selectedBoundaries || [],
      kinkSummary: kinkSummary || '',
      instructions: instructions || ''
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (Number(expirationHours) || 24));

    const { error } = await supabase.from("invitations").insert({
      invite_token: inviteToken,
      invite_type: inviteType,
      expires_at: expiresAt.toISOString(),
      preferences: payload,
      ...(user && { sender_id: user.id }),
      ...(groupId && { group_id: groupId })
    });

    if (error) {
      console.error("Database insert error in invite generation:", error);
      throw error;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenus.app';
    const signupLink = `${baseUrl}/signup?pass=${inviteToken}`;
    const messageBody = `You've been invited to a secure Between Us Guest Pass! Create your account to view instructions and shared boundaries here: ${signupLink}`;

    const targetPhone = phoneNumber || mobileNumber || (contactMethod === 'sms' ? contactInfo : null);

    // Trigger Twilio SMS Dispatch using active environment variables
    if (targetPhone) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', targetPhone);
        formData.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        formData.append('Body', messageBody);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        if (!twilioRes.ok) {
          const errText = await twilioRes.text();
          console.error("Twilio SMS dispatch failed:", errText);
        } else {
          console.log(`Twilio SMS successfully dispatched to ${targetPhone}`);
        }
      } else {
        console.warn("Twilio credentials not configured. SMS not sent.");
      }
    }

    // Trigger Resend Email Dispatch if contactMethod is email
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

    return NextResponse.json({ success: true, token: inviteToken });
  } catch (error: any) {
    console.error("Invite Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate invite" }, { status: 500 });
  }
}
