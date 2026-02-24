import express from 'express';
import authRoutes from './auth.js';
import courseRoutes from './courses.js';
import enrollmentRoutes from './enrollments.js';
import certificateRoutes from './certificates.js';
import blogRoutes from './blogs.js';
import uploadRoutes from './upload.js';
import aiRoutes from './ai.js';
import dashboardRoutes from './dashboard.js';

const router = express.Router();

// API v1 routes
router.use('/v1/auth', authRoutes);
router.use('/v1/courses', courseRoutes);
router.use('/v1/enrollments', enrollmentRoutes);
router.use('/v1/certificates', certificateRoutes);
router.use('/v1/blogs', blogRoutes);
router.use('/v1/upload', uploadRoutes);
router.use('/v1/ai', aiRoutes);
router.use('/v1/dashboard', dashboardRoutes);

export default router;
