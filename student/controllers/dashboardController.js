import DashboardService from '../../services/dashboardService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

export const getStudentDashboard = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('student') && !userRoles.includes('admin')) {
    throw new AppError('Only students can access student dashboard', 403);
  }
  const stats = await DashboardService.getStudentStats(req.user.id);
  res.json({
    message: 'Student dashboard retrieved successfully',
    data: stats,
  });
});
