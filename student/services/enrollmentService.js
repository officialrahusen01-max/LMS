import Enrollment from '../../models/Enrollment.js';
import Progress from '../../models/Progress.js';
import Course from '../../models/Course.js';
import AppError from '../../utils/AppError.js';

class EnrollmentService {
  static async enrollInCourse(userId, courseId) {
    const course = await Course.findById(courseId).select('published title pricing');
    if (!course) throw new AppError('Course not found', 404);
    if (!course.published) throw new AppError('Course is not published', 400);
    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (existingEnrollment) throw new AppError('Already enrolled in this course', 400);
    const paymentInfo = {
      type: course.pricing?.type || 'free',
      amount: course.pricing?.amount || 0,
      transactionId: null
    };
    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      paymentInfo
    });
    await Progress.create({
      user: userId,
      course: courseId,
      lessons: [],
      percentComplete: 0
    });
    await enrollment.populate('course', 'title category');
    await enrollment.populate('user', 'fullName email');
    return enrollment;
  }

  static async getMyCourses(userId) {
    return Enrollment.find({ user: userId })
      .populate(
        'course',
        'title description category primaryInstructor published coverUrl thumbnailUrl slug shortDescription level',
      )
      .populate('user', 'fullName email')
      .lean();
  }

  static async getEnrollment(userId, courseId) {
    return Enrollment.findOne({ user: userId, course: courseId }).populate('course', 'title');
  }

  static async cancelEnrollment(userId, courseId) {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    if (enrollment.status === 'cancelled') throw new AppError('Enrollment already cancelled', 400);
    enrollment.status = 'cancelled';
    await enrollment.save();
    return enrollment;
  }
}

export default EnrollmentService;
