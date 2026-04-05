import DashboardService from '../../services/dashboardService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

export const getInstructorDashboard = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('instructor') && !userRoles.includes('admin')) {
    throw new AppError('Only instructors can access instructor dashboard', 403);
  }
  const stats = await DashboardService.getInstructorStats(req.user.id);
  res.json({
    message: 'Instructor dashboard retrieved successfully',
    data: stats,
  });
});
