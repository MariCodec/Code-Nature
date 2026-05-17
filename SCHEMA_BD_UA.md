# SCHEMA_BD_UA

## Призначення

Цей документ описує актуальну концептуальну схему БД для навчальної платформи.
Він має бути спільною опорою для бекенду, фронтенду та майбутньої адмінки.

Поточний фронтенд уже працює в напрямку цієї моделі через mock API:

- `track -> course -> course_module -> lesson`
- уроки мають `files`, `theoryBlocks`, `tasks`
- техчеки є уроками з `lesson_kind = tech_check`
- код учня зберігається як `savedFiles`, а не як окремі `html/css` поля
- прогрес зберігається окремо по уроках і завданнях
- є ролі `student` і `teacher`
- є базовий teacher flow для перегляду учнів, прогресу та code snapshots

Схема нижче фіксує не тільки вже реалізовану MVP-модель, а й найближчі потрібні модулі:

- CRUD курсів
- CRUD уроків
- відеоуроки
- teacher comments
- code version history
- groups/classes
- submissions/review workflow
- admin panel API

---

## Основні Принципи

- Усі `id` можна реалізувати як UUID або string ids.
- Усі дати зберігаються як timestamp і віддаються в API як ISO string.
- Контент уроків належить БД з першої бекенд-реалізації, навіть якщо перший імпорт буде з поточного `lessonData.ts`.
- Поточний MVP є `HTML/CSS-first`, але не `HTML/CSS-only`.
- Client-side validation лишається на фронтенді, але правила перевірки зберігаються в БД як JSON.
- Відео є частиною lesson content model, а не окремою паралельною сутністю поза уроками.
- Техчек не є окремою продуктовою моделлю: це `lesson` з `lesson_kind = tech_check`.
- Submissions потрібні для review workflow і не мають заміняти автопрогрес. Це окремий шар перевірки.

---

## Enums

Рекомендовані значення для enum-like полів:

- `users.role`: `student | teacher | admin`
- `lessons.lesson_kind`: `lesson | tech_check`
- `lessons.runtime_type`: `html-css-preview | js-dom | code-output | theory-only | video`
- `lessons.validation_type`: `dom-check | output-check | manual-check | none`
- `lesson_theory_blocks.block_type`: `text | list | code | note | video`
- `lesson_videos.provider`: `upload | youtube | vimeo | mux | external`
- `student_lesson_progress.status`: `not_started | in_progress | completed`
- `submissions.status`: `draft | submitted | in_review | changes_requested | approved | rejected`
- `code_versions.source`: `autosave | manual_save | submission | teacher_review`

---

## 1. `users`

Зберігає користувачів платформи.

Поля:

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `created_at`
- `updated_at`

Обмеження:

- `email` унікальний
- `role` на старті використовує `student | teacher`, але схема резервує `admin`

---

## 2. `tracks`

Верхній рівень навчального напряму.

Поля:

- `id`
- `slug`
- `title`
- `description`
- `created_at`
- `updated_at`

Зв’язки:

- один `track` має багато `courses`

Приклад:

- `frontend`

---

## 3. `courses`

Курс у межах треку.

Поля:

- `id`
- `track_id`
- `slug`
- `title`
- `description`
- `level`
- `is_published`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Зв’язки:

- `track_id -> tracks.id`
- `created_by_user_id -> users.id`
- `updated_by_user_id -> users.id`

Примітки:

- це базова таблиця для майбутнього CRUD курсів
- публічність курсу контролюється через `is_published`
- призначення учням не зберігається тут, для цього є `student_course_assignments`

---

## 4. `course_modules`

Логічні розділи курсу.

Поля:

- `id`
- `course_id`
- `slug`
- `title`
- `description`
- `order_index`
- `is_published`
- `created_at`
- `updated_at`

Зв’язки:

- `course_id -> courses.id`

Правила:

- кожен курс має один або більше модулів
- кожен урок належить конкретному модулю
- навіть маленький курс має module, наприклад `Основи`

---

## 5. `lessons`

Основна таблиця уроків, техчеків і відеоуроків.

Поля:

- `id`
- `course_id`
- `module_id`
- `slug`
- `title`
- `description`
- `lesson_kind`
- `runtime_type`
- `validation_type`
- `order_index`
- `is_published`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Зв’язки:

- `course_id -> courses.id`
- `module_id -> course_modules.id`
- `created_by_user_id -> users.id`
- `updated_by_user_id -> users.id`

Правила:

- `module_id` обов’язковий
- module має належати тому самому course, що й lesson
- звичайний урок: `lesson_kind = lesson`
- техчек: `lesson_kind = tech_check`
- відеоурок може бути:
  - `runtime_type = video`, якщо це переважно відео без редактора
  - або `runtime_type = html-css-preview` з додатковим відеоблоком, якщо відео супроводжує практику

---

## 6. `lesson_files`

Файли, які відкриваються в редакторі уроку.

Поля:

