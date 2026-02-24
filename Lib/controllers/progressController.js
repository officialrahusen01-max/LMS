import ProgressService from '../services/progressService.js';
import Enrollment from '../models/Enrollment.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * ProgressController
 * Handles progress tracking HTTP requests
 */
class ProgressController {
  /**
   * PUT /courses/:courseId/lessons/:lessonId/complete
   * Mark a lesson as completed
   */
  static completeLesson = catchAsync(async (req, res) => {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    if (!courseId || !lessonId) {
      throw new AppError('Course ID and Lesson ID required', 400);
    }

    // Verify enrollment exists and is active
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      throw new AppError('Must be enrolled in course to complete lessons', 403);
    }

    const opts = {
      lastPosition: req.body.lastPosition || 0,
      secondsWatched: req.body.secondsWatched || 0
    };

    const progress = await ProgressService.markLessonComplete(
      userId,
      courseId,
      lessonId,
      opts
    );

    res.status(200).json({
      message: 'Lesson marked as completed',
      data: progress
    });
  });

  /**
   * GET /courses/:courseId/progress
   * Get progress for a course
   */
  static getProgress = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      throw new AppError('Course ID required', 400);
    }

    // Verify enrollment exists
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    const progress = await ProgressService.getCourseProgress(userId, courseId);

    res.status(200).json({
      message: 'Progress retrieved',
      data: progress
    });
  });

  /**
   * GET /me/progress
   * Get all progress across all courses
   */
  static getAllProgress = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const progressDocs = await ProgressService.getAllProgress(userId);

    res.status(200).json({
      message: 'All progress retrieved',
      data: progressDocs,
      count: progressDocs.length
    });
  });

  /**
   * GET /courses/:courseId/progress/completed-lessons
   * Get list of completed lessons
   */
  static getCompletedLessons = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      throw new AppError('Course ID required', 400);
    }

    // Verify enrollment exists
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    const completedLessons = await ProgressService.getCompletedLessons(
      userId,
      courseId
    );

    res.status(200).json({
      message: 'Completed lessons retrieved',
      data: completedLessons,
      count: completedLessons.length
    });
  });
}

export default ProgressController;
