import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createClientBase } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

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

    const rawContact = (contactInfo || '').trim();
    const rawEmail = (email || (rawContact.includes('@') ? rawContact : '')).trim();
    const isContactMethodSms = contactMethod === 'sms';
    const isNumericContact = /^[\d\s+\-().]{7,}$/.test(rawContact);
    const rawPhone = (phoneNumber || mobileNumber || (isContactMethodSms || isNumericContact ? rawContact : '')).trim();
    const rawNickname = (nickname || (!rawContact.includes('@') && !isNumericContact ? rawContact : '')).trim();

    const phoneDigits = (rawPhone || rawContact).replace(/[^\d]/g, '');

    let recipientEmail: string | null = rawEmail || null;
    let targetPhone: string | null = rawPhone || (phoneDigits.length >= 7 ? rawContact : null) || null;
    let recipientUserId: string | null = null;
    let matchedProfile: any = null;

    // 1. Resolve Recipient in Directory (by email, nickname, anonymous_alias, or mobile_number)
    const orConditions: string[] = [];
    if (recipientEmail) {
      orConditions.push(`email.ilike.${recipientEmail}`);
    }
    if (rawNickname) {
      orConditions.push(`nickname.ilike.${rawNickname}`);
      orConditions.push(`anonymous_alias.ilike.${rawNickname}`);
    }
    if (rawContact && !rawContact.includes('@') && !isNumericContact) {
      orConditions.push(`nickname.ilike.${rawContact}`);
      orConditions.push(`anonymous_alias.ilike.${rawContact}`);
    }
    if (phoneDigits && phoneDigits.length >= 7) {
      const last10 = phoneDigits.slice(-10);
      orConditions.push(`mobile_number.ilike.%${last10}%`);
    }

    if (orConditions.length > 0) {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, nickname, anonymous_alias, mobile_number')
        .or(orConditions.join(','))
        .limit(1)
        .maybeSingle();

      if (profileErr) {
        console.warn("Profile directory query warning in invite route:", profileErr);
      }

      if (data) {
        matchedProfile = data;
        recipientUserId = data.id;
        if (!recipientEmail && data.email) {
          recipientEmail = data.email;
        }
        if (!targetPhone && data.mobile_number) {
          targetPhone = data.mobile_number;
        }
      }
    }

    // Set canonical recipient identifier
    let recipientIdentifier = recipientUserId || recipientEmail || targetPhone || rawContact || rawNickname || 'guest';

    if (!recipientUserId && !recipientEmail && !targetPhone) {
      return NextResponse.json({
        error: `Could not resolve recipient for "${rawContact || rawNickname || 'input'}". Please verify their email, mobile number, or nickname.`
      }, { status: 404 });
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

    let senderName = "Your Partner";
    if (user?.id) {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('nickname, anonymous_alias')
        .eq('id', user.id)
        .maybeSingle();
      if (senderProfile?.nickname || senderProfile?.anonymous_alias) {
        senderName = senderProfile.nickname || senderProfile.anonymous_alias;
      }
    }

    const boundariesList = Array.isArray(selectedBoundaries) && selectedBoundaries.length > 0 
      ? selectedBoundaries.join(', ') 
      : 'Standard intimate boundaries';
    const kinksFormatted = Array.isArray(kinkSummary) 
      ? kinkSummary.join(', ') 
      : (kinkSummary || 'None specified');
    const instructionsText = instructions || 'No special instructions provided.';

    const dispatchResults = {
      email: false,
      sms: false,
      inbox: false
    };

    // ==========================================
    // DISPATCH 1: EMAIL (Resend)
    // ==========================================
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
              subject: `You have a Between Us Guest Pass from ${senderName}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
                  <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">You've been invited to a secure Between Us Guest Pass</h2>
                  <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">${senderName} has shared specific desires, kinks, and instructions for a memorable experience. Please log in and check your Between Us inbox for details.</p>
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
          if (resendRes.ok) {
            dispatchResults.email = true;
          } else {
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

    // ==========================================
    // DISPATCH 2: SMS (Twilio)
    // ==========================================
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
          if (twilioRes.ok) {
            dispatchResults.sms = true;
          } else {
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

    // ==========================================
    // DISPATCH 3: INBOX (in_app_messages)
    // ==========================================
    if (recipientUserId) {
      try {
        const inboxMessage = `You have received a Between Us Guest Pass from ${senderName}!\n\n` +
          `SHARED BOUNDARIES:\n${boundariesList}\n\n` +
          `SHARED DESIRES & KINKS:\n${kinksFormatted}\n\n` +
          `GUEST INSTRUCTIONS & CHEAT CODES:\n"${instructionsText}"\n\n` +
          `Direct Pass Link: ${guestPassUrl}\n\n` +
          `Please review the boundaries and explore your personalized experiences together!`;

        const { error: msgErr } = await supabase.from('in_app_messages').insert({
          user_id: recipientUserId,
          subject: `Guest Pass from ${senderName}: Instructions & Desires`,
          message: inboxMessage,
          is_read: false
        });

        if (!msgErr) {
          dispatchResults.inbox = true;
        } else {
          console.error("Failed to insert inbox message:", msgErr);
        }
      } catch (inboxErr) {
        console.error("Failed to dispatch inbox message:", inboxErr);
      }
    }

    return NextResponse.json({
      success: true,
      token: inviteToken,
      url: guestPassUrl,
      recipientIdentifier,
      dispatched: dispatchResults
    });
  } catch (error: any) {
    console.error("Guest Pass Delivery Error:", error);
    return NextResponse.json({ error: error.message || "Failed to deliver guest pass" }, { status: 500 });
  }
}
