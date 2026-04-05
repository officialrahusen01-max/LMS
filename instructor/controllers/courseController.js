import CourseService from '../services/courseService.js';
import catchAsync from '../../utils/catchAsync.js';

export const listMyCourses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const result = await CourseService.listMyTeachingCourses(userId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.json({
    success: true,
    data: result.courses,
    pagination: {
      page: result.currentPage,
      limit: parseInt(limit, 10),
      total: result.total,
      pages: result.pages,
    },
  });
});

export const listCourses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, level, tags, search } = req.query;
  const filters = {};
  if (category) filters.category = category;
  if (level) filters.level = level;
  if (tags) filters.tags = tags;
  const roles = req.user?.roles || [];
  const result = await CourseService.listCourses({
    filters,
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    viewerRoles: roles,
    viewerId: req.user?.id,
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

export const getCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const course = await CourseService.getCourseById(id, userId);
  res.json({ success: true, data: course });
});

export const createCourse = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { title, shortDescription, description, category, level, pricingType, price, tags, categories, pricing } = req.body;
  const course = await CourseService.createCourse({
    title,
    shortDescription,
    description,
    categories: categories || (category ? [category] : []),
    level,
    pricing: pricing || (pricingType ? { type: pricingType, price: price || 0 } : undefined),
    tags
  }, userId);
  res.status(201).json({
    success: true,
    data: course,
    message: 'Course created successfully'
  });
});

export const updateCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const course = await CourseService.updateCourse(id, req.body, req.user.id);
  res.json({ success: true, data: course, message: 'Course updated successfully' });
});

export const deleteCourse = catchAsync(async (req, res) => {
  await CourseService.deleteCourse(req.params.id, req.user.id);
  res.json({ success: true, message: 'Course deleted successfully' });
});

export const publishCourse = catchAsync(async (req, res) => {
  const course = await CourseService.publishCourse(req.params.id, req.user.id);
  res.json({ success: true, data: course, message: 'Course published successfully' });
});

export const unpublishCourse = catchAsync(async (req, res) => {
  const course = await CourseService.unpublishCourse(req.params.id, req.user.id);
  res.json({ success: true, data: course, message: 'Course unpublished successfully' });
});

export const addInstructor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { instructorId, role = 'contributor' } = req.body;
  const course = await CourseService.addInstructor(id, instructorId, role, req.user.id);
  res.json({ success: true, data: course, message: 'Instructor added successfully' });
});

export const removeInstructor = catchAsync(async (req, res) => {
  const { id, instructorId } = req.params;
  const course = await CourseService.removeInstructor(id, instructorId, req.user.id);
  res.json({ success: true, data: course, message: 'Instructor removed successfully' });
});
