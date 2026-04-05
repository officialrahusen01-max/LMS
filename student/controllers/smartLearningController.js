import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import SmartLearningService from '../services/smartLearningService.js';

export const getRecommendations = catchAsync(async (req, res) => {
  const userRoles = req.user?.roles || [];
  if (!userRoles.includes('student') && !userRoles.includes('admin')) {
    throw new AppError('Only students can access smart learning recommendations', 403);
  }
  const data = await SmartLearningService.getRecommendations(req.user.id, { limit: req.query.limit });
  res.json({ message: 'Smart learning recommendations retrieved', data });
});

export const getWeakTopics = catchAsync(async (req, res) => {
  const userRoles = req.user?.roles || [];
  if (!userRoles.includes('student') && !userRoles.includes('admin')) {
    throw new AppError('Only students can access weak topics', 403);
  }
  const courseId = req.query.courseId;
  if (!courseId) throw new AppError('courseId query param is required', 400);
  const data = await SmartLearningService.getWeakTopics(req.user.id, courseId);
  res.json({ message: 'Weak topics retrieved', data });
});

export const tutor = catchAsync(async (req, res) => {
  const userRoles = req.user?.roles || [];
  if (!userRoles.includes('student') && !userRoles.includes('admin')) {
    throw new AppError('Only students can use the personal tutor', 403);
  }
  const data = await SmartLearningService.tutor(req.user.id, req.body || {});
  res.json({ message: 'Tutor reply generated', data });
});

