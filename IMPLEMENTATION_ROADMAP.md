# Implementation Roadmap

## Goal

Transform the current HTML/CSS learning app into a role-based learning platform for:

- students, who complete lessons and tasks
- teachers, who monitor student progress

This roadmap defines the correct order of implementation so the project does not require major rewrites later.

The current MVP remains HTML/CSS-first, but architecture decisions should not block future support for:

- other frontend topics such as JavaScript or React
- other programming languages
- different lesson runtimes and validation modes

## Product Direction

The platform should support two main roles:

- `student`
- `teacher`

Student responsibilities:

- sign up / sign in
- open lessons
- write HTML/CSS
- run code
- complete tasks
- save progress
- restore saved code and progress later

Teacher responsibilities:

- sign in
- view assigned students
- view each student's lesson progress
- open a detailed page for a student
- optionally review the student's latest saved code

## MVP Decisions

For MVP, lessons should already be modeled in the database.

For architecture, do not treat the product as permanently limited to only HTML/CSS lessons.
Use abstractions that allow future growth toward:

- multiple tracks
- multiple courses
- multiple lesson types
- multiple file layouts per lesson
- multiple validation strategies

Store in backend/database:

- users
- roles
- teacher-student relationships
- tracks
- courses
- lessons
- lesson files
- lesson theory blocks
- lesson tasks
- student progress
- student saved code

Do not require a full content-management UI in the first implementation phase unless product requirements change.

## Implementation Order

### Phase 1. Lock MVP Architecture

Goal: define stable product and technical boundaries before building more UI.

Tasks:

- confirm roles: `student`, `teacher`
- confirm whether a teacher sees only progress or also student code
- confirm whether there are direct teacher-student links or groups/classes
- confirm that lessons are content entities in the backend model from the start
- define routing strategy for student and teacher areas
- define which data is stored in the database

Deliverables:

- approved role model
- approved entities list
- approved route map
- approved API contract draft

### Phase 2. Data Model and API Contracts

Goal: define the database shape and frontend-backend contract.

Core entities:

- `Track`
- `Course`
- `Lesson`
- `LessonFile`
- `LessonTheoryBlock`
- `LessonTask`
- `User`
- `TeacherStudent`
- `StudentLessonProgress`
- `StudentTaskProgress`
- `StudentCode`

Lesson model should be designed conceptually for future flexibility:

- one track contains multiple courses
- one course contains multiple lessons
- one lesson may use different runtime types
- one lesson may contain multiple editable files

Recommended conceptual fields:

- `trackSlug`
- `courseId`
- `lessonRuntimeType`
- `validationType`
- `files`

Database-level responsibilities:

- store user identity and role
- store relationships between teachers and students
- store course and lesson content
- store lesson completion states per student
- store task completion states per student
- store saved lesson files per student and lesson

Backend API draft:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /tracks`
- `GET /tracks/:trackSlug/courses`
- `GET /courses/:courseId`
- `GET /courses/:courseId/lessons`
- `GET /lessons/:lessonId`
- `GET /student/me/progress`
- `GET /student/me/code`
- `GET /student/me/code/:lessonId`
- `PUT /student/me/code/:lessonId`
- `PUT /student/me/progress/:lessonId`
- `GET /teacher/students`
- `GET /teacher/students/:studentId`
- `GET /teacher/students/:studentId/progress`
- `GET /teacher/students/:studentId/code/:lessonId`

Deliverables:

- entity list
- API endpoint list
- DTO contract list
- abstraction notes for future non-HTML/CSS lesson support

### Phase 3. Auth Foundation

Goal: replace the current mock auth direction with backend-ready auth architecture.

Tasks:

- add real session loading on app start
- store authenticated user with role
- redirect user by role after login
- add route guards for student and teacher areas
- stop treating auth as local-only mock behavior

Expected routes:

- `/login`
- `/register`
- `/student/...`
- `/teacher/...`

Deliverables:

- role-aware auth state
- route protection
- app initialization that loads session first

### Phase 4. Student Flow Stabilization

Goal: make student experience fully stable before teacher dashboard work.

Current progress inside this phase:

- content loading already goes through `contentApi` + `contentSlice`
- route structure for public/student/teacher is already in place
- student persistence has started moving to a dedicated `studentApi`
- lesson navigation is already detached from static `lessonData.ts`
- lesson page partially consumes `LessonDTO` directly

Tasks:

- save student code by `userId + lessonId`
- load lessons from API instead of static frontend-only data
- save student progress by `userId`
- restore code after reload
- restore progress after reload
- keep lesson check logic client-side
- keep lesson progression and task unlocking stable
- replace local storage as the main source of persistence with API-based persistence

Even while implementing only HTML/CSS now, avoid student data models that assume every lesson always has only:

- `html`
- `css`

Future-ready persistence should conceptually allow:

- a lesson with multiple files
- a lesson with a different primary language
- a lesson with a different runtime mode

Student pages:

- `/student`
- `/student/lessons`
- `/student/lessons/:lessonId`
- `/student/progress`

Deliverables:

- working student lesson flow
- stable persistence
- working auth + progress + code integration
- reduced legacy adapter usage inside lesson/editor pages

### Phase 5. Teacher Flow MVP

Goal: provide minimum teacher visibility over students.

Tasks:

- create teacher dashboard shell
- create student list page
- create student details page
- show lesson progress for each student
- show completed lessons count
- show current lesson or last active lesson
- optionally show latest saved code per lesson

Teacher pages:

- `/teacher`
- `/teacher/students`
- `/teacher/students/:studentId`

Deliverables:

- teacher student list
- student details page
- progress monitoring interface

### Phase 6. Content Expansion

Goal: only after architecture and flows are stable, expand learning content.

Tasks:

- add more lessons
- expand theory blocks
- improve docs page structure
- refine instructional UX text
- apply visual polish

Important:

- do not mass-produce lessons before the student flow and teacher flow are stable
- do not over-polish UI before routing, persistence, and role separation are done
- do not hardcode future product direction to only HTML/CSS if the platform may later include other programming languages
- do not block MVP by trying to build a full teacher/admin CMS too early

## Why This Order Matters

If frontend pages and lesson content are completed first without locking the platform model, the project will likely require rewrites in:

- route structure
- Redux state shape
- persistence logic
- teacher/student page separation
- auth flow
- lesson content model

The correct focus right now is not "finish the frontend", but "finish the product skeleton".

## Recommended Immediate Next Step

Start with architecture artifacts, not new UI.

The next practical implementation step should be:

1. finalize entities
2. finalize API contracts
3. finalize route map
4. implement auth foundation
5. implement student persistence

## Suggested Build Sequence

1. MVP architecture spec
2. database schema draft
3. API contract draft
4. auth and role routing
5. student persistence
6. teacher dashboard MVP
7. content expansion
