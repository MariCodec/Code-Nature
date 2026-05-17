# CURRENT_IMPLEMENTATION_UA

## Що Це За Документ

Цей файл описує фактичну реалізацію проєкту на поточний момент.
Його задача - швидко пояснити, що вже є в коді, які модулі за що відповідають і де зараз проходить межа між реальною реалізацією та майбутнім бекендом.

---

## Загальний Стан

Проєкт є React/Vite застосунком для навчання HTML/CSS, який уже мігрує в рольову навчальну платформу.

Технології:

- React 19
- React Router
- Redux Toolkit
- TypeScript
- Monaco Editor
- Sass modules
- mock API через локальні TypeScript-модулі
- localStorage як тимчасове сховище mock API

Поточна архітектура вже орієнтована на модель:

```text
track -> course -> course_module -> lesson
```

---

## Ролі Та Роутинг

Файл: `src/App.tsx`

Поточні ролі:

- `student`
- `teacher`

Public routes:

- `/`
- `/home`
- `/docs`
- `/docs/:category/:id`
- `/login`
- `/register`
- `/app`

Student routes:

- `/student`
- `/student/learning`
- `/student/tech-checks`
- `/student/progress`
- `/student/courses/:courseId`
- `/student/courses/:courseId/modules/:moduleId/lessons/:id`
- `/student/courses/:courseId/modules/:moduleId/tech-checks/:id`

Teacher routes:

- `/teacher`
- `/teacher/students`
- `/teacher/students/:studentId`

`AuthGuard` розділяє student і teacher area за роллю.

---

## Auth

Основні файли:

- `src/api/authApi.ts`
- `src/store/slices/authSlice.ts`
- `src/store/thunks/authThunks.ts`
- `src/AppInitializer.tsx`
- `src/features/auth/LoginPage.tsx`
- `src/features/auth/RegisterPage.tsx`

Що реалізовано:

- mock register
- mock login
- mock logout
- session у localStorage під ключем `auth_session_v1`
- роль у session
- завантаження session при старті app
- очищення student progress/code при logout

Обмеження:

- немає реального бекенду
- немає password hashing на фронті, це має бути тільки на бекенді
- mock login приймає будь-якого користувача з валідним email/password

---

## Content Model

Основні файли:

- `src/types/content.ts`
- `src/api/contentApi.ts`
- `src/store/slices/contentSlice.ts`
- `src/data/lessonData.ts`

Поточні DTO:

- `TrackDTO`
- `CourseDTO`
- `CourseModuleDTO`
- `LessonListItemDTO`
- `LessonDTO`
- `LessonFileDTO`
- `LessonTheoryBlockDTO`
- `LessonTaskDTO`

Що реалізовано:

- один frontend track
- два курси:
  - `course_html_basic`
  - `course_css_basic`
- по одному module на курс:
  - `module_html_basic`
  - `module_css_basic`
- уроки мапляться зі старого `lessonData.ts`
- tech checks генеруються в `contentApi.ts` як уроки з `lessonKind = tech_check`
- уроки мають `runtimeType`, `validationType`, `files`, `theoryBlocks`, `tasks`

Обмеження:

- контент ще не приходить з HTTP API
- джерело уроків усе ще статичний `lessonData.ts`, але доступ до нього вже обгорнутий у mock API
- відео в DTO ще не додано

---

## Student Flow

Основні файли:

- `src/pages/Student/StudentLearningPage.tsx`
- `src/pages/Student/StudentTechChecksPage.tsx`
- `src/pages/Student/StudentProgressPage.tsx`
- `src/pages/LessonsList/LessonsList.tsx`
- `src/pages/lessonPage/LessonPage.tsx`

Що реалізовано:

- сторінка навчання з курсами, модулями, уроками і техчеками
- сторінка техчеків
- сторінка прогресу учня
- список уроків курсу
- сторінка конкретного уроку
- canonical route structure через course/module/lesson ids

Student progress UX уже використовує:

- completed lessons
- current lesson
- task completion summary
- continue learning entry point

---

## Code Editor

Основні файли:

