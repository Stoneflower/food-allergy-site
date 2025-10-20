exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, message } = JSON.parse(event.body || '{}');
    if (!name || !email || !message) {
      return { statusCode: 400, body: 'Missing fields' };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MAIL_TO = process.env.MAIL_TO;
    const MAIL_FROM = process.env.MAIL_FROM || 'noreply@onresend.com';
    if (!RESEND_API_KEY || !MAIL_TO) {
      return { statusCode: 500, body: 'Email env not configured' };
    }

    const subject = `【お問い合わせ】EATtoo から`;
    const header = '表示に問題があったり、こういうふうにしてほしいなど、ありましたらお送りください。\nお礼のメールもモチベーションに繋がるので、絶賛受付中です。\n\n';
    const text = `${header}お名前: ${name}\nメール: ${email}\n\n本文:\n${message}`;
    const html = `
      <div>
        <p>${header.replace(/\n/g, '<br/>')}</p>
        <p><strong>お名前:</strong> ${name}<br/>
        <strong>メール:</strong> ${email}</p>
        <p><strong>本文:</strong><br/>${(message || '').replace(/\n/g, '<br/>')}</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: MAIL_TO,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { statusCode: 502, body };
    }

    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
};


