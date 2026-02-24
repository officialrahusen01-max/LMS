import AuthService from "../services/authService.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

class AuthController {
  static register = catchAsync(async (req, res) => {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: result,
    });
  });
  static login = catchAsync(async (req, res) => {
    const userAgent = req.get("user-agent");
    const ip = req.ip || req.connection.remoteAddress;

    const result = await AuthService.login({
      ...req.body,
      userAgent,
      ip,
    });

    res.status(200).json({
      status: true,
      message: "Login successful",
      data: result,
    });
  });

  static refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const userAgent = req.get("user-agent");
    const ip = req.ip || req.connection.remoteAddress;

    const result = await AuthService.refreshAccessToken(refreshToken, {
      userAgent,
      ip,
    });

    res.status(200).json({
      status: true,
      message: "Token refreshed successfully",
      data: result,
    });
  });

  static logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    await AuthService.logout(refreshToken);

    res.status(200).json({
      status: true,
      message: "Logged out successfully",
    });
  });

  static getProfile = catchAsync(async (req, res) => {
    const user = await AuthService.getProfile(req.user.id);

    res.status(200).json({
      status: true,
      message: "Profile retrieved",
      data: user,
    });
  });

  static updateProfile = catchAsync(async (req, res) => {
    const user = await AuthService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: user,
    });
  });

  static updateStatus = catchAsync(async (req, res) => {
    const { id, status } = req.body;
    await AuthService.updateStatus(req.user.id, id, status);

    res.status(200).json({
      status: true,
      message: "Status update successfully",
    });
  });

  static changePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.id, oldPassword, newPassword);

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  });
}

export default AuthController;
