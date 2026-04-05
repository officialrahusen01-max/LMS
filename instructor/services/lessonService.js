import Lesson from '../../models/Lesson.js';
import Course from '../../models/Course.js';
import AppError from '../../utils/AppError.js';

class LessonService {
  /** Published courses: anyone. Draft: admin or course instructors only. */
  static canViewUnpublishedCourse(course, viewerUserId, roles = []) {
    if (!course) return false;
    if (course.published) return true;
    if (Array.isArray(roles) && roles.includes('admin')) return true;
    if (!viewerUserId) return false;
    const uid = String(viewerUserId);
    const pid = course.primaryInstructor?.toString?.() ?? String(course.primaryInstructor);
    if (pid === uid) return true;
    const instructors = course.instructors || [];
    return instructors.some((i) => {
      const u = i.user;
      const id = u && u._id ? u._id.toString() : String(u);
      return id === uid;
    });
  }

  static async listLessonsByCourse(courseId, viewerUserId = null, roles = []) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!this.canViewUnpublishedCourse(course, viewerUserId, roles)) {
      throw new AppError('Course not found', 404);
    }
    return Lesson.find({ course: courseId }).sort({ order: 1 }).select('-meta');
  }

  static async getLessonById(lessonId, viewerUserId = null, roles = []) {
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) throw new AppError('Lesson not found', 404);
    if (!this.canViewUnpublishedCourse(lesson.course, viewerUserId, roles)) {
      throw new AppError('Lesson not found', 404);
    }
    return lesson;
  }

  static async createLesson(courseId, data, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) || course.primaryInstructor.toString() === userId;
    if (!isInstructor) throw new AppError('Only course instructors can create lessons', 403);
    const { title, content, order = 0, duration = 0, media = [], transcript } = data;
    if (!title) throw new AppError('Lesson title is required', 400);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Lesson.findOne({ course: courseId, slug });
    if (existing) throw new AppError('A lesson with this title already exists in this course', 409);
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
    const plain = course.toObject();
    const sections = Array.isArray(plain.sections) ? [...plain.sections] : [];
    if (sections.length === 0) {
      course.sections = [{ title: 'Course content', order: 0, lessonIds: [lesson._id] }];
    } else {
      const first = { ...sections[0], lessonIds: [...(sections[0].lessonIds || []).map((id) => id)] };
      if (!first.lessonIds.some((id) => id.toString() === lesson._id.toString())) {
        first.lessonIds.push(lesson._id);
      }
      course.sections = [first, ...sections.slice(1)];
    }
    await course.save();
    return lesson.populate('course', 'title slug');
  }

  static async updateLesson(lessonId, updates, userId) {
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) throw new AppError('Lesson not found', 404);
    const course = lesson.course;
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) || course.primaryInstructor.toString() === userId;
    if (!isInstructor) throw new AppError('Only course instructors can update lessons', 403);
    const allowedFields = ['title', 'content', 'order', 'duration', 'media', 'transcript', 'isPreview', 'quizId'];
    const filteredUpdates = {};
    allowedFields.forEach(field => { if (updates.hasOwnProperty(field)) filteredUpdates[field] = updates[field]; });
    if (filteredUpdates.title) {
      const newSlug = filteredUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const courseId = course._id || course;
      const slugExists = await Lesson.findOne({ course: courseId, slug: newSlug, _id: { $ne: lessonId } });
      if (slugExists) throw new AppError('A lesson with this title already exists in this course', 409);
      filteredUpdates.slug = newSlug;
    }
    Object.assign(lesson, filteredUpdates);
    await lesson.save();
    return lesson.populate('course', 'title slug');
  }

  static async deleteLesson(lessonId, userId) {
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) throw new AppError('Lesson not found', 404);
    const course = lesson.course;
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) || course.primaryInstructor.toString() === userId;
    if (!isInstructor) throw new AppError('Only course instructors can delete lessons', 403);
    course.sections = course.sections.map(section => ({
      ...section,
      lessonIds: section.lessonIds.filter(id => id.toString() !== lessonId)
    }));
    await course.save();
    await Lesson.findByIdAndDelete(lessonId);
    return { message: 'Lesson deleted successfully' };
  }

  static async reorderLessons(courseId, lessonIds, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    const isInstructor = course.instructors.some(i => i.user.toString() === userId) || course.primaryInstructor.toString() === userId;
    if (!isInstructor) throw new AppError('Only course instructors can reorder lessons', 403);
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) throw new AppError('Valid lesson IDs array required', 400);
    const lessons = await Lesson.find({ _id: { $in: lessonIds }, course: courseId });
    if (lessons.length !== lessonIds.length) throw new AppError('One or more lessons not found in this course', 400);
    await Promise.all(lessonIds.map((id, index) => Lesson.findByIdAndUpdate(id, { order: index }, { new: true })));
    return { message: 'Lessons reordered successfully' };
  }
}

export default LessonService;
