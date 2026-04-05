import Embedding from '../../models/Embedding.js';
import { createEmbedding, generateAIResponse } from '../../utils/openai.js';
import AppError from '../../utils/AppError.js';
import LessonService from './lessonService.js';
import EmbeddingService from './embeddingService.js';

class AIService {
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    let dotProduct = 0, magnitudeA = 0, magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  static async askQuestion(question, courseId = null) {
    if (!question || !question.trim()) throw new AppError('Question cannot be empty', 400);
    try {
      const questionEmbedding = await createEmbedding(question);
      const filter = courseId ? { course: courseId } : {};
      const embeddings = await Embedding.find(filter)
        .populate('course', 'title slug')
        .populate('blog', 'title slug');
      if (embeddings.length === 0) throw new AppError('No course content available to search', 404);
      const scoredResults = embeddings
        .map((emb) => {
          const vector = emb.embeddingMeta?.vector;
          if (!vector || vector.length === 0) return { embedding: emb, score: 0 };
          const score = this.cosineSimilarity(questionEmbedding, vector);
          return { embedding: emb, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      if (scoredResults[0].score < 0.3) {
        return {
          answer: 'I could not find relevant course content to answer your question. Please try asking about course topics.',
          recommendedContent: [],
          similarityScore: 0,
        };
      }
      const context = scoredResults
        .map((result, index) => {
          const { embedding } = result;
          return `[${index + 1}] ${embedding.sourceType.toUpperCase()}: ${embedding.chunkText.substring(0, 300)}...`;
        })
        .join('\n\n');
      const answer = await generateAIResponse(context, question);
      const recommendedContent = scoredResults
        .filter((r) => r.score > 0.4)
        .map((result) => {
          const { embedding, score } = result;
          return {
            id: embedding.sourceId,
            type: embedding.sourceType,
            title: embedding.sourceType === 'blog' ? embedding.blog?.title : embedding.course?.title,
            slug: embedding.sourceType === 'blog' ? embedding.blog?.slug : embedding.course?.slug,
            similarity: Math.round(score * 100) / 100,
          };
        });
      return {
        answer,
        recommendedContent,
        similarityScore: Math.round(scoredResults[0].score * 100) / 100,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new AppError(`AI service error: ${error.message}`, 500);
    }
  }

  static async indexCourseContent(courseId) {
    const lessons = await LessonService.listLessonsByCourse(courseId);
    for (const lesson of lessons) {
      try {
        await EmbeddingService.generateAndStoreEmbeddingForLesson(lesson._id);
      } catch (error) {
        console.error(`Failed to index lesson ${lesson._id}:`, error.message);
      }
    }
    return { indexed: lessons.length };
  }
}

export default AIService;
