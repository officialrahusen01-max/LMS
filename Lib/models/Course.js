import mongoose from 'mongoose';

/** Course schema
 * - Supports multiple instructors with primaryInstructor as owner
 * - Pricing supports free, one_time, subscription
 */
const instructorSub = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'contributor'], default: 'contributor' },
  order: { type: Number, default: 0 }
}, { _id: false });

const sectionSub = new mongoose.Schema({
  title: { type: String },
  order: { type: Number },
  lessonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  shortDescription: { type: String },
  description: { type: String },
  primaryInstructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  instructors: { type: [instructorSub], default: [] },
  categories: [{ type: String, index: true }],
  tags: [{ type: String, index: true }],
  level: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  language: { type: String, default: 'en' },
  thumbnailUrl: { type: String },
  thumbnailPublicId: { type: String },
  coverUrl: { type: String },
  coverPublicId: { type: String },
  duration: { type: Number },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
  pricing: {
    type: { type: String, enum: ['free','one_time','subscription'], required: true, default: 'free' },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    accessDurationDays: { type: Number, default: null },
    subscriptionPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null }
  },
  certificate: {
    enabled: { type: Boolean, default: false },
    certificateThresholdPct: { type: Number, default: 80 },
    requiresFinalQuiz: { type: Boolean, default: false }
  },
  sections: { type: [sectionSub], default: [] },
  stats: { studentsCount: { type: Number, default: 0 }, avgRating: { type: Number, default: 0 } },
  aiKnowledge: { includeInAi: { type: Boolean, default: true } },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Text index for search
courseSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });

// Virtual: count instructors
courseSchema.virtual('instructorCount').get(function() {
  return (this.instructors || []).length;
});

// Methods
courseSchema.methods.isSubscriptionCourse = function() {
  return this.pricing && this.pricing.type === 'subscription';
};

courseSchema.methods.getCertificateThreshold = function() {
  return (this.certificate && this.certificate.certificateThresholdPct) || 80;
};

export default mongoose.model('Course', courseSchema);
