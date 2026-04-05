import EnrollmentService from '../services/enrollmentService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

class EnrollmentController {
  static enroll = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    if (!courseId) throw new AppError('Course ID required', 400);
    const enrollment = await EnrollmentService.enrollInCourse(userId, courseId);
    res.status(201).json({
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  });

  static myCourses = catchAsync(async (req, res) => {
    const enrollments = await EnrollmentService.getMyCourses(req.user.id);
    res.status(200).json({
      message: 'Enrolled courses retrieved',
      data: enrollments,
      count: enrollments.length
    });
  });

  static getEnrollment = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    if (!courseId) throw new AppError('Course ID required', 400);
    const enrollment = await EnrollmentService.getEnrollment(userId, courseId);
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    res.status(200).json({
      message: 'Enrollment retrieved',
      data: enrollment
    });
  });

  static cancelEnrollment = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    if (!courseId) throw new AppError('Course ID required', 400);
    const enrollment = await EnrollmentService.cancelEnrollment(userId, courseId);
    res.status(200).json({
      message: 'Enrollment cancelled',
      data: enrollment
    });
  });
}

export default EnrollmentController;
