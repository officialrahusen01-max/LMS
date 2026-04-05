import AuthService from '../services/authService.js';
import AdminOtpService from '../services/adminOtpService.js';
import catchAsync from '../../utils/catchAsync.js';

class AuthController {

  static verifyUserName = catchAsync(async (req, res) => {
    const result = await AuthService.verifyUserName(req.body);
    res.status(200).json({
      status: true,
      message: 'User name is available',
      data: result
    });
  });

  static register = catchAsync(async (req, res) => {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      status: true,
      message: 'User registered successfully',
      data: result
    });
  });


  static login = catchAsync(async (req, res) => {
    const userAgent = req.get('user-agent');
    const ip = req.ip || req.connection.remoteAddress;

    const result = await AuthService.login({
      ...req.body,
      userAgent,
      ip
    });

    res.status(200).json({
      status: true,
      message: 'Login successful',
      data: result
    });
  });

  static refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const userAgent = req.get('user-agent');
    const ip = req.ip || req.connection.remoteAddress;

    const result = await AuthService.refreshAccessToken(refreshToken, {
      userAgent,
      ip
    });

    res.status(200).json({
      status: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  static logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    await AuthService.logout(refreshToken);

    res.status(200).json({
      status: true,
      message: 'Logged out successfully'
    });
  });

  static getStudentProfile = catchAsync(async (req, res) => {
    const user = await AuthService.getStudentProfile(req.user.id);

    res.status(200).json({
      status: true,
      message: 'Student profile retrieved',
      data: user
    });
  });

  static updateProfile = catchAsync(async (req, res) => {
    const user = await AuthService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      status: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  static changePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.id, oldPassword, newPassword);

    res.status(200).json({
      status: true,
      message: 'Password changed successfully'
    });
  });

  /** POST { email } — sends 6-digit OTP to admin email */
  static requestAdminOtp = catchAsync(async (req, res) => {
    const result = await AdminOtpService.requestOtp(req.body?.email);
    res.status(200).json({
      status: true,
      message: result.message,
      data: { sent: true },
    });
  });

  /** POST { email, otp } — verifies OTP and returns JWT + refresh + user */
  static verifyAdminOtp = catchAsync(async (req, res) => {
    const userAgent = req.get('user-agent');
    const ip = req.ip || req.connection?.remoteAddress;
    const result = await AdminOtpService.verifyOtp(req.body?.email, req.body?.otp, {
      userAgent,
      ip,
    });
    res.status(200).json({
      status: true,
      message: 'Admin login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  });
}

export default AuthController;
