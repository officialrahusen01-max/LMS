╔════════════════════════════════════════════════════════════════════════════╗
║              PHASE 2 - QUICK REFERENCE & TESTING GUIDE                      ║
╚════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════

QUICK START
───────────

Files Created:
  src/services/enrollmentService.js
  src/services/progressService.js
  src/controllers/enrollmentController.js
  src/controllers/progressController.js
  src/routes/enrollments.js

Routes Available:
  POST   /api/v1/enrollments/courses/:courseId/enroll
  GET    /api/v1/enrollments/me
  GET    /api/v1/enrollments/me/courses/:courseId
  DELETE /api/v1/enrollments/me/courses/:courseId
  PUT    /api/v1/enrollments/courses/:courseId/lessons/:lessonId/complete
  GET    /api/v1/enrollments/courses/:courseId/progress
  GET    /api/v1/enrollments/courses/:courseId/progress/completed-lessons
  GET    /api/v1/enrollments/me/progress

═══════════════════════════════════════════════════════════════════════════════

CURL TEST EXAMPLES
──────────────────

Note: Replace {token} with actual JWT, {courseId} with course ObjectId, etc.

1. ENROLL IN COURSE

curl -X POST "http://localhost:8000/api/v1/enrollments/courses/{courseId}/enroll" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{}'

Response (201):
{
  "message": "Successfully enrolled in course",
  "data": {
    "_id": "...",
    "user": "...",
    "course": {...},
    "status": "active",
    "enrolledAt": "2026-02-06T...",
    "paymentInfo": {...}
  }
}

2. GET MY COURSES

curl -X GET "http://localhost:8000/api/v1/enrollments/me" \
  -H "Authorization: Bearer {token}"

Response (200):
{
  "message": "Enrolled courses retrieved",
  "data": [{Enrollment}, ...],
  "count": 3
}

3. COMPLETE LESSON

curl -X PUT "http://localhost:8000/api/v1/enrollments/courses/{courseId}/lessons/{lessonId}/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"lastPosition": 0, "secondsWatched": 300}'

Response (200):
{
  "message": "Lesson marked as completed",
  "data": {
    "_id": "...",
    "user": "...",
    "course": "...",
    "lessons": [{lesson, completed: true, ...}, ...],
    "percentComplete": 50,
    "lastLesson": "{lessonId}"
  }
}

4. GET PROGRESS

curl -X GET "http://localhost:8000/api/v1/enrollments/courses/{courseId}/progress" \
  -H "Authorization: Bearer {token}"

Response (200):
{
  "message": "Progress retrieved",
  "data": {Progress}
}

5. GET COMPLETED LESSONS

curl -X GET "http://localhost:8000/api/v1/enrollments/courses/{courseId}/progress/completed-lessons" \
  -H "Authorization: Bearer {token}"

Response (200):
{
  "message": "Completed lessons retrieved",
  "data": ["lessonId1", "lessonId2", ...],
  "count": 5
}

6. GET ALL PROGRESS

curl -X GET "http://localhost:8000/api/v1/enrollments/me/progress" \
  -H "Authorization: Bearer {token}"

Response (200):
{
  "message": "All progress retrieved",
  "data": [{Progress}, ...],
  "count": 3
}

7. CANCEL ENROLLMENT

curl -X DELETE "http://localhost:8000/api/v1/enrollments/me/courses/{courseId}" \
  -H "Authorization: Bearer {token}"

Response (200):
{
  "message": "Enrollment cancelled",
  "data": {
    "_id": "...",
    "status": "cancelled"
  }
}

═══════════════════════════════════════════════════════════════════════════════

MANUAL TESTING WORKFLOW
───────────────────────

Prerequisites:
  1. Server running: npm start (or node server.js)
  2. MongoDB connected
  3. Published course in database
  4. Student JWT token

Test Sequence:

STEP 1: Enroll student in course
  curl -X POST .../enrollments/courses/{courseId}/enroll \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 201, Enrollment created with status='active'

STEP 2: Verify enrollment in list
  curl -X GET .../enrollments/me \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, course appears in data array

STEP 3: Get enrollment details
  curl -X GET .../enrollments/me/courses/{courseId} \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, enrollment data with status='active'

STEP 4: Complete first lesson (assume lessonId exists)
  curl -X PUT .../enrollments/courses/{courseId}/lessons/{lessonId}/complete \
    -H "Authorization: Bearer {studentToken}" \
    -d '{"secondsWatched": 600}'
  ✓ Expect 200, percentComplete = 33 (for 3-lesson course)

STEP 5: Get progress
  curl -X GET .../enrollments/courses/{courseId}/progress \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, percentComplete = 33, 1 lesson completed

STEP 6: Get completed lessons
  curl -X GET .../enrollments/courses/{courseId}/progress/completed-lessons \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, data = [lessonId]

STEP 7: Complete all lessons (repeat STEP 4 for other lessons)
  [Complete lesson 2]
  [Complete lesson 3]
  ✓ After last lesson, enrollment.status = 'completed'

