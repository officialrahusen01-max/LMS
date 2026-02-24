import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
// Auth Router
router.post('/register', AuthController.register)
      .post('/login', AuthController.login)
      .post('/refresh', AuthController.refreshToken) 
      .post('/logout', authenticate, AuthController.logout)
      .get('/getProfile', authenticate, AuthController.getProfile)
      .put('/updateProfile', authenticate, AuthController.updateProfile)
      .patch('/update-status', authenticate, AuthController.updateStatus)
      .post('/change-password', authenticate, AuthController.changePassword);

export default router;
