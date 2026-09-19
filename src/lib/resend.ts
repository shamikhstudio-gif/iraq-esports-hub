import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_default_ieh_key';
export const resend = new Resend(resendApiKey);

export function generateVerificationEmailHtml(code: string, recipientName: string = 'اللاعب') {
  return `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="utf-8">
    <title>كود تأكيد التسجيل - شبكة بابل للرياضات الإلكترونية</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8fafc;
        margin: 0;
        padding: 40px 20px;
        direction: rtl;
        text-align: right;
        color: #000000;
      }
      .container {
        max-width: 560px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 40px;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f1f5f9;
      }
      .logo-text {
        font-size: 24px;
        font-weight: 800;
        color: #000000;
      }
      .logo-sub {
        font-size: 13px;
        color: #000000;
        font-weight: 600;
        margin-top: 4px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      .desc {
        font-size: 15px;
        color: #52525b;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .code-box {
        background: #f8fafc;
        border: 2px dashed #e4e4e7;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 28px 0;
      }
      .code-digits {
        font-family: 'Courier New', Courier, monospace;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: 8px;
        color: #000000;
      }
      .code-expiry {
        font-size: 13px;
        color: #71717a;
        margin-top: 8px;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #a1a1aa;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #f1f5f9;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo-text">IEH | IRAQ ESPORTS HUB</div>
        <div class="logo-sub">شبكة الرياضات الإلكترونية العراقية الرسمية</div>
      </div>
      
      <div class="greeting">مرحباً بك ${recipientName}،</div>
      <div class="desc">
        شكراً لانضمامك إلى شبكة الرياضات الإلكترونية العراقية (IEH). لتأكيد حسابك، يرجى استخدام رمز التأكيد التالي:
      </div>
      
      <div class="code-box">
        <div class="code-digits">${code}</div>
        <div class="code-expiry">رمز التأكيد صالح لمدة 15 دقيقة فقط</div>
      </div>
      
      <div class="footer">
        © 2026 شبكة الرياضات الإلكترونية العراقية (IEH) - جمهورية العراق
      </div>
    </div>
  </body>
  </html>
  `;
}