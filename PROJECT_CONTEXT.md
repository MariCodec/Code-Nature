# Project Context

## Project Summary

This project is an interactive HTML/CSS learning platform built with:

- Vite
- React
- TypeScript
- Redux Toolkit
- Monaco Editor

Users write HTML and CSS in the browser, run their code, and complete ordered lesson tasks.

The project is evolving from a single-user learning app into a multi-user educational platform for:

- students
- teachers

## Product Vision

The platform should support the following learning model:

- students complete lessons and tasks inside the browser
- student code and progress are saved
- teachers can see their students and monitor progress
- teachers can open an individual student page and review completion details

This means the app must support role-based logic, backend persistence, and user-scoped progress.

Important product direction:

- current MVP is HTML/CSS-first
- architecture should still allow future support for additional programming topics and lesson types

## Current Progress

At the current implementation stage, the frontend has already been partially migrated toward the target architecture.

Already implemented:

- a separate content model aligned with the future backend
- mock `contentApi`
- Redux `contentSlice`
- lesson pages connected to the new content flow
- role-aware auth foundation
- route separation for public / student / teacher areas
- `savedFiles`-ready student code state
- `CodeEditor` partially migrated from hardcoded HTML/CSS assumptions toward lesson files
- user-scoped `studentApi` for code and progress persistence
- lesson navigation connected to `contentSlice` instead of static lesson data
- `LessonPage` partially switched to direct `lessonDto` usage for header and tasks
- `checkLesson` now works from DTO-based task data instead of legacy lesson content
- `DocsPage` now uses the same content flow as lesson pages
- the temporary compatibility adapter layer has already been removed
- code persistence now stores `savedFiles`-only data
- progress persistence now stores DTO-like lesson/task progress data and maps it back into the current Redux UI state

This means:

- the frontend is no longer purely static-lesson-driven
- the migration is already in progress
- student persistence has already moved to API-shaped flows in a practical way
- the current frontend block has reached a solid intermediate completion point
- the next frontend priority can shift to the next feature block instead of more persistence cleanup

## Current Technical Reality

At the moment:

- lessons are currently static frontend data in code, but this should be treated as a temporary implementation state
- lesson checking is client-side
- progress is stored in Redux
- code is stored in Redux
- local persistence now exists primarily through a user-scoped `studentApi` mock layer
- auth exists only as a mock direction, not as real backend auth

The current implementation is strongly oriented around HTML and CSS, but this should be treated as the current specialization of the MVP, not as a permanent platform limitation.

Important current constraints:

- lesson validation should remain client-side
- task checking currently uses hidden iframe rendering and DOM/computed-style checks
- validation logic should stay separate from progress logic
- state should remain serializable

## MVP Direction

For MVP:

- lessons should be represented in backend/database models
- backend/database stores both content data and user-related data

For architecture:

- the system should be thought of as `track -> course -> lesson`
- the first implemented track is effectively frontend basics
- the first implemented runtime is HTML/CSS preview
- future runtimes may differ

Data stored in backend/database:

- users
- roles
- teacher-student relationships
- tracks
- courses
- lessons
- lesson files
- lesson theory blocks
- lesson tasks
- student lesson progress
- student task progress
- student saved code

The MVP should remain simple, but the abstractions should not assume that every future lesson is always:

- HTML + CSS only
- DOM-based
- checked only through iframe/computed styles

## Roles

### Student

Student capabilities:

- register and login
- open lessons
- write HTML/CSS
- run code
- complete tasks
- unlock next lessons
- save and restore code
- save and restore progress

### Teacher

Teacher capabilities:

- login
- view assigned students
- view lesson progress for each student
- open an individual student page
- optionally view the student's saved code for a lesson

## Core Entities

These are the minimum core entities for MVP.

Conceptually, the platform should also reserve space for:

- `Track`
- `Course`
- `Lesson`
- `LessonFile`
- `LessonTheoryBlock`
- `LessonTask`
- generalized lesson runtime metadata

### User

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `createdAt`

### TeacherStudent

- `id`
- `teacherId`
- `studentId`
- `createdAt`

### StudentLessonProgress

- `id`
- `studentId`
- `lessonId`
- `status`
- `completedAt`
- `updatedAt`

### StudentTaskProgress

- `id`
- `studentId`
- `lessonId`
- `taskId`
- `isCompleted`
- `completedAt`
- `updatedAt`

### StudentCode

- `id`
- `studentId`
- `lessonId`
- `savedFiles`
- `updatedAt`

This entity should already be designed in a generalized way:

- lesson files instead of fixed HTML/CSS fields
- runtime-aware saved work

## MVP Page Map

### Public

- `/login`
- `/register`

### Student

- `/student`
- `/student/lessons`
- `/student/lessons/:lessonId`
- `/student/progress`

### Teacher

- `/teacher`
- `/teacher/students`
- `/teacher/students/:studentId`

## API Contract Draft

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Student

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

### Teacher

- `GET /teacher/students`
- `GET /teacher/students/:studentId`
- `GET /teacher/students/:studentId/progress`
- `GET /teacher/students/:studentId/code/:lessonId`

## Frontend Architecture Intent

Frontend should evolve toward:

- track/course/lesson navigation instead of only category/lesson navigation
- role-aware routing
- user-scoped persistence
- API adapter instead of localStorage as the primary persistence mechanism
- separation between student pages and teacher pages
- stable DTO contracts between frontend and backend

It should also gradually evolve toward:

- generalized lesson files instead of hardcoded HTML/CSS-only models
- lesson runtime abstraction
- validation abstraction

## Important Product Decisions

These decisions should be preserved across future chats unless product requirements change:

- lessons belong in backend/database models for MVP
- current implementation remains HTML/CSS-first for MVP
- student progress must be saved per user
- student code must be saved per user and per lesson
- teacher must be able to view student progress
- teacher may later be allowed to view student code
- lesson checking stays client-side
- no backend execution of user HTML/CSS is required
- architecture should remain open for future non-HTML/CSS courses and lesson types

## Current Priority Order

1. lock MVP architecture
2. define entities and API contracts
3. implement auth foundation
4. stabilize student flow
5. implement teacher flow
6. expand lesson content and docs

## Guidance For Future Chats

When continuing this project in another chat, use this context:

- this is not just a code editor app anymore
- it is becoming a role-based educational platform
- it should be treated as HTML/CSS-first, not HTML/CSS-only
- student and teacher flows must be designed separately
- persistence must be backend-ready and user-scoped
- avoid polishing large amounts of UI before auth, routing, persistence, and role separation are stable
- avoid building a full content-management UI too early
