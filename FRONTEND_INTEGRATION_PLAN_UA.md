# FRONTEND_INTEGRATION_PLAN_UA

## Як Читати Документи

У проєкті вже є кілька `.md`, але для frontend-роботи головним файлом має бути цей документ.

| Файл | Для чого читати |
| --- | --- |
| `FRONTEND_INTEGRATION_PLAN_UA.md` | Головний frontend-план: що вже зроблено, де це в коді, що робити далі |
| `CURRENT_IMPLEMENTATION_UA.md` | Повна карта поточної реалізації по всьому проєкту |
| `BACKEND_FRONTEND_CONTRACT_UA.md` | Узгодження з бекендом для майбутніх API і DTO |
| `API_SPEC_UA.md` | Детальні endpoint-и і DTO |
| `SCHEMA_BD_UA.md` | Концептуальна схема бази даних |


Практично:

1. Для frontend-задач починати з цього файлу.
2. Якщо треба API - дивитись `API_SPEC_UA.md`.
3. Якщо треба БД - дивитись `SCHEMA_BD_UA.md`.
4. Якщо треба зрозуміти всю систему - дивитись `CURRENT_IMPLEMENTATION_UA.md`.

---

## Поточна Ідея Фронтенду

Фронтенд уже не є просто локальним HTML/CSS editor app.
Він рухається до навчальної платформи з ролями:

- `student`
- `teacher`

Основна модель контенту:

```text
track -> course -> module -> lesson
```

Урок може містити:

- metadata
- theory blocks
- videos
- files для редактора
- tasks
- validation rules

Поточний MVP залишається `HTML/CSS-first`, але frontend-модель уже не повинна бути `HTML/CSS-only`.

---

## Що Вже Реалізовано

| Блок | Що зроблено | Для чого | Основні файли |
| --- | --- | --- | --- |
| App routing | Розділено public, student і teacher routes | Щоб student/teacher flows не змішувались | `src/App.tsx` |
| Auth guard | Додано role-based доступ | Щоб студент не заходив у teacher area і навпаки | `src/features/auth/AuthGuard.tsx` |
| Mock auth API | Login/register/logout/session через localStorage | Тимчасова заміна backend auth | `src/api/authApi.ts`, `src/store/thunks/authThunks.ts`, `src/store/slices/authSlice.ts` |
| App init | Session завантажується при старті | Щоб після refresh користувач не губився | `src/AppInitializer.tsx` |
| Layout/header | Header показує role-based navigation, dashboard link, logout | Щоб навігація залежала від ролі без зайвого дублювання `student/Учень` | `src/components/layout/Header.tsx` |
| Content DTO | Додано типи track/course/module/lesson/files/tasks/videos | Щоб frontend працював у backend-ready моделі | `src/types/content.ts` |
| Mock content API | Static `lessonData` обгорнуто в API-подібний шар | Щоб потім замінити mock на HTTP без переписування UI | `src/api/contentApi.ts`, `src/data/lessonData.ts` |
| Content Redux | Додано `contentSlice` з thunk-и для tracks/courses/modules/lessons | Щоб контент жив у Redux, а не напряму в компонентах | `src/store/slices/contentSlice.ts` |
| Course/module routes | Уроки відкриваються через canonical route з courseId/moduleId | Щоб routing відповідав моделі БД | `src/utils/courseMapping.ts`, `src/App.tsx` |
| Student learning page | Є сторінка курсів, модулів, уроків і техчеків | Основний student entry point | `src/pages/Student/StudentLearningPage.tsx` |
| Student tech checks page | Є окрема сторінка техчеків | Щоб контрольні перевірки були видимим flow | `src/pages/Student/StudentTechChecksPage.tsx` |
| Student progress page | Є зведення прогресу, задач і continue learning | Щоб студент бачив свій шлях навчання | `src/pages/Student/StudentProgressPage.tsx` |
| Lessons list | Список уроків курсу працює через content state | Щоб не читати `lessonData` напряму | `src/pages/LessonsList/LessonsList.tsx` |
| Lesson page | Урок бере `LessonDTO` з `contentSlice` | Щоб сторінка уроку була API-ready | `src/pages/lessonPage/LessonPage.tsx` |
| Lesson videos | `LessonDTO` має `videos`; перед практикою показується intro-відео, після старту є малий відеоблок у sidebar | Щоб студент спочатку дивився пояснення, а потім міг повернутися до нього під час практики | `src/types/content.ts`, `src/api/contentApi.ts`, `src/pages/lessonPage/LessonPage.tsx` |
| Video progress | Є `videoStatus` у progress state і persistence через mock student API | Щоб frontend міг знати, чи студент уже відкрив практику після відео | `src/store/slices/progressSlice.ts`, `src/api/studentApi.ts`, `src/store/thunks/syncThunks.ts` |
| Code editor | Monaco працює з lesson files і savedFiles | Щоб редактор не був привʼязаний тільки до hardcoded html/css | `src/components/CodeEditor/CodeEditor.tsx`, `src/utils/lessonFiles.ts`, `src/utils/codeFiles.ts` |
| Preview | HTML/CSS рендериться в iframe | Поточний runtime для HTML/CSS уроків | `src/components/CodeEditor/Output.tsx` |
| Client validation | Tasks перевіряються на фронті через iframe DOM/CSS checks | Не треба backend execution для HTML/CSS | `src/utils/checkLesson.ts`, `src/utils/validateHtmlCss.ts`, `src/utils/validateHtmlParse5.ts` |
| Progress Redux | Є completed lessons, current lesson, task status | Щоб UI міг показувати прогрес | `src/store/slices/progressSlice.ts` |
| User code Redux | Код зберігається як `savedFiles`, плюс html/css compatibility | Щоб перейти до multi-file backend contract | `src/store/slices/userCodeSlice.ts` |
| Student mock API | Code/progress зберігаються per user у localStorage | Тимчасова заміна student backend API | `src/api/studentApi.ts`, `src/store/thunks/syncThunks.ts` |
| Teacher mock API | Teacher бачить студентів з localStorage progress/code | Тимчасовий teacher dashboard без backend | `src/api/teacherApi.ts` |
| Teacher Redux | Є teacher state для students/details/code snapshots | Щоб teacher pages працювали через store | `src/store/slices/teacherSlice.ts` |
| Teacher pages | Є home, students list, student details | MVP teacher flow | `src/pages/Teacher/TeacherHomePage.tsx`, `src/pages/Teacher/TeacherStudentsPage.tsx`, `src/pages/Teacher/TeacherStudentPage.tsx` |
| Docs page | Docs читає theory з content flow | Щоб docs теж були API-ready | `src/pages/Docs/DocsPage.tsx` |

