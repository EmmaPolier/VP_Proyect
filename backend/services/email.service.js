import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper para ejecutar promesa con timeout
async function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de email')), ms)
    ),
  ]);
}

export async function sendOTP(to, code) {
  try {
    await withTimeout(transporter.sendMail({
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
    }), 5000);
    console.log(`[OK] OTP enviado a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando OTP:', error.message);
    throw error;
  }
}

export async function sendVerificationEmail(to, link) {
  try {
    await withTimeout(transporter.sendMail({
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
    }), 5000);
    console.log(`[OK] Email de verificación enviado a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando email:', error.message);
    throw error;
  }
}

export async function sendNotificationEmail(to, subject, html) {
  try {
    await withTimeout(transporter.sendMail({
      from: `"VamonosPues" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    }), 5000);
    console.log(`[OK] Notificación enviada a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando notificación:', error.message);
    throw error;
  }
}

export async function sendPasswordResetEmail(to, nombre, resetLink) {
  try {
    await withTimeout(transporter.sendMail({
      from: `"VamonosPues" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Recupera tu contraseña - VamonosPues",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;background:#f9f9f9">
          <h2 style="color:#333;margin-bottom:8px">VamonosPues 🚗</h2>
          <p style="color:#555;margin-bottom:16px">Hola ${nombre},</p>
          
          <p style="color:#555;margin-bottom:16px">Recibimos una solicitud para recuperar tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
          
          <div style="text-align:center;margin:24px 0">
            <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:#007bff;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px">
              Recuperar Contraseña
            </a>
          </div>
          
          <p style="color:#888;font-size:13px;margin-bottom:12px">
            O copia este link en tu navegador: <br/>
            <a href="${resetLink}" style="color:#007bff;word-break:break-all;font-size:12px">${resetLink}</a>
          </p>
          
          <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:16px 0;border-radius:4px">
            <p style="color:#856404;margin:0;font-size:13px">
              ⚠️ <strong>Este link expira en 30 minutos</strong> por razones de seguridad.
            </p>
          </div>
          
          <p style="color:#555;margin-bottom:8px">Si no solicitaste recuperar tu contraseña, puedes ignorar este email. Tu cuenta permanecerá segura.</p>
          
          <p style="color:#888;font-size:12px;margin-top:24px;border-top:1px solid #ddd;padding-top:16px">
            VamonosPues © 2026<br/>
            Este es un email automático, por favor no responda.
          </p>
        </div>
      `,
    }), 5000);
    console.log(`[OK] Email de recuperación de contraseña enviado a ${to}`);
  } catch (error) {
    console.error('[ERROR] Error enviando email de recuperación:', error.message);
    throw error;
  }
}
