import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import config from "../configuration/config.js";

class AuthService {
  static async register(data) {
    const { fullName, publicUsername, email, password } = data;
    if (!fullName || !publicUsername || !email || !password) {
      throw new AppError(
        "Missing required fields: fullName, publicUsername, email, password",
        400,
      );
    }
    const existingUser = await User.findOne({
      $or: [{ email }, { publicUsername }],
    });
    if (existingUser) {
      throw new AppError("Email or username already registered", 409);
    }
    const user = new User({
      fullName,
      publicUsername,
      email,
      password,
      roles: ["student"],
      isEmailVerified: false,
      approvedInstructor: false,
    });

    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        throw new AppError(`${field} already registered`, 409);
      }
    }

    const accessToken = user.generateAccessToken();
    const { tokenHash, refreshToken } = await this.generateAndStoreRefreshToken(
      user._id,
    );

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, accessToken, refreshToken };
  }

  static async login(data) {
    const { email, password, userAgent, ip } = data;

    if (!email || !password) {
      throw new AppError("Email and password required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    const isPasswordValid =
      user && (await bcrypt.compare(password, user.password));

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== "active") {
      throw new AppError(`Account is ${user.status}`, 403);
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } },
    );

    const accessToken = user.generateAccessToken();
    const { refreshToken } = await this.generateAndStoreRefreshToken(user._id, {
      userAgent,
      ip,
    });

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
    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const tokenDoc = await RefreshToken.findOne({ tokenHash });
    if (!tokenDoc) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (tokenDoc.revoked) {
      throw new AppError("Refresh token has been revoked", 401);
    }

    if (new Date() > tokenDoc.expiresAt) {
      throw new AppError("Refresh token expired", 401);
    }

    const user = await User.findById(tokenDoc.user);
    if (!user || user.status !== "active") {
      throw new AppError("User not found or inactive", 401);
    }

    const newAccessToken = user.generateAccessToken();
    const { tokenHash: newTokenHash, refreshToken: newRefreshToken } =
      await this.generateAndStoreRefreshToken(user._id, metadata);

    tokenDoc.revoked = true;
    tokenDoc.replacedByTokenHash = newTokenHash;
    await tokenDoc.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

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

  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  static async updateProfile(userId, updates) {
    const allowedFields = ["fullName", "bio", "avatarUrl"];
    const filteredUpdates = {};

    allowedFields.forEach((field) => {
      if (updates.hasOwnProperty(field)) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  static async statusUpdate(userId, id, status) {
    if (!id) {
      throw new AppError("User id required", 400);
    }

    if (typeof status === "undefined") {
      throw new AppError("Status required", 400);
    }

    const loginUser = await User.findById(userId);
    if (!loginUser) {
      throw new AppError("Unauthorized user", 401);
    }

    if (loginUser.roles !== config.ADMIN) {
      throw new AppError("You are not allowed to update status", 403);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.status = status;
    await user.save();

    return true;
  }

  static async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new AppError("Old password and new password required", 400);
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new AppError("Old password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    return { message: "Password changed successfully" };
  }

  static parseExpiry(expiryStr) {
    const match = expiryStr.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error("Invalid expiry format");

    const [, num, unit] = match;
    const ms = {
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24,
    };

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
