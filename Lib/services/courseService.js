import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import AppError from '../utils/AppError.js';

/**
 * CourseService - handles course operations with permissions
 */
class CourseService {
  /**
   * List all published courses with pagination and filtering
   * @param {Object} query - { page, limit, category, tags, level, search }
   * @returns {Object} - { courses, total, pages, currentPage }
   */
  static async listCourses(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = { published: true };

    if (query.category) filter.categories = query.category;
    if (query.level) filter.level = query.level;
    if (query.tags) filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const courses = await Course.find(filter)
      .populate('primaryInstructor', 'fullName publicUsername avatarUrl')
      .populate('instructors.user', 'fullName publicUsername avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort({ publishedAt: -1 });

    const total = await Course.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return { courses, total, pages, currentPage: page };
  }

  /**
   * Get single course by ID or slug
   * @param {String} identifier - Course ID or slug
   * @param {String} userId - Current user ID (for permission checks)
   * @returns {Object} - Course document
   */
  static async getCourseById(identifier, userId = null) {
    const filter = identifier.match(/^[0-9a-f]{24}$/) ? { _id: identifier } : { slug: identifier };

    const course = await Course.findOne(filter)
      .populate('primaryInstructor', 'fullName publicUsername avatarUrl bio')
      .populate('instructors.user', 'fullName publicUsername avatarUrl')
      .populate('pricing.subscriptionPlanId', 'name slug priceMonthly priceYearly');

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // If course not published and user is not instructor/admin, deny access
    if (!course.published) {
      const isInstructor = userId && course.instructors.some(i => i.user._id.toString() === userId);
      const isPrimaryInstructor = userId && course.primaryInstructor._id.toString() === userId;
      if (!isInstructor && !isPrimaryInstructor) {
        throw new AppError('Course not found or access denied', 404);
      }
    }

    // Fetch lesson count and stats
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    const enrollmentCount = await Enrollment.countDocuments({ course: course._id, status: 'active' });

    course.stats.studentsCount = enrollmentCount;

    return { ...course.toObject(), lessonCount };
  }

  /**
   * Create new course
   * @param {Object} data - Course data
   * @param {String} userId - Creator user ID
   * @returns {Object} - Created course
   */
  static async createCourse(data, userId) {
    // Verify user status and instructor approval (final authority)
    const User = (await import('../models/User.js')).default;
    const userDoc = await User.findById(userId).select('roles approvedInstructor status');
    if (!userDoc) throw new AppError('User not found', 404);
    if (userDoc.status !== 'active') throw new AppError('Account not active', 403);
    if (!userDoc.roles.includes('admin')) {
      if (!userDoc.approvedInstructor) throw new AppError('Instructor account not approved', 403);
    }

    const { title, shortDescription, description, categories, tags, level, pricing } = data;

    // Validate required fields
    if (!title || !shortDescription || !description) {
      throw new AppError('title, shortDescription, and description are required', 400);
    }

    // Validate pricing
    if (pricing && !['free', 'one_time', 'subscription'].includes(pricing.type)) {
      throw new AppError('Invalid pricing type', 400);
    }

    // Check if slug is unique
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Course.findOne({ slug });
    if (existing) {
      throw new AppError('A course with this title already exists', 409);
    }

    const course = new Course({
      title,
      slug,
      shortDescription,
      description,
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

  /**
   * Update course
   * @param {String} courseId - Course ID
   * @param {Object} updates - Fields to update
   * @param {String} userId - User ID (must be instructor)
   * @returns {Object} - Updated course
   */
  static async updateCourse(courseId, updates, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check permissions: primary instructor or admin
    const isOwner = course.primaryInstructor.toString() === userId;
    if (!isOwner) {
      throw new AppError('Only course owner can update this course', 403);
    }

    // Final authority: ensure owner is active
    const User = (await import('../models/User.js')).default;
    const userDoc = await User.findById(userId).select('status');
    if (!userDoc || userDoc.status !== 'active') throw new AppError('Account not active', 403);

    // Allowed fields
    const allowedFields = ['title', 'shortDescription', 'description', 'categories', 'tags', 'level', 'thumbnailUrl', 'coverUrl', 'pricing', 'certificate', 'aiKnowledge'];
    const filteredUpdates = {};

    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field)) {
        filteredUpdates[field] = updates[field];
      }
    });

    // If title changed, regenerate slug
    if (filteredUpdates.title) {
      const newSlug = filteredUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugExists = await Course.findOne({ slug: newSlug, _id: { $ne: courseId } });
      if (slugExists) {
        throw new AppError('A course with this title already exists', 409);
      }
      filteredUpdates.slug = newSlug;
    }

    Object.assign(course, filteredUpdates);
    await course.save();

    return course.populate('primaryInstructor', 'fullName publicUsername avatarUrl');
  }

