# Auto Quiz Generation System

## Overview
Automatically generate MCQ (Multiple Choice Questions) and subjective quiz questions from lesson content using AI (OpenAI GPT-3.5).

## Architecture

### Models
- **Quiz Model** (`Lib/models/Quiz.js`)
  - Stores quiz metadata
  - Contains embedded questions (MCQ & Subjective)
  - Tracks publication status and settings
  - Stores generation metadata (date, model used)

- **Question Schema** (embedded in Quiz)
  - Fields: `type`, `question`, `options`, `correctOption` (MCQ), `sampleAnswer` (Subjective)
  - Supports difficulty levels: easy, medium, hard
  - Tracks question order

### Services

#### Instructor Service (`Lib/instructor/services/quizService.js`)
- `generateQuizFromLesson()` - Auto-generate quiz from lesson content
- `generateMCQQuestions()` - Generate multiple choice questions
- `generateSubjectiveQuestions()` - Generate essay/text-based questions
- `regenerateQuestions()` - Regenerate questions for existing quiz
- `updateQuizSettings()` - Update quiz metadata
- `deleteQuiz()` - Delete quiz and update lesson reference

#### Student Service (`Lib/student/services/quizService.js`)
- `getQuizForTaking()` - Get quiz questions (hides correct answers)
- `submitQuizAnswers()` - Submit and grade quiz answers
- `getQuizResults()` - Retrieve quiz submission results
- `getPublishedQuizByLesson()` - Get published quiz for a lesson

## API Endpoints

### Instructor Endpoints

#### 1. Generate Quiz from Lesson
**POST** `/api/v1/instructor/courses/:courseId/lessons/:lessonId/generate-quiz`

Request Body:
```json
{
  "mcqCount": 5,
  "subjectiveCount": 3,
  "difficulty": "medium"
}
```

Response:
```json
{
  "success": true,
  "message": "Quiz generated successfully",
  "data": {
    "_id": "quiz-id",
    "lesson": "lesson-id",
    "title": "Lesson Title - Quiz",
    "questions": [
      {
        "_id": "q1",
        "type": "mcq",
        "question": "What is X?",
        "options": ["A", "B", "C", "D"],
        "correctOption": 0,
        "difficulty": "medium"
      },
      {
        "_id": "q2",
        "type": "subjective",
        "question": "Explain Y",
        "sampleAnswer": "Expected answer...",
        "difficulty": "medium"
      }
    ],
    "totalQuestions": 8,
    "mcqCount": 5,
    "subjectiveCount": 3,
    "isPublished": false,
    "generatedAt": "2024-01-01T10:00:00Z"
  }
}
```

#### 2. Get Quiz
**GET** `/api/v1/instructor/quizzes/:quizId`

Returns full quiz with answers (for instructor review).

#### 3. Get Quiz by Lesson
**GET** `/api/v1/instructor/courses/:courseId/lessons/:lessonId/quiz`

#### 4. Update Quiz Settings
**PUT** `/api/v1/instructor/quizzes/:quizId`

Request Body:
```json
{
  "title": "New Title",
  "passingScore": 75,
  "timeLimit": 30,
  "allowRetake": true,
  "showAnswers": true,
  "randomizeQuestions": true,
  "randomizeOptions": true
}
```

#### 5. Regenerate Questions
**POST** `/api/v1/instructor/quizzes/:quizId/regenerate`

Request Body:
```json
{
  "mcqCount": 3,
  "subjectiveCount": 2,
  "difficulty": "hard"
}
```

#### 6. Publish Quiz
**PATCH** `/api/v1/instructor/quizzes/:quizId/publish`

Request Body:
```json
{
  "isPublished": true
}
```

#### 7. Delete Quiz
**DELETE** `/api/v1/instructor/quizzes/:quizId`

### Student Endpoints

#### 1. Get Quiz Questions (for taking)
**GET** `/api/v1/student/lessons/:lessonId/quiz`

Returns quiz with questions but without revealing correct answers.

Response:
```json
{
  "success": true,
  "data": {
    "_id": "quiz-id",
    "title": "Quiz Title",
    "description": "...",
    "totalQuestions": 8,
    "timeLimit": 30,
    "passingScore": 70,
    "questions": [
      {
        "_id": "q1",
        "type": "mcq",
        "question": "What is X?",
        "options": ["A", "B", "C", "D"],
        "difficulty": "medium"
      }
    ]
  }
}
```

#### 2. Submit Quiz Answers
**POST** `/api/v1/student/quizzes/:quizId/submit`

Request Body:
```json
{
  "answers": [
    {
      "questionId": "q1",
      "selectedOption": 0  // For MCQ
    },
    {
      "questionId": "q2",
      "studentAnswer": "My answer here"  // For subjective
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "quizId": "quiz-id",
    "scorePercentage": 87.5,
    "score": 7,
    "totalPoints": 8,
    "passed": true,
    "passingScore": 70,
    "results": [
      {
        "questionId": "q1",
        "question": "What is X?",
        "type": "mcq",
        "studentAnswer": 0,
        "isCorrect": true,
        "feedback": "✓ Correct answer"
      }
    ],
    "showAnswers": true
  }
}
```

#### 3. Get Quiz Results
**GET** `/api/v1/student/quizzes/:quizId/results`

## Question Generation Details

### MCQ Generation Prompt
- Generates questions with 4 options
- One correct answer (index 0-3)
- Based on lesson content (first 3000 chars)
- Customizable difficulty levels
- Avoids duplicate questions

### Subjective Generation Prompt
- Open-ended questions
- Includes sample answer guidance
- Encourages critical thinking
- Based on key lesson concepts
- Multiple difficulty levels

## Database Updates
When a quiz is generated:
1. **Quiz document** is created with all questions
2. **Lesson document** is updated with `quizId` reference
3. **Progress tracking** stores quiz scores per student

## Configuration

### OpenAI Settings
Make sure `OPENAI_API_KEY` is set in `.env`
```
OPENAI_API_KEY=sk-...
```

### Quiz Parameters
- `mcqCount`: 1-20 (default: 5)
- `subjectiveCount`: 0-20 (default: 3)
- `difficulty`: easy, medium, hard
- `timeLimit`: 0 (unlimited) or minutes
- `passingScore`: 0-100 percentage

## Error Handling

### Common Errors
- **400**: Missing lesson content - Add content or transcript before generating quiz
- **401**: Invalid refresh token - Redirect to login
- **403**: Insufficient permissions - Only instructors can generate quizzes
- **404**: Quiz or Lesson not found
- **500**: OpenAI API error - Check API key and quota

## Usage Flow

### For Instructors
1. Create a lesson with content
2. Call `/generate-quiz` endpoint
3. Review generated questions
4. Optionally regenerate questions
5. Publish the quiz when ready

### For Students
1. Enroll in course
2. Complete lesson
3. Call `/lessons/:id/quiz` to get questions
4. Submit answers via `/quizzes/:quizId/submit`
5. Get immediate feedback on MCQs
6. View results via `/quizzes/:quizId/results`

## Future Enhancements
- [ ] Manual question editing after generation
- [ ] Question import/export
- [ ] Multiple difficulty levels generation
- [ ] Analytics dashboard for quiz performance
- [ ] Adaptive difficulty based on student performance
- [ ] Certificate requirements linked to quiz passing
- [ ] Real-time quiz timer and progress tracking
- [ ] Peer review for subjective answers
