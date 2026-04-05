import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getStudentDashboard } from '../student/controllers/dashboardController.js';
import { getInstructorDashboard } from '../instructor/controllers/dashboardController.js';
import { getAdminDashboard } from '../admin/controllers/dashboardController.js';

const router = express.Router();

router.get('/admin', authenticate, getAdminDashboard);
router.get('/instructor', authenticate, getInstructorDashboard);
router.get('/student', authenticate, getStudentDashboard);

export default router;
