import multer from 'multer';
import { HttpError } from '../utils/http-error.js';

// Express recognizes error middleware by its four parameters.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ error: 'Upload fehlgeschlagen: maximal 15 Bilder mit insgesamt 12 MB.' });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Unerwarteter Serverfehler.' });
}
