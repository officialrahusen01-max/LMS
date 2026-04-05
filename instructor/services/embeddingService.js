import Embedding from '../../models/Embedding.js';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';
import Blog from '../../models/Blog.js';
import { createEmbedding } from '../../utils/openai.js';
import AppError from '../../utils/AppError.js';

class EmbeddingService {
  static extractCourseText(course) {
    const parts = [course.title, course.shortDescription, course.description, course.tags?.join(' '), course.categories?.join(' ')];
    return parts.filter(Boolean).join(' | ');
  }

  static extractLessonText(lesson) {
    const parts = [lesson.title, lesson.content, lesson.transcript];
    return parts.filter(Boolean).join(' | ');
  }

  static extractBlogText(blog) {
    const parts = [blog.title, blog.excerpt, blog.content, blog.tags?.join(' '), blog.categories?.join(' ')];
    return parts.filter(Boolean).join(' | ');
  }

  static async generateAndStoreEmbeddingForCourse(courseId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    const text = this.extractCourseText(course);
    if (!text.trim()) throw new AppError('No content to embed', 400);
    try {
      const embedding = await createEmbedding(text);
      await Embedding.deleteMany({ sourceType: 'course-note', sourceId: courseId });
      const embeddingDoc = await Embedding.create({
        course: courseId,
        sourceType: 'course-note',
        sourceId: courseId,
        chunkText: text,
        embeddingVectorId: `course-${courseId}`,
        embeddingMeta: { score: 1.0, tokens: Math.ceil(text.length / 4) },
      });
      await this.storeVectorEmbedding(embeddingDoc._id, embedding);
      return embeddingDoc;
    } catch (error) {
      throw new AppError(`Failed to generate course embedding: ${error.message}`, 500);
    }
  }

  static async generateAndStoreEmbeddingForLesson(lessonId) {
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) throw new AppError('Lesson not found', 404);
    const text = this.extractLessonText(lesson);
    if (!text.trim()) throw new AppError('No content to embed', 400);
    try {
      const embedding = await createEmbedding(text);
      await Embedding.deleteMany({ sourceType: 'lesson', sourceId: lessonId });
      const embeddingDoc = await Embedding.create({
        course: lesson.course._id,
        sourceType: 'lesson',
        sourceId: lessonId,
        chunkText: text,
        embeddingVectorId: `lesson-${lessonId}`,
        embeddingMeta: { score: 1.0, tokens: Math.ceil(text.length / 4) },
      });
      await this.storeVectorEmbedding(embeddingDoc._id, embedding);
      return embeddingDoc;
    } catch (error) {
      throw new AppError(`Failed to generate lesson embedding: ${error.message}`, 500);
    }
  }

  static async generateAndStoreEmbeddingForBlog(blogId) {
    const blog = await Blog.findById(blogId);
    if (!blog) throw new AppError('Blog not found', 404);
    if (!blog.published) throw new AppError('Can only embed published blogs', 400);
    const text = this.extractBlogText(blog);
    if (!text.trim()) throw new AppError('No content to embed', 400);
    try {
      const embedding = await createEmbedding(text);
      await Embedding.deleteMany({ sourceType: 'blog', sourceId: blogId });
      const embeddingDoc = await Embedding.create({
        blog: blogId,
        sourceType: 'blog',
        sourceId: blogId,
        chunkText: text,
        embeddingVectorId: `blog-${blogId}`,
        embeddingMeta: { score: 1.0, tokens: Math.ceil(text.length / 4) },
      });
      await this.storeVectorEmbedding(embeddingDoc._id, embedding);
      return embeddingDoc;
    } catch (error) {
      throw new AppError(`Failed to generate blog embedding: ${error.message}`, 500);
    }
  }

  static async storeVectorEmbedding(embeddingId, vector) {
    return Embedding.findByIdAndUpdate(
      embeddingId,
      { $set: { 'embeddingMeta.vector': vector } },
      { new: true }
    );
  }
}

export default EmbeddingService;
