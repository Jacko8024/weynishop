import nodemailer from 'nodemailer';

const log = (...args) => console.log('[email]', ...args);

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    log(`Configured SMTP transporter for host: ${host}`);
  }

  return transporter;
}

/**
 * Send 6-digit verification OTP email for password reset or email confirmation.
 * @param {string} email
 * @param {string} otp
 * @param {string} [name]
 */
export async function sendOtpEmail(email, otp, name = 'Valued Customer') {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'WeyniShop <noreply@weynishop.com>';

  const subject = `${otp} is your WeyniShop verification code`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .logo { font-size: 24px; font-weight: 800; color: #ec5c2c; margin-bottom: 20px; letter-spacing: -0.5px; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .desc { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
        .otp-box { background: #fff7ed; border: 2px dashed #fdba74; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">WeyniShop</div>
        <div class="title">Reset your password</div>
        <div class="desc">Hello ${name},<br>We received a request to reset your WeyniShop password. Use the verification code below to proceed:</div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <div class="desc" style="font-size: 13px;">This code will expire in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} WeyniShop Marketplace. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  if (!mailer) {
    log(`[SIMULATED EMAIL] SMTP not configured. OTP for ${email}: ${otp}`);
    return { ok: true, simulated: true, otp };
  }

  try {
    const info = await mailer.sendMail({
      from,
      to: email,
      subject,
      html,
    });
    log(`Sent OTP email to ${email}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    log(`Failed to send email to ${email}:`, err.message);
    // Still resolve so client flow is unblocked with appropriate notice
    return { ok: false, error: err.message, otp };
  }
}
