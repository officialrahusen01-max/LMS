import mongoose from 'mongoose';

/** Enrollment schema
 * - Enforces unique (user, course)
 * - Pre-save validation sets expiresAt according to course pricing when applicable
 */
const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active','completed','cancelled','refunded'], default: 'active', index: true },
  expiresAt: { type: Date, default: null },
  purchase: {
    provider: { type: String },
    transactionId: { type: String },
    amount: { type: Number },
    currency: { type: String },
    coupon: { code: String, discountPct: Number }
  },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Unique enrollment per user-course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

/** pre-save: set expiresAt based on Course.pricing where applicable */
// Note: async middleware must not use `next` — Mongoose does not pass it for async functions.
enrollmentSchema.pre('save', async function () {
  if (this.expiresAt) return;
  const Course = mongoose.model('Course');
  const courseDoc = await Course.findById(this.course).select('pricing').lean();
  if (!courseDoc) return;

  const pricing = courseDoc.pricing || {};
  if (pricing.type === 'free') {
    this.expiresAt = null; // lifetime
  } else if (pricing.type === 'one_time') {
    if (pricing.accessDurationDays && Number.isInteger(pricing.accessDurationDays)) {
      const start = this.enrolledAt instanceof Date ? this.enrolledAt : new Date();
      this.expiresAt = new Date(start.getTime() + pricing.accessDurationDays * 24 * 60 * 60 * 1000);
    } else {
      this.expiresAt = null; // lifetime by default per product rules
    }
  } else if (pricing.type === 'subscription') {
    this.expiresAt = null;
  }
});

// Helper
enrollmentSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (!this.expiresAt) return true;
  return new Date() < this.expiresAt;
};

export default mongoose.model('Enrollment', enrollmentSchema);