- `src/components/CodeEditor/CodeEditor.tsx`
- `src/components/CodeEditor/CodeButtons.tsx`
- `src/components/CodeEditor/Output.tsx`
- `src/utils/codeFiles.ts`
- `src/utils/lessonFiles.ts`
- `src/utils/checkLesson.ts`
- `src/utils/validateHtmlCss.ts`
- `src/utils/validateHtmlParse5.ts`

Що реалізовано:

- Monaco Editor
- вкладки файлів з `lessonDto.files`
- поточна підтримка `index.html` і `style.css`
- preview через iframe
- HTML parse validation через parse5/Monaco markers
- запуск перевірки завдань через hidden iframe
- DOM/CSS checks через декларативні task rules
- форматування коду
- reset code до initial lesson files

Важливо:

- Redux state уже зберігає `savedFiles`
- helper-и ще підтримують html/css для сумісності з поточним UI
- runtime фактично підтримує тільки `html-css-preview`

---

## Student Persistence

Основні файли:

- `src/api/studentApi.ts`
- `src/store/thunks/syncThunks.ts`
- `src/store/slices/userCodeSlice.ts`
- `src/store/slices/progressSlice.ts`

Що реалізовано:

- user-scoped localStorage persistence
- код учня зберігається під ключем `student_code_v1:${userId}`
- прогрес учня зберігається під ключем `student_progress_v1:${userId}`
- persisted code format базується на `savedFiles`
- persisted progress format базується на:
  - `currentLessonId`
  - `lessonProgress`
  - `taskProgress`
- `syncThunks` перетворює DTO-like persisted data у поточний Redux UI shape

Поточний Redux shape:

- `progress.completedLessons`
- `progress.currentLessonId`
- `progress.lastActivityAt`
- `progress.taskStatus`
- `userCode[lessonId].savedFiles`
- `userCode[lessonId].html`
- `userCode[lessonId].css`

Обмеження:

- `studentApi` ще не HTTP API
- code snapshot `updatedAt` для teacher view зараз не завжди доступний

---

## Teacher Flow

Основні файли:

- `src/api/teacherApi.ts`
- `src/store/slices/teacherSlice.ts`
- `src/pages/Teacher/TeacherHomePage.tsx`
- `src/pages/Teacher/TeacherStudentsPage.tsx`
- `src/pages/Teacher/TeacherStudentPage.tsx`

Що реалізовано:

- teacher home
- список учнів
- детальна сторінка учня
- перегляд lesson progress
- перегляд task progress
- перегляд code snapshots як списку файлів

Як зараз формується список учнів:

- `teacherApi` сканує localStorage ключі `student_code_v1:*` і `student_progress_v1:*`
- учні з’являються, якщо вже мають код або прогрес

Обмеження:

- немає реального `teacher_students` або `groups`
- немає teacher comments
- немає review workflow
- немає inline code review

---

## Docs

Основні файли:

- `src/pages/Docs/DocsPage.tsx`
- `src/pages/Docs/DocsPage.module.scss`

Що реалізовано:

- docs уже читають content через `contentSlice`
- теорія рендериться з `lessonDto.theoryBlocks`
- сторінка docs більше не має прямої залежності від legacy lesson source як основної моделі

---

## Layout And Navigation

Основні файли:

- `src/components/layout/Layout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/lessonNavigation/LessonNavigation.tsx`

Що реалізовано:

- role-aware header
- user name
- role badge
- dashboard link
- logout
- student links: навчання, техчеки
- teacher link: учні
- lesson navigation через `contentSlice`
- next lesson блокується, якщо поточний урок не завершено

---

## Що Ще Не Реалізовано

Потрібно додати в майбутніх етапах:

- реальний backend API
- БД згідно з `SCHEMA_BD_UA.md`
- CRUD курсів
- CRUD уроків
- відеоуроки у DTO/UI
- groups/classes
- teacher comments
- submissions/review workflow
- code version history
- admin panel API
- нормальні assigned courses для student/teacher
- повноцінний multi-file editor beyond HTML/CSS

---

## Практичний Висновок

Поточний frontend уже достатньо підготовлений до бекенду:

- UI не повинен напряму залежати від БД
- API layer уже існує як mock
- DTO shape уже частково стабільний
- student/teacher routing розділений
- persistence уже user-scoped

Наступний правильний крок - замінювати mock API модулі на реальний HTTP-клієнт без зміни продуктової моделі.
