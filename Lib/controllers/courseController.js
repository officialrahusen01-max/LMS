import CourseService from '../services/courseService.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * CourseController - handles HTTP requests for courses
 */

// List courses (public)
export const listCourses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, level, tags, search } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (level) filters.level = level;
  if (tags) filters.tags = tags;

  const result = await CourseService.listCourses({
    filters,
    search,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: result.courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.total,
      pages: Math.ceil(result.total / limit)
    }
  });
});

// Get course by ID (public)
export const getCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const course = await CourseService.getCourseById(id, userId);

  res.json({
    success: true,
    data: course
  });
});

// Create course (instructor, admin)
export const createCourse = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { title, shortDescription, category, level, pricingType, price, tags } = req.body;

  const course = await CourseService.createCourse({
    title,
    shortDescription,
    category,
    level,
    pricingType,
    price,
    tags
  }, userId);

  res.status(201).json({
    success: true,
    data: course,
    message: 'Course created successfully'
  });
});

// Update course (owner, admin)
export const updateCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const course = await CourseService.updateCourse(id, req.body, userId);

  res.json({
    success: true,
    data: course,
    message: 'Course updated successfully'
  });
});

// Delete course (owner, admin)
export const deleteCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await CourseService.deleteCourse(id, userId);

  res.json({
    success: true,
    message: 'Course deleted successfully'
  });
});

// Publish course (owner, admin)
export const publishCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const course = await CourseService.publishCourse(id, userId);

  res.json({
    success: true,
    data: course,
    message: 'Course published successfully'
  });
});

// Unpublish course (owner, admin)
export const unpublishCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const course = await CourseService.unpublishCourse(id, userId);

  res.json({
    success: true,
    data: course,
    message: 'Course unpublished successfully'
  });
});

// Add instructor to course (owner, admin)
export const addInstructor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { instructorId, role = 'contributor' } = req.body;
  const userId = req.user.id;

  const course = await CourseService.addInstructor(id, instructorId, role, userId);

  res.json({
    success: true,
    data: course,
    message: 'Instructor added successfully'
  });
});

// Remove instructor from course (owner, admin)
export const removeInstructor = catchAsync(async (req, res) => {
  const { id, instructorId } = req.params;
  const userId = req.user.id;

  const course = await CourseService.removeInstructor(id, instructorId, userId);

  res.json({
    success: true,
    data: course,
    message: 'Instructor removed successfully'
  });
});
