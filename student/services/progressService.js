import Progress from '../../models/Progress.js';
import Enrollment from '../../models/Enrollment.js';
import Lesson from '../../models/Lesson.js';
import Course from '../../models/Course.js';
import AppError from '../../utils/AppError.js';
import CertificateService from './certificateService.js';

class ProgressService {
  static async markLessonComplete(userId, courseId, lessonId, opts = {}) {
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });
    if (!enrollment) throw new AppError('Enrollment not found or not active', 404);
    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) throw new AppError('Lesson not found in this course', 404);
    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      progress = await Progress.create({
        user: userId,
        course: courseId,
        lessons: [],
        percentComplete: 0
      });
    }
    await progress.markLessonCompleted(lessonId, {
      lastPosition: opts.lastPosition || 0,
      secondsWatched: opts.secondsWatched || 0
    });
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    await progress.recalculatePercent(totalLessons);
    if (progress.percentComplete === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await enrollment.save();
      try {
        await CertificateService.generateCertificate(userId, courseId);
      } catch (error) {
        console.error('Certificate generation failed:', error.message);
      }
    }
    await progress.save();
    return progress;
  }

  static async getCourseProgress(userId, courseId) {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    let progress = await Progress.findOne({ user: userId, course: courseId })
      .populate('course', 'title totalLessons')
      .populate('lessons.lesson', 'title order');
    if (!progress) {
      progress = await Progress.create({
        user: userId,
        course: courseId,
        lessons: [],
        percentComplete: 0
      });
      await progress.populate('course', 'title totalLessons');
    }
    return progress;
  }

  static async getCompletedLessons(userId, courseId) {
    const progress = await Progress.findOne({ user: userId, course: courseId }).select('lessons');
    if (!progress) return [];
    return (progress.lessons || []).filter(l => l.completed).map(l => l.lesson.toString());
  }

  static async getAllProgress(userId) {
    return Progress.find({ user: userId })
      .populate('course', 'title description category')
      .populate('lessons.lesson', 'title order')
      .lean();
  }
}

export default ProgressService;
