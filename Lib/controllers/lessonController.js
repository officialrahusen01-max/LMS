import LessonService from '../services/lessonService.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * LessonController - handles HTTP requests for lessons
 */

// List lessons in a course (public)
export const listLessonsByCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const lessons = await LessonService.listLessonsByCourse(courseId);

  res.json({
    success: true,
    data: lessons,
    count: lessons.length
  });
});

// Get single lesson (public)
export const getLesson = catchAsync(async (req, res) => {
  const { lessonId } = req.params;

  const lesson = await LessonService.getLessonById(lessonId);

  res.json({
    success: true,
    data: lesson
  });
});

// Create lesson (course instructor, admin)
export const createLesson = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const lesson = await LessonService.createLesson(courseId, req.body, userId);

  res.status(201).json({
    success: true,
    data: lesson,
    message: 'Lesson created successfully'
  });
});

// Update lesson (course instructor, admin)
export const updateLesson = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.id;

  const lesson = await LessonService.updateLesson(lessonId, req.body, userId);

  res.json({
    success: true,
    data: lesson,
    message: 'Lesson updated successfully'
  });
});

// Delete lesson (course instructor, admin)
export const deleteLesson = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.id;

  await LessonService.deleteLesson(lessonId, userId);

  res.json({
    success: true,
    message: 'Lesson deleted successfully'
  });
});

// Reorder lessons in a course (course instructor, admin)
export const reorderLessons = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { lessonIds } = req.body;
  const userId = req.user.id;

  await LessonService.reorderLessons(courseId, lessonIds, userId);

  res.json({
    success: true,
    message: 'Lessons reordered successfully'
  });
});
