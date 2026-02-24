import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import * as uploadController from '../controllers/uploadController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Upload Routes
 * Base: /api/v1/upload
 */

// Image upload
router.post('/image', authenticate, upload.single('file'), uploadController.uploadImage);

// Video upload
router.post('/video', authenticate, upload.single('file'), uploadController.uploadVideo);

// Document upload
router.post('/document', authenticate, upload.single('file'), uploadController.uploadDocument);

export default router;
