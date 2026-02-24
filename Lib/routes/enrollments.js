import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import EnrollmentController from '../controllers/enrollmentController.js';
import ProgressController from '../controllers/progressController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ========== ENROLLMENT ROUTES ==========

/**
 * POST /api/v1/enrollments/courses/:courseId/enroll
 * Student enrolls in a course
 */
router.post('/courses/:courseId/enroll', authorize(['student']), EnrollmentController.enroll);

/**
 * GET /api/v1/enrollments/me
 * Get all enrolled courses for current student
 */
router.get('/me', authorize(['student']), EnrollmentController.myCourses);

/**
 * GET /api/v1/enrollments/me/courses/:courseId
 * Get enrollment status for a specific course
 */
router.get('/me/courses/:courseId', authorize(['student']), EnrollmentController.getEnrollment);

/**
 * DELETE /api/v1/enrollments/me/courses/:courseId
 * Cancel enrollment in a course
 */
router.delete('/me/courses/:courseId', authorize(['student']), EnrollmentController.cancelEnrollment);

// ========== PROGRESS ROUTES ==========

/**
 * PUT /api/v1/enrollments/courses/:courseId/lessons/:lessonId/complete
 * Mark lesson as completed
 */
router.put(
  '/courses/:courseId/lessons/:lessonId/complete',
  authorize(['student']),
  ProgressController.completeLesson
);

/**
 * GET /api/v1/enrollments/courses/:courseId/progress
 * Get progress for a course
 */
router.get(
  '/courses/:courseId/progress',
  authorize(['student']),
  ProgressController.getProgress
);

/**
 * GET /api/v1/enrollments/courses/:courseId/progress/completed-lessons
 * Get completed lessons for a course
 */
router.get(
  '/courses/:courseId/progress/completed-lessons',
  authorize(['student']),
  ProgressController.getCompletedLessons
);

/**
 * GET /api/v1/enrollments/me/progress
 * Get all progress across all courses
 */
router.get('/me/progress', authorize(['student']), ProgressController.getAllProgress);

export default router;
