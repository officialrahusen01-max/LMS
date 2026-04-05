import Embedding from '../../models/Embedding.js';
import Doubt from '../../models/Doubt.js';
import Lesson from '../../models/Lesson.js';
import Course from '../../models/Course.js';
import { createEmbedding, generateAIResponse } from '../../utils/openai.js';
import AppError from '../../utils/AppError.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Improved RAG-based Doubt Solver Service
 * Uses semantic search with embeddings to find relevant course content
 * and generates context-aware answers
 */
class DoubtSolverService {
  /**
   * Cosine similarity between two vectors
   */
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

  /**
   * Find most relevant chunks from course using semantic search
   * Improved RAG: Better filtering and ranking
   */
  static async findRelevantContext(question, courseId, topK = 7) {
    if (!question || !question.trim()) {
      throw new AppError('Question cannot be empty', 400);
    }

    // Generate embedding for the question
    let questionEmbedding;
    try {
      questionEmbedding = await createEmbedding(question);
    } catch (error) {
      throw new AppError('Failed to generate question embedding', 500);
    }

    // Search embeddings from the course
    const embeddings = await Embedding.find({ course: courseId })
      .populate('course', 'title slug')
      .lean();

    if (embeddings.length === 0) {
      throw new AppError('No course content indexed for this course. Please ask instructor to index the course.', 404);
    }

    // Score all chunks using cosine similarity
    const scoredChunks = embeddings
      .map((emb) => {
        const vector = emb.embeddingMeta?.vector;
        if (!vector || vector.length === 0) {
          return { embedding: emb, score: 0 };
        }
        const similarity = this.cosineSimilarity(questionEmbedding, vector);
        return { embedding: emb, score: similarity };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Filter only chunks with minimum similarity threshold (improved RAG)
    const minSimilarity = 0.25; // Lower threshold for broader context
    const relevantChunks = scoredChunks.filter((item) => item.score >= minSimilarity);

    return {
      chunks: relevantChunks,
      bestScore: scoredChunks[0]?.score || 0,
      questionEmbedding,
    };
  }

  /**
   * Solve student doubt using context-aware RAG
   */
  static async solveDoubt(studentId, courseId, lessonId = null, question) {
    if (!question || question.length > 2000) {
      throw new AppError('Question must be between 1 and 2000 characters', 400);
    }

    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    let lesson = null;
    if (lessonId) {
      lesson = await Lesson.findById(lessonId);
      if (!lesson) throw new AppError('Lesson not found', 404);
    }

    try {
      // Step 1: Find relevant context using improved RAG
      const { chunks, bestScore, questionEmbedding } = await this.findRelevantContext(
        question,
        courseId,
        7 // Retrieve top 7 chunks
      );

      // If no relevant content found
      if (chunks.length === 0 || bestScore < 0.25) {
        const answer = `I couldn't find specific course content related to your question. 
        
For this question: "${question}"

I recommend:
1. Reviewing the course materials relevant to this topic
2. Discussing with your instructor or peers
3. Checking the course resources and documentation

Feel free to ask another question about the course content!`;

        const doubt = await Doubt.create({
          student: studentId,
          course: courseId,
          lesson: lessonId,
          question,
          questionEmbedding,
          answer,
          sourceType: null,
          sourceId: null,
          relevantChunks: [],
          status: 'pending-review',
        });

        return {
          doubtId: doubt._id,
          question,
          answer,
          sourceType: null,
          relevantChunks: [],
          helpfulLinks: [],
          confidence: 0,
        };
      }

      // Step 2: Build context from top chunks
      const contextParts = chunks
        .map((item, idx) => {
          const { embedding, score } = item;
          return `[Source ${idx + 1} - ${embedding.sourceType.toUpperCase()}]:
${embedding.chunkText}
[Relevance: ${(score * 100).toFixed(0)}%]`;
        })
        .join('\n\n---\n\n');

      // Step 3: Generate improved answer using context
      const systemPrompt = `You are an expert teaching assistant for an online learning platform. 
Your role is to help students understand course concepts by:
1. Using the provided course content as your primary source
2. Explaining concepts clearly and pedagogically
3. Providing examples when relevant
4. Suggesting what topics to review if the answer relates to prerequisites
5. Being encouraging and supportive

Important: Base your answers ONLY on the provided course content. If information is not in the course material, say so.`;

      const userPrompt = `Based on the following course content, please answer this student's question:

COURSE CONTEXT:
${contextParts}

STUDENT'S QUESTION:
"${question}"

Please provide:
1. A clear, educational answer based on the course content
2. Key points the student should remember
3. Any prerequisites they should review (if applicable)
4. Related topics they might find helpful`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const answer = response.choices[0].message.content;

      // Step 4: Generate follow-up questions for deeper learning
      const followUpResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate 2-3 follow-up questions that would help deepen understanding of the topic.',
          },
          {
            role: 'user',
            content: `After answering "${question}", what related questions could a student ask? List 2-3 brief questions.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 300,
      });

      const followUpText = followUpResponse.choices[0].message.content;
      const followUpQuestions = followUpText
        .split('\n')
        .filter((q) => q.trim() && q.trim().length > 5)
        .slice(0, 3);

      // Step 5: Determine best source
      const bestChunk = chunks[0].embedding;
      const relevantChunksData = chunks.map((item) => ({
        text: item.embedding.chunkText.substring(0, 200),
        type: item.embedding.sourceType,
        similarity: (item.score * 100).toFixed(0),
      }));

      // Step 6: Save doubt record
      const doubt = await Doubt.create({
        student: studentId,
        course: courseId,
        lesson: lessonId,
        question,
        questionEmbedding,
        answer,
        sourceType: bestChunk.sourceType,
        sourceId: bestChunk.sourceId,
        relevantChunks: relevantChunksData,
        followUpQuestions,
        status: 'resolved',
      });

      return {
        doubtId: doubt._id,
        question,
        answer,
        sourceType: bestChunk.sourceType,
        relevantChunks: relevantChunksData,
        followUpQuestions,
        confidence: (chunks[0].score * 100).toFixed(0),
        helpfulLinks: this.generateHelpfulLinks(chunks),
      };
    } catch (error) {
      console.error('Doubt solver error:', error);
      if (error.statusCode) throw error;
      throw new AppError(`Failed to solve doubt: ${error.message}`, 500);
    }
  }

  /**
   * Generate helpful resource links
   */
  static generateHelpfulLinks(chunks) {
    const links = [];
    const seen = new Set();

    for (const item of chunks) {
      const { embedding } = item;

      if (embedding.sourceType === 'lesson' && !seen.has(embedding.sourceId.toString())) {
        const lesson = embedding.lesson || {};
        links.push({
          type: 'lesson',
          id: embedding.sourceId,
          title: lesson.title || 'Review Lesson',
          url: `/lessons/${embedding.sourceId}`,
        });
        seen.add(embedding.sourceId.toString());

        if (links.length > 3) break;
      }
    }

    return links;
  }

  /**
   * Get student's doubt history
   */
  static async getDoubtHistory(studentId, courseId) {
    const doubts = await Doubt.find({
      student: studentId,
      course: courseId,
    })
      .select('question answer status rating createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    return doubts;
  }

  /**
   * Rate doubt response
   */
  static async rateDoubtResponse(doubtId, studentId, rating, isHelpful, clearedDoubt) {
    const doubt = await Doubt.findById(doubtId);

    if (!doubt) throw new AppError('Doubt record not found', 404);
    if (doubt.student.toString() !== studentId.toString()) {
      throw new AppError('Not authorized to rate this doubt', 403);
    }

    doubt.rating = rating;
    doubt.isHelpful = isHelpful;
    doubt.clearedDoubt = clearedDoubt;
    await doubt.save();

    return doubt;
  }

  /**
   * Get common doubts (for instructor)
   */
  static async getCommonDoubts(courseId, limit = 10) {
    const commonDoubts = await Doubt.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: '$question',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          lastAsked: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return commonDoubts;
  }

  /**
   * Search similar doubts (suggest if already answered)
   */
  static async findSimilarDoubts(question, courseId, limit = 3) {
    try {
      const questionEmbedding = await createEmbedding(question);

      const doubts = await Doubt.find({ course: courseId, status: 'resolved' }).lean();

      const scoredDoubts = doubts
        .map((doubt) => {
          const vector = doubt.questionEmbedding || [];
          if (vector.length === 0) return { doubt, score: 0 };
          const score = this.cosineSimilarity(questionEmbedding, vector);
          return { doubt, score };
        })
        .sort((a, b) => b.score - a.score)
        .filter((item) => item.score > 0.7) // High similarity threshold
        .slice(0, limit);

      return scoredDoubts.map((item) => ({
        id: item.doubt._id,
        question: item.doubt.question,
        answer: item.doubt.answer,
        similarity: (item.score * 100).toFixed(0),
      }));
    } catch (error) {
      console.error('Error finding similar doubts:', error);
      return [];
    }
  }
}

export default DoubtSolverService;
