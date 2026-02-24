import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as courseController from '../controllers/courseController.js';
import * as lessonController from '../controllers/lessonController.js';

const router = express.Router();

/**
 * Course Routes
 * Base: /api/v1/courses
 */

// Public routes
router.get('/', courseController.listCourses);
router.get('/:id', courseController.getCourse);

// Protected routes - instructor/admin only
router.post('/', authenticate, authorize(['instructor', 'admin']), courseController.createCourse);
router.put('/:id', authenticate, authorize(['instructor', 'admin']), courseController.updateCourse);
router.delete('/:id', authenticate, authorize(['instructor', 'admin']), courseController.deleteCourse);

// Publish/unpublish
router.post('/:id/publish', authenticate, authorize(['instructor', 'admin']), courseController.publishCourse);
router.post('/:id/unpublish', authenticate, authorize(['instructor', 'admin']), courseController.unpublishCourse);

// Instructor management
router.post('/:id/instructors', authenticate, authorize(['instructor', 'admin']), courseController.addInstructor);
router.delete('/:id/instructors/:instructorId', authenticate, authorize(['instructor', 'admin']), courseController.removeInstructor);

/**
 * Lesson Routes
 * Base: /api/v1/courses/:courseId/lessons
 */

// Public routes
router.get('/:courseId/lessons', lessonController.listLessonsByCourse);
router.get('/:courseId/lessons/:lessonId', lessonController.getLesson);

// Protected routes - instructor/admin only
router.post('/:courseId/lessons', authenticate, authorize(['instructor', 'admin']), lessonController.createLesson);
router.put('/:courseId/lessons/:lessonId', authenticate, authorize(['instructor', 'admin']), lessonController.updateLesson);
router.delete('/:courseId/lessons/:lessonId', authenticate, authorize(['instructor', 'admin']), lessonController.deleteLesson);

// Lesson reordering
router.post('/:courseId/lessons/reorder', authenticate, authorize(['instructor', 'admin']), lessonController.reorderLessons);

export default router;
