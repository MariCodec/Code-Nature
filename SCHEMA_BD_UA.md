# SCHEMA_BD_UA

## Що Це За Документ

Цей файл описує концептуальну схему бази даних для MVP навчальної платформи.

Тут зафіксовано:

- які таблиці мають бути в БД
- які поля мають бути в цих таблицях
- як таблиці пов’язані між собою
- що входить у MVP
- що можна відкласти на пізніші етапи

Це не готова SQL-міграція, а технічна схема, на основі якої потім можна буде зробити:

- SQL schema
- Prisma schema
- backend models
- API contracts

---

## Основна Ідея MVP

На першому етапі:

- уроки вже входять у модель БД
- у БД зберігаються і контентні дані, і користувацькі дані

Тобто в базу йдуть:

- користувачі
- ролі
- зв’язки викладач-учень
- треки
- курси
- уроки
- файли уроку
- блоки теорії
- завдання уроку
- призначення курсів учням
- прогрес учнів
- код учнів

Що НЕ обов’язково входить у першу реалізацію:

- UI для створення курсів
- UI для створення уроків
- повноцінна CMS / адмінка контенту
- складна система груп

---

## Загальна Логіка Даних

Архітектурна модель платформи:

- `track -> course -> lesson -> task`

На MVP:

- `track`, `course`, `lesson`, `task` вже закладаються в модель БД
- прогрес і код учня зберігаються в БД

---

## Таблиці Для MVP

### 1. `users`

Призначення:

- зберігає всіх користувачів платформи
- визначає роль користувача

Поля:

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `created_at`
- `updated_at`

Примітки:

- `role` = `student | teacher`
- `email` має бути унікальним

---

### 2. `tracks`

Призначення:

- верхній рівень навчального напряму
- дозволяє не обмежуватися лише фронтендом у майбутньому

Приклади:

- `frontend`
- `backend`
- `data`

Поля:

- `id`
- `slug`
- `title`
- `description`
- `created_at`
- `updated_at`

Примітки:

- для MVP можна мати один трек, наприклад `frontend`

---

### 3. `courses`

Призначення:

- курс, який належить до певного треку

Приклади:

- `HTML для початківців`
- `CSS для початківців`
- `Frontend Start`

Поля:

- `id`
- `track_id`
- `slug`
- `title`
- `description`
- `level`
- `is_published`
- `created_at`
- `updated_at`

Зв’язки:

- `track_id -> tracks.id`

Примітки:

- `level` може бути, наприклад: `beginner | intermediate | advanced`
- на MVP достатньо кількох курсів у межах одного треку

---

### 4. `lessons`

Призначення:

- зберігає уроки курсу
- визначає тип уроку і тип runtime

Поля:

- `id`
- `course_id`
- `slug`
- `title`
- `description`
- `runtime_type`
- `validation_type`
- `order_index`
- `is_published`
- `created_at`
- `updated_at`

Зв’язки:

- `course_id -> courses.id`

Примітки:

- `runtime_type` для MVP може бути `html-css-preview`
- далі можуть з’явитися інші типи, наприклад `js-dom`, `code-output`, `theory-only`
- `validation_type` для MVP може бути `dom-check`

---

### 5. `lesson_files`

Призначення:

- зберігає файли, які відкриваються в редакторі уроку

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

Примітки:

- для HTML/CSS уроку тут можуть бути:
  - `index.html`
  - `style.css`
- у майбутньому ця таблиця дозволяє підтримати:
  - `script.js`
  - `main.py`
  - інші файли

---

### 6. `lesson_theory_blocks`

Призначення:

- зберігає теоретичні блоки уроку

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

- `block_type` може бути:
  - `text`
  - `list`
  - `code`
  - `note`
- `content_json` дає достатню гнучкість без зайвої кількості полів

---

### 7. `lesson_tasks`

Призначення:

- зберігає завдання уроку
- визначає порядок завдань
- зберігає правила перевірки

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

- `rules_json` підходить для поточної декларативної моделі перевірки
- це дозволяє зберігати:
  - html selectors
  - css checks
  - text contains rules
  - майбутні validation presets

---

### 8. `teacher_students`

Призначення:

- зв’язок між викладачем і учнем

Поля:

- `id`
- `teacher_id`
- `student_id`
- `created_at`

