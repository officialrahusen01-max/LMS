import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import EnrollmentController from '../controllers/enrollmentController.js';
import ProgressController from '../controllers/progressController.js';
import CertificateController from '../controllers/certificateController.js';
import * as QuizController from '../controllers/quizController.js';
import * as DoubtController from '../controllers/doubtController.js';

const enrollmentRouter = express.Router();
enrollmentRouter.use(authenticate);
enrollmentRouter.post('/courses/:courseId/enroll', authorize(['student']), EnrollmentController.enroll);
enrollmentRouter.get('/me', authorize(['student']), EnrollmentController.myCourses);
enrollmentRouter.get('/me/courses/:courseId', authorize(['student']), EnrollmentController.getEnrollment);
enrollmentRouter.delete('/me/courses/:courseId', authorize(['student']), EnrollmentController.cancelEnrollment);
enrollmentRouter.put('/courses/:courseId/lessons/:lessonId/complete', authorize(['student']), ProgressController.completeLesson);
enrollmentRouter.get('/courses/:courseId/progress', authorize(['student']), ProgressController.getProgress);
enrollmentRouter.get('/courses/:courseId/progress/completed-lessons', authorize(['student']), ProgressController.getCompletedLessons);
enrollmentRouter.get('/me/progress', authorize(['student']), ProgressController.getAllProgress);

// ========== QUIZ ROUTES ==========
enrollmentRouter.get('/lessons/:lessonId/quiz', authorize(['student']), QuizController.getQuizForTaking);
enrollmentRouter.post('/quizzes/:quizId/submit', authorize(['student']), QuizController.submitQuizAnswers);
enrollmentRouter.get('/quizzes/:quizId/results', authorize(['student']), QuizController.getQuizResults);

// ========== DOUBT SOLVER (AI Q&A) ==========
enrollmentRouter.post('/courses/:courseId/ask-doubt', authorize(['student']), DoubtController.askDoubt);
enrollmentRouter.get('/courses/:courseId/search-doubts', authorize(['student']), DoubtController.searchSimilarDoubts);
enrollmentRouter.get('/courses/:courseId/my-doubts', authorize(['student']), DoubtController.getMyDoubts);
enrollmentRouter.post('/doubts/:doubtId/feedback', authorize(['student']), DoubtController.rateDoubtResponse);
enrollmentRouter.get('/doubts/:doubtId', authorize(['student']), DoubtController.getDoubDetailst);

const certificateRouter = express.Router();
certificateRouter.get('/me', authenticate, authorize(['student']), CertificateController.myCertificates);
// Static path before :certificateId or "verify" is captured as an id
certificateRouter.get('/verify/:hash', CertificateController.verifyCertificate);
certificateRouter.get('/:certificateId', authenticate, authorize(['student']), CertificateController.getCertificate);

export { enrollmentRouter, certificateRouter };