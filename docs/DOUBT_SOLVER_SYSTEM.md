# AI Doubt Solver - Context-Aware Q&A System

## Overview

An intelligent question-answering system that:
- ✅ Understands student doubts using AI (GPT-3.5)
- ✅ Retrieves relevant course content using semantic search (RAG)
- ✅ Generates context-aware answers based on course material
- ✅ Tracks doubt history and learning patterns
- ✅ Suggests similar already-answered doubts
- ✅ Provides instructor insights on common doubts

## Architecture

### How It Works (RAG Pipeline)

```
Student Question
       ↓
[1] Generate Question Embedding (Semantic Search)
       ↓
[2] Search Course Embeddings (Find Top 7 Relevant Chunks)
       ↓
[3] Build Context from Retrieved Chunks
       ↓
[4] Generate Answer using GPT (Context + Question)
       ↓
[5] Generate Follow-up Questions
       ↓
[6] Save Doubt Record + Track Student Feedback
       ↓
Answer to Student
```

### Key Components

1. **Doubt Model** - Stores all Q&A interactions
2. **EmbeddingService** - Generates vector embeddings for chunks
3. **DoubtSolverService** - RAG pipeline with semantic search
4. **Controllers** - API endpoints for students and instructors

## Data Models

### Doubt Schema

```typescript
{
  student: ObjectId,           // Who asked
  course: ObjectId,            // Course context
  lesson: ObjectId,            // (Optional) Specific lesson
  
  // Question
  question: string,            // Student's question
  questionEmbedding: [Number], // Vector embedding for semantic search
  
  // AI Response
  answer: string,              // Generated answer
  sourceType: 'lesson' | 'course-note' | 'blog',
  sourceId: ObjectId,          // Which content was used
  relevantChunks: [{          // Top chunks used for context
    text: string,
    type: string,
    similarity: number (0-1)
  }],
  
  // Quality Metrics
  isHelpful: boolean,         // Did student find it helpful?
  rating: 1-5,                // Star rating
  clearedDoubt: boolean,      // Did this solve the doubt?
  followUpQuestions: [string],
  
  // Instructor Response
  instructorComment: string,  // Instructor can add clarification
  instructorCommentedAt: Date,
  
  status: 'open' | 'resolved' | 'pending-review',
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Student Endpoints

#### 1. Ask a Doubt
**POST** `/api/v1/student/courses/:courseId/ask-doubt`

Request:
```json
{
  "question": "What is event bubbling in JavaScript?",
  "lessonId": "optional-lesson-id"
}
```

Response:
```json
{
  "success": true,
  "message": "Question answered successfully",
  "data": {
    "doubtId": "doubt-123",
    "question": "What is event bubbling...",
    "answer": "Event bubbling is when...",
    "sourceType": "lesson",
    "relevantChunks": [
      {
        "text": "Events propagate...",
        "type": "lesson",
        "similarity": 0.89
      }
    ],
    "followUpQuestions": [
      "What is event capturing?",
      "How to prevent event bubbling?"
    ],
    "confidence": "89",
    "helpfulLinks": [
      {
        "type": "lesson",
        "id": "lesson-456",
        "title": "Event Handling Basics",
        "url": "/lessons/lesson-456"
      }
    ]
  }
}
```

#### 2. Search Similar Doubts
**GET** `/api/v1/student/courses/:courseId/search-doubts?q=query`

Before asking a new question, check if it's already answered.

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "doubt-456",
      "question": "Similar question...",
      "answer": "Existing answer...",
      "similarity": "94"
    }
  ]
}
```

#### 3. Get Doubt History
**GET** `/api/v1/student/courses/:courseId/my-doubts`

Response:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "doubt-123",
      "question": "...",
      "answer": "...",
      "status": "resolved",
      "rating": 5,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### 4. Rate Doubt Response
**POST** `/api/v1/student/doubts/:doubtId/feedback`

Request:
```json
{
  "rating": 5,
  "isHelpful": true,
  "clearedDoubt": true
}
```

---

### Instructor Endpoints

