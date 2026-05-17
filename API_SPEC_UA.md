# API_SPEC_UA

## Що Це За Документ

Цей файл описує базову специфікацію API для MVP навчальної платформи.

Він потрібен, щоб:

- фронтенд і бекенд працювали через однакові контракти
- не виникало розбіжностей у структурі даних
- було зрозуміло, які endpoint-и потрібні в MVP

Це не Swagger і не OpenAPI-файл.
Це робочий технічний spec, на основі якого потім можна зробити:

- backend routes
- controllers
- DTO
- OpenAPI schema

---

## Загальні Принципи API

### Формат

- API працює у JSON
- всі дати повертаються у форматі ISO string
- всі id є рядками

### Авторизація

На MVP передбачається authenticated API для більшості endpoint-ів.

Типово:

- public endpoints:
  - login
  - register
- protected endpoints:
  - student
  - teacher
  - content access, якщо курс доступний тільки авторизованим користувачам

### Ролі

Система підтримує:

- `student`
- `teacher`

### Підхід до контенту

На MVP контент уроків уже входить у модель бекенду.

Це означає, що API має вміти віддавати:

- треки
- курси
- уроки
- файли уроку
- теорію уроку
- завдання уроку

### Поточна спеціалізація MVP

MVP залишається `HTML/CSS-first`, але API не повинен бути жорстко прив’язаний тільки до HTML/CSS.

Тому:

- урок повертає `runtimeType`
- урок повертає масив `files`
- код учня повертається як `savedFiles`

---

## Базові Типи Відповідей

### Успішна відповідь

```json
{
  "data": {}
}
```

### Помилка

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "У вас немає доступу до цього ресурсу"
  }
}
```

### Пагінація

Для MVP не обов’язкова всюди.

Але якщо список зростатиме, формат краще одразу уніфікувати:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

---

## DTO

### UserDTO

```ts
type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
};
```

### AuthSessionDTO

```ts
type AuthSessionDTO = {
  user: UserDTO;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};
```

### TrackDTO

```ts
type TrackDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
};
```

### CourseDTO

```ts
type CourseDTO = {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  isPublished: boolean;
};
```

### CourseModuleDTO

```ts
type CourseModuleDTO = {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
};
```

### LessonFileDTO

```ts
type LessonFileDTO = {
  id: string;
  name: string;
  language: string;
  initialContent: string;
  orderIndex: number;
  isEditable: boolean;
};
```

### LessonTheoryBlockDTO

```ts
type LessonTheoryBlockDTO = {
  id: string;
  blockType: "text" | "list" | "code" | "note";
  content: unknown;
  orderIndex: number;
};
```

### LessonVideoDTO

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

### LessonTaskDTO

```ts
type LessonTaskDTO = {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  rules: unknown;
};
```

### LessonDTO

```ts
type LessonDTO = {
  id: string;
  courseId: string;
  moduleId: string;
  lessonKind: "lesson" | "tech_check";
  slug: string;
  title: string;
  description: string;
  runtimeType: string;
  validationType: string;
  orderIndex: number;
  isPublished: boolean;
  files: LessonFileDTO[];
  theoryBlocks: LessonTheoryBlockDTO[];
  videos: LessonVideoDTO[];
  tasks: LessonTaskDTO[];
};
```

### StudentLessonProgressDTO

```ts
type StudentLessonProgressDTO = {
  lessonId: string;
  courseId: string;
  status: "not_started" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};
