import UploadService from '../services/uploadService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file provided', 400);
  }

  if (req.file.size > MAX_IMAGE_SIZE) {
    throw new AppError(`Image size must not exceed 5MB`, 400);
  }

  if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
    throw new AppError('Invalid image type. Allowed: JPEG, PNG, GIF, WebP', 400);
  }

  const result = await UploadService.uploadImage(req.file.buffer);

  res.status(201).json({
    message: 'Image uploaded successfully',
    data: result,
  });
});

export const uploadVideo = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file provided', 400);
  }

  if (req.file.size > MAX_VIDEO_SIZE) {
    throw new AppError(`Video size must not exceed 200MB`, 400);
  }

  if (!ALLOWED_VIDEO_TYPES.includes(req.file.mimetype)) {
    throw new AppError('Invalid video type. Allowed: MP4, MPEG, MOV, AVI, WebM', 400);
  }

  const result = await UploadService.uploadVideo(req.file.buffer);

  res.status(201).json({
    message: 'Video uploaded successfully',
    data: result,
  });
});

export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file provided', 400);
  }

  if (req.file.size > MAX_DOCUMENT_SIZE) {
    throw new AppError(`Document size must not exceed 20MB`, 400);
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(req.file.mimetype)) {
    throw new AppError('Invalid document type. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT', 400);
  }

  const result = await UploadService.uploadDocument(req.file.buffer);

  res.status(201).json({
    message: 'Document uploaded successfully',
    data: result,
  });
});