- `id`
- `lesson_id`
- `name`
- `language`
- `initial_content`
- `order_index`
- `is_editable`
- `created_at`
- `updated_at`

Зв’язки:

- `lesson_id -> lessons.id`

Приклади:

- `index.html`
- `style.css`
- у майбутньому `script.js`, `main.py`, інші файли

---

## 7. `lesson_theory_blocks`

Текстова/структурована теорія уроку.

Поля:

- `id`
- `lesson_id`
- `block_type`
- `content_json`
- `order_index`
- `created_at`
- `updated_at`

Зв’язки:

- `lesson_id -> lessons.id`

Примітки:

- `content_json` залежить від `block_type`
- для відео можна використовувати `block_type = video`, але для нормалізованих відеометаданих краще також створювати запис у `lesson_videos`

---

## 8. `lesson_videos`

Відео, пов’язані з уроком.

Поля:

- `id`
- `lesson_id`
- `provider`
- `source_url`
- `asset_id`
- `title`
- `description`
- `duration_seconds`
- `thumbnail_url`
- `transcript`
- `captions_url`
- `order_index`
- `is_required`
- `created_at`
- `updated_at`

Зв’язки:

- `lesson_id -> lessons.id`

Примітки:

- `source_url` підходить для YouTube/Vimeo/external
- `asset_id` підходить для Mux/S3/internal upload
- фронтенд має отримувати відео разом із `LessonDTO`
- для MVP можна мати одне відео на урок, але схема дозволяє кілька

---

## 9. `lesson_tasks`

Завдання уроку.

Поля:

- `id`
- `lesson_id`
- `title`
- `description`
- `order_index`
- `rules_json`
- `created_at`
- `updated_at`

Зв’язки:

- `lesson_id -> lessons.id`

Примітки:

- поточний фронтенд підтримує декларативні правила:
  - `htmlSelectors`
  - `cssChecks`
  - `requireTextContains`
- для `manual-check` rules можуть бути порожніми або містити rubric JSON

---

## 10. `groups`

Групи або класи учнів.

Поля:

- `id`
- `name`
- `slug`
- `description`
- `teacher_id`
- `created_at`
- `updated_at`

Зв’язки:

- `teacher_id -> users.id`

Примітки:

- це потрібний шар для `groups/classes`
- прямий зв’язок teacher-student можна залишити для простих кейсів, але групи мають стати основною моделлю організації класів

---

## 11. `group_students`

Учасники груп.

Поля:

- `id`
- `group_id`
- `student_id`
- `joined_at`

Зв’язки:

- `group_id -> groups.id`
- `student_id -> users.id`

Обмеження:

- унікальна пара `group_id + student_id`

---

## 12. `teacher_students`

Прямий зв’язок викладача й учня.

Поля:

- `id`
- `teacher_id`
- `student_id`
- `created_at`

Зв’язки:

- `teacher_id -> users.id`
- `student_id -> users.id`

Примітки:

- потрібний для простого teacher flow і сумісності з поточним фронтендом
- коли groups/classes стануть основною моделлю, цей зв’язок можна використовувати як derived/shortcut або залишити для індивідуального навчання

---

## 13. `student_course_assignments`

Призначення курсів учням.

Поля:

- `id`
- `student_id`
- `course_id`
- `group_id`
- `assigned_by_user_id`
- `assigned_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `group_id -> groups.id`
- `assigned_by_user_id -> users.id`

Примітки:

- `group_id` може бути `null`, якщо курс призначено індивідуально

---

## 14. `student_lesson_progress`

Прогрес учня по уроку.

Поля:

- `id`
- `student_id`
- `course_id`
- `lesson_id`
- `status`
- `started_at`
- `completed_at`
- `updated_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `lesson_id -> lessons.id`

Обмеження:

- унікальна пара `student_id + lesson_id`

---

## 15. `student_task_progress`

Прогрес учня по завданнях уроку.

Поля:

- `id`
- `student_id`
- `course_id`
- `lesson_id`
- `task_id`
- `is_completed`
- `completed_at`
- `updated_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `lesson_id -> lessons.id`
- `task_id -> lesson_tasks.id`

Обмеження:

- унікальна пара `student_id + task_id`

---

## 16. `student_code`

Останній актуальний стан коду учня по уроку.

Поля:

- `id`
- `student_id`
- `course_id`
- `lesson_id`
- `saved_files_json`
- `updated_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `lesson_id -> lessons.id`

Обмеження:

- унікальна пара `student_id + lesson_id`

Приклад `saved_files_json`:

```json
[
  {
    "name": "index.html",
    "language": "html",
    "content": "<h1>Hello</h1>"
  },
  {
    "name": "style.css",
    "language": "css",
    "content": "h1 { color: green; }"
  }
]
```

---

## 17. `code_versions`

Історія версій коду учня.

Поля:

