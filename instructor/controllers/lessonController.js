import LessonService from '../services/lessonService.js';
import catchAsync from '../../utils/catchAsync.js';

export const listLessonsByCourse = catchAsync(async (req, res) => {
  const lessons = await LessonService.listLessonsByCourse(
    req.params.courseId,
    req.user?.id,
    req.user?.roles || []
  );
  res.json({ success: true, data: lessons, count: lessons.length });
});

export const getLesson = catchAsync(async (req, res) => {
  const lesson = await LessonService.getLessonById(
    req.params.lessonId,
    req.user?.id,
    req.user?.roles || []
  );
  res.json({ success: true, data: lesson });
});

export const createLesson = catchAsync(async (req, res) => {
  const lesson = await LessonService.createLesson(req.params.courseId, req.body, req.user.id);
  res.status(201).json({ success: true, data: lesson, message: 'Lesson created successfully' });
});

export const updateLesson = catchAsync(async (req, res) => {
  const lesson = await LessonService.updateLesson(req.params.lessonId, req.body, req.user.id);
  res.json({ success: true, data: lesson, message: 'Lesson updated successfully' });
});

export const deleteLesson = catchAsync(async (req, res) => {
  await LessonService.deleteLesson(req.params.lessonId, req.user.id);
  res.json({ success: true, message: 'Lesson deleted successfully' });
});

export const reorderLessons = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { lessonIds } = req.body;
  await LessonService.reorderLessons(courseId, lessonIds, req.user.id);
  res.json({ success: true, message: 'Lessons reordered successfully' });
});
