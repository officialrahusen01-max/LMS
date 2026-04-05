import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** True when all three vars are set (image/video uploads will work). */
export function isCloudinaryConfigured() {
  const n = (v) => (typeof v === "string" ? v.trim() : "");
  return !!(n(process.env.CLOUDINARY_CLOUD_NAME) && n(process.env.CLOUDINARY_API_KEY) && n(process.env.CLOUDINARY_API_SECRET));
}

export default cloudinary;
