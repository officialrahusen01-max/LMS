import mongoose from 'mongoose';

/** SubscriptionPlan schema */
const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  priceMonthly: { type: Number, default: 0 },
  priceYearly: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  active: { type: Boolean, default: true },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
