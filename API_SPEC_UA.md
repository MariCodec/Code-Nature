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
  accessToken: string;
  refreshToken?: string;
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
  slug: string;
  title: string;
  description: string;
  runtimeType: string;
  validationType: string;
  orderIndex: number;
  isPublished: boolean;
  files: LessonFileDTO[];
  theoryBlocks: LessonTheoryBlockDTO[];
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
  assignedCoursesCount: number;
  lastActivityAt: string | null;
};
```

### TeacherStudentDetailsDTO

```ts
type TeacherStudentDetailsDTO = {
  student: UserDTO;
  assignedCourses: CourseDTO[];
  lessonProgress: StudentLessonProgressDTO[];
  taskProgress: StudentTaskProgressDTO[];
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

### `GET /courses/:courseId/lessons`

Призначення:

- повернути список уроків курсу

Response:

```json
{
  "data": [
    {
      "id": "lesson_intro_html",
      "courseId": "course_html_basic",
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

## Що Не Входить У Перший MVP API

Поки не обов’язково реалізовувати:

- CRUD для створення/редагування курсів
- CRUD для створення/редагування уроків
- teacher comments
- code version history
- groups/classes
- submissions/review workflow
- admin panel API

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
