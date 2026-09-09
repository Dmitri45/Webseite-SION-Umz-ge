import { config } from '../config/env.js';
import { buildContactParams } from '../templates/contact-params.js';
import { HttpError } from '../utils/http-error.js';

export async function sendContactEmail(formData, files = []) {
  const attachments = files.map((file) => ({
    name: file.originalname,
    content: file.buffer.toString('base64'),
  }));
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.mail.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: {
        name: config.mail.fromName,
        email: config.mail.from,
      },
      to: [{ email: config.mail.to }],
      replyTo: { email: formData.email, name: formData.name },
      subject: `Neue Umzugsanfrage – ${formData.name}`,
      templateId: config.mail.templateId,
      params: buildContactParams(formData),
      attachment: attachments,
    }),
  });
  if (!response.ok) {
    console.error(await response.text());
    throw new HttpError(502, 'E-Mail konnte nicht versendet werden.');
  }
}
