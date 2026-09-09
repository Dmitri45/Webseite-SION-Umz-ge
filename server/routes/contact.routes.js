import { Router } from 'express';
import { submitContact } from '../controllers/contact.controller.js';
import { uploadPhotos, validatePhotoSize } from '../middleware/upload.js';

const router = Router();

router.post('/', uploadPhotos, validatePhotoSize, submitContact);

export default router;
