import mongoose from 'mongoose';

/** Certificate schema */
const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  issuedAt: { type: Date, default: Date.now },
  certificateId: { type: String, required: true, unique: true, index: true },
  downloadUrl: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

certificateSchema.index({ user: 1, course: 1 });

/** Prepare payload for PDF generator */
certificateSchema.methods.generateCertificatePayload = function() {
  return {
    certificateId: this.certificateId,
    user: this.user,
    course: this.course,
    issuedAt: this.issuedAt,
    meta: this.meta
  };
};

export default mongoose.model('Certificate', certificateSchema);
