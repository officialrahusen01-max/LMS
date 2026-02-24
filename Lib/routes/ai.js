import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();
// Ask question (public endpoint, but requires auth)
router.post('/ask', authenticate, aiController.askQuestion);

// Generate embeddings (instructor/admin only)
router.post('/index/courses/:courseId', authenticate, authorize(['instructor', 'admin']), aiController.indexCourse);
router.post('/embeddings/course/:courseId', authenticate, authorize(['instructor', 'admin']), aiController.generateCourseEmbedding);
router.post('/embeddings/lesson/:lessonId', authenticate, authorize(['instructor', 'admin']), aiController.generateLessonEmbedding);
router.post('/embeddings/blog/:blogId', authenticate, authorize(['instructor', 'admin']), aiController.generateBlogEmbedding);

export default router;
