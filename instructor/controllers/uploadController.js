import UploadService from '../services/uploadService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import { isCloudinaryConfigured } from '../../utils/cloudinary.js';

const cloudinaryMissingMessage =
  'File upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to Lib/.env (Dashboard → https://console.cloudinary.com/settings/api ).';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

export const uploadImage = catchAsync(async (req, res) => {
  if (!isCloudinaryConfigured()) throw new AppError(cloudinaryMissingMessage, 503);
  if (!req.file) throw new AppError('No file provided', 400);
  if (req.file.size > MAX_IMAGE_SIZE) throw new AppError('Image size must not exceed 5MB', 400);
  if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) throw new AppError('Invalid image type', 400);
  const result = await UploadService.uploadImage(req.file.buffer);
  res.status(201).json({ message: 'Image uploaded successfully', data: result });
});

export const uploadVideo = catchAsync(async (req, res) => {
  if (!isCloudinaryConfigured()) throw new AppError(cloudinaryMissingMessage, 503);
  if (!req.file) throw new AppError('No file provided', 400);
  if (req.file.size > MAX_VIDEO_SIZE) throw new AppError('Video size must not exceed 200MB', 400);
  if (!ALLOWED_VIDEO_TYPES.includes(req.file.mimetype)) throw new AppError('Invalid video type', 400);
  const result = await UploadService.uploadVideo(req.file.buffer);
  res.status(201).json({ message: 'Video uploaded successfully', data: result });
});

export const uploadDocument = catchAsync(async (req, res) => {
  if (!isCloudinaryConfigured()) throw new AppError(cloudinaryMissingMessage, 503);
  if (!req.file) throw new AppError('No file provided', 400);
  if (req.file.size > MAX_DOCUMENT_SIZE) throw new AppError('Document size must not exceed 20MB', 400);
  if (!ALLOWED_DOCUMENT_TYPES.includes(req.file.mimetype)) throw new AppError('Invalid document type', 400);
  const result = await UploadService.uploadDocument(req.file.buffer);
  res.status(201).json({ message: 'Document uploaded successfully', data: result });
});
