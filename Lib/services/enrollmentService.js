import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import AppError from '../utils/AppError.js';

/**
 * EnrollmentService
 * Manages student course enrollments
 */
class EnrollmentService {
  /**
   * Enroll user in a course
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Enrollment document
   */
  static async enrollInCourse(userId, courseId) {
    // Verify course exists and is published
    const course = await Course.findById(courseId).select('published title pricing');
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (!course.published) {
      throw new AppError('Course is not published', 400);
    }

    // Check existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      throw new AppError('Already enrolled in this course', 400);
    }

    // Determine payment info based on course pricing
    const paymentInfo = {
      type: course.pricing?.type || 'free',
      amount: course.pricing?.amount || 0,
      transactionId: null
    };

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      paymentInfo
    });

    // Auto-create progress document
    await Progress.create({
      user: userId,
      course: courseId,
      lessons: [],
      percentComplete: 0
    });

    // Populate before return
    await enrollment.populate('course', 'title category');
    await enrollment.populate('user', 'fullName email');

    return enrollment;
  }

  /**
   * Get all courses enrolled by user
   * @param {string} userId - Student user ID
   * @returns {Promise<Array>} Array of enrollment documents with course details
   */
  static async getMyCourses(userId) {
    const enrollments = await Enrollment.find({
      user: userId
    })
      .populate('course', 'title description category primaryInstructor published')
      .populate('user', 'fullName email')
      .lean();

    return enrollments;
  }

  /**
   * Get enrollment status for a course
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object|null>} Enrollment document or null
   */
  static async getEnrollment(userId, courseId) {
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    }).populate('course', 'title');

    return enrollment;
  }

  /**
   * Cancel enrollment
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Updated enrollment
   */
  static async cancelEnrollment(userId, courseId) {
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (enrollment.status === 'cancelled') {
      throw new AppError('Enrollment already cancelled', 400);
    }

    enrollment.status = 'cancelled';
    await enrollment.save();

    return enrollment;
  }
}

export default EnrollmentService;