Зв’язки:

- `teacher_id -> users.id`
- `student_id -> users.id`

Примітки:

- для MVP беремо просту модель без груп
- один викладач може мати багато учнів
- один учень потенційно може бути пов’язаний із кількома викладачами, якщо це знадобиться
- якщо захочеш простішу модель, можна на MVP тимчасово обмежити одного учня одним викладачем на рівні бізнес-логіки

---

### 9. `student_course_assignments`

Призначення:

- зберігає, які курси призначені конкретному учню

Поля:

- `id`
- `student_id`
- `course_id`
- `assigned_by_teacher_id`
- `assigned_at`

Зв’язки:

- `student_id -> users.id`
- `course_id -> courses.id`
- `assigned_by_teacher_id -> users.id`

Примітки:

- це важливо, щоб різні учні могли проходити різні курси
- саме ця таблиця робить платформу гнучкою для різних програм навчання

---

### 10. `student_lesson_progress`

Призначення:

- зберігає прогрес учня по конкретному уроку

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

Примітки:

- `status` = `not_started | in_progress | completed`
- `course_id` тут можна лишити для швидких вибірок по курсу

---

### 11. `student_task_progress`

Призначення:

- зберігає прогрес учня по конкретних завданнях уроку

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

Примітки:

- `course_id` можна лишити для швидкої аналітики і зручних вибірок

---

### 12. `student_code`

Призначення:

- зберігає код учня для конкретного уроку

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

Примітки:

- замість окремих `html_code` і `css_code` краще вже зараз зберігати універсальні дані
- `saved_files_json` може містити масив або map файлів уроку

Приклад структури:

- `index.html`
- `style.css`
- в майбутньому будь-які інші файли

---

## Що Поки Не Обов’язково Додавати В Першу Реалізацію

Ці речі можна відкласти на потім:

- `groups`
- `teacher_comments`
- `submissions`
- `manual_review_status`
- адмінку для редагування контенту
- версіонування уроків

Причина:

- контент уже варто закласти в БД
- але не обов’язково одразу робити складні інструменти для керування ним

---

## Майбутнє Розширення Схеми

Коли платформа виросте, логічно буде додати:

---

## Основні Зв’язки Між Таблицями

### Базові зв’язки

- один `track` має багато `courses`
- один `course` має багато `lessons`
- один `lesson` має багато `lesson_files`
- один `lesson` має багато `lesson_theory_blocks`
- один `lesson` має багато `lesson_tasks`
- один `teacher` має багато `students` через `teacher_students`
- один `student` може мати багато призначених курсів через `student_course_assignments`
- один `student` має багато записів прогресу по уроках
- один `student` має багато записів прогресу по завданнях
- один `student` має багато збережених кодів

---

## Що Важливо Для Реалізації

### 1. Не прив’язувати схему назавжди лише до HTML/CSS

Так, зараз продукт HTML/CSS-first.

Але архітектурно треба пам’ятати:

- у майбутньому можуть бути інші мови
- можуть бути інші типи runtime
- можуть бути інші типи перевірки

Тому:

- курси і треки вже зараз треба закладати
- `student_code` зараз може бути простим
- але далі його краще зробити універсальнішим

### 2. Не переносити весь контент у БД на старті

Контент уже варто тримати в БД, якщо платформа мислиться довгостроково.

Але не потрібно одразу робити:

- складну CMS
- редактор контенту
- багаторівневу адмінку

### 3. Дані мають бути user-scoped

Усе, що стосується прогресу і коду, має бути прив’язане до:

- `student_id`
- `course_id`
- `lesson_id`

---

## Мінімальний Набір Таблиць Для Першої Реалізації

Якщо брати найпрактичніший MVP-набір, то першими потрібні:

- `users`
- `tracks`
- `courses`
- `lessons`
- `lesson_files`
- `lesson_theory_blocks`
- `lesson_tasks`
- `teacher_students`
- `student_course_assignments`
- `student_lesson_progress`
- `student_task_progress`
- `student_code`

---

## Що Робити Після Цього Документа

Після затвердження цієї схеми правильний наступний крок:

1. зробити `API_SPEC_UA.md`
2. зафіксувати DTO
3. підготувати план інтеграції фронтенду з бекендом
4. після цього переходити до реалізації auth і student persistence
