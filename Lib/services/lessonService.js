import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import AppError from '../utils/AppError.js';

/**
 * LessonService - handles lesson operations
 */
class LessonService {
  /**
   * List lessons in a course
   * @param {String} courseId - Course ID
   * @returns {Array} - Lessons sorted by order
   */
  static async listLessonsByCourse(courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1 })
      .select('-meta');

    return lessons;
  }

  /**
   * Get single lesson
   * @param {String} lessonId - Lesson ID
   * @returns {Object} - Lesson document
   */
  static async getLessonById(lessonId) {
    const lesson = await Lesson.findById(lessonId)
      .populate('course', 'title slug published');

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    return lesson;
  }

  /**
   * Create lesson for a course
   * @param {String} courseId - Course ID
   * @param {Object} data - Lesson data
   * @param {String} userId - Creator user ID
   * @returns {Object} - Created lesson
   */
  static async createLesson(courseId, data, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check if user is instructor of this course
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) ||
                         course.primaryInstructor.toString() === userId;
    if (!isInstructor) {
      throw new AppError('Only course instructors can create lessons', 403);
    }

    const { title, content, order = 0, duration = 0, media = [], transcript } = data;

    if (!title) {
      throw new AppError('Lesson title is required', 400);
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness in course
    const existing = await Lesson.findOne({ course: courseId, slug });
    if (existing) {
      throw new AppError('A lesson with this title already exists in this course', 409);
    }

    const lesson = new Lesson({
      course: courseId,
      title,
      slug,
      content: content || '',
      order,
      duration,
      media: media || [],
      transcript: transcript || '',
      isPreview: false
    });

    await lesson.save();
    return lesson.populate('course', 'title slug');
  }

  /**
   * Update lesson
   * @param {String} lessonId - Lesson ID
   * @param {Object} updates - Fields to update
   * @param {String} userId - User ID
   * @returns {Object} - Updated lesson
   */
  static async updateLesson(lessonId, updates, userId) {
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const course = lesson.course;
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) ||
                         course.primaryInstructor.toString() === userId;
    if (!isInstructor) {
      throw new AppError('Only course instructors can update lessons', 403);
    }

    // Allowed fields
    const allowedFields = ['title', 'content', 'order', 'duration', 'media', 'transcript', 'isPreview', 'quizId'];
    const filteredUpdates = {};

    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field)) {
        filteredUpdates[field] = updates[field];
      }
    });

    // If title changed, regenerate slug
    if (filteredUpdates.title) {
      const newSlug = filteredUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugExists = await Lesson.findOne({ course: lesson.course, slug: newSlug, _id: { $ne: lessonId } });
      if (slugExists) {
        throw new AppError('A lesson with this title already exists in this course', 409);
      }
      filteredUpdates.slug = newSlug;
    }

    Object.assign(lesson, filteredUpdates);
    await lesson.save();

    return lesson.populate('course', 'title slug');
  }

  /**
   * Delete lesson
   * @param {String} lessonId - Lesson ID
   * @param {String} userId - User ID
   */
  static async deleteLesson(lessonId, userId) {
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const course = lesson.course;
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) ||
                         course.primaryInstructor.toString() === userId;
    if (!isInstructor) {
      throw new AppError('Only course instructors can delete lessons', 403);
    }

    // Remove from course sections
    course.sections = course.sections.map(section => ({
      ...section,
      lessonIds: section.lessonIds.filter(id => id.toString() !== lessonId)
    }));
    await course.save();

    // Delete lesson
    await Lesson.findByIdAndDelete(lessonId);

    return { message: 'Lesson deleted successfully' };
  }

  /**
   * Reorder lessons in a course
   * @param {String} courseId - Course ID
   * @param {Array} lessonIds - Ordered array of lesson IDs
   * @param {String} userId - User ID
   */
  static async reorderLessons(courseId, lessonIds, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const isInstructor = course.instructors.some(i => i.user.toString() === userId) ||
                         course.primaryInstructor.toString() === userId;
    if (!isInstructor) {
      throw new AppError('Only course instructors can reorder lessons', 403);
    }

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new AppError('Valid lesson IDs array required', 400);
    }

    // Verify all lessons belong to course
    const lessons = await Lesson.find({ _id: { $in: lessonIds }, course: courseId });
    if (lessons.length !== lessonIds.length) {
      throw new AppError('One or more lessons not found in this course', 400);
    }

    // Update order
    const updatePromises = lessonIds.map((id, index) =>
      Lesson.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updatePromises);

    return { message: 'Lessons reordered successfully' };
  }
}

export default LessonService;
