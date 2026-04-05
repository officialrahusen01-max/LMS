import mongoose from 'mongoose';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';
import Enrollment from '../../models/Enrollment.js';
import AppError from '../../utils/AppError.js';

function toObjectId(id) {
  if (id == null) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  const s = String(id);
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

class CourseService {
  static async listCourses(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;
    const roles = Array.isArray(query.viewerRoles) ? query.viewerRoles : [];
    const viewerId = query.viewerId;

    /** Students / guests: published only. Instructors: published + own drafts. Admin: all. */
    let visibilityFilter;
    if (roles.includes('admin')) {
      visibilityFilter = {};
    } else if (roles.includes('instructor') && viewerId) {
      const oid = toObjectId(viewerId);
      visibilityFilter = oid
        ? {
            $or: [
              { published: true },
              {
                published: false,
                $or: [{ primaryInstructor: oid }, { 'instructors.user': oid }],
              },
            ],
          }
        : { published: true };
    } else {
      visibilityFilter = { published: true };
    }

    const q = query.filters || query;
    const andParts = [visibilityFilter];
    if (q.category) andParts.push({ categories: q.category });
    if (q.level) andParts.push({ level: q.level });
    if (q.tags) andParts.push({ tags: { $in: Array.isArray(q.tags) ? q.tags : [q.tags] } });
    if (query.search) andParts.push({ $text: { $search: query.search } });

    const filter = andParts.length === 1 ? andParts[0] : { $and: andParts };

    const courses = await Course.find(filter)
      .populate('primaryInstructor', 'fullName publicUsername avatarUrl')
      .populate('instructors.user', 'fullName publicUsername avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });
    const total = await Course.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    return { courses, total, pages, currentPage: page };
  }

  static async getCourseById(identifier, userId = null) {
    const filter = identifier.match(/^[0-9a-f]{24}$/) ? { _id: identifier } : { slug: identifier };
    const course = await Course.findOne(filter)
      .populate('primaryInstructor', 'fullName publicUsername avatarUrl bio')
      .populate('instructors.user', 'fullName publicUsername avatarUrl')
      .populate('pricing.subscriptionPlanId', 'name slug priceMonthly priceYearly');
    if (!course) throw new AppError('Course not found', 404);
    if (!course.published) {
      const isInstructor = userId && course.instructors.some(i => i.user._id.toString() === userId);
      const isPrimaryInstructor = userId && course.primaryInstructor._id.toString() === userId;
      if (!isInstructor && !isPrimaryInstructor) throw new AppError('Course not found or access denied', 404);
    }
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    const enrollmentCount = await Enrollment.countDocuments({ course: course._id, status: 'active' });
    course.stats.studentsCount = enrollmentCount;
    return { ...course.toObject(), lessonCount };
  }

  static async createCourse(data, userId) {
    const User = (await import('../../models/User.js')).default;
    const userDoc = await User.findById(userId).select('roles approvedInstructor status');
    if (!userDoc) throw new AppError('User not found', 404);
    if (userDoc.status !== 'active') throw new AppError('Account not active', 403);
    if (!userDoc.roles.includes('admin') && !userDoc.approvedInstructor) throw new AppError('Instructor account not approved', 403);
    const { title, shortDescription, description, categories, tags, level, pricing } = data;
    if (!title || !shortDescription) throw new AppError('title and shortDescription are required', 400);
    if (pricing && !['free', 'one_time', 'subscription'].includes(pricing.type)) throw new AppError('Invalid pricing type', 400);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Course.findOne({ slug });
    if (existing) throw new AppError('A course with this title already exists', 409);
    const course = new Course({
      title,
      slug,
      shortDescription,
      description: description || '',
      primaryInstructor: userId,
      instructors: [{ user: userId, role: 'owner' }],
      categories: categories || [],
      tags: tags || [],
      level: level || 'beginner',
      pricing: pricing || { type: 'free' },
      published: false,
      aiKnowledge: { includeInAi: true }
    });
    await course.save();
    return course.populate('primaryInstructor', 'fullName publicUsername avatarUrl');
  }

  static async updateCourse(courseId, updates, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (course.primaryInstructor.toString() !== userId) throw new AppError('Only course owner can update this course', 403);
    const User = (await import('../../models/User.js')).default;
    const userDoc = await User.findById(userId).select('status');
    if (!userDoc || userDoc.status !== 'active') throw new AppError('Account not active', 403);
    const allowedFields = ['title', 'shortDescription', 'description', 'categories', 'tags', 'level', 'thumbnailUrl', 'coverUrl', 'pricing', 'certificate', 'aiKnowledge'];
    const filteredUpdates = {};
    allowedFields.forEach(field => { if (updates.hasOwnProperty(field)) filteredUpdates[field] = updates[field]; });
    if (filteredUpdates.title) {
      const newSlug = filteredUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugExists = await Course.findOne({ slug: newSlug, _id: { $ne: courseId } });
      if (slugExists) throw new AppError('A course with this title already exists', 409);
      filteredUpdates.slug = newSlug;
    }
    Object.assign(course, filteredUpdates);
    await course.save();
    return course.populate('primaryInstructor', 'fullName publicUsername avatarUrl');
  }

  static async addInstructor(courseId, instructorId, role = 'contributor', userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (course.primaryInstructor.toString() !== userId) throw new AppError('Only course owner can add instructors', 403);
    const User = (await import('../../models/User.js')).default;
    const owner = await User.findById(userId).select('status');
    if (!owner || owner.status !== 'active') throw new AppError('Account not active', 403);
    if (course.instructors.some(i => i.user.toString() === instructorId)) throw new AppError('Instructor already added to course', 409);
    course.instructors.push({ user: instructorId, role, order: course.instructors.length });
    await course.save();
    return course.populate('instructors.user', 'fullName publicUsername avatarUrl');
  }

  static async removeInstructor(courseId, instructorId, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (course.primaryInstructor.toString() !== userId) throw new AppError('Only course owner can remove instructors', 403);
    const User = (await import('../../models/User.js')).default;
    const owner = await User.findById(userId).select('status');
    if (!owner || owner.status !== 'active') throw new AppError('Account not active', 403);
    if (course.primaryInstructor.toString() === instructorId) throw new AppError('Cannot remove primary instructor', 400);
    course.instructors = course.instructors.filter(i => i.user.toString() !== instructorId);
    await course.save();
    return course;
  }

  static async publishCourse(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!course.instructors.some(i => i.user.toString() === userId)) throw new AppError('Only course instructors can publish', 403);
    const User = (await import('../../models/User.js')).default;
    const userDoc = await User.findById(userId).select('roles approvedInstructor status');
    if (!userDoc) throw new AppError('User not found', 404);
    if (userDoc.status !== 'active') throw new AppError('Account not active', 403);
    if (!userDoc.roles.includes('admin') && !userDoc.approvedInstructor) throw new AppError('Instructor account not approved', 403);
    if (course.published) throw new AppError('Course is already published', 400);
    const lessonCount = await Lesson.countDocuments({ course: courseId });
    if (lessonCount === 0) {
      throw new AppError('Add at least one lesson before publishing. Students only see published courses in the catalog.', 400);
    }
    course.published = true;
    course.publishedAt = new Date();
    await course.save();
    return course;
  }

  static async unpublishCourse(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!course.instructors.some(i => i.user.toString() === userId)) throw new AppError('Only course instructors can unpublish', 403);
    const User = (await import('../../models/User.js')).default;
    const userDoc = await User.findById(userId).select('status');
    if (!userDoc || userDoc.status !== 'active') throw new AppError('Account not active', 403);
    if (!course.published) throw new AppError('Course is not published', 400);
    course.published = false;
    await course.save();
    return course;
  }

  static async deleteCourse(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (course.primaryInstructor.toString() !== userId) throw new AppError('Only course owner can delete', 403);
    const enrollmentCount = await Enrollment.countDocuments({ course: courseId });
    if (enrollmentCount > 0) throw new AppError('Cannot delete course with enrolled students', 400);
    await Lesson.deleteMany({ course: courseId });
    await Course.findByIdAndDelete(courseId);
    return { message: 'Course deleted successfully' };
  }

  /** Courses where user is primary instructor or listed as instructor (includes drafts). */
  static async listMyTeachingCourses(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, parseInt(query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const filter = {
      $or: [{ primaryInstructor: userId }, { 'instructors.user': userId }],
    };
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .select('title slug shortDescription level published publishedAt categories tags thumbnailUrl updatedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter),
    ]);
    const courseIds = courses.map((c) => c._id);
    let lessonCounts = [];
    let enrollCounts = [];
    if (courseIds.length > 0) {
      [lessonCounts, enrollCounts] = await Promise.all([
        Lesson.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Enrollment.aggregate([
          { $match: { course: { $in: courseIds }, status: 'active' } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
      ]);
    }
    const lessonMap = Object.fromEntries(lessonCounts.map((x) => [String(x._id), x.count]));
    const enrollMap = Object.fromEntries(enrollCounts.map((x) => [String(x._id), x.count]));
    const enriched = courses.map((c) => ({
      ...c,
      lessonCount: lessonMap[String(c._id)] ?? 0,
      enrollmentCount: enrollMap[String(c._id)] ?? 0,
    }));
    return {
      courses: enriched,
      total,
      pages: Math.ceil(total / limit) || 1,
      currentPage: page,
    };
  }
}

export default CourseService;
