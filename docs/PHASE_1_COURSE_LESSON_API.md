# Phase 1: Course & Lesson APIs - Implementation Guide

## Overview

Phase 1 provides the foundation for the AI learning platform with full Course and Lesson CRUD operations, multi-instructor support, and role-based access control.

## Architecture

### Service Layer Pattern

Services handle all business logic and validation:
- **CourseService**: Course CRUD, multi-instructor management, publish/unpublish
- **LessonService**: Lesson CRUD within courses, reordering

### Controller Layer

Controllers wrap service methods and handle HTTP requests/responses:
- **CourseController**: 8 endpoints for course operations
- **LessonController**: 6 endpoints for lesson operations

### Routes

RESTful API endpoints with proper HTTP methods and status codes:
- Courses: `GET/POST /api/v1/courses`, `GET/PUT/DELETE /api/v1/courses/:id`
- Lessons: `GET/POST /api/v1/courses/:courseId/lessons`, `GET/PUT/DELETE /api/v1/courses/:courseId/lessons/:lessonId`

---

## API Reference

### Courses

#### List Courses (Public)
```
GET /api/v1/courses?page=1&limit=10&category=web&level=beginner&search=react
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `category`: Filter by category
- `level`: Filter by level (beginner/intermediate/advanced)
- `tags`: Filter by tags
- `search`: Full-text search in title/description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "React Basics",
      "slug": "react-basics",
      "shortDescription": "Learn React",
      "category": "web",
      "level": "beginner",
      "pricingType": "free",
      "published": true,
      "instructorCount": 1,
      "studentCount": 150
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

#### Get Course (Public)
```
GET /api/v1/courses/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "React Basics",
    "slug": "react-basics",
    "shortDescription": "Learn React from scratch",
    "description": "Complete React course...",
    "category": "web",
    "level": "beginner",
    "pricingType": "one_time",
    "price": 29.99,
    "tags": ["react", "javascript", "web"],
    "primaryInstructor": {
      "_id": "...",
      "fullName": "John Doe"
    },
    "instructors": [
      {
        "user": { "_id": "...", "fullName": "John Doe" },
        "role": "owner",
        "order": 1
      }
    ],
    "sections": [
      {
        "title": "Fundamentals",
        "description": "Core concepts",
        "lessonIds": ["lesson1", "lesson2"]
      }
    ],
    "published": true,
    "studentCount": 150,
    "averageRating": 4.8,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Course (Auth Required - Instructor/Admin)
```
POST /api/v1/courses
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "React Basics",
  "shortDescription": "Learn React from scratch",
  "description": "Complete React course with examples",
  "category": "web",
  "level": "beginner",
  "pricingType": "free",
  "price": 0,
  "tags": ["react", "javascript"]
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "data": { /* course object */ },
  "message": "Course created successfully"
}
```

#### Update Course (Auth Required - Owner/Admin)
```
PUT /api/v1/courses/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Advanced React",
  "shortDescription": "Advanced React patterns",
  "description": "...",
  "level": "advanced",
  "tags": ["react", "advanced"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated course */ },
  "message": "Course updated successfully"
}
```

