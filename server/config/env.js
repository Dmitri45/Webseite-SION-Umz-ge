import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const templateId = Number(process.env.BREVO_TEMPLATE_ID || 3);
if (!Number.isSafeInteger(templateId) || templateId <= 0) {
  throw new Error('BREVO_TEMPLATE_ID must be a positive integer.');
}

export const config = {
  port: process.env.PORT || 3000,
  publicRoot: fileURLToPath(new URL('../../', import.meta.url)),
  mail: {
    apiKey: process.env.BREVO_API_KEY,
    templateId,
    from: process.env.MAIL_FROM,
    fromName: process.env.MAIL_FROM_NAME || 'SION Umzüge Website',
    to: process.env.MAIL_TO,
  },
};
