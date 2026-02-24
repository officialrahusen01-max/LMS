import AIService from '../services/aiService.js';
import EmbeddingService from '../services/embeddingService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const askQuestion = catchAsync(async (req, res) => {
  const { question, courseId } = req.body;
  const userId = req.user.id;

  if (!question || !question.trim()) {
    throw new AppError('Question is required', 400);
  }

  if (question.length > 1000) {
    throw new AppError('Question must be less than 1000 characters', 400);
  }

  const result = await AIService.askQuestion(question, courseId);

  res.json({
    message: 'Question answered successfully',
    data: result,
  });
});

export const indexCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  if (!req.user.role || !['instructor', 'admin'].includes(req.user.role)) {
    throw new AppError('Only instructors and admins can index courses', 403);
  }

  const result = await AIService.indexCourseContent(courseId);

  res.json({
    message: 'Course content indexed successfully',
    data: result,
  });
});

export const generateCourseEmbedding = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  if (!req.user.role || !['instructor', 'admin'].includes(req.user.role)) {
    throw new AppError('Only instructors and admins can generate embeddings', 403);
  }

  const embedding = await EmbeddingService.generateAndStoreEmbeddingForCourse(courseId);

  res.status(201).json({
    message: 'Course embedding generated successfully',
    data: embedding,
  });
});

export const generateLessonEmbedding = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.id;

  if (!req.user.role || !['instructor', 'admin'].includes(req.user.role)) {
    throw new AppError('Only instructors and admins can generate embeddings', 403);
  }

  const embedding = await EmbeddingService.generateAndStoreEmbeddingForLesson(lessonId);

  res.status(201).json({
    message: 'Lesson embedding generated successfully',
    data: embedding,
  });
});

export const generateBlogEmbedding = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.id;

  if (!req.user.role || !['instructor', 'admin'].includes(req.user.role)) {
    throw new AppError('Only instructors and admins can generate embeddings', 403);
  }

  const embedding = await EmbeddingService.generateAndStoreEmbeddingForBlog(blogId);

  res.status(201).json({
    message: 'Blog embedding generated successfully',
    data: embedding,
  });
});
