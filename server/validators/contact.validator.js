import { HttpError } from '../utils/http-error.js';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'fromAddress', 'toAddress'];

export function validateContact(formData) {
  if (REQUIRED_FIELDS.some((field) => !formData?.[field])) {
    throw new HttpError(400, 'Bitte alle Pflichtfelder ausfüllen.');
  }
}
