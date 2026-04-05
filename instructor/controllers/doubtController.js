import DoubtSolverService from '../../student/services/doubtSolverService.js';
import Doubt from '../../models/Doubt.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import mongoose from 'mongoose';

/**
 * Get common doubts in a course (instructor view)
 * GET /instructor/courses/:courseId/common-doubts
 */
export const getCommonDoubts = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { limit = 10 } = req.query;

  const commonDoubts = await DoubtSolverService.getCommonDoubts(
    courseId,
    parseInt(limit)
  );

  res.json({
    success: true,
    data: commonDoubts,
  });
});

/**
 * Get all student doubts in a course (instructor view)
 * GET /instructor/courses/:courseId/doubts
 */
export const getCourseDoubts = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { status = 'all', page = 1, limit = 20 } = req.query;

  const filter = { course: courseId };
  if (status !== 'all') {
    filter.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [doubts, total] = await Promise.all([
    Doubt.find(filter)
      .populate('student', 'fullName email publicUsername')
      .populate('lesson', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Doubt.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: doubts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  });
});

/**
 * Add instructor comment/response to a doubt
 * POST /instructor/doubts/:doubtId/comment
 */
export const commentOnDoubt = catchAsync(async (req, res) => {
  const { doubtId } = req.params;
  const { comment } = req.body;

  if (!comment || comment.trim().length < 5) {
    throw new AppError('Comment must be at least 5 characters', 400);
  }

  const doubt = await Doubt.findByIdAndUpdate(
    doubtId,
    {
      $set: {
        instructorComment: comment,
        instructorCommentedAt: new Date(),
        status: 'resolved',
      },
    },
    { new: true }
  ).populate('student', 'fullName email');

  if (!doubt) {
    throw new AppError('Doubt not found', 404);
  }

  res.json({
    success: true,
    message: 'Comment added successfully',
    data: doubt,
  });
});

/**
 * Get doubt statistics for a course
 * GET /instructor/courses/:courseId/doubt-stats
 */
export const getDoubtStats = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const stats = await Doubt.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalDoubts: { $sum: 1 },
        resolvedDoubts: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
        averageRating: { $avg: '$rating' },
        helpfulCount: {
          $sum: { $cond: [{ $eq: ['$isHelpful', true] }, 1, 0] },
        },
        clearedCount: {
          $sum: { $cond: [{ $eq: ['$clearedDoubt', true] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalDoubts: 0,
    resolvedDoubts: 0,
    averageRating: 0,
    helpfulCount: 0,
    clearedCount: 0,
  };

  res.json({
    success: true,
    data: {
      ...result,
      resolutionRate: result.totalDoubts > 0 
        ? Math.round((result.resolvedDoubts / result.totalDoubts) * 100) 
        : 0,
      helpfulRate: result.totalDoubts > 0
        ? Math.round((result.helpfulCount / result.totalDoubts) * 100)
        : 0,
    },
  });
});

export default {
  getCommonDoubts,
  getCourseDoubts,
  commentOnDoubt,
  getDoubtStats,
};
