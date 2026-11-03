import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, inviteType, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json({ error: "Missing email or token." }, { status: 400 });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const joinLink = `https://betweenusapp.io/join?token=${token}`;
    let emailBody = "";

    if (inviteType === "couple") {
      emailBody = `Hey! I created a profile on Between Us. A private and discreet app designed to facilitate open and judgement free intimacy conversations. The app will learn our preference and evolve over time to generate custom-tailored intimacy games, date night ideas, role-play scenarios and encourage in-person conversations to enhance our relationship. Here is a link to merge our profiles. This allows us share our interests, desires and curiosities in a private setting. Allowing me to understand your evolving intimate preferences. This single-use link will expire as soon as you click it so it cannot be shared with anyone else.\n\nJoin here: ${joinLink}`;
    } else {
      emailBody = `Hey! Let's connect on Between Us to share our boundaries and curiosities in a private, judgement-free setting. This app allows us to securely communicate our preferences to ensure everyone is on the same page and comfortable. This single-use link will expire as soon as you click it so it cannot be shared with anyone else.\n\nJoin here: ${joinLink}`;
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Email delivery service not configured on server (missing RESEND_API_KEY)." },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error: resendError } = await resend.emails.send({
      from: 'Between Us <invites@betweenusapp.io>',
      to: sanitizedEmail,
      subject: "Between Us: New Notification",
      text: emailBody,
      html: `<div><p>${emailBody.replace(/\n\n/g, '</p><p>')}</p><p><a href="${joinLink}">Join here: ${joinLink}</a></p></div>`
    });

    if (resendError) {
      console.error("Resend invite send error:", resendError);
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    console.log(`[Email Dispatcher] Sent to: ${sanitizedEmail}`);

    return NextResponse.json({ success: true, message: "Invite sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
