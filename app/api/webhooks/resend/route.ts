import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Check if this is a Resend webhook event or a direct payload
    // Resend wraps webhooks in { type: 'email.received', data: { ... } }
    let emailData = payload;
    if (payload.type === 'email.received' && payload.data) {
      emailData = payload.data;
    }

    const { subject, from, to, text, html } = emailData;

    // Check if the email was sent to our support or jd3 inbox
    const recipientList = Array.isArray(to) ? to.join(',') : (to || '');
    if (!recipientList.includes('support@betweenusapp.io') && !recipientList.includes('jd3@betweenusapp.io')) {
      return NextResponse.json({ success: true, message: 'Ignored: Not directed to support or jd3 inbox.' });
    }

    // Forward the parsed email to the designated admin inbox
    const adminEmail = 'jdcdjd664411@proton.me';
    
    if (process.env.RESEND_API_KEY) {
      // 1. Forward the parsed email to the designated admin inbox
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Between Us Support Forwarder <alerts@betweenusapp.io>',
          to: adminEmail,
          reply_to: from, // Allow admin to reply directly to the user
          subject: `[SUPPORT TICKET] ${subject || 'No Subject'}`,
          text: `Original Sender: ${from}\n\n${text || 'No text content'}`,
          html: `<div><p><strong>Original Sender:</strong> ${from}</p><hr/>${html || text || '<p>No content</p>'}</div>`
        })
      });
      console.log(`Support email from ${from} forwarded to ${adminEmail}`);

      // 2. Automated email reply for inbound messages to support@betweenusapp.io
      if (recipientList.includes('support@betweenusapp.io') && from) {
        const userEmail = from.match(/<([^>]+)>/)?.[1] || from;
        const autoReplyCopy = "Please allow 48 hours for a reply. If you do not receive a response within 48 hours, feel free to give us a call at (224) 479-1076.";

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Between Us Support <support@betweenusapp.io>',
            to: userEmail,
            subject: `Re: ${subject || 'Your Support Request - Between Us'}`,
            text: `Thank you for contacting Between Us Support.\n\n${autoReplyCopy}\n\nBest regards,\nBetween Us Support Team`,
            html: `<div>
              <p>Thank you for contacting Between Us Support.</p>
              <p>${autoReplyCopy}</p>
              <br/>
              <p>Best regards,<br/>Between Us Support Team</p>
            </div>`
          })
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
