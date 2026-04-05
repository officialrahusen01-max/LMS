import mongoose from 'mongoose';

/** RefreshToken schema stores hashed tokens and metadata for rotation/revocation */
const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: { type: String },
  ip: { type: String },
  // Track when this refresh token was last used for auditing and session management
  lastUsedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false },
  replacedByTokenHash: { type: String }
}, { timestamps: true });

// tokenHash has unique constraint at field level

// Compound index to help revoke-all and session listing queries
refreshTokenSchema.index({ user: 1, revoked: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