---

## Поточні Обмеження

| Обмеження | Що це означає |
| --- | --- |
| Немає реального backend API | `authApi`, `contentApi`, `studentApi`, `teacherApi` поки mock/localStorage |
| Контент ще з `lessonData.ts` | UI вже не читає його напряму, але джерело даних ще статичне |
| Video support для MVP готовий | Frontend показує intro-відео і sidebar-preview, але немає admin UI/backend API для керування відео |
| Editor практично HTML/CSS | `savedFiles` уже є, але UI повноцінно підтримує тільки `index.html` і `style.css` |
| Teacher flow без реальних groups | Список учнів зараз формується з localStorage, не з `teacher_students` / `groups` |
| Немає submissions/review | Teacher ще не може робити повний review workflow |
| Немає admin panel | Курси/уроки/відео поки не створюються через UI |

---

## Який Frontend-Файл За Що Відповідає

| Зона | Файли |
| --- | --- |
| Routes | `src/App.tsx` |
| App init | `src/AppInitializer.tsx` |
| Auth API | `src/api/authApi.ts` |
| Auth state | `src/store/slices/authSlice.ts`, `src/store/thunks/authThunks.ts` |
| Content API | `src/api/contentApi.ts` |
| Content state | `src/store/slices/contentSlice.ts` |
| Content DTO | `src/types/content.ts` |
| Legacy lesson source | `src/data/lessonData.ts`, `src/types/lessonTypes.ts` |
| Student persistence | `src/api/studentApi.ts`, `src/store/thunks/syncThunks.ts` |
| Student code state | `src/store/slices/userCodeSlice.ts` |
| Student progress state | `src/store/slices/progressSlice.ts` |
| Teacher API/state | `src/api/teacherApi.ts`, `src/store/slices/teacherSlice.ts` |
| Student pages | `src/pages/Student/*` |
| Teacher pages | `src/pages/Teacher/*` |
| Lesson page | `src/pages/lessonPage/LessonPage.tsx` |
| Editor | `src/components/CodeEditor/*` |
| Lesson validation | `src/utils/checkLesson.ts`, `src/utils/validateHtmlCss.ts`, `src/utils/validateHtmlParse5.ts` |
| Layout/navigation | `src/components/layout/*`, `src/components/lessonNavigation/*` |

---

## Наступний Frontend Roadmap

### 1. Video Lessons UI

Статус: frontend MVP зроблено.

Що вже зроблено:

- `LessonDTO.videos` додано в content model
- у mock `contentApi.ts` додано тестове YouTube-відео
- перед практикою показується intro-екран з відео
- після переходу до практики у sidebar лишається малий відеоблок
- перегляд відео зберігається у `videoStatus`
- video-only lesson page підтримується для майбутніх уроків без редактора