STEP 8: Verify 100% completion
  curl -X GET .../enrollments/courses/{courseId}/progress \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, percentComplete = 100

STEP 9: Get all progress
  curl -X GET .../enrollments/me/progress \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, shows all courses and progress

STEP 10: Cancel enrollment (optional)
  curl -X DELETE .../enrollments/me/courses/{courseId} \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 200, status = 'cancelled'

═══════════════════════════════════════════════════════════════════════════════

ERROR SCENARIOS
───────────────

Test Error Cases:

1. NOT AUTHENTICATED
  curl .../enrollments/me (no Authorization header)
  ✓ Expect 401: "No token provided"

2. INVALID TOKEN
  curl .../enrollments/me \
    -H "Authorization: Bearer invalid"
  ✓ Expect 401: "Invalid token"

3. INSUFFICIENT ROLE (instructor instead of student)
  curl .../enrollments/courses/{courseId}/enroll \
    -H "Authorization: Bearer {instructorToken}"
  ✓ Expect 403: "Role not authorized"

4. COURSE NOT PUBLISHED
  [Modify course.published = false]
  curl -X POST .../enrollments/courses/{courseId}/enroll \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 400: "Course is not published"

5. ALREADY ENROLLED
  curl -X POST .../enrollments/courses/{courseId}/enroll \
    -H "Authorization: Bearer {studentToken}"
  (call twice)
  ✓ First: 201, Second: 400 "Already enrolled"

6. COURSE NOT FOUND
  curl -X POST .../enrollments/courses/invalid/enroll \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 404: "Course not found"

7. NOT ENROLLED (trying to complete lesson)
  [Use different courseId]
  curl -X PUT .../enrollments/courses/{otherCourseId}/lessons/{lessonId}/complete \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 403: "Not enrolled in this course"

8. LESSON NOT IN COURSE
  curl -X PUT .../enrollments/courses/{courseId}/lessons/{wrongLessonId}/complete \
    -H "Authorization: Bearer {studentToken}"
  ✓ Expect 404: "Lesson not found in this course"

═══════════════════════════════════════════════════════════════════════════════

MONGODB QUERIES FOR TESTING
───────────────────────────

View enrollments:
  db.enrollments.find({user: ObjectId("...")}).pretty()

View progress:
  db.progresses.find({user: ObjectId("...")}).pretty()

Check completion percentage:
  db.progresses.findOne({
    user: ObjectId("..."),
    course: ObjectId("...")
  }).percentComplete

Reset progress (if needed):
  db.progresses.updateOne(
    {user: ObjectId("..."), course: ObjectId("...")},
    {$set: {lessons: [], percentComplete: 0}}
  )

List all enrollments for a course:
  db.enrollments.find({course: ObjectId("...")}).pretty()

═══════════════════════════════════════════════════════════════════════════════

INTEGRATION WITH PHASE 1
───────────────────────

Phase 1 (Course & Lesson APIs):
  ✓ Enrollment uses Course model to validate published status
  ✓ Progress uses Lesson model to verify lesson belongs to course
  ✓ Services automatically reference Phase 1 models

Phase 1 auth still in place:
  ✓ JWT middleware validates token
  ✓ authorize(['student']) enforces student role
  ✓ All endpoints respect authentication

Data flow:
  Course (Phase 1) → Published
    ↓
  Student enrolls → Enrollment created + Progress created
    ↓
  Student completes lesson → Progress updated
    ↓
  100% complete → Enrollment status = 'completed' (ready for Phase 3 Certificate)

═══════════════════════════════════════════════════════════════════════════════

PHASE 3 READINESS
─────────────────

Phase 2 provides foundation for Phase 3 (Certificates):

Current State:
  ✓ Enrollment.status = 'completed' when 100% progress
  ✓ Progress.certificateIssuedAt field exists (ready for Phase 3)
  ✓ Progress.finalQuiz tracking implemented

Phase 3 will add:
  - Certificate model with certificate template
  - Certificate generation when enrollment = 'completed'
  - Certificate download endpoint
  - Certificate verification endpoint

═══════════════════════════════════════════════════════════════════════════════

COMMON ISSUES & SOLUTIONS
─────────────────────────

Issue: Lesson won't mark as complete
Solution: Check Enrollment exists with status='active'
  curl -X GET .../enrollments/me/courses/{courseId} \
    -H "Authorization: Bearer {token}"
  → If 404, student not enrolled

Issue: percentComplete not updating
Solution: Ensure all lessons in course are accounted for
  → Check total lesson count in Course
  → Verify lesson IDs are correct

Issue: Cannot enroll in course
Solution: Verify course.published = true
  → In MongoDB: db.courses.findOne({_id: ObjectId("...")})
  → Check published field

Issue: 403 Forbidden on enrollment routes
Solution: Verify JWT token is for student role
  → Token must contain roles: ['student']
  → Check JWT payload in jwt.io

═══════════════════════════════════════════════════════════════════════════════
