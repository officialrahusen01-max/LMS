import express from 'express';
import authRoutes from '../auth/routes/index.js';
import { enrollmentRouter, certificateRouter } from '../student/routes/index.js';
import instructorRoutes from '../instructor/routes/index.js';
import dashboardRoutes from './dashboard.js';
import adminRoutes from '../admin/routes/index.js';
import studentSmartLearningRoutes from '../student/routes/smartLearning.js';
import { authenticate } from '../middleware/auth.js';
import * as adminApi from '../admin/controllers/adminApiController.js';

const router = express.Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/enrollments', enrollmentRouter);
router.use('/v1/certificates', certificateRouter);
router.use('/v1', instructorRoutes);
router.use('/v1/dashboard', dashboardRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/student/smart-learning', studentSmartLearningRoutes);
/** Students / instructors: published institution notices */
router.get('/v1/institution-updates', authenticate, adminApi.listMyInstitutionUpdates);

export default router;