Що залишилось пізніше:

- замінити тестове YouTube-посилання на реальні дані з backend
- додати редагування відео в admin lesson editor
- за потреби додати точніший progress tracking: seconds watched / completedAt

Файли:

- `src/types/content.ts`
- `src/api/contentApi.ts`
- `src/pages/lessonPage/LessonPage.tsx`
- `src/pages/lessonPage/LessonPage.module.scss`

Результат:

- frontend готовий приймати відео до будь-якого уроку без зміни логіки редактора.

---

### 2. Replace Mock API Boundaries With HTTP Client

Пріоритет: високий, коли backend готовий.

Що зробити:

- створити базовий HTTP client
- замінити internals у `authApi`, `contentApi`, `studentApi`, `teacherApi`
- залишити ті самі DTO і thunk-и
- додати error handling для API errors

Файли:

- `src/api/authApi.ts`
- `src/api/contentApi.ts`
- `src/api/studentApi.ts`
- `src/api/teacherApi.ts`
- `src/store/thunks/*`

Результат:

- UI не переписується, міняється тільки API layer.

---

### 3. Admin Content MVP

Пріоритет: середній, після базового backend content API.

Що зробити першим:

- admin route guard для `admin` або teacher-with-permission
- список курсів
- створення/редагування курсу
- список modules у курсі
- створення/редагування module
- список lessons у module
- створення/редагування lesson metadata

Що не робити одразу:

- складний visual CMS
- drag-and-drop builder
- повну аналітику

Нові файли орієнтовно:

- `src/pages/Admin/AdminCoursesPage.tsx`
- `src/pages/Admin/AdminCourseEditorPage.tsx`
- `src/pages/Admin/AdminLessonEditorPage.tsx`
- `src/api/adminApi.ts`
- `src/store/slices/adminSlice.ts`

Результат:

- контент можна створювати без ручного редагування `lessonData.ts`.

---

### 4. Lesson Editor In Admin

Пріоритет: середній.

Що зробити:

- редагування lesson files
- редагування theory blocks
- редагування videos
- редагування tasks
- JSON/rule editor для validation rules
- preview lesson before publish

Файли:

- нові admin lesson editor компоненти
- `src/types/content.ts`
- `src/api/adminApi.ts`

Результат:

- курс і урок можна повністю зібрати з frontend admin UI.

---

### 5. Groups / Classes UI

Пріоритет: середній після real teacher API.

Що зробити:

- сторінка groups list
- group details
- додавання/видалення студентів у групі
- призначення курсів групі
- фільтр teacher students by group

Файли:

- `src/pages/Teacher/*`
- `src/api/teacherApi.ts`
- `src/store/slices/teacherSlice.ts`

Результат:

- teacher dashboard перестає бути просто списком усіх студентів.

---

### 6. Submissions And Review Workflow

Пріоритет: середній/низький, після groups і стабільного student API.

Що зробити:

- student кнопка `Submit for review`
- submissions list для teacher
- submission details
- status update: submitted / in_review / changes_requested / approved
- показ submitted code snapshot

Файли:

- `src/api/studentApi.ts`
- `src/api/teacherApi.ts`
- `src/store/slices/teacherSlice.ts`
- нові сторінки teacher review

Результат:

- викладач може перевіряти роботи не тільки за auto-progress.

---

### 7. Teacher Comments

Пріоритет: після submissions.

Що зробити:

- список коментарів до submission
- додавання загального коментаря
- resolved/unresolved state
- пізніше inline comments по файлах/рядках

Результат:

- teacher feedback стає частиною навчального workflow.

---

### 8. Code Version History

Пріоритет: після submissions/comments.

Що зробити:

- список versions для lesson code
- перегляд snapshot
- порівняння версій пізніше

Результат:

- можна бачити, як змінювалась робота учня.

---

## Рекомендований Порядок Найближчих Дій

Якщо робити прагматично, порядок такий:

1. Довести student learning page до фінальної структури: course accordion, locked states, video/practice status.
2. Підготувати backend HTTP API layer без зміни UI.
3. Підключити real auth/content/student APIs.
4. Зробити мінімальну admin page для курсів і уроків.
5. Додати редагування відео в admin lesson editor.
6. Після цього переходити до groups/classes.
7. Потім submissions/review.
8. Потім teacher comments і code version history.

---

## Що Не Варто Робити Зараз

- Не будувати велику адмінку до появи стабільного backend API.
- Не ускладнювати video progress до backend/admin етапу; для MVP достатньо `videoStatus`.
- Не робити submissions до того, як буде реальна модель student/group/course assignment.
- Не повертатися до старої моделі `category -> lesson` як основної.
- Не вводити `htmlCode` / `cssCode` як backend contract; залишати `savedFiles`.
