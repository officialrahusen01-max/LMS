import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../configuration/config.js";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    publicUsername: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    roles: {
      type: [String],
      enum: ["admin", "instructor", "student"],
      default: ["student"],
      index: true,
    },
    bio: { type: String },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
      index: true,
    },
    instructorProfile: {
      bio: { type: String },
      expertise: { type: [String], default: [] },
      socialLinks: { type: [String], default: [] },
    },
    studentProfile: {
      learningPreferences: { type: [String], default: [] },
    },
    avatarUrl: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ["local", "google", "facebook", "github"],
      default: "local",
    },
    providerId: { type: String },
    approvedInstructor: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.getJwtPayload = function () {
  return {
    id: this._id,
    roles: this.roles,
    approvedInstructor: this.approvedInstructor,
    status: this.status,
  };
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(this.getJwtPayload(), config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || "1h",
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

export default mongoose.model("User", userSchema);
