import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Check if this is a Resend webhook event or a direct payload
    // Resend wraps webhooks in { type: 'email.received', data: { ... } }
    let emailData = payload;
    if (payload.type === 'email.received' && payload.data) {
      emailData = payload.data;
    }

    let subject = emailData.subject || payload.subject;
    const from = emailData.from || payload.from;
    const to = emailData.to || payload.to;
    let text = emailData.text || payload.text;
    let html = emailData.html || payload.html;

    // Check if the email was sent to our support or jd3 inbox
    const recipientList = Array.isArray(to) ? to.join(',') : (to || '');
    if (!recipientList.includes('support@betweenusapp.io') && !recipientList.includes('jd3@betweenusapp.io')) {
      return NextResponse.json({ success: true, message: 'Ignored: Not directed to support or jd3 inbox.' });
    }

    // Forward the parsed email to the designated admin inbox
    const adminEmail = 'jdcdjd664411@proton.me';
    
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // If text/html body is missing and email_id is available, fetch full email content via Resend API
      const emailId = emailData.email_id || emailData.id || payload.email_id;
      if (emailId && (!text && !html)) {
        try {
          const { data: inboundEmail } = await resend.emails.receiving.get(emailId);
          if (inboundEmail) {
            if (inboundEmail.subject && !subject) subject = inboundEmail.subject;
            if (inboundEmail.text) text = inboundEmail.text;
            if (inboundEmail.html) html = inboundEmail.html;
          }
        } catch (fetchErr) {
          console.warn('Could not fetch full email via Resend receiving API:', fetchErr);
        }
      }

      // Explicitly map incoming parsed subject, text, and html
      const emailSubject = subject || 'No Subject';
      const emailText = text || 'No text content';
      const emailHtml = html || (text ? `<div>${text.replace(/\n/g, '<br/>')}</div>` : '<p>No content</p>');

      // 1. Forward the parsed email to the designated admin inbox using Resend SDK
      await resend.emails.send({
        from: 'Between Us Support Forwarder <alerts@betweenusapp.io>',
        to: adminEmail,
        replyTo: from, // Allow admin to reply directly to the user
        subject: `[SUPPORT TICKET] ${emailSubject}`,
        text: `Original Sender: ${from}\n\n${emailText}`,
        html: `<div><p><strong>Original Sender:</strong> ${from}</p><hr/>${emailHtml}</div>`
      });
      console.log(`Support email from ${from} forwarded to ${adminEmail}`);

      // 2. Automated email reply for inbound messages to support@betweenusapp.io
      if (recipientList.includes('support@betweenusapp.io') && from) {
        const userEmail = from.match(/<([^>]+)>/)?.[1] || from;
        const autoReplyCopy = "Please allow 48 hours for a reply. If you do not receive a response within 48 hours, feel free to give us a call at (224) 479-1076.";

        await resend.emails.send({
          from: 'Between Us Support <support@betweenusapp.io>',
          to: userEmail,
          subject: `Re: ${emailSubject}`,
          text: `Thank you for contacting Between Us Support.\n\n${autoReplyCopy}\n\nBest regards,\nBetween Us Support Team`,
          html: `<div>
            <p>Thank you for contacting Between Us Support.</p>
            <p>${autoReplyCopy}</p>
            <br/>
            <p>Best regards,<br/>Between Us Support Team</p>
          </div>`
        });
        console.log(`Support auto-reply sent to ${userEmail}`);
      }
    } else {
      console.warn('RESEND_API_KEY not configured. Support email not forwarded or auto-replied.');
    }

    return NextResponse.json({ success: true, message: 'Email forwarded to admin successfully.' });
  } catch (error: any) {
    console.error('Inbound Email Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
