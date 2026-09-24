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

    // Check if the email was sent to our support inbox
    const recipientList = Array.isArray(to) ? to.join(',') : (to || '');
    if (!recipientList.includes('support@betweenusapp.io')) {
      return NextResponse.json({ success: true, message: 'Ignored: Not directed to support inbox.' });
    }

    // Forward the parsed email to the designated admin inbox
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@betweenusapp.io';
    
    if (process.env.RESEND_API_KEY) {
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
    } else {
      console.warn('RESEND_API_KEY not configured. Support email not forwarded.');
    }

    return NextResponse.json({ success: true, message: 'Email forwarded to admin successfully.' });
  } catch (error: any) {
    console.error('Inbound Email Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
