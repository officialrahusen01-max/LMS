# Phase 1 Quick Reference

## 🚀 Getting Started

### Start the Server
```bash
npm start
```
Server runs on `http://localhost:5000`

### Base URL for All APIs
```
http://localhost:5000/api/v1
```

---

## 📚 Course APIs at a Glance

### Public Endpoints (No Auth Required)

**List All Courses**
```bash
GET /courses?page=1&limit=10&category=web&level=beginner
```

**Get Single Course**
```bash
GET /courses/:id
```

### Protected Endpoints (Auth Required)

**Create Course**
```bash
POST /courses
Authorization: Bearer <token>

{
  "title": "React Basics",
  "shortDescription": "Learn React",
  "description": "Full course description...",
  "category": "web",
  "level": "beginner",
  "pricingType": "free",
  "tags": ["react", "javascript"]
}
```

**Update Course**
```bash
PUT /courses/:id
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "shortDescription": "Updated description",
  ...
}
```

**Delete Course**
```bash
DELETE /courses/:id
Authorization: Bearer <token>
```

**Publish Course**
```bash
POST /courses/:id/publish
Authorization: Bearer <token>
```

**Unpublish Course**
```bash
POST /courses/:id/unpublish
Authorization: Bearer <token>
```

**Add Instructor**
```bash
POST /courses/:id/instructors
Authorization: Bearer <token>

{
  "instructorId": "user_id",
  "role": "contributor"
}
```

**Remove Instructor**
```bash
DELETE /courses/:id/instructors/:instructorId
Authorization: Bearer <token>
```

---

## 📖 Lesson APIs at a Glance

### Public Endpoints (No Auth Required)

**List Lessons in Course**
```bash
GET /courses/:courseId/lessons
```

**Get Single Lesson**
```bash
GET /courses/:courseId/lessons/:lessonId
```

### Protected Endpoints (Auth Required)

**Create Lesson**
```bash
POST /courses/:courseId/lessons
Authorization: Bearer <token>

{
  "title": "Introduction",
  "content": "Lesson content...",
  "order": 0,
  "duration": 15,
  "transcript": "Full transcript...",
  "isPreview": true,
  "media": [
    {
      "type": "video",
      "url": "https://...",
      "duration": 15
    }
  ]
}
```

**Update Lesson**
```bash
PUT /courses/:courseId/lessons/:lessonId
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "content": "Updated content...",
  "duration": 20
}
```

**Delete Lesson**
```bash
DELETE /courses/:courseId/lessons/:lessonId
Authorization: Bearer <token>
```

**Reorder Lessons**
```bash
POST /courses/:courseId/lessons/reorder
Authorization: Bearer <token>

{
  "lessonIds": ["lesson1", "lesson3", "lesson2"]
}
```

---

## 🔐 Authentication

### Register (Create Account)
```bash
POST /auth/register

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### Login
```bash
POST /auth/login

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

Response includes `accessToken` - use in Authorization header:
```
Authorization: Bearer <accessToken>
```

### Refresh Token
```bash
POST /auth/refresh

{
  "refreshToken": "<refreshToken>"
}
```

---

## 📋 Complete Workflow Example

```bash
# 1. Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Instructor",
    "email": "jane@example.com",
    "password": "SecurePass123"
  }'

# 2. Login
RESPONSE=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123"
  }')

# Extract token (jq tool needed)
TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')

# 3. Create Course
COURSE_RESPONSE=$(curl -X POST http://localhost:5000/api/v1/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python for Beginners",
    "shortDescription": "Learn Python basics",
    "description": "Complete Python course for beginners",
    "category": "programming",
    "level": "beginner",
    "pricingType": "free",
    "tags": ["python", "programming"]
  }')

# Extract course ID
COURSE_ID=$(echo $COURSE_RESPONSE | jq -r '.data._id')

# 4. Create Lesson
curl -X POST http://localhost:5000/api/v1/courses/$COURSE_ID/lessons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chapter 1: Variables and Data Types",
    "content": "In this lesson we learn about...",
    "order": 0,
    "duration": 25,
    "isPreview": true
  }'

# 5. Publish Course
curl -X POST http://localhost:5000/api/v1/courses/$COURSE_ID/publish \
  -H "Authorization: Bearer $TOKEN"

# 6. View Published Course (No auth needed)
curl http://localhost:5000/api/v1/courses/$COURSE_ID
```

---

## 🔍 Query Parameters Reference

### List Courses Query Params
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `category` - Filter by category
- `level` - Filter level (beginner/intermediate/advanced)
- `tags` - Filter by tags
- `search` - Full-text search

### Example Filtered List
```bash
GET /courses?page=1&limit=20&category=web&level=intermediate&search=react
```

---

## ✅ Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

---

## 📊 Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - No/invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate (e.g., slug) |
| 500 | Server Error - Internal error |

---

## 🎯 Key Permissions

- **Create Course/Lesson**: Requires `instructor` or `admin` role
- **Update Course/Lesson**: Only course owner/instructors
- **Publish Course**: Only course owner/instructors
- **Delete Course**: Only course owner/instructors (and no active enrollments)
- **Add Instructor**: Only course owner/instructors

---

## 📝 Allowed Update Fields

### Course Updates
- title
- shortDescription
- description
- category
- level
- pricingType
- price
- tags
- sections

### Lesson Updates
- title
- content
- order
- duration
- media
- transcript
- isPreview
- quizId

---

## 🧪 Testing

### Automated Test Suite
```bash
node tests/phase1-api-test.js
```

### Using Postman/Thunder Client
1. Import endpoints from `docs/PHASE_1_COURSE_LESSON_API.md`
2. Set environment variable: `TOKEN` from login response
3. Test endpoints with proper authorization headers

### Using curl
See "Complete Workflow Example" section above

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Missing `Authorization: Bearer <token>` header
- Token expired - use refresh endpoint to get new token

### "Forbidden" Error
- You're not the course owner/instructor
- Make sure you're using correct user token

### "Not Found" Error
- Course/lesson ID doesn't exist
- Check courseId and lessonId parameters

### Duplicate Slug Error
- A lesson with that title already exists in the course
- Change the lesson title

---

## 📚 Full Documentation

For complete API documentation including all parameters, request/response examples, and error codes, see:
- [PHASE_1_COURSE_LESSON_API.md](PHASE_1_COURSE_LESSON_API.md)

For Phase 1 implementation details:
- [PHASE_1_SUMMARY.md](PHASE_1_SUMMARY.md)

---

## 🔗 Related Resources

- **Authentication Docs**: [AUTHENTICATION.md](AUTHENTICATION.md)
- **Test Suite**: [tests/phase1-api-test.js](../tests/phase1-api-test.js)
- **Main Routes**: [src/routes/courses.js](../src/routes/courses.js)
- **Services**: [src/services/courseService.js](../src/services/courseService.js), [src/services/lessonService.js](../src/services/lessonService.js)
- **Controllers**: [src/controllers/courseController.js](../src/controllers/courseController.js), [src/controllers/lessonController.js](../src/controllers/lessonController.js)

---

## ⏭️ Next Phase

**Phase 2: Enrollment & Progress**
- Coming Soon
- Will add enrollment, progress tracking, and certificates

