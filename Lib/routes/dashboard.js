import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

/**
 * Dashboard Routes
 * Base: /api/v1/dashboard
 */

// Admin dashboard
router.get('/admin', authenticate, dashboardController.getAdminDashboard);

// Instructor dashboard
router.get('/instructor', authenticate, dashboardController.getInstructorDashboard);

// Student dashboard
router.get('/student', authenticate, dashboardController.getStudentDashboard);

export default router;
