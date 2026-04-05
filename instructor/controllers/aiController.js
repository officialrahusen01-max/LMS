import AIService from '../services/aiService.js';
import EmbeddingService from '../services/embeddingService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

export const askQuestion = catchAsync(async (req, res) => {
  const { question, courseId } = req.body;
  if (!question || !question.trim()) throw new AppError('Question is required', 400);
  if (question.length > 1000) throw new AppError('Question must be less than 1000 characters', 400);
  const result = await AIService.askQuestion(question, courseId);
  res.json({ message: 'Question answered successfully', data: result });
});

export const indexCourse = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('instructor') && !userRoles.includes('admin')) throw new AppError('Only instructors and admins can index courses', 403);
  const result = await AIService.indexCourseContent(req.params.courseId);
  res.json({ message: 'Course content indexed successfully', data: result });
});

export const generateCourseEmbedding = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('instructor') && !userRoles.includes('admin')) throw new AppError('Only instructors and admins can generate embeddings', 403);
  const embedding = await EmbeddingService.generateAndStoreEmbeddingForCourse(req.params.courseId);
  res.status(201).json({ message: 'Course embedding generated successfully', data: embedding });
});

export const generateLessonEmbedding = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('instructor') && !userRoles.includes('admin')) throw new AppError('Only instructors and admins can generate embeddings', 403);
  const embedding = await EmbeddingService.generateAndStoreEmbeddingForLesson(req.params.lessonId);
  res.status(201).json({ message: 'Lesson embedding generated successfully', data: embedding });
});

export const generateBlogEmbedding = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('instructor') && !userRoles.includes('admin')) throw new AppError('Only instructors and admins can generate embeddings', 403);
  const embedding = await EmbeddingService.generateAndStoreEmbeddingForBlog(req.params.blogId);
  res.status(201).json({ message: 'Blog embedding generated successfully', data: embedding });
});
