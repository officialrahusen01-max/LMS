import StudentQuizService from '../services/quizService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

/**
 * Get quiz for taking (student view - hides answers)
 * GET /student/lessons/:lessonId/quiz
 */
export const getQuizForTaking = catchAsync(async (req, res) => {
  const quizData = await StudentQuizService.getQuizForTaking(req.params.lessonId, req.user.id);

  res.json({
    success: true,
    data: quizData,
  });
});

/**
 * Submit quiz answers
 * POST /student/quizzes/:quizId/submit
 */
export const submitQuizAnswers = catchAsync(async (req, res) => {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    throw new AppError('Answers array is required', 400);
  }

  const result = await StudentQuizService.submitQuizAnswers(
    req.params.quizId,
    req.user.id,
    answers
  );

  res.json({
    success: true,
    message: 'Quiz submitted successfully',
    data: result,
  });
});

/**
 * Get quiz results
 * GET /student/quizzes/:quizId/results
 */
export const getQuizResults = catchAsync(async (req, res) => {
  const results = await StudentQuizService.getQuizResults(req.params.quizId, req.user.id);

  res.json({
    success: true,
    data: results,
  });
});
