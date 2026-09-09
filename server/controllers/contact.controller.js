import { config } from '../config/env.js';
import { sendContactEmail } from '../services/mail.service.js';
import { validateContact } from '../validators/contact.validator.js';
import { HttpError } from '../utils/http-error.js';

export async function submitContact(req, res, next) {
  try {
    if (!config.mail.apiKey) {
      throw new HttpError(500, 'E-Mail-Versand ist noch nicht konfiguriert.');
    }
    validateContact(req.body);
    await sendContactEmail(req.body, req.files || []);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    console.error(error);
    next(new HttpError(500, 'Serverfehler beim Versand.'));
  }
}
