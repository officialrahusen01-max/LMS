import mongoose from 'mongoose';

/** Media metadata for stored assets */
const mediaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  provider: { type: String, enum: ['cloudinary','s3','local'], required: true },
  providerId: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['video','audio','image','document'], required: true, index: true },
  mimeType: { type: String },
  size: { type: Number },
  meta: { duration: Number, width: Number, height: Number, thumbnailUrl: String },
  createdAt: { type: Date, default: Date.now }
});

mediaSchema.index({ providerId: 1 });

export default mongoose.model('Media', mediaSchema);