  /**
   * Add instructor to course
   * @param {String} courseId - Course ID
   * @param {String} instructorId - Instructor user ID
   * @param {String} role - 'owner' or 'contributor'
   * @param {String} userId - Current user ID (must be owner)
   */
  static async addInstructor(courseId, instructorId, role = 'contributor', userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (course.primaryInstructor.toString() !== userId) {
      throw new AppError('Only course owner can add instructors', 403);
    }

    // Ensure owner account is active
    const User = (await import('../models/User.js')).default;
    const owner = await User.findById(userId).select('status');
    if (!owner || owner.status !== 'active') throw new AppError('Account not active', 403);

    const alreadyAdded = course.instructors.some(i => i.user.toString() === instructorId);
    if (alreadyAdded) {
      throw new AppError('Instructor already added to course', 409);
    }

    course.instructors.push({ user: instructorId, role, order: course.instructors.length });
    await course.save();

    return course.populate('instructors.user', 'fullName publicUsername avatarUrl');
  }

  /**
   * Remove instructor from course
   * @param {String} courseId - Course ID
   * @param {String} instructorId - Instructor user ID
   * @param {String} userId - Current user ID (must be owner)
   */
  static async removeInstructor(courseId, instructorId, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (course.primaryInstructor.toString() !== userId) {
      throw new AppError('Only course owner can remove instructors', 403);
    }

    // Ensure owner account is active
    const User = (await import('../models/User.js')).default;
    const owner = await User.findById(userId).select('status');
    if (!owner || owner.status !== 'active') throw new AppError('Account not active', 403);

    if (course.primaryInstructor.toString() === instructorId) {
      throw new AppError('Cannot remove primary instructor', 400);
    }

    course.instructors = course.instructors.filter(i => i.user.toString() !== instructorId);
    await course.save();

    return course;
  }

  /**
   * Publish course (makes it visible to students)
   * @param {String} courseId - Course ID
   * @param {String} userId - Current user ID
   */
  static async publishCourse(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const isInstructor = course.instructors.some(i => i.user.toString() === userId);
    if (!isInstructor) {
      throw new AppError('Only course instructors can publish', 403);
    }

    // Final authority: verify user's approvedInstructor and status
    const User = (await import('../models/User.js')).default;
    const userDoc = await User.findById(userId).select('roles approvedInstructor status');
    if (!userDoc) throw new AppError('User not found', 404);
    if (userDoc.status !== 'active') throw new AppError('Account not active', 403);
    if (!userDoc.roles.includes('admin') && !userDoc.approvedInstructor) {
      throw new AppError('Instructor account not approved', 403);
    }

    if (course.published) {
      throw new AppError('Course is already published', 400);
    }

    // Validation: at least one section with lessons
    if (!course.sections || course.sections.length === 0) {
      throw new AppError('Course must have at least one section with lessons before publishing', 400);
    }

    course.published = true;
    course.publishedAt = new Date();
    await course.save();

    return course;
  }

  /**
   * Unpublish course
   * @param {String} courseId - Course ID
   * @param {String} userId - Current user ID
   */
  static async unpublishCourse(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const isInstructor = course.instructors.some(i => i.user.toString() === userId);
    if (!isInstructor) {
      throw new AppError('Only course instructors can unpublish', 403);
    }

    // Ensure user's account active
    const User = (await import('../models/User.js')).default;
    const userDoc = await User.findById(userId).select('status');
    if (!userDoc || userDoc.status !== 'active') throw new AppError('Account not active', 403);

    if (!course.published) {
      throw new AppError('Course is not published', 400);
    }

    course.published = false;
    await course.save();

    return course;
  }

  /**
   * Delete course (only if no students enrolled)
   * @param {String} courseId - Course ID
   * @param {String} userId - Current user ID
   */
  static async deleteCourse(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (course.primaryInstructor.toString() !== userId) {
      throw new AppError('Only course owner can delete', 403);
    }

    // Check if any students enrolled
    const enrollmentCount = await Enrollment.countDocuments({ course: courseId });
    if (enrollmentCount > 0) {
      throw new AppError('Cannot delete course with enrolled students', 400);
    }

    // Delete all lessons
    await Lesson.deleteMany({ course: courseId });

    // Delete course
    await Course.findByIdAndDelete(courseId);

    return { message: 'Course deleted successfully' };
  }
}

export default CourseService;
