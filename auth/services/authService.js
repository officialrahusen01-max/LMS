import RefreshToken from "../../models/RefreshToken.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import AppError from "../../utils/AppError.js";
import config from "../../configuration/config.js";
import User from "../../models/User.js";

class AuthService {
  static async verifyUserName(data) {
    const { publicUsername } = data;
    const existingUser = await User.findOne({ publicUsername });
    if (existingUser) {
      throw new AppError("Username already registered", 409);
    }
    return true;
  }
  static async register(data) {
    const { fullName, publicUsername, roles: rolesRaw, email, password } = data;
    if (!fullName || !publicUsername || !email || !password) {
      throw new AppError(
        "Missing required fields: fullName, publicUsername, email, password",
        400,
      );
    }
    /** Never trust client for admin — public signup only student / instructor */
    const allowed = new Set(["student", "instructor"]);
    const roles = Array.isArray(rolesRaw)
      ? [...new Set(rolesRaw.filter((r) => allowed.has(String(r))))]
      : [];
    if (roles.length === 0) {
      throw new AppError(
        "Invalid role: registration allows only student or instructor",
        400,
      );
    }
    await this.verifyUserName({ publicUsername });
    const existingUser = await User.findOne({ $or: [{ email }] });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }
    const user = new User({
      fullName,
      publicUsername,
      email,
      password,
      roles, // sanitized above
      isEmailVerified: false,
      approvedInstructor: false,
    });
    await user.save();
    const accessToken = user.generateAccessToken();
    const { refreshToken } = await this.generateAndStoreRefreshToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    return { user: userObj, accessToken, refreshToken };
  }

  static async login(data) {
    const { publicUsername, password, userAgent, ip } = data;
    if (!publicUsername || !password) {
      throw new AppError("publicUsername and password required", 400);
    }
    const user = await User.findOne({ publicUsername }).select("+password");
    if (!user) {
      throw new AppError("Invalid publicUsername or password", 401);
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid publicUsername or password", 401);
    }
    if (user.status !== "active") {
      throw new AppError("Account is " + user.status, 403);
    }
    user.lastLoginAt = new Date();
    await user.save();
    const accessToken = user.generateAccessToken();
    const { refreshToken } = await this.generateAndStoreRefreshToken(user._id, {
      userAgent,
      ip,
    });
    const userObj = user.toObject();
    delete userObj.password;
    return { accessToken, refreshToken };
  }

  static async generateAndStoreRefreshToken(userId, metadata = {}) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const refreshExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN || "7d";
    const expiryMs = this.parseExpiry(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + expiryMs);
    const refreshTokenDoc = new RefreshToken({
      user: userId,
      tokenHash,
      userAgent: metadata.userAgent,
      ip: metadata.ip,
      expiresAt,
      revoked: false,
    });
    await refreshTokenDoc.save();
    return { tokenHash, refreshToken: rawToken };
  }

  static async refreshAccessToken(refreshToken, metadata = {}) {
    if (!refreshToken) throw new AppError("Refresh token required", 400);
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const tokenDoc = await RefreshToken.findOne({ tokenHash });
    if (!tokenDoc) throw new AppError("Invalid refresh token", 401);
    if (tokenDoc.revoked)
      throw new AppError("Refresh token has been revoked", 401);
    if (new Date() > tokenDoc.expiresAt)
      throw new AppError("Refresh token expired", 401);
    const user = await User.findById(tokenDoc.user);
    if (!user || user.status !== "active")
      throw new AppError("User not found or inactive", 401);
    const newAccessToken = user.generateAccessToken();
    const { tokenHash: newTokenHash, refreshToken: newRefreshToken } =
      await this.generateAndStoreRefreshToken(user._id, metadata);
    tokenDoc.revoked = true;
    tokenDoc.replacedByTokenHash = newTokenHash;
    await tokenDoc.save();
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken) {
    if (!refreshToken) throw new AppError("Refresh token required", 400);
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const tokenDoc = await RefreshToken.findOne({ tokenHash });
    if (tokenDoc && !tokenDoc.revoked) {
      tokenDoc.revoked = true;
      await tokenDoc.save();
    }
    return true;
  }

  static async getStudentProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.instructorProfile;
    delete userObj.createdAt;
    delete userObj.updatedAt;
    return userObj;
  }

  // static async getProfile(userId) {
  //   const user = await User.findById(userId);
  //   if (!user) throw new AppError("User not found", 404);
  //   const userObj = user.toObject();
  //   delete userObj.password;
  //   return userObj;
  // }

  static async updateProfile(userId, updates) {
    const allowedFields = ["fullName", "bio", "avatarUrl"];
    const filteredUpdates = {};
    allowedFields.forEach((field) => {
      if (updates.hasOwnProperty(field))
        filteredUpdates[field] = updates[field];
    });
    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new AppError("User not found", 404);
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  static async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword)
      throw new AppError("Old password and new password required", 400);
    const user = await User.findById(userId).select("+password");
    if (!user) throw new AppError("User not found", 404);
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) throw new AppError("Old password is incorrect", 401);
    user.password = newPassword;
    await user.save();
    return { message: "Password changed successfully" };
  }

  static parseExpiry(expiryStr) {
    const match = expiryStr.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error("Invalid expiry format");
    const [, num, unit] = match;
    const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(num) * ms[unit];
  }

  static verifyJWT(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      throw new AppError("Invalid or expired token", 401);
    }
  }
}

export default AuthService;