#### Delete Course (Auth Required - Owner/Admin)
```
DELETE /api/v1/courses/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Note:** Can only delete if no active enrollments

#### Publish Course (Auth Required - Owner/Admin)
```
POST /api/v1/courses/:id/publish
Authorization: Bearer <token>
```

**Requirements:**
- At least one section with lessons
- Course must have title and description

**Response:**
```json
{
  "success": true,
  "data": { /* course with published: true */ },
  "message": "Course published successfully"
}
```

#### Unpublish Course (Auth Required - Owner/Admin)
```
POST /api/v1/courses/:id/unpublish
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": { /* course with published: false */ },
  "message": "Course unpublished successfully"
}
```

#### Add Instructor (Auth Required - Owner/Admin)
```
POST /api/v1/courses/:id/instructors
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "instructorId": "user123",
  "role": "contributor"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated course */ },
  "message": "Instructor added successfully"
}
```

#### Remove Instructor (Auth Required - Owner/Admin)
```
DELETE /api/v1/courses/:id/instructors/:instructorId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated course */ },
  "message": "Instructor removed successfully"
}
```

**Note:** Cannot remove primary instructor

---

### Lessons

#### List Lessons in Course (Public)
```
GET /api/v1/courses/:courseId/lessons
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Introduction to React",
      "slug": "introduction-to-react",
      "content": "React is a JavaScript library...",
      "order": 0,
      "duration": 15,
      "isPreview": true,
      "media": [
        {
          "type": "video",
          "url": "https://...",
          "duration": 15
        }
      ],
      "course": {
        "_id": "...",
        "title": "React Basics",
        "slug": "react-basics"
      }
    }
  ],
  "count": 5
}
```

#### Get Lesson (Public)
```
GET /api/v1/courses/:courseId/lessons/:lessonId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Introduction to React",
    "slug": "introduction-to-react",
    "content": "React is a JavaScript library...",
    "transcript": "Transcript of video content...",
    "order": 0,
    "duration": 15,
    "isPreview": true,
    "media": [
      {
        "type": "video",
        "url": "https://cloudinary.com/...",
        "duration": 15
      }
    ],
    "quizId": "quiz123",
    "course": {
      "_id": "...",
      "title": "React Basics"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Lesson (Auth Required - Course Instructor/Admin)
```
POST /api/v1/courses/:courseId/lessons
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Introduction to React",
  "content": "React is a JavaScript library for building UI...",
  "order": 0,
  "duration": 15,
  "transcript": "Full video transcript...",
  "media": [
    {
      "type": "video",
      "url": "https://cloudinary.com/...",
      "duration": 15
    }
  ],
  "isPreview": true
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "data": { /* lesson object */ },
  "message": "Lesson created successfully"
}
```

#### Update Lesson (Auth Required - Course Instructor/Admin)
```
PUT /api/v1/courses/:courseId/lessons/:lessonId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Introduction to React Hooks",
  "content": "Updated content...",
  "duration": 20,
  "isPreview": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated lesson */ },
  "message": "Lesson updated successfully"
}
```

#### Delete Lesson (Auth Required - Course Instructor/Admin)
```
DELETE /api/v1/courses/:courseId/lessons/:lessonId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson deleted successfully"
}
```

#### Reorder Lessons (Auth Required - Course Instructor/Admin)
```
POST /api/v1/courses/:courseId/lessons/reorder
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "lessonIds": ["lesson1", "lesson3", "lesson2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lessons reordered successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

### Common Status Codes

- **400**: Bad request (validation error)
- **401**: Unauthorized (no token)
- **403**: Forbidden (no permission)
- **404**: Not found
- **409**: Conflict (e.g., duplicate slug)
- **500**: Server error

---

## Implementation Details

### CourseService Methods

1. **listCourses(filters, search, page, limit)**
   - Filters: category, level, tags
   - Search: Full-text search on title/description
   - Pagination: skip = (page-1) * limit
   - Returns: { courses, total }

2. **getCourseById(courseId, userId)**
   - For draft courses: only owner/instructors can view
   - For published courses: public view
   - Populates: primaryInstructor, instructors.user, sections

3. **createCourse(data, userId)**
   - Generates slug from title (unique per workspace)
   - Sets primaryInstructor to current user
   - Default values: published = false, pricingType = 'free'
   - Validates: title, pricing type

4. **updateCourse(courseId, updates, userId)**
   - Whitelisted fields: title, shortDescription, description, category, level, pricingType, price, tags, sections
   - Enforces owner permission
   - Prevents updating published status (use publishCourse/unpublishCourse)

5. **publishCourse(courseId, userId)**
   - Validates: at least one section with lessons, owner permission
   - Sets: published = true, publishedAt = now

6. **unpublishCourse(courseId, userId)**
   - Sets: published = false
   - Allows re-publishing

7. **addInstructor(courseId, instructorId, role, userId)**
   - Roles: 'owner' (primary), 'lead', 'contributor'
   - Prevents duplicates
   - Owner permission required

8. **removeInstructor(courseId, instructorId, userId)**
   - Prevents removing primary instructor
   - Owner permission required

9. **deleteCourse(courseId, userId)**
   - Prevents deletion if course has enrollments
   - Owner permission required

### LessonService Methods

1. **listLessonsByCourse(courseId)**
   - Returns lessons sorted by order
   - Excludes sensitive metadata

2. **getLessonById(lessonId)**
   - Populates course info
   - Full lesson data

3. **createLesson(courseId, data, userId)**
   - Generates slug from title (unique per course)
   - Validates: title, course exists, user is instructor
   - Default values: isPreview = false, order = 0

4. **updateLesson(lessonId, updates, userId)**
   - Whitelisted fields: title, content, order, duration, media, transcript, isPreview, quizId
   - Regenerates slug if title changes
   - Instructor permission required

5. **deleteLesson(lessonId, userId)**
   - Removes from course sections
   - Instructor permission required

6. **reorderLessons(courseId, lessonIds, userId)**
   - Updates order field for all lessons
   - Validates: all lessons belong to course
   - Instructor permission required

---

## Security & Permissions

### Authentication

All protected endpoints require:
- Valid JWT token in Authorization header: `Authorization: Bearer <token>`
- User must be authenticated (have valid token)

### Authorization

Role-based access:
- **Public endpoints**: No authentication required
- **Create/Update/Delete**: Requires `instructor` or `admin` role
- **Resource ownership**: Only course owner or admin can modify their course

### Field Whitelisting

Updates only accept specific fields to prevent privilege escalation:
- Cannot directly modify: published, publishedAt, primaryInstructor, createdAt
- Use specific endpoints for: publishCourse, unpublishCourse, addInstructor

---

## Usage Examples

### Example 1: Create Course and Lessons

```bash
# 1. Register and login
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# 2. Login to get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
# Response includes: accessToken, refreshToken

# 3. Create course
curl -X POST http://localhost:5000/api/v1/courses \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "React Basics",
    "shortDescription": "Learn React",
    "description": "Complete React course...",
    "category": "web",
    "level": "beginner",
    "pricingType": "free"
  }'
