import QuizService from '../services/quizService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

/**
 * Generate quiz automatically from lesson content
 * POST /instructor/courses/:courseId/lessons/:lessonId/generate-quiz
 */
export const generateQuizFromLesson = catchAsync(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { mcqCount = 5, subjectiveCount = 3, difficulty = 'medium' } = req.body;

  // Validate counts
  if (mcqCount < 1 || mcqCount > 20) {
    throw new AppError('MCQ count must be between 1 and 20', 400);
  }
  if (subjectiveCount < 0 || subjectiveCount > 20) {
    throw new AppError('Subjective count must be between 0 and 20', 400);
  }

  const quiz = await QuizService.generateQuizFromLesson(lessonId, {
    mcqCount,
    subjectiveCount,
    difficulty,
    courseId,
  });

  res.status(201).json({
    success: true,
    message: 'Quiz generated successfully',
    data: quiz,
  });
});

/**
 * Get quiz by quiz ID
 * GET /instructor/quizzes/:quizId
 */
export const getQuiz = catchAsync(async (req, res) => {
  const quiz = await QuizService.getQuizById(req.params.quizId);

  res.json({
    success: true,
    data: quiz,
  });
});

/**
 * Get quiz by lesson ID
 * GET /instructor/courses/:courseId/lessons/:lessonId/quiz
 */
export const getQuizByLesson = catchAsync(async (req, res) => {
  const { lessonId } = req.params;

  const quiz = await QuizService.getQuizByLessonId(lessonId);

  if (!quiz) {
    throw new AppError('No quiz found for this lesson', 404);
  }

  res.json({
    success: true,
    data: quiz,
  });
});

/**
 * Update quiz settings (title, description, passing score, etc.)
 * PUT /instructor/quizzes/:quizId
 */
export const updateQuizSettings = catchAsync(async (req, res) => {
  const quiz = await QuizService.updateQuizSettings(req.params.quizId, req.body);

  res.json({
    success: true,
    message: 'Quiz updated successfully',
    data: quiz,
  });
});

/**
 * Regenerate quiz questions
 * POST /instructor/quizzes/:quizId/regenerate
 */
export const regenerateQuestions = catchAsync(async (req, res) => {
  const { mcqCount, subjectiveCount, difficulty } = req.body;

  const quiz = await QuizService.regenerateQuestions(req.params.quizId, {
    mcqCount,
    subjectiveCount,
    difficulty,
  });

  res.json({
    success: true,
    message: 'Questions regenerated successfully',
    data: quiz,
  });
});

/**
 * Delete quiz
 * DELETE /instructor/quizzes/:quizId
 */
export const deleteQuiz = catchAsync(async (req, res) => {
  await QuizService.deleteQuiz(req.params.quizId);

  res.json({
    success: true,
    message: 'Quiz deleted successfully',
  });
});

/**
 * Publish/Unpublish quiz
 * PATCH /instructor/quizzes/:quizId/publish
 */
export const publishQuiz = catchAsync(async (req, res) => {
  const { isPublished } = req.body;

  const quiz = await QuizService.updateQuizSettings(req.params.quizId, {
    isPublished: !!isPublished,
  });

  res.json({
    success: true,
    message: `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`,
    data: quiz,
  });
});
