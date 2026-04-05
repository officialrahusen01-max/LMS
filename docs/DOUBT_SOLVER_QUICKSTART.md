# AI Doubt Solver - Quick Start Guide

## 🚀 Setup (Instructor)

### 1. Index Course Content
```bash
POST /api/v1/instructor/ai/embeddings/course/{courseId}
```
This generates vector embeddings for all course materials. **Do this once per course.**

### 2. Index Lesson (Optional)
```bash
POST /api/v1/instructor/ai/embeddings/lesson/{lessonId}
```

---

## 🎓 Student Usage

### Ask a Doubt
```bash
POST /api/v1/student/courses/{courseId}/ask-doubt
Content-Type: application/json

{
  "question": "How does prototypal inheritance work in JavaScript?",
  "lessonId": "optional"  # If asking about specific lesson
}
```

**Response (2-5 seconds):**
```json
{
  "data": {
    "doubtId": "d123",
    "answer": "Prototypal inheritance is...",
    "confidence": "87",
    "relevantChunks": [
      { "text": "...", "similarity": 0.87 }
    ],
    "followUpQuestions": [
      "What's the difference between __proto__ and prototype?",
      "How does Object.create() use prototypes?"
    ]
  }
}
```

### Check If Already Answered
```bash
GET /api/v1/student/courses/{courseId}/search-doubts?q=prototypal inheritance
```

### View My Doubt History
```bash
GET /api/v1/student/courses/{courseId}/my-doubts
```

### Rate the Answer
```bash
POST /api/v1/student/doubts/{doubtId}/feedback
{
  "rating": 5,            # 1-5 stars
  "isHelpful": true,      # Did it help?
  "clearedDoubt": true    # Doubt solved?
}
```

---

## 📊 Instructor Dashboard

### See What Students Ask Most
```bash
GET /api/v1/instructor/courses/{courseId}/common-doubts?limit=10
```

**Response:**
```json
{
  "data": [
    {
      "_id": "How do closures work?",
      "count": 12,           # Asked 12 times
      "averageRating": 4.7,
      "lastAsked": "2024-01-15"
    }
  ]
}
```

### View All Course Doubts
```bash
GET /api/v1/instructor/courses/{courseId}/doubts?status=open&page=1
```

### Course Analytics
```bash
GET /api/v1/instructor/courses/{courseId}/doubt-stats
```

**Response:**
```json
{
  "data": {
    "totalDoubts": 45,
    "resolutionRate": 93,      # % AI answered
    "averageRating": 4.5,
    "helpfulRate": 89,         # % students found helpful
    "clearedCount": 40
  }
}
```

### Add Your Comment
```bash
POST /api/v1/instructor/doubts/{doubtId}/comment
{
  "comment": "Great question! Here's a more detailed explanation..."
}
```

---

## 🔑 Key Features

| Feature | What It Does |
|---------|-------------|
| **Semantic Search** | Finds relevant course content using AI embeddings |
| **RAG Pipeline** | Generates answers grounded in course material |
| **Follow-ups** | Suggests related questions for deeper learning |
| **Similar Doubts** | Finds already-answered similar questions |
| **Student Feedback** | Ratings and helpfulness tracking |
| **Instructor Insights** | Analytics on common doubts and topics |
| **Source Attribution** | Shows which course material answered the question |

---

## 📈 Analytics for Instructors

### Identify Knowledge Gaps
If many students ask about "closures" with low ratings:
- Review and improve closure content
- Add more examples
- Link to related topics

### Improve Course Content
- Common doubts = topics needing better explanation
- Low ratings = answers not aligning with course
- Suggested student comments = direct feedback

### Student Success Metrics
- **High helpfulness rate** = clear course content
- **Quick resolution** = effective teaching
- **Good ratings** = quality course material

---

## ⚡ Performance Tips

1. **Generate embeddings for each course** (one-time cost: ~30 seconds)
2. **First doubt takes 3-5s** (AI + search)
3. **Similar doubts are instant** (cached search)
4. **Keep questions focused** (5-500 characters)

---

## 🎯 Best Practices

### For Students
- ✅ Search first (maybe it's already answered!)
- ✅ Be specific in your question
- ✅ Rate answers to help improve content
- ✅ Read the sources provided

### For Instructors
- ✅ Index course content at course creation
- ✅ Review common doubts regularly
- ✅ Add instructor comments to clarify
- ✅ Use analytics to improve teaching

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No content found" | Index course: POST `.../embeddings/course/{id}` |
| "Answer seems wrong" | Add more specific content to course |
| "Slow response" | Normal for first query (5s), improves after |
| "Student not satisfied" | Review their rating, improve course |

---

## 📚 API Cheat Sheet

**Student:**
- `POST /student/courses/:id/ask-doubt` - Ask a question
- `GET /student/courses/:id/search-doubts?q=...` - Search similar
- `GET /student/courses/:id/my-doubts` - View history
- `POST /student/doubts/:id/feedback` - Rate answer

**Instructor:**
- `GET /instructor/courses/:id/common-doubts` - Top questions
- `GET /instructor/courses/:id/doubts` - All doubts
- `GET /instructor/courses/:id/doubt-stats` - Analytics
- `POST /instructor/doubts/:id/comment` - Add response

---

## 🚀 Next Steps

1. ✅ Index your course content
2. ✅ Have students ask questions
3. ✅ Review analytics weekly
4. ✅ Update course based on feedback
5. ✅ Iterate!