# Response: course object with _id

# 4. Create lesson
curl -X POST http://localhost:5000/api/v1/courses/<courseId>/lessons \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction",
    "content": "React basics...",
    "order": 0,
    "duration": 15,
    "isPreview": true
  }'

# 5. Publish course
curl -X POST http://localhost:5000/api/v1/courses/<courseId>/publish \
  -H "Authorization: Bearer <accessToken>"
```

### Example 2: Add Another Instructor

```bash
curl -X POST http://localhost:5000/api/v1/courses/<courseId>/instructors \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "instructorId": "<userId>",
    "role": "contributor"
  }'
```

### Example 3: View Published Course (No Auth)

```bash
curl http://localhost:5000/api/v1/courses/<courseId>

curl http://localhost:5000/api/v1/courses/<courseId>/lessons
```

---

## Phase 1 Completion Checklist

- ✅ CourseService: All 8 methods implemented
- ✅ LessonService: All 6 methods implemented
- ✅ CourseController: 8 endpoints
- ✅ LessonController: 6 endpoints
- ✅ Routes: All endpoints wired
- ✅ Auth middleware: Integrated
- ✅ Error handling: Standardized
- ✅ Validation: Field checks and permissions
- ✅ Multi-instructor support: Implemented
- ✅ Publish/unpublish: Logic complete

---

## Next Steps (Phase 2)

Phase 2 will implement:
- Enrollment: Enroll in courses (free/paid/subscription)
- Progress tracking: Mark lessons complete, track progress
- Certificates: Generate certificates for eligible students

Phase 2 will build upon Phase 1's Course and Lesson APIs.

