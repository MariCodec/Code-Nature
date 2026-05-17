# BACKEND_FRONTEND_CONTRACT_UA

## Мета

Цей документ фіксує, як бекенд і фронтенд мають працювати узгоджено після наступних змін:

- CRUD курсів
- CRUD уроків
- відеоуроки
- teacher comments
- code version history
- groups/classes
- submissions/review workflow
- admin panel API

Документ не замінює `API_SPEC_UA.md`, а уточнює майбутні модулі, щоб фронтенд і бекенд не розійшлися в моделі.

---

## Поточна Межа Відповідальності

Фронтенд уже має mock API:

- `authApi`
- `contentApi`
- `studentApi`
- `teacherApi`

Бекенд має повторити ці контракти через HTTP і БД.

Фронтенд не повинен:

- напряму знати структуру таблиць
- сам формувати relationships між teacher/student/group
- сам вирішувати, які курси доступні учню
- сам зберігати teacher comments або review status без API

Бекенд не повинен:

- запускати HTML/CSS код учня для поточного MVP
- повертати урок у legacy `html/css only` форматі
- вводити окремі `htmlCode`/`cssCode` як основний контракт

---

## Content Contract

Базова модель:

```text
track -> course -> course_module -> lesson
```

Урок має приходити як повний `LessonDTO`:

```ts
type LessonDTO = {
  id: string;
  courseId: string;
  moduleId: string;
  lessonKind: "lesson" | "tech_check";
  slug: string;
  title: string;
  description: string;
  runtimeType: "html-css-preview" | "js-dom" | "code-output" | "theory-only" | "video";
  validationType: "dom-check" | "output-check" | "manual-check" | "none";
  orderIndex: number;
  isPublished: boolean;
  files: LessonFileDTO[];
  theoryBlocks: LessonTheoryBlockDTO[];
  videos: LessonVideoDTO[];
  tasks: LessonTaskDTO[];
};
```

`videos` треба додати до фронтенд типів, коли почнеться реалізація відеоуроків.

---

## Video Lessons

Відео не має бути окремою паралельною системою поза lessons.

Мінімальний DTO:

```ts
type LessonVideoDTO = {
  id: string;
  provider: "upload" | "youtube" | "vimeo" | "mux" | "external";
  sourceUrl: string | null;
  assetId: string | null;
  title: string;
  description: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  transcript: string | null;
  captionsUrl: string | null;
  orderIndex: number;
  isRequired: boolean;
};
```

Очікувана поведінка фронтенду:

- якщо `runtimeType = video`, показати video-first lesson page
- якщо `runtimeType = html-css-preview` і `videos.length > 0`, показати відео як частину теорії/інструкції
- якщо `isRequired = true`, у майбутньому можна додати video progress, але це не блокує перший MVP

---

## Course CRUD

Admin/teacher API має працювати з тією самою `courses` таблицею, яку читає student content API.

Мінімальні endpoint-и:

- `POST /admin/courses`
- `PATCH /admin/courses/:courseId`
- `DELETE /admin/courses/:courseId`
- `POST /admin/courses/:courseId/modules`
- `PATCH /admin/modules/:moduleId`
- `DELETE /admin/modules/:moduleId`
- `POST /admin/courses/:courseId/publish`
- `POST /admin/courses/:courseId/unpublish`

Важливо:

- delete краще почати як soft delete або забороняти видалення, якщо є student progress/submissions
- publish/unpublish має бути окремою дією або чітко контрольованим полем

---

## Lesson CRUD

Lesson CRUD має редагувати:

- lesson metadata
- files
- theory blocks
- videos
- tasks
- order
- publish state

Мінімальні endpoint-и:

- `POST /admin/modules/:moduleId/lessons`
- `PATCH /admin/lessons/:lessonId`
- `DELETE /admin/lessons/:lessonId`
- `POST /admin/lessons/:lessonId/files`
- `PATCH /admin/lesson-files/:fileId`
- `DELETE /admin/lesson-files/:fileId`
- `POST /admin/lessons/:lessonId/theory-blocks`
- `PATCH /admin/lesson-theory-blocks/:blockId`
- `DELETE /admin/lesson-theory-blocks/:blockId`
- `POST /admin/lessons/:lessonId/videos`
- `PATCH /admin/lesson-videos/:videoId`
- `DELETE /admin/lesson-videos/:videoId`
- `POST /admin/lessons/:lessonId/tasks`
- `PATCH /admin/lesson-tasks/:taskId`
- `DELETE /admin/lesson-tasks/:taskId`

