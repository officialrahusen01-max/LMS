# Quiz Generation - Quick Start

## 🚀 Quick Setup

### 1. Ensure Lesson Has Content
```javascript
// Lesson must have either content or transcript
const lesson = {
  title: "JavaScript Basics",
  content: "JavaScript is a programming language...", // OR
  transcript: "Video transcript content..."
};
```

### 2. Generate Quiz (Instructor)

```bash
curl -X POST http://localhost:3000/api/v1/instructor/courses/courseId/lessons/lessonId/generate-quiz \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mcqCount": 5,
    "subjectiveCount": 3,
    "difficulty": "medium"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Quiz generated successfully",
  "data": {
    "_id": "quiz123",
    "questions": [
      {
        "_id": "q1",
        "type": "mcq",
        "question": "What is JavaScript?",
        "options": ["A", "B", "C", "D"],
        "correctOption": 0,
        "difficulty": "medium"
      },
      {
        "_id": "q2",
        "type": "subjective",
        "question": "Explain event bubbling",
        "sampleAnswer": "...",
        "difficulty": "medium"
      }
    ]
  }
}
```

### 3. Publish Quiz
```bash
curl -X PATCH http://localhost:3000/api/v1/instructor/quizzes/quiz123/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPublished": true}'
```

### 4. Student Takes Quiz
```bash
# Get quiz questions (no answers revealed)
curl http://localhost:3000/api/v1/student/lessons/lessonId/quiz \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### 5. Submit Answers
```bash
curl -X POST http://localhost:3000/api/v1/student/quizzes/quiz123/submit \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "q1", "selectedOption": 0},
      {"questionId": "q2", "studentAnswer": "Event bubbling is..."}
    ]
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "scorePercentage": 87.5,
    "score": 7,
    "totalPoints": 8,
    "passed": true,
    "passingScore": 70,
    "results": [
      {
        "questionId": "q1",
        "isCorrect": true,
        "feedback": "✓ Correct answer"
      }
    ]
  }
}
```

## 📊 Parameters

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| mcqCount | number | 5 | 1-20 | Number of MCQ questions |
| subjectiveCount | number | 3 | 0-20 | Number of subjective questions |
| difficulty | string | medium | easy, medium, hard | Question difficulty |
| timeLimit | number | 0 | 0-999 | Time in minutes (0 = unlimited) |
| passingScore | number | 70 | 0-100 | Passing percentage |
| allowRetake | boolean | true | - | Can student retake quiz |
| showAnswers | boolean | true | - | Show answers after submission |

## 📝 Question Types

### MCQ (Multiple Choice Question)
- 4 options to choose from
- Auto-graded (correct answer returned as index 0-3)
- Immediate feedback

### Subjective (Essay)
- Free-text response
- Sample answer provided for guidance
- Student answer stored for reference

## 🔒 Security

- Only instructors/admins can generate/manage quizzes
- Only enrolled students can take quizzes
- Correct answers hidden from students while taking quiz
- Quiz responses automatically tracked in Progress model

## ⚙️ Configuration

In `.env`:
```
OPENAI_API_KEY=sk-...
```

## 📚 Database Collections

- **Quiz** - Quiz documents with embedded questions
- **Lesson** - Has `quizId` reference
- **Progress** - Tracks quiz attempts and scores per student per lesson

## 🎯 Example: Full Flow
```
Instructor creates lesson
    ↓
Instructor calls /generate-quiz (AI generates 8 questions)
    ↓
Instructor reviews and publishes quiz
    ↓
Student enrolls in course
    ↓
Student calls /lessons/:id/quiz (gets questions without answers)
    ↓
Student submits answers
    ↓
System grades and stores in Progress
    ↓
Student gets immediate results
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Lesson must have content" | Add `content` or `transcript` to lesson |
| "OpenAI API error" | Check `OPENAI_API_KEY` in .env |
| "Quiz not found" | Ensure quiz was generated and published |
| "Permission denied" | Use correct role (instructor for generate, student for take) |

## 📖 Full Documentation
See `Lib/docs/QUIZ_SYSTEM.md` for complete API reference
