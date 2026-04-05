import DoubtSolverService from '../services/doubtSolverService.js';
import Doubt from '../../models/Doubt.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

/**
 * Ask a doubt - AI will answer based on course context
 * POST /student/courses/:courseId/ask-doubt
 */
export const askDoubt = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { question, lessonId } = req.body;

  if (!question || question.trim().length < 5) {
    throw new AppError('Question must be at least 5 characters long', 400);
  }

  const result = await DoubtSolverService.solveDoubt(
    req.user.id,
    courseId,
    lessonId || null,
    question
  );

  res.status(201).json({
    success: true,
    message: 'Question answered successfully',
    data: result,
  });
});

/**
 * Get similar already-answered doubts before asking
 * GET /student/courses/:courseId/search-doubts?q=question
 */
export const searchSimilarDoubts = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { q } = req.query;

  if (!q || q.trim().length < 3) {
    throw new AppError('Search query must be at least 3 characters', 400);
  }

  const similarDoubts = await DoubtSolverService.findSimilarDoubts(q, courseId, 3);

  res.json({
    success: true,
    data: similarDoubts,
  });
});

/**
 * Get student's doubt history
 * GET /student/courses/:courseId/my-doubts
 */
export const getMyDoubts = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const doubts = await DoubtSolverService.getDoubtHistory(req.user.id, courseId);

  res.json({
    success: true,
    count: doubts.length,
    data: doubts,
  });
});

/**
 * Rate a doubt response / provide feedback
 * POST /student/doubts/:doubtId/feedback
 */
export const rateDoubtResponse = catchAsync(async (req, res) => {
  const { doubtId } = req.params;
  const { rating, isHelpful, clearedDoubt } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const updatedDoubt = await DoubtSolverService.rateDoubtResponse(
    doubtId,
    req.user.id,
    rating,
    isHelpful !== undefined ? isHelpful : null,
    clearedDoubt !== undefined ? clearedDoubt : false
  );

  res.json({
    success: true,
    message: 'Thank you for your feedback!',
    data: updatedDoubt,
  });
});

/**
 * Get specific doubt with full details
 * GET /student/doubts/:doubtId
 */
export const getDoubDetailst = catchAsync(async (req, res) => {
  const { doubtId } = req.params;

  const doubt = await Doubt.findById(doubtId).populate(
    'student',
    'fullName email'
  );

  if (!doubt) {
    throw new AppError('Doubt not found', 404);
  }

  if (doubt.student._id.toString() !== req.user.id.toString()) {
    throw new AppError('Not authorized to view this doubt', 403);
  }

  res.json({
    success: true,
    data: doubt,
  });
});

export default {
  askDoubt,
  searchSimilarDoubts,
  getMyDoubts,
  rateDoubtResponse,
  getDoubDetailst,
};
