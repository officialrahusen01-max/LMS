import mongoose from 'mongoose';

/** UserSubscription schema - links user to a subscription plan and provider metadata */
const userSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true, index: true },
  provider: { type: String },
  providerSubscriptionId: { type: String },
  status: { type: String, enum: ['active','paused','cancelled','expired'], default: 'active', index: true },
  startedAt: { type: Date },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

userSubscriptionSchema.index({ user: 1, status: 1 });

userSubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.currentPeriodEnd || new Date() < this.currentPeriodEnd);
};

export default mongoose.model('UserSubscription', userSubscriptionSchema);
