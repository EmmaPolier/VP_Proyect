import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOTP(to, code) {
  try {
    await transporter.sendMail({
      from: `"VamonosPues" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Código de verificación - VamonosPues",
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <h2 style="margin-bottom:8px">VamonosPues 🚗</h2>
          <p style="color:#555">Tu código de verificación es:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:16px 0;color:#111">
            ${code}
          </div>
          <p style="color:#888;font-size:13px">Este código expira en 10 minutos. No lo compartas con nadie.</p>
        </div>
      `,
    });
    console.log(`[OK] OTP enviado a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando OTP:', error);
    throw error;
  }
}

export async function sendVerificationEmail(to, link) {
  try {
    await transporter.sendMail({
      from: `"VamonosPues" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verifica tu cuenta - VamonosPues",
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <h2>Bienvenido a VamonosPues 🚗</h2>
          <p>Haz clic en el enlace para verificar tu cuenta:</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#007bff;color:white;text-decoration:none;border-radius:6px">
            Verificar Cuenta
          </a>
        </div>
      `,
    });
    console.log(`[OK] Email de verificación enviado a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando email:', error);
    throw error;
  }
}

export async function sendNotificationEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"VamonosPues" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[OK] Notificación enviada a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando notificación:', error);
    throw error;
  }
}
