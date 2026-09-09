import multer from 'multer';
import { HttpError } from '../utils/http-error.js';

const MAX_PHOTOS = 15;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_PHOTOS, fileSize: MAX_TOTAL_BYTES },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return callback(new HttpError(400, 'Bitte nur JPEG-, PNG- oder WebP-Bilder hochladen.'));
    }
    callback(null, true);
  },
});

export const uploadPhotos = upload.array('photos', MAX_PHOTOS);

export function validatePhotoSize(req, res, next) {
  const totalBytes = (req.files || []).reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return next(new HttpError(400, 'Die Bilder dürfen insgesamt maximal 12 MB groß sein.'));
  }
  next();
}
