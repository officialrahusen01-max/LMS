import mongoose from 'mongoose';

/** Lesson schema */
const mediaSub = new mongoose.Schema({
  provider: { type: String, enum: ['cloudinary','s3','local'], default: 'cloudinary' },
  type: { type: String, enum: ['video','audio','document','image'], required: true },
  url: { type: String, required: true },
  providerId: { type: String },
  publicId: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  duration: { type: Number },
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  content: { type: String },
  order: { type: Number, default: 0, index: true },
  duration: { type: Number, default: 0 },
  media: { type: [mediaSub], default: [] },
  transcript: { type: String },
  isPreview: { type: Boolean, default: false },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ title: 'text', content: 'text' });

// Virtual to compute lesson url
lessonSchema.virtual('lessonUrl').get(function() {
  return `/courses/${this.course}/lessons/${this.slug}`;
});

export default mongoose.model('Lesson', lessonSchema);
