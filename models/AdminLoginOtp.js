import mongoose from "mongoose";

/**
 * Short-lived OTP for admin email login. OTP itself is never stored — only SHA-256 hash.
 */
const adminLoginOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("AdminLoginOtp", adminLoginOtpSchema);
