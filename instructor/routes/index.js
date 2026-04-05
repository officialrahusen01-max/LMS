import express from 'express';
import multer from 'multer';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';
import * as courseController from '../controllers/courseController.js';
import * as lessonController from '../controllers/lessonController.js';
import * as blogController from '../controllers/blogController.js';
import * as commentController from '../controllers/commentController.js';
import * as uploadController from '../controllers/uploadController.js';
import * as aiController from '../controllers/aiController.js';
import * as quizController from '../controllers/quizController.js';
import * as doubtController from '../controllers/doubtController.js';
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ========== COURSES ==========
router.get('/courses/mine', authenticate, authorize(['instructor', 'admin']), courseController.listMyCourses);
router.get('/courses', optionalAuth, courseController.listCourses);
router.get('/courses/:id', optionalAuth, courseController.getCourse);
router.post('/courses', authenticate, authorize(['instructor', 'admin']), courseController.createCourse);
router.put('/courses/:id', authenticate, authorize(['instructor', 'admin']), courseController.updateCourse);
router.delete('/courses/:id', authenticate, authorize(['instructor', 'admin']), courseController.deleteCourse);
router.post('/courses/:id/publish', authenticate, authorize(['instructor', 'admin']), courseController.publishCourse);
router.post('/courses/:id/unpublish', authenticate, authorize(['instructor', 'admin']), courseController.unpublishCourse);
router.post('/courses/:id/instructors', authenticate, authorize(['instructor', 'admin']), courseController.addInstructor);
router.delete('/courses/:id/instructors/:instructorId', authenticate, authorize(['instructor', 'admin']), courseController.removeInstructor);

// ========== LESSONS ==========
router.get('/courses/:courseId/lessons', optionalAuth, lessonController.listLessonsByCourse);
router.get('/courses/:courseId/lessons/:lessonId', optionalAuth, lessonController.getLesson);
router.post('/courses/:courseId/lessons', authenticate, authorize(['instructor', 'admin']), lessonController.createLesson);
router.put('/courses/:courseId/lessons/:lessonId', authenticate, authorize(['instructor', 'admin']), lessonController.updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', authenticate, authorize(['instructor', 'admin']), lessonController.deleteLesson);
router.post('/courses/:courseId/lessons/reorder', authenticate, authorize(['instructor', 'admin']), lessonController.reorderLessons);

// ========== QUIZZES ==========
router.post('/courses/:courseId/lessons/:lessonId/generate-quiz', authenticate, authorize(['instructor', 'admin']), quizController.generateQuizFromLesson);
router.get('/courses/:courseId/lessons/:lessonId/quiz', authenticate, authorize(['instructor', 'admin']), quizController.getQuizByLesson);
router.get('/quizzes/:quizId', authenticate, authorize(['instructor', 'admin']), quizController.getQuiz);
router.put('/quizzes/:quizId', authenticate, authorize(['instructor', 'admin']), quizController.updateQuizSettings);
router.post('/quizzes/:quizId/regenerate', authenticate, authorize(['instructor', 'admin']), quizController.regenerateQuestions);
router.patch('/quizzes/:quizId/publish', authenticate, authorize(['instructor', 'admin']), quizController.publishQuiz);
router.delete('/quizzes/:quizId', authenticate, authorize(['instructor', 'admin']), quizController.deleteQuiz);

// ========== BLOGS ==========
router.get('/blogs', blogController.listBlogs);
router.get('/blogs/slug/:slug', blogController.getBlogBySlug);
router.get('/blogs/me/articles', authenticate, authorize(['instructor', 'admin']), blogController.getAuthorBlogs);
router.get('/blogs/:id/comments', commentController.listComments);
router.post('/blogs/:id/like', blogController.likeBlog);
router.get('/blogs/:id', authenticate, blogController.getBlog);
router.post('/blogs', authenticate, authorize(['instructor', 'admin']), blogController.createBlog);
router.put('/blogs/:id', authenticate, authorize(['instructor', 'admin']), blogController.updateBlog);
router.delete('/blogs/:id', authenticate, authorize(['instructor', 'admin']), blogController.deleteBlog);
router.post('/blogs/:id/publish', authenticate, authorize(['instructor', 'admin']), blogController.publishBlog);
router.post('/blogs/:id/unpublish', authenticate, authorize(['instructor', 'admin']), blogController.unpublishBlog);
router.post('/blogs/:id/comments', authenticate, commentController.addComment);
router.post('/blogs/comments/:commentId/like', commentController.likeComment);
router.delete('/blogs/comments/:commentId', authenticate, commentController.deleteComment);

// ========== UPLOAD ==========
router.post('/upload/image', authenticate, upload.single('file'), uploadController.uploadImage);
router.post('/upload/video', authenticate, upload.single('file'), uploadController.uploadVideo);
router.post('/upload/document', authenticate, upload.single('file'), uploadController.uploadDocument);

// ========== AI ==========
router.post('/ai/ask', authenticate, aiController.askQuestion);
router.post('/ai/index/courses/:courseId', authenticate, authorize(['instructor', 'admin']), aiController.indexCourse);
router.post('/ai/embeddings/course/:courseId', authenticate, authorize(['instructor', 'admin']), aiController.generateCourseEmbedding);
router.post('/ai/embeddings/lesson/:lessonId', authenticate, authorize(['instructor', 'admin']), aiController.generateLessonEmbedding);
router.post('/ai/embeddings/blog/:blogId', authenticate, authorize(['instructor', 'admin']), aiController.generateBlogEmbedding);

// ========== STUDENT DOUBTS (INSTRUCTOR VIEW) ==========
router.get('/courses/:courseId/common-doubts', authenticate, authorize(['instructor', 'admin']), doubtController.getCommonDoubts);
router.get('/courses/:courseId/doubts', authenticate, authorize(['instructor', 'admin']), doubtController.getCourseDoubts);
router.get('/courses/:courseId/doubt-stats', authenticate, authorize(['instructor', 'admin']), doubtController.getDoubtStats);
router.post('/doubts/:doubtId/comment', authenticate, authorize(['instructor', 'admin']), doubtController.commentOnDoubt);

export default router;
