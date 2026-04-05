import express from 'express';
import rateLimit from 'express-rate-limit';
import AuthController from '../controllers/authController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

const adminOtpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { status: false, message: 'Too many code requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminOtpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { status: false, message: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/verify-username', AuthController.verifyUserName)
  .post('/register', AuthController.register)
  .post('/admin/request-otp', adminOtpRequestLimiter, AuthController.requestAdminOtp)
  .post('/admin/verify-otp', adminOtpVerifyLimiter, AuthController.verifyAdminOtp)
  .post('/login', AuthController.login)
  .post('/refresh', AuthController.refreshToken)
  .post('/logout', authenticate, AuthController.logout)
  .get('/getStudentProfile', authenticate, AuthController.getStudentProfile)
  .put('/updateProfile', authenticate, AuthController.updateProfile)
  .post('/change-password', authenticate, AuthController.changePassword);

export default router;