#### 1. Get Common Doubts (Most Asked)
**GET** `/api/v1/instructor/courses/:courseId/common-doubts?limit=10`

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "What is a closure?",
      "count": 15,
      "averageRating": 4.6,
      "lastAsked": "2024-01-15T14:30:00Z"
    }
  ]
}
```

#### 2. Get All Doubts in Course
**GET** `/api/v1/instructor/courses/:courseId/doubts?status=open&page=1&limit=20`

Query Params:
- `status`: 'all' | 'open' | 'resolved' | 'pending-review'
- `page`: pagination
- `limit`: results per page

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "doubt-123",
      "student": {
        "_id": "user-456",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "question": "...",
      "answer": "...",
      "status": "resolved",
      "rating": 4,
      "createdAt": "..."
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

#### 3. Doubt Statistics
**GET** `/api/v1/instructor/courses/:courseId/doubt-stats`

Response:
```json
{
  "success": true,
  "data": {
    "totalDoubts": 45,
    "resolvedDoubts": 42,
    "resolutionRate": 93,
    "averageRating": 4.5,
    "helpfulCount": 40,
    "clearedCount": 38,
    "helpfulRate": 89,
    "clearedCount": 84
  }
}
```

#### 4. Add Instructor Comment
**POST** `/api/v1/instructor/doubts/:doubtId/comment`

Request:
```json
{
  "comment": "Great question! That's a common misconception. Here's a more detailed explanation..."
}
```

---

## RAG (Retrieval Augmented Generation) Improvements

### Why RAG?
- ✅ Answers are grounded in course content
- ✅ Reduces hallucination
- ✅ Maintains consistency with course material
- ✅ Students see exact sources

### How It Works

1. **Semantic Search (Vector Similarity)**
   - Question embedding → Find top 7 similar content chunks
   - Cosine similarity scoring
   - Minimum threshold for relevance

2. **Context Building**
   - Combines top chunks into coherent context
   - Each chunk includes relevance score

3. **AI Response Generation**
   - GPT-3.5 generates answer using context
   - Constrained to course material
   - More reliable and traceable

### Improvements Made

| Feature | Before | After |
|---------|--------|-------|
| Retrieval | Single best match | Top 7 results ranked |
| Threshold | 0.3 (loose) | 0.25 with filtering |
| Context | Basic concatenation | Weighted by similarity |
| Follow-ups | None | 2-3 related questions |
| Sources | Basic reference | Detailed chunk tracking |
| Feedback | No tracking | Full historical record |

---

## Configuration

### Prerequisites
- Course content must be indexed (embeddings generated)
- `OPENAI_API_KEY` in `.env`

### Generate Embeddings (Instructor)
```bash
POST /api/v1/instructor/ai/embeddings/course/:courseId
POST /api/v1/instructor/ai/embeddings/lesson/:lessonId
```

---

## Frontend Usage

### Student - Ask Doubt

```typescript
import { askDoubt, searchSimilarDoubts } from '@/lib/doubt-solver-api';

// Check for similar doubts first
const similar = await searchSimilarDoubts(courseId, 'my question');

// If not found, ask
const result = await askDoubt(courseId, 'My question?', lessonId);

// Rate the response
import { rateDoubtResponse } from '@/lib/doubt-solver-api';
await rateDoubtResponse(doubtId, 5, true, true);
```

### Instructor - View Analytics

```typescript
import { getCommonDoubts, getDoubtStats } from '@/lib/doubt-solver-api';

const commonDoubts = await getCommonDoubts(courseId);
const stats = await getDoubtStats(courseId);
```

---

## Quality Metrics

### Student Perspectives
- **Answer Quality**: 1-5 star rating
- **Helpfulness**: Did it answer the question?
- **Doubt Cleared**: Did it completely resolve the doubt?

### Instructor Insights
- **Common Doubts**: Which topics confuse students?
- **Resolution Rate**: % of doubts resolved by AI
- **Student Satisfaction**: Average rating
- **Topics Needing Attention**: Low-rated doubts

---

## Error Handling

| Error | Solution |
|-------|----------|
| No embeddings found | Instructor must index course content |
| No relevant content | Search threshold too high |
| Poor answer quality | Add more detailed content to course |
| Low student ratings | Review feedback and improve content |

---

## Future Enhancements

- [ ] Multi-turn conversations (follow-up questions)
- [ ] Personalized learning paths based on doubt patterns
- [ ] Automatic content suggestions to instructors
- [ ] Integration with course outline for quick reference
- [ ] Multilingual support
- [ ] AI-generated content summaries
- [ ] Doubt analytics dashboard
- [ ] Peer-learning suggestions (connect students with same doubts)

---

## File Structure

```
Lib/
├── models/
│   └── Doubt.js              # Doubt schema
├── student/
│   ├── services/
│   │   └── doubtSolverService.js
│   ├── controllers/
│   │   └── doubtController.js
│   └── routes/
├── instructor/
│   ├── controllers/
│   │   └── doubtController.js
│   └── routes/

LMS LMS/
└── lib/
    └── doubt-solver-api.ts   # Frontend API helpers
```

---

## Testing the System

### Step 1: Index Course Content
```
Instructor → Settings → Index Course Content
```

### Step 2: Ask a Doubt
```
Student → Course → Ask Doubt → "My question here"
```

### Step 3: View Results
- Answer based on course content
- See sources and relevance scores
- Rate the response

### Step 4: Instructor Insights
```
Instructor → Analytics → Common Doubts → See patterns
```

---

## Performance Notes

- First request may take 3-5 seconds (AI processing)
- Subsequent similar doubts are faster
- Vector search is O(n) but optimized with indexing
- Embeddings cached at course level

---

## Support & Troubleshooting

**Q: Answer seems irrelevant?**
- A: Course content may not cover that topic. Instructor should add more content.

**Q: Why is processing slow?**
- A: First-time embedding generation is expensive. Usually 3-5 seconds.

**Q: Can students see different answers?**
- A: Yes, due to question variations and AI temperature. All are grounded in course content.

