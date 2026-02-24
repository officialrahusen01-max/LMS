import EnrollmentService from '../services/enrollmentService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * EnrollmentController
 * Handles enrollment-related HTTP requests
 */
class EnrollmentController {
  /**
   * POST /courses/:courseId/enroll
   * Enroll student in a course
   */
  static enroll = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      throw new AppError('Course ID required', 400);
    }

    const enrollment = await EnrollmentService.enrollInCourse(userId, courseId);

    res.status(201).json({
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  });

  /**
   * GET /me/courses
   * Get all enrolled courses for current student
   */
  static myCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const enrollments = await EnrollmentService.getMyCourses(userId);

    res.status(200).json({
      message: 'Enrolled courses retrieved',
      data: enrollments,
      count: enrollments.length
    });
  });

  /**
   * GET /me/courses/:courseId
   * Get enrollment status for a specific course
   */
  static getEnrollment = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      throw new AppError('Course ID required', 400);
    }

    const enrollment = await EnrollmentService.getEnrollment(userId, courseId);

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    res.status(200).json({
      message: 'Enrollment retrieved',
      data: enrollment
    });
  });

  /**
   * DELETE /me/courses/:courseId
   * Cancel enrollment in a course
   */
  static cancelEnrollment = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      throw new AppError('Course ID required', 400);
    }

    const enrollment = await EnrollmentService.cancelEnrollment(userId, courseId);

    res.status(200).json({
      message: 'Enrollment cancelled',
      data: enrollment
    });
  });
}

export default EnrollmentController;
