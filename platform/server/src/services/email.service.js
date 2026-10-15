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

/**
 * Send welcome email to newly registered users.
 * @param {string} email
 * @param {string} name
 * @param {string} [role]
 */
export async function sendWelcomeEmail(email, name = 'Customer', role = 'buyer') {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'WeyniShop <noreply@weynishop.com>';
  const storefrontUrl = process.env.STOREFRONT_URL || 'https://www.weynishop.com';

  const roleText =
    role === 'seller'
      ? 'Your seller account has been registered! You can now start listing products and growing your online business.'
      : role === 'delivery'
      ? 'Your courier account has been registered! You can now pick up orders and earn on every delivery.'
      : 'Welcome to WeyniShop! Enjoy seamless online shopping with fast home delivery and exclusive discounts.';

  const subject = `Welcome to WeyniShop, ${name}! 🎉`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .logo { font-size: 26px; font-weight: 800; color: #ec5c2c; margin-bottom: 20px; letter-spacing: -0.5px; }
        .title { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .desc { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .highlight { background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #9a3412; }
        .btn { display: inline-block; background: #ec5c2c; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; text-align: center; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">WeyniShop</div>
        <div class="title">Welcome aboard, ${name}! 👋</div>
        <div class="desc">${roleText}</div>
        <div class="highlight">
          <strong>Quick Tip:</strong> Download the official WeyniShop Android app or add WeyniShop to your home screen for instant delivery notifications and tracking.
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${storefrontUrl}" class="btn">Explore WeyniShop</a>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} WeyniShop Marketplace. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  if (!mailer) {
    log(`[SIMULATED EMAIL] SMTP not configured. Welcome email for ${email} (${name})`);
    return { ok: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({ from, to: email, subject, html });
    log(`Sent welcome email to ${email}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    log(`Failed to send welcome email to ${email}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send order confirmation / purchase receipt email to the buyer.
 * @param {object} order
 * @param {object} buyer
 */
export async function sendOrderConfirmationEmail(order, buyer) {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'WeyniShop <noreply@weynishop.com>';
  const storefrontUrl = process.env.STOREFRONT_URL || 'https://www.weynishop.com';

  const buyerEmail = buyer?.email || order?.buyer?.email;
  const buyerName = buyer?.name || order?.buyer?.name || 'Customer';
  if (!buyerEmail) return { ok: false, error: 'No buyer email' };

  const items = order.items || [];
  const itemsHtml = items
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; font-size: 14px; color: #1e293b;">${it.name || 'Item'}</td>
        <td style="padding: 10px 0; font-size: 14px; text-align: center; color: #64748b;">x${it.quantity || it.qty || 1}</td>
        <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 600; color: #0f172a;">${it.price || it.unitPrice || 0} ETB</td>
      </tr>
    `
    )
    .join('');

  const subject = `Order Confirmed #${order.id} — WeyniShop 🛍️`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .logo { font-size: 26px; font-weight: 800; color: #ec5c2c; margin-bottom: 16px; letter-spacing: -0.5px; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
        .desc { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .total-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #ec5c2c; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; text-align: center; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">WeyniShop</div>
        <div class="title">Thank you for your order, ${buyerName}! 🎉</div>
        <div class="desc">We've received your order <strong>#${order.id}</strong> and notified the seller. You can track your delivery live on the WeyniShop app.</div>
        
        <table class="table">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #94a3b8;">
              <th style="text-align: left; padding-bottom: 8px;">Product</th>
              <th style="text-align: center; padding-bottom: 8px;">Qty</th>
              <th style="text-align: right; padding-bottom: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #64748b;">
            <span>Delivery Address:</span>
            <span style="font-weight: 500; color: #0f172a; text-align: right;">${order.deliveryAddress || 'Standard Address'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px;">
            <span>Total Paid:</span>
            <span style="color: #ec5c2c;">${order.total || order.subtotal || 0} ETB</span>
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${storefrontUrl}/buyer/orders/${order.id}" class="btn">Track Order Live</a>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} WeyniShop Marketplace. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  if (!mailer) {
    log(`[SIMULATED EMAIL] SMTP not configured. Order confirmation for #${order.id} to ${buyerEmail}`);
    return { ok: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({ from, to: buyerEmail, subject, html });
    log(`Sent order confirmation email to ${buyerEmail}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    log(`Failed to send order email to ${buyerEmail}:`, err.message);
    return { ok: false, error: err.message };
  }
}

