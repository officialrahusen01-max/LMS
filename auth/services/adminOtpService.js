import crypto from "crypto";
import User from "../../models/User.js";
import AdminLoginOtp from "../../models/AdminLoginOtp.js";
import AppError from "../../utils/AppError.js";
import sendOtp from "../../utils/sendOtp.js";
import AuthService from "./authService.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

function generateSixDigitOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

class AdminOtpService {
  /**
   * Send OTP to email if user exists and has admin role.
   * Generic success message to reduce email enumeration.
   */
  static async requestOtp(emailRaw) {
    const email = String(emailRaw || "").toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Valid email is required", 400);
    }

    const user = await User.findOne({ email }).select("email roles status");
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin || user.status !== "active") {
      return {
        ok: true,
        message: "If this email is registered as an active admin, a login code was sent.",
      };
    }

    await AdminLoginOtp.deleteMany({ email });

    const code = generateSixDigitOtp();
    const otpHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await AdminLoginOtp.create({ email, otpHash, expiresAt, attempts: 0 });

    try {
      await sendOtp(email, code, {
        subject: "AiNextro LMS — Admin login code",
        productName: "AiNextro LMS Admin",
      });
    } catch (err) {
      await AdminLoginOtp.deleteMany({ email });
      const m = String(err?.message || "");
      if (m.includes("not configured")) {
        throw new AppError(
          "Email is not configured. Set EMAIL_USER and EMAIL_PASS in Lib/.env (restart the API server).",
          503
        );
      }
      throw new AppError(m || "Failed to send email.", 503);
    }

    return {
      ok: true,
      message: "If this email is registered as an active admin, a login code was sent.",
    };
  }

  /**
   * Verify OTP and return same tokens shape as password login.
   */
  static async verifyOtp(emailRaw, otpRaw, metadata = {}) {
    const email = String(emailRaw || "").toLowerCase().trim();
    const otp = String(otpRaw || "").trim();
    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }
    if (!/^\d{6}$/.test(otp)) {
      throw new AppError("OTP must be 6 digits", 400);
    }

    const user = await User.findOne({ email }).select("+password roles status");
    if (!user?.roles?.includes("admin")) {
      throw new AppError("Invalid or expired code", 401);
    }
    if (user.status !== "active") {
      throw new AppError("Account is " + user.status, 403);
    }

    const record = await AdminLoginOtp.findOne({ email }).sort({ createdAt: -1 });
    if (!record || new Date() > record.expiresAt) {
      throw new AppError("Invalid or expired code", 401);
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      await AdminLoginOtp.deleteMany({ email });
      throw new AppError("Too many attempts. Request a new code.", 429);
    }

    record.attempts += 1;
    await record.save();

    const match = record.otpHash === hashOtp(otp);
    if (!match) {
      throw new AppError("Invalid or expired code", 401);
    }

    await AdminLoginOtp.deleteMany({ email });

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = user.generateAccessToken();
    const { refreshToken } = await AuthService.generateAndStoreRefreshToken(user._id, {
      userAgent: metadata.userAgent,
      ip: metadata.ip,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return { accessToken, refreshToken, user: userObj };
  }
}

export default AdminOtpService;
