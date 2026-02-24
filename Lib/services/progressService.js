import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import AppError from '../utils/AppError.js';
import CertificateService from './certificateService.js';

/**
 * ProgressService
 * Manages student progress tracking within courses
 */
class ProgressService {
  /**
   * Mark a lesson as completed for a student
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @param {string} lessonId - Lesson ID
   * @param {Object} opts - Options (lastPosition, secondsWatched)
   * @returns {Promise<Object>} Updated progress document
   */
  static async markLessonComplete(userId, courseId, lessonId, opts = {}) {
    // Verify enrollment exists and is active
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found or not active', 404);
    }

    // Verify lesson exists and belongs to course
    const lesson = await Lesson.findOne({
      _id: lessonId,
      course: courseId
    });

    if (!lesson) {
      throw new AppError('Lesson not found in this course', 404);
    }

    // Get or create progress
    let progress = await Progress.findOne({
      user: userId,
      course: courseId
    });

    if (!progress) {
      progress = await Progress.create({
        user: userId,
        course: courseId,
        lessons: [],
        percentComplete: 0
      });
    }

    // Mark lesson completed
    await progress.markLessonCompleted(lessonId, {
      lastPosition: opts.lastPosition || 0,
      secondsWatched: opts.secondsWatched || 0
    });

    // Recalculate completion percentage
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    await progress.recalculatePercent(totalLessons);

    // Update last lesson
    progress.lastLesson = lessonId;

    // If 100% complete, mark enrollment as completed
    if (progress.percentComplete === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await enrollment.save();

      // Auto-generate certificate
      try {
        await CertificateService.generateCertificate(userId, courseId);
      } catch (error) {
        // Log error but don't fail progress update
        console.error('Certificate generation failed:', error.message);
      }
    }

    await progress.save();
    return progress;
  }

  /**
   * Get course progress for a student
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Progress document
   */
  static async getCourseProgress(userId, courseId) {
    // Verify enrollment exists
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Get progress
    let progress = await Progress.findOne({
      user: userId,
      course: courseId
    })
      .populate('course', 'title totalLessons')
      .populate('lessons.lesson', 'title order');

    // Create if doesn't exist
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

  /**
   * Get lessons completed in a course
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} Array of completed lesson IDs
   */
  static async getCompletedLessons(userId, courseId) {
    const progress = await Progress.findOne({
      user: userId,
      course: courseId
    }).select('lessons');

    if (!progress) {
      return [];
    }

    return (progress.lessons || [])
      .filter(l => l.completed)
      .map(l => l.lesson.toString());
  }

  /**
   * Reset progress for a course (admin only)
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Updated progress document
   */
  static async resetProgress(userId, courseId) {
    const progress = await Progress.findOne({
      user: userId,
      course: courseId
    });

    if (!progress) {
      throw new AppError('Progress not found', 404);
    }

    progress.lessons = [];
    progress.percentComplete = 0;
    progress.lastLesson = null;
    progress.finalQuiz.passed = false;
    progress.finalQuiz.score = 0;
    progress.certificateIssuedAt = null;

    await progress.save();

    // Reset enrollment status to active
    await Enrollment.updateOne(
      { user: userId, course: courseId },
      { status: 'active', completedAt: null }
    );

    return progress;
  }

  /**
   * Get all courses with progress for a student
   * @param {string} userId - Student user ID
   * @returns {Promise<Array>} Array of progress documents with course details
   */
  static async getAllProgress(userId) {
    const progressDocs = await Progress.find({ user: userId })
      .populate('course', 'title description category')
      .populate('lessons.lesson', 'title order')
      .lean();

    return progressDocs;
  }
}

export default ProgressService;
