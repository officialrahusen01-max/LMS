import DashboardService from '../services/dashboardService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getAdminDashboard = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admins can access admin dashboard', 403);
  }

  const stats = await DashboardService.getAdminStats();

  res.json({
    message: 'Admin dashboard retrieved successfully',
    data: stats,
  });
});

export const getInstructorDashboard = catchAsync(async (req, res) => {
  if (!req.user.role || !['instructor', 'admin'].includes(req.user.role)) {
    throw new AppError('Only instructors can access instructor dashboard', 403);
  }

  const stats = await DashboardService.getInstructorStats(req.user.id);

  res.json({
    message: 'Instructor dashboard retrieved successfully',
    data: stats,
  });
});

export const getStudentDashboard = catchAsync(async (req, res) => {
  if (!req.user.role || !['student', 'admin'].includes(req.user.role)) {
    throw new AppError('Only students can access student dashboard', 403);
  }

  const stats = await DashboardService.getStudentStats(req.user.id);

  res.json({
    message: 'Student dashboard retrieved successfully',
    data: stats,
  });
});
