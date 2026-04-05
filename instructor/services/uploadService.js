import cloudinary from '../../utils/cloudinary.js';
import AppError from '../../utils/AppError.js';

class UploadService {
  static async uploadImage(fileBuffer, folder = 'lms/images') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
        (error, result) => {
          if (error) reject(new AppError(`Image upload failed: ${error.message}`, 500));
          else resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  static async uploadVideo(fileBuffer, folder = 'lms/videos') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'video', quality: 'auto' },
        (error, result) => {
          if (error) reject(new AppError(`Video upload failed: ${error.message}`, 500));
          else resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            duration: result.duration,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  static async uploadDocument(fileBuffer, folder = 'lms/documents') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'raw' },
        (error, result) => {
          if (error) reject(new AppError(`Document upload failed: ${error.message}`, 500));
          else resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}

export default UploadService;