- `id`
- `student_id`
- `course_id`
- `lesson_id`
- `submission_id`
- `saved_files_json`
- `source`
- `created_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `lesson_id -> lessons.id`
- `submission_id -> submissions.id`

Примітки:

- `student_code` зберігає останній стан
- `code_versions` зберігає історію
- `submission_id` може бути `null`, якщо версія створена autosave/manual save

---

## 18. `submissions`

Відправлення роботи учнем на перевірку.

Поля:

- `id`
- `student_id`
- `course_id`
- `lesson_id`
- `status`
- `submitted_files_json`
- `submitted_at`
- `reviewed_by_user_id`
- `reviewed_at`
- `created_at`
- `updated_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `lesson_id -> lessons.id`
- `reviewed_by_user_id -> users.id`

Примітки:

- submission фіксує конкретний snapshot роботи
- для auto-checked lessons submission може створюватися опційно
- для `manual-check` submission є основним workflow

---

## 19. `teacher_comments`

Коментарі викладача до submission, уроку або конкретного файлу.

Поля:

- `id`
- `teacher_id`
- `student_id`
- `lesson_id`
- `submission_id`
- `file_name`
- `line_number`
- `comment_text`
- `is_resolved`
- `created_at`
- `updated_at`

Зв’язки:

- `teacher_id -> users.id`
- `student_id -> users.id`
- `lesson_id -> lessons.id`
- `submission_id -> submissions.id`

Примітки:

- `submission_id` може бути `null`, якщо коментар прив’язаний до поточного коду учня
- `file_name` і `line_number` можуть бути `null`, якщо це загальний коментар

---

## 20. `submission_reviews`

Підсумковий review по submission.

Поля:

- `id`
- `submission_id`
- `reviewer_id`
- `status`
- `summary`
- `created_at`
- `updated_at`

Зв’язки:

- `submission_id -> submissions.id`
- `reviewer_id -> users.id`

Примітки:

- статус review має синхронізуватися зі статусом `submissions.status`
- детальні inline-коментарі зберігаються в `teacher_comments`

---

## 21. `admin_audit_log`

Журнал дій для адмінки та CRUD контенту.

Поля:

- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `before_json`
- `after_json`
- `created_at`

Зв’язки:

- `actor_user_id -> users.id`

Примітки:

- корисно для змін курсів, уроків, модулів, відео, завдань і груп
- можна реалізувати не в першій міграції, але контракт варто тримати в плані

---

## Основні Зв’язки

- `track` має багато `courses`
- `course` має багато `course_modules`
- `course_module` має багато `lessons`
- `lesson` має багато `lesson_files`
- `lesson` має багато `lesson_theory_blocks`
- `lesson` має багато `lesson_videos`
- `lesson` має багато `lesson_tasks`
- `teacher` має багато `groups`
- `group` має багато `students` через `group_students`
- `teacher` може мати прямі `students` через `teacher_students`
- `student` має багато `student_course_assignments`
- `student` має багато `student_lesson_progress`
- `student` має багато `student_task_progress`
- `student` має один актуальний `student_code` на lesson
- `student` має багато `code_versions`
- `student` має багато `submissions`
- `submission` має багато `teacher_comments`
- `submission` має один або багато `submission_reviews`

---

## Мінімальний Порядок Міграцій

### База MVP

1. `users`
2. `tracks`
3. `courses`
4. `course_modules`
5. `lessons`
6. `lesson_files`
7. `lesson_theory_blocks`
8. `lesson_tasks`
9. `teacher_students`
10. `student_course_assignments`
11. `student_lesson_progress`
12. `student_task_progress`
13. `student_code`

### Найближче Розширення

1. `lesson_videos`
2. `groups`
3. `group_students`
4. `code_versions`
5. `submissions`
6. `teacher_comments`
7. `submission_reviews`
8. `admin_audit_log`

---

## Важливі Узгодження Для Бекенду І Фронтенду

### Контент уроку

`GET /lessons/:lessonId` має повертати повний lesson object:

- lesson metadata
- `files`
- `theoryBlocks`
- `videos`
- `tasks`

Фронтенд не має окремо здогадуватися, чи урок відео, практика або техчек. Це визначається через:

- `lessonKind`
- `runtimeType`
- `validationType`
- наявність `files`, `videos`, `tasks`

### Код учня

Фронтенд і бекенд мають використовувати `savedFiles`:

- не вводити окремі API-поля `htmlCode` і `cssCode`
- не прив’язувати БД до двох файлів
- для поточного редактора можна показувати тільки `index.html` і `style.css`, але контракт має лишатися multi-file

### Відеоуроки

Відео має бути доступне фронтенду через lesson DTO.

Мінімальний `LessonVideoDTO`:

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

### Review workflow

Submissions не повинні ламати поточний auto-check flow:

- auto-check оновлює `student_lesson_progress` і `student_task_progress`
- submission створює review snapshot
- teacher comments і review status працюють поверх snapshot

### Admin API

CRUD для курсів і уроків має змінювати ті самі таблиці, які читає student content API.
Не потрібно створювати окрему CMS-модель, яка потім синхронізується з навчальною моделлю.
