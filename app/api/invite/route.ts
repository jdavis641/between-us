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
      email,
      nickname,
      phoneNumber,
      mobileNumber,
      expirationHours = 24
    } = body;

    const authSupabase = await createClient();
    let { data: { user } } = await authSupabase.auth.getUser();

    const authHeader = req.headers.get('Authorization');
    const explicitToken = authHeader?.replace('Bearer ', '')?.trim();
    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      const tokenRes = await authSupabase.auth.getUser(explicitToken);
      user = tokenRes.data?.user || null;
    }

    const supabase = createClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rawIdentifier = (contactInfo || email || nickname || '').trim();
    const isSms = contactMethod === 'sms';
    const targetPhone = phoneNumber || mobileNumber || (isSms ? rawIdentifier : null);

    let recipientIdentifier = rawIdentifier;
    let recipientEmail: string | null = rawIdentifier.includes('@') ? rawIdentifier : null;

    if (!isSms) {
      if (!rawIdentifier) {
        return NextResponse.json({ error: "Please enter an email address or nickname." }, { status: 400 });
      }

      // Query profiles table to resolve nickname / anonymous_alias / email to UUID
      const { data: matchedProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, nickname, anonymous_alias')
        .or(`email.ilike.${rawIdentifier},nickname.ilike.${rawIdentifier},anonymous_alias.ilike.${rawIdentifier}`)
        .limit(1)
        .maybeSingle();

      if (profileErr) {
        console.warn("Profile query warning in invite route:", profileErr);
      }

      if (matchedProfile) {
        // Correctly query the profiles table to resolve identifier to a UUID
        recipientIdentifier = matchedProfile.id;
        if (matchedProfile.email) {
          recipientEmail = matchedProfile.email;
        }
      } else if (rawIdentifier.includes('@')) {
        // Gracefully process the invite for a non-registered email
        recipientEmail = rawIdentifier;
        recipientIdentifier = rawIdentifier;
      } else {
        return NextResponse.json({
          error: `No registered user found with nickname "${rawIdentifier}". Please verify the nickname or enter their email address.`
        }, { status: 404 });
      }
    } else {
      if (!targetPhone) {
        return NextResponse.json({ error: "Please enter a valid mobile number for SMS dispatch." }, { status: 400 });
      }
      recipientIdentifier = targetPhone;
    }

    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (Number(expirationHours) || 24));

    // Save Guest Pass configuration for the sender if authenticated
    if (user?.id) {
      try {
        const kinksList = Array.isArray(kinkSummary)
          ? kinkSummary
          : (kinkSummary ? kinkSummary.split('\n\n').filter((k: string) => k.trim()) : []);
        await supabase.from('intimacy_preferences').upsert({
          user_id: user.id,
          category_tag: 'Guest Pass Config',
          preference_level: 'System',
          kinks_override: JSON.stringify({
            boundaries: selectedBoundaries || [],
            kinks: kinksList,
            instructions: instructions || ''
          }),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, category_tag' });
      } catch (prefErr) {
        console.warn("Could not persist guest pass preferences:", prefErr);
      }
    }

    // Cleanly matches database schema for public.invitations
    const insertPayload: Record<string, any> = {
      recipient_identifier: recipientIdentifier,
      invite_token: inviteToken,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    };
    if (user?.id) {
      insertPayload.sender_id = user.id;
    }

    const { error: insertError } = await supabase.from("invitations").insert(insertPayload);
    if (insertError) {
      console.error("Database insert error in invitations:", insertError);
      throw insertError;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenusapp.io';
    const guestPassUrl = `${baseUrl}/signin?pass=${inviteToken}`;
    const messageBody = `You've been invited to a secure Between Us Guest Pass! Please log in and check your Between Us inbox for details: ${guestPassUrl}`;

    // Dispatch via Resend (email)
    if (recipientEmail) {
      if (process.env.RESEND_API_KEY) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Between Us <invites@betweenusapp.io>',
              to: recipientEmail,
              subject: 'You have a Between Us Guest Pass Waiting',
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
                  <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">You've been invited to a secure Between Us Guest Pass</h2>
                  <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">The sender has shared specific desires, kinks, and instructions for a memorable experience. Please log in and check your Between Us inbox for details.</p>
                  <p style="margin: 28px 0; text-align: center;">
                    <a href="${guestPassUrl}" style="background-color: #7f1d1d; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(127, 29, 29, 0.4);">
                      Log In & Check Inbox
                    </a>
                  </p>
                  <p style="font-size: 12px; color: #71717a; text-align: center;">Direct link: <a href="${guestPassUrl}" style="color: #ef4444;">${guestPassUrl}</a></p>
                </div>
              `
            })
          });
          if (!resendRes.ok) {
            const errText = await resendRes.text();
            console.error("Resend invite email dispatch error:", errText);
          }
        } catch (resendErr) {
          console.error("Failed to send invite email via Resend:", resendErr);
        }
      } else {
        console.warn("RESEND_API_KEY not configured. Email dispatch skipped.");
      }
    }

    // Dispatch via Twilio SMS
    if (targetPhone) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const digitsOnly = targetPhone.replace(/[^\d+]/g, '');
          const formattedPhone = targetPhone.startsWith('+')
            ? targetPhone
            : (digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`);

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
          const formData = new URLSearchParams();
          formData.append('To', formattedPhone);
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
          }
        } catch (twilioErr) {
          console.error("Failed to send invite SMS via Twilio:", twilioErr);
        }
      } else {
        console.warn("Twilio credentials not configured. SMS not sent.");
      }
    }

    return NextResponse.json({
      success: true,
      token: inviteToken,
      url: guestPassUrl,
      recipientIdentifier
    });
  } catch (error: any) {
    console.error("Guest Pass Delivery Error:", error);
    return NextResponse.json({ error: error.message || "Failed to deliver guest pass" }, { status: 500 });
  }
}
