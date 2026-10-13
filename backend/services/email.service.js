import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const serviceDirectory = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.resolve(serviceDirectory, '..', 'token.json');

let authClient;

async function getAuthClient() {
  if (authClient) return authClient;

  const tokenFile = await fs.readFile(TOKEN_PATH, 'utf-8');
  const savedCredentials = JSON.parse(tokenFile);

  if (savedCredentials.type !== 'authorized_user' || !savedCredentials.refresh_token) {
    throw new Error('token.json no contiene una autorización OAuth válida.');
  }
  
  authClient = await google.auth.fromJSON(savedCredentials);
  return authClient;
}

function createRawMessage({ to, subject, html, from }) {
  if (/[\r\n]/.test(to) || /[\r\n]/.test(from)) {
    throw new Error('El remitente y destinatario no pueden contener saltos de línea.');
  }

  const encodedSubject = Buffer.from(subject, 'utf-8').toString('base64');
  const encodedHtml = Buffer.from(html, 'utf-8').toString('base64');

  const message = [
    `From: "Vamonos pues Drive" <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodedHtml,
  ].join('\r\n');

  return Buffer.from(message, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sendHtmlEmail({ to, subject, html }) {
  const from = process.env.EMAIL_USER;

  if (!from) {
    throw new Error('La variable de entorno EMAIL_USER no está configurada.');
  }

  const auth = await getAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = createRawMessage({ to, subject, html, from });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export async function sendPasswordResetEmail(to, nombre, resetLink) {
  const safeName = escapeHtml(nombre);
  const safeLink = escapeHtml(resetLink);

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
      <h2>VamonosPues</h2>
      <p>Hola ${safeName},</p>
      <p>Recibimos una solicitud para recuperar tu contraseña.</p>
      <p>
        <a href="${safeLink}">Recuperar contraseña</a>
      </p>
      <p>Este enlace expira en 30 minutos.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
  `;

  return sendHtmlEmail({
    to,
    subject: 'Recupera tu contraseña - VamonosPues',
    html,
  });
}

export async function sendEmergencyNotification({
  to,
  userName,
  routeId,
  tipoEmergencia,
  departure,
  origin,
  destination,
  location,
  sentAt,
}) {
  const locationDetails = location
    ? `<p><strong>Ubicación:</strong> ${escapeHtml(location.latitud)}, ${escapeHtml(location.longitud)}</p>`
    : '<p><strong>Ubicación:</strong> No disponible.</p>';

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <h2>Alerta de emergencia - VamosPuesDrive</h2>
      <p>Contacta a ${escapeHtml(userName)} y verifica que esté bien.</p>
      <p><strong>Ruta:</strong> ${escapeHtml(routeId)}</p>
      <p><strong>Tipo de emergencia:</strong> ${escapeHtml(tipoEmergencia)}</p>
      <p><strong>Origen:</strong> ${escapeHtml(origin)}</p>
      <p><strong>Destino:</strong> ${escapeHtml(destination)}</p>
      <p><strong>Salida:</strong> ${escapeHtml(departure)}</p>
      ${locationDetails}
      <p><strong>Alerta registrada:</strong> ${escapeHtml(sentAt.toISOString())}</p>
    </div>
  `;

  return sendHtmlEmail({
    to,
    subject: 'Alerta de emergencia - VamosPuesDrive',
    html,
  });
}

export async function sendOTP(to, code) {
  const html = `
    <p>Tu código de verificación es: 
    <strong>${escapeHtml(code)}</strong>
    </p>
    <p>Este código es válido por 10 minutos.</p>
    `;
  return sendHtmlEmail({ 
    to, 
    subject: 'Código de verificación', 
    html 
  });
}

export async function sendVerificationEmail(to, link) {
  const safeLink = escapeHtml(link);
  const html = `<p>Haz clic en el siguiente enlace para verificar tu cuenta:</p><p><a href="${safeLink}">${safeLink}</a></p>`;

  return sendHtmlEmail({ to, subject: 'Verificación de cuenta', html });
}

export async function sendNotificationEmail(to, subject, html) {
  return sendHtmlEmail({ to, subject, html });
}