Важливо:

- фронтенд lesson runner читає тільки published content
- admin panel може читати draft/unpublished content
- task rules мають лишатися JSON-сумісними

---

## Groups / Classes

Групи потрібні для організації учнів і призначення курсів.

Мінімальні endpoint-и:

- `GET /teacher/groups`
- `POST /teacher/groups`
- `PATCH /teacher/groups/:groupId`
- `DELETE /teacher/groups/:groupId`
- `GET /teacher/groups/:groupId/students`
- `POST /teacher/groups/:groupId/students`
- `DELETE /teacher/groups/:groupId/students/:studentId`
- `POST /teacher/groups/:groupId/courses/:courseId/assign`

Фронтенд teacher area має в майбутньому перейти від "усі учні з localStorage" до:

- groups list
- group details
- students inside group
- assigned courses per group/student

---

## Student Code And Code Versions

Поточний активний код:

- `GET /student/me/code`
- `GET /student/me/code/:lessonId`
- `PUT /student/me/code/:lessonId`

Історія версій:

- `GET /student/me/code/:lessonId/versions`
- `POST /student/me/code/:lessonId/versions`
- `GET /teacher/students/:studentId/code/:lessonId/versions`

Правило:

- `student_code` = останній стан
- `code_versions` = історія snapshots
- submission має створювати code version із `source = submission`

---

## Submissions / Review Workflow

Submission потрібний, коли учень відправляє роботу на перевірку.

Student endpoint-и:

- `POST /student/me/lessons/:lessonId/submissions`
- `GET /student/me/submissions`
- `GET /student/me/submissions/:submissionId`

Teacher endpoint-и:

- `GET /teacher/submissions`
- `GET /teacher/submissions/:submissionId`
- `PATCH /teacher/submissions/:submissionId/status`
- `POST /teacher/submissions/:submissionId/reviews`

Статуси:

- `draft`
- `submitted`
- `in_review`
- `changes_requested`
- `approved`
- `rejected`

Auto-check і submission не конфліктують:

- auto-check може завершити задачі/урок
- submission фіксує роботу для teacher review
- manual-check уроки мають залежати від submission review

---

## Teacher Comments

Коментарі мають підтримувати:

- загальний коментар до submission
- коментар до конкретного файлу
- коментар до конкретного рядка
- resolved/unresolved state

Endpoint-и:

- `GET /teacher/submissions/:submissionId/comments`
- `POST /teacher/submissions/:submissionId/comments`
- `PATCH /teacher/comments/:commentId`
- `DELETE /teacher/comments/:commentId`
- `POST /teacher/comments/:commentId/resolve`
- `POST /teacher/comments/:commentId/unresolve`

Фронтенд на першому етапі може показувати коментарі списком.
Inline comments у редакторі можна додати пізніше.

---

## Admin Panel API

Admin API покриває:

- users
- tracks
- courses
- modules
- lessons
- files
- theory blocks
- videos
- tasks
- groups
- audit log

Мінімальні namespace-и:

- `/admin/users`
- `/admin/tracks`
- `/admin/courses`
- `/admin/modules`
- `/admin/lessons`
- `/admin/groups`
- `/admin/audit-log`

Ролі:

- `admin` може керувати всім
- `teacher` може керувати своїми групами і, якщо дозволено продуктом, власними курсами/уроками
- `student` не має доступу до admin API

---

## Найближчі Зміни У Фронтенді

Коли бекенд почне реалізовувати ці модулі, фронтенду треба:

1. Додати `LessonVideoDTO` у `src/types/content.ts`.
2. Додати `videos` у `LessonDTO`.
3. Оновити `contentApi` mock, щоб він повертав `videos: []`.
4. Додати UI для video-first уроку.
5. Додати API adapters для submissions/comments/code versions.
6. Розширити teacher pages під groups і review queue.
7. Додати admin area тільки після стабілізації backend contracts.