```

### StudentTaskProgressDTO

```ts
type StudentTaskProgressDTO = {
  lessonId: string;
  taskId: string;
  courseId: string;
  isCompleted: boolean;
  completedAt: string | null;
  updatedAt: string;
};
```

### StudentSavedFileDTO

```ts
type StudentSavedFileDTO = {
  name: string;
  language: string;
  content: string;
};
```

### StudentCodeDTO

```ts
type StudentCodeDTO = {
  lessonId: string;
  courseId: string;
  savedFiles: StudentSavedFileDTO[];
  updatedAt: string;
};
```

### TeacherStudentListItemDTO

```ts
type TeacherStudentListItemDTO = {
  id: string;
  name: string;
  email: string;
  completedLessonsCount: number;
  currentLessonId: string | null;
  lastActivityAt: string | null;
};
```

### TeacherStudentDetailsDTO

```ts
type TeacherStudentDetailsDTO = {
  id: string;
  name: string;
  email: string;
  currentLessonId: string | null;
  completedLessonsCount: number;
  lastActivityAt: string | null;
  lessonProgress: StudentLessonProgressDTO[];
  taskProgress: StudentTaskProgressDTO[];
  codeSnapshots: TeacherStudentCodeSnapshotDTO[];
};
```

### TeacherStudentCodeSnapshotDTO

```ts
type TeacherStudentCodeSnapshotDTO = {
  lessonId: string;
  savedFiles: StudentSavedFileDTO[];
  updatedAt: string | null;
};
```

---

## Auth API

### `POST /auth/register`

Призначення:

- створити нового користувача

Request:

```json
{
  "name": "Maria",
  "email": "maria@example.com",
  "password": "secret123",
  "role": "student"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "usr_1",
      "name": "Maria",
      "email": "maria@example.com",
      "role": "student"
    },
    "accessToken": "token",
    "refreshToken": "refresh-token"
  }
}
```

### `POST /auth/login`

Призначення:

- логін користувача

Request:

```json
{
  "email": "maria@example.com",
  "password": "secret123"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "usr_1",
      "name": "Maria",
      "email": "maria@example.com",
      "role": "student"
    },
    "accessToken": "token",
    "refreshToken": "refresh-token"
  }
}
```

### `POST /auth/logout`

Призначення:

- завершити сесію

Response:

```json
{
  "data": {
    "success": true
  }
}
```

### `GET /auth/me`

Призначення:

- повернути поточного користувача

Response:

```json
{
  "data": {
    "id": "usr_1",
    "name": "Maria",
    "email": "maria@example.com",
    "role": "student"
  }
}
```

---

## Content API

### `GET /tracks`

Призначення:

- повернути список напрямів

Response:

```json
{
  "data": [
    {
      "id": "track_frontend",
      "slug": "frontend",
      "title": "Frontend",
      "description": "Основи frontend-розробки"
    }
  ]
}
```

### `GET /tracks/:trackSlug/courses`

Призначення:

- повернути курси для конкретного треку

Response:

```json
{
  "data": [
    {
      "id": "course_html_basic",
      "trackId": "track_frontend",
      "slug": "html-basic",
      "title": "HTML для початківців",
      "description": "Базова HTML-розмітка",
      "level": "beginner",
      "isPublished": true
    }
  ]
}
```

### `GET /courses/:courseId`

Призначення:

- повернути деталі курсу

Response:

```json
{
  "data": {
    "id": "course_html_basic",
    "trackId": "track_frontend",
    "slug": "html-basic",
    "title": "HTML для початківців",
    "description": "Базова HTML-розмітка",
    "level": "beginner",
    "isPublished": true
  }
}
```

### `GET /courses/:courseId/modules`

Призначення:

- повернути список модулів курсу

Response:

```json
{
  "data": [
    {
      "id": "module_html_basic",
      "courseId": "course_html_basic",
      "slug": "html-basic",
      "title": "HTML Basic",
      "description": "Структура HTML-документа, базові теги та семантика.",
      "orderIndex": 1,
      "isPublished": true
    }
  ]
}
```

### `GET /modules/:moduleId/lessons`

Призначення:

- повернути список уроків конкретного модуля
- якщо модуль має техчек, він повертається в цьому ж списку як item з `lessonKind: "tech_check"`

Response:

```json
{
  "data": [
    {
      "id": "lesson_intro_html",
      "courseId": "course_html_basic",
      "moduleId": "module_html_basic",
      "lessonKind": "lesson",
      "slug": "intro-html",
      "title": "Основи HTML",
      "description": "Перші HTML-теги",
      "runtimeType": "html-css-preview",
      "validationType": "dom-check",
      "orderIndex": 1,
      "isPublished": true
    }
  ]
}
```

### `GET /lessons/:lessonId`

Призначення:

- повернути повний урок разом із файлами, теорією і завданнями

Response:

```json
{
  "data": {
    "id": "lesson_intro_html",
    "courseId": "course_html_basic",
    "moduleId": "module_html_basic",
    "lessonKind": "lesson",
    "slug": "intro-html",
    "title": "Основи HTML",
    "description": "Перші HTML-теги",
    "runtimeType": "html-css-preview",
    "validationType": "dom-check",
    "orderIndex": 1,
    "isPublished": true,
    "files": [
      {
        "id": "file_1",
        "name": "index.html",
        "language": "html",
        "initialContent": "<h1>Привіт, HTML!</h1>",
        "orderIndex": 1,
        "isEditable": true
      },
      {
        "id": "file_2",
        "name": "style.css",
        "language": "css",
        "initialContent": "h1 { color: red; }",
        "orderIndex": 2,
        "isEditable": true
      }
    ],
    "theoryBlocks": [
      {
        "id": "theory_1",
        "blockType": "text",
        "content": {
          "text": "HTML — це мова розмітки"
        },
        "orderIndex": 1
      }
    ],
    "videos": [],
    "tasks": [
      {
        "id": "task_1",
        "title": "Зробіть заголовок зеленим",
        "description": "Потрібно змінити колір заголовка",
        "orderIndex": 1,
        "rules": {
          "htmlSelectors": [{ "selector": "h1" }],
          "cssChecks": [{ "selector": "h1", "property": "color", "value": "rgb(0, 128, 0)" }]
        }
      }
    ]
  }
}
```

---

## Student API

### `GET /student/me/courses`

Призначення:

- повернути курси, призначені поточному учню

Response:

```json
{
  "data": [
    {
      "id": "course_html_basic",
      "trackId": "track_frontend",
      "slug": "html-basic",
      "title": "HTML для початківців",
      "description": "Базова HTML-розмітка",
      "level": "beginner",
      "isPublished": true
    }
  ]
}
```

### `GET /student/me/progress`

Призначення:

- повернути прогрес поточного учня

Response:

```json
{
  "data": {
    "lessonProgress": [
      {
        "lessonId": "lesson_intro_html",
        "courseId": "course_html_basic",
        "status": "in_progress",
        "startedAt": "2026-03-29T10:00:00.000Z",
        "completedAt": null,
        "updatedAt": "2026-03-29T10:15:00.000Z"
      }
    ],
    "taskProgress": [
      {
        "lessonId": "lesson_intro_html",
        "taskId": "task_1",
        "courseId": "course_html_basic",
        "isCompleted": true,
        "completedAt": "2026-03-29T10:14:00.000Z",
        "updatedAt": "2026-03-29T10:14:00.000Z"
      }
    ]
  }
}
```

### `GET /student/me/code`

Призначення:

- повернути всі збережені коди поточного учня

Response:

```json
{
  "data": [
    {
      "lessonId": "lesson_intro_html",
      "courseId": "course_html_basic",
      "savedFiles": [
        {
          "name": "index.html",
          "language": "html",
          "content": "<h1>Привіт, HTML!</h1>"
        },
        {
          "name": "style.css",
          "language": "css",
          "content": "h1 { color: green; }"
        }
      ],
      "updatedAt": "2026-03-29T10:15:00.000Z"
    }
  ]
}
```

### `GET /student/me/code/:lessonId`

Призначення:

- повернути код учня для одного уроку

Response:

```json
{
  "data": {
    "lessonId": "lesson_intro_html",
    "courseId": "course_html_basic",
    "savedFiles": [
      {
        "name": "index.html",
        "language": "html",
        "content": "<h1>Привіт, HTML!</h1>"
      },
      {
        "name": "style.css",
        "language": "css",
        "content": "h1 { color: green; }"
      }
    ],
    "updatedAt": "2026-03-29T10:15:00.000Z"
  }
}
```

### `PUT /student/me/code/:lessonId`

Призначення:

- зберегти поточний код учня для уроку

Request:

```json
{
  "courseId": "course_html_basic",
  "savedFiles": [
    {
      "name": "index.html",
      "language": "html",
      "content": "<h1>Привіт, HTML!</h1>"
    },
    {
      "name": "style.css",
      "language": "css",
      "content": "h1 { color: green; }"
    }
  ]
}
```

Response:

```json
{
  "data": {
    "lessonId": "lesson_intro_html",
    "courseId": "course_html_basic",
    "savedFiles": [
      {
        "name": "index.html",
        "language": "html",
        "content": "<h1>Привіт, HTML!</h1>"
      },
      {
        "name": "style.css",
        "language": "css",
        "content": "h1 { color: green; }"
      }
    ],
    "updatedAt": "2026-03-29T10:20:00.000Z"
  }
}
```

### `PUT /student/me/progress/:lessonId`

Призначення:

- оновити прогрес учня по уроку і завданнях

Request:

```json
{
  "courseId": "course_html_basic",
  "status": "in_progress",
  "taskProgress": [
    {
      "taskId": "task_1",
      "isCompleted": true
    }
  ]
}
```

Response:

```json
{
  "data": {
    "lessonId": "lesson_intro_html",
    "courseId": "course_html_basic",
    "status": "in_progress",
    "updatedAt": "2026-03-29T10:20:00.000Z"
  }
}
```

---

## Teacher API

### `GET /teacher/students`

Призначення:

- повернути список учнів викладача

Response:

```json
{
  "data": [
    {
      "id": "student_1",
      "name": "Ірина",
      "email": "iryna@example.com",
      "completedLessonsCount": 3,
      "assignedCoursesCount": 2,
      "lastActivityAt": "2026-03-29T10:20:00.000Z"
    }
  ]
}
```

### `GET /teacher/students/:studentId`

Призначення:

- повернути деталі конкретного учня

Response:

```json
{
  "data": {
    "student": {
      "id": "student_1",
      "name": "Ірина",
      "email": "iryna@example.com",
      "role": "student"
    },
    "assignedCourses": [
      {
        "id": "course_html_basic",
        "trackId": "track_frontend",
        "slug": "html-basic",
        "title": "HTML для початківців",
        "description": "Базова HTML-розмітка",
        "level": "beginner",
        "isPublished": true
      }
    ],
    "lessonProgress": [
      {
        "lessonId": "lesson_intro_html",
        "courseId": "course_html_basic",
        "status": "completed",
        "startedAt": "2026-03-29T09:00:00.000Z",
        "completedAt": "2026-03-29T09:20:00.000Z",
        "updatedAt": "2026-03-29T09:20:00.000Z"
      }
    ],
    "taskProgress": [
      {
        "lessonId": "lesson_intro_html",
        "taskId": "task_1",
        "courseId": "course_html_basic",
        "isCompleted": true,
        "completedAt": "2026-03-29T09:15:00.000Z",
        "updatedAt": "2026-03-29T09:15:00.000Z"
      }
    ]
  }
}
```

### `GET /teacher/students/:studentId/progress`

Призначення:

- окремо повернути прогрес конкретного учня

Response:

```json
{
  "data": {
    "lessonProgress": [],
    "taskProgress": []
  }
}
```

### `GET /teacher/students/:studentId/code/:lessonId`

Призначення:

- повернути збережений код учня для конкретного уроку

Response:

```json
{
  "data": {
    "lessonId": "lesson_intro_html",
    "courseId": "course_html_basic",
    "savedFiles": [
      {
        "name": "index.html",
        "language": "html",
        "content": "<h1>Привіт, HTML!</h1>"
      },
      {
        "name": "style.css",
        "language": "css",
        "content": "h1 { color: green; }"
      }
    ],
    "updatedAt": "2026-03-29T10:20:00.000Z"
  }
}
```

---

## Наступні API Модулі, Які Треба Зафіксувати

Нижче не обов’язково реалізовувати все в першому backend sprint, але ці модулі вже є частиною цільового контракту.
Їх потрібно враховувати в БД, DTO і frontend integration plan.

### Course CRUD / Admin

- `POST /admin/courses`
- `PATCH /admin/courses/:courseId`
- `DELETE /admin/courses/:courseId`
- `POST /admin/courses/:courseId/publish`
- `POST /admin/courses/:courseId/unpublish`
- `POST /admin/courses/:courseId/modules`
- `PATCH /admin/modules/:moduleId`
- `DELETE /admin/modules/:moduleId`

Призначення:

- створення і редагування курсів
- керування модулями
- publish/unpublish для student-facing content

### Lesson CRUD / Admin

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

Призначення:

- створення і редагування уроків
- редагування файлів, теорії, відео і завдань
- підтримка звичайних уроків, техчеків і відеоуроків через один lesson contract

### Video Lessons

Відеоуроки мають працювати через `LessonDTO.videos`.

Для відео-first уроку:

- `runtimeType = "video"`
- `validationType = "none"` або `manual-check`
- `files` може бути порожнім масивом
- `tasks` може бути порожнім масивом або містити follow-up завдання

Для практичного уроку з відео:

- `runtimeType = "html-css-preview"`
- `videos` містить інструкційне відео
- `files` і `tasks` працюють як у поточному editor flow

### Groups / Classes

- `GET /teacher/groups`
- `POST /teacher/groups`
- `PATCH /teacher/groups/:groupId`
- `DELETE /teacher/groups/:groupId`
- `GET /teacher/groups/:groupId/students`
- `POST /teacher/groups/:groupId/students`
- `DELETE /teacher/groups/:groupId/students/:studentId`
- `POST /teacher/groups/:groupId/courses/:courseId/assign`

Призначення:

- групувати учнів у класи
- призначати курси групам
- давати teacher dashboard реальну структуру замість простого списку всіх учнів

### Submissions / Review Workflow

- `POST /student/me/lessons/:lessonId/submissions`
- `GET /student/me/submissions`
- `GET /student/me/submissions/:submissionId`
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

Призначення:

- учень відправляє snapshot роботи
- викладач перевіряє submission
- manual-check уроки можуть завершуватись через review

### Teacher Comments

- `GET /teacher/submissions/:submissionId/comments`
- `POST /teacher/submissions/:submissionId/comments`
- `PATCH /teacher/comments/:commentId`
- `DELETE /teacher/comments/:commentId`
- `POST /teacher/comments/:commentId/resolve`
- `POST /teacher/comments/:commentId/unresolve`

Коментар може бути:

- загальним до submission
- прив’язаним до конкретного файлу
- прив’язаним до конкретного рядка

### Code Version History

- `GET /student/me/code/:lessonId/versions`
- `POST /student/me/code/:lessonId/versions`
- `GET /teacher/students/:studentId/code/:lessonId/versions`

Призначення:

- `student_code` зберігає останній стан
- `code_versions` зберігає історію
- submission створює окрему версію коду

### Admin Panel API

Namespace-и:

- `/admin/users`
- `/admin/tracks`
- `/admin/courses`
- `/admin/modules`
- `/admin/lessons`
- `/admin/groups`
- `/admin/audit-log`

Призначення:

- керування користувачами
- керування контентом
- керування групами
- аудит змін

---

## Порядок Реалізації API

Рекомендований порядок:

1. `Auth API`
2. `Content API`
3. `Student API`
4. `Teacher API`

Причина:

- без auth немає ролей
- без content API студенту нічого відкривати
- без student API немає збереження прогресу
- teacher API має сенс тільки після появи student data

---

## Що Робити Після Цього Документа

Після затвердження цього spec логічний наступний крок:

1. зафіксувати frontend integration plan
2. визначити DTO на рівні фронтенду
3. почати реалізацію auth foundation
4. після цього перейти до завантаження уроків з API
