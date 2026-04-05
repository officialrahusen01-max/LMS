import DashboardService from '../../services/dashboardService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

export const getAdminDashboard = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('admin')) {
    throw new AppError('Only admins can access admin dashboard', 403);
  }
  const stats = await DashboardService.getAdminStats();
  res.json({
    message: 'Admin dashboard retrieved successfully',
    data: stats,
  });
});
