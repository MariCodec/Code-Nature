# FRONTEND_INTEGRATION_PLAN_UA

## Що Це За Документ

Цей файл описує, як перевести поточний фронтенд із локального HTML/CSS-first прототипу до архітектури, яка працює з:

- backend API
- ролями `student` і `teacher`
- уроками, що приходять з БД
- збереженням прогресу і коду для конкретного користувача

Це не план бекенду.
Це план змін саме у поточному React/Redux фронтенді.

---

## Поточний Стан Фронтенду

Зараз у проєкті вже є:

- сторінки уроків
- редактор коду на Monaco
- client-side validation
- перевірка завдань через iframe
- Redux state для:
  - коду
  - прогресу
  - auth
- шар `storage/`
- моковий `authApi`

Основні поточні обмеження:

- уроки беруться зі статичного `src/data/lessonData.ts`
- auth ще не інтегрований у справжній app flow
- прогрес і код ще не прив’язані до реального backend API
- teacher flow ще відсутній

---

## Головний Принцип Інтеграції

Не робити один великий рефакторинг за раз.

Правильний шлях:

1. зберегти робочий student flow
2. поступово заміняти локальні джерела даних на API
3. не ламати client-side lesson validation
4. не чіпати teacher flow, доки не стабілізований student flow

---

## Порядок Робіт

1. Підготувати frontend-моделі під API
2. Реалізувати auth foundation
3. Додати content API integration
4. Перевести student code/progress на API
5. Стабілізувати student routes
6. Додати teacher flow

---

## Вже Реалізовано

Нижче зафіксовано те, що вже реалізовано у фронтенді на поточний момент.

### 1. Додано нову content-модель

Що зроблено:

- додані типи для:
  - `Track`
  - `Course`
  - `Lesson`
  - `LessonFile`
  - `LessonTheoryBlock`
  - `LessonTask`
  - `StudentCodeDTO`
  - `StudentProgressDTO`

Для чого:

- щоб фронтенд мислив у тій самій моделі, що і майбутній бекенд
- щоб відійти від занадто вузької локальної моделі `html/css only`
- щоб підготувати основу для `track -> course -> lesson`

Що це дало:

- новий data contract уже існує на рівні типів
- далі можна переводити сторінки і state без повторного перегляду базових моделей

### 2. Додано `contentApi` як mock API-шар

Що зроблено:

- створено `src/api/contentApi.ts`
- поточний статичний `lessonData.ts` тепер обгорнутий у API-подібний шар

Для чого:

- щоб фронтенд уже працював ніби через бекенд
- щоб потім заміна mock API на реальний бекенд не вимагала великого переписування сторінок

Що це дало:

- сторінки більше не повинні напряму залежати від `lessonData.ts`
- з’явився правильний проміжний рівень між UI і даними

### 3. Додано `contentSlice`

Що зроблено:

- створено Redux slice для контенту
- додані thunk-и для:
  - завантаження треків
  - завантаження курсів
  - завантаження уроків
  - завантаження одного уроку

Для чого:

- щоб контентний state жив окремо від UI-компонентів
- щоб сторінки могли працювати через Redux, а не через прямий імпорт статичних даних

Що це дало:

- фронтенд уже має окремий content layer
- легше підключити реальний API пізніше

### 4. Переведено `LessonsList` і `LessonPage` на новий content source

Що зроблено:

- `LessonsList.tsx` більше не читає уроки напряму з `lessonData.ts`
- `LessonPage.tsx` також бере урок через `contentSlice`

Для чого:

- щоб student pages почали жити від нового content flow
- щоб поступово прибрати прямі залежності від статичних локальних даних

Що це дало:

- список уроків і сторінка уроку вже ближчі до майбутньої API-архітектури

### 5. Додано `contentAdapters.ts`

Що зроблено:

- створено adapter між новим `LessonDTO` і старим `LessonContent`

Для чого:

- щоб не переписувати весь UI за один крок
- щоб старі компоненти могли ще працювати, поки нова модель уже впроваджується

Що це дало:

- перехід на нову архітектуру відбувається поступово
- `CodeEditor`, `TaskList` та інші legacy-компоненти не довелося ламати одразу

Примітка:

- це тимчасовий шар сумісності
- його треба буде видалити після завершення міграції редактора і lesson-логіки

### 6. Реалізовано базовий auth foundation

Що зроблено:

- увімкнено `/login` і `/register`
- додано роль користувача в mock auth
- додано role-based guard
- розділено маршрути на:
  - public
  - student
  - teacher
- додано завантаження session при старті

Для чого:

- щоб фронтенд уже був готовий до role-based архітектури
- щоб student і teacher flows надалі не змішувалися

Що це дало:

- з’явилась базова модель доступу по ролях
- teacher area можна розвивати окремо від student area

### 7. Виправлено маршрути student area і legacy redirects

Що зроблено:

- картки уроків тепер ведуть у `/student/...`
- lesson navigation теж працює через `/student/...`
- старі шляхи типу `/html/:id` редіректять у новий формат
- публічна home-сторінка знову доступна окремо

Для чого:

- щоб перехід на нову структуру маршрутів не ламав поточну навігацію

Що це дало:

- student area стала стабільною після зміни роутингу
- старі посилання не перестали працювати повністю

### 8. `userCode` підготовлено до `savedFiles`

Що зроблено:

- у `userCodeSlice` додано `savedFiles`
- `storage/types.ts` оновлено під новий формат
- додані helper-и для перетворення між:
  - `html/css`
  - `savedFiles`

Для чого:

- щоб state уже був сумісний з майбутнім API
- щоб потім не робити ще один великий рефакторинг сховища коду

Що це дало:

- локальний student code state уже ближчий до backend-моделі

### 9. `CodeEditor` переведено ближче до lesson files і `savedFiles`

Що зроблено:

- редактор почав брати fallback значення з `lessonDto.files`
- вкладки будуються з lesson files, а не з двох жорстко зашитих кнопок
- значення редактора тепер беруться з `savedFiles` як із основного джерела

Для чого:

- щоб редактор перестав бути жорстко прив’язаним до legacy-структури
- щоб підготувати його до майбутнього multi-file / API-based flow

Що це дало:

- редактор уже значно ближчий до нової lesson-моделі
- при цьому поточний HTML/CSS student flow не зламано

### 10. Додано `studentApi` і user-scoped persistence

Що зроблено:

- створено `src/api/studentApi.ts`
- збереження коду і прогресу винесено в окремий API-подібний шар
- дані тепер зберігаються окремо для кожного `userId`
- `syncThunks` переведено зі старого загального `storage` на `studentApi`

Для чого:

- щоб persistence був ближчим до майбутнього бекенду
- щоб код і прогрес перестали бути "глобальними для всіх"
- щоб підготувати правильний контракт для майбутніх HTTP-запитів

Що це дало:

- student persistence уже має правильний напрямок
- замінити mock/local persistence на реальний бекенд буде значно простіше

### 11. `LessonNavigation` переведено на новий content flow

Що зроблено:

- `LessonNavigation.tsx` більше не читає уроки напряму з `lessonData.ts`
- попередній і наступний урок тепер рахуються через `contentSlice`

Для чого:

- щоб навігація між уроками теж жила в новій архітектурі
- щоб прибирати legacy-залежності не тільки зі сторінок, а й з допоміжних компонентів

Що це дало:

- ще один важливий шмат student flow відв’язаний від старого джерела даних
- навігація тепер узгоджена з моделлю `track -> course -> lesson`

### 12. `LessonPage` частково відв’язано від legacy-адаптера

Що зроблено:

- `LessonHeader` тепер отримує `title` і `description` напряму з `lessonDto`
- `TaskList` отримує задачі напряму з `lessonDto.tasks`
- legacy adapter залишився тільки там, де він ще реально потрібен, насамперед у `CodeEditor`

Для чого:

- щоб поступово прибирати `LessonContent` як проміжну модель
- щоб не тримати всю сторінку уроку на compatibility layer довше, ніж потрібно

Що це дало:

- сторінка уроку вже частково працює від нового DTO-напрямку
- наступні кроки по видаленню `contentAdapters.ts` стали простішими

### Підсумок Поточного Стану

Що вже підготовлено:

- content layer
- route foundation
- auth foundation
- перехідний compatibility layer
- `savedFiles`-ready editor state
- user-scoped student persistence
- навігація уроків через `contentSlice`
- часткова відмова від legacy-формату на `LessonPage`

Що це означає:

- фронтенд уже рухається по правильній архітектурі
- але ще не підключений до реального бекенду
- головні наступні фронтенд-кроки: далі зменшувати legacy в `CodeEditor` і доводити `student persistence` до backend-ready DTO flow
- наступні кроки мають бути спрямовані на:
  - student persistence через API-shaped layer
  - поступове прибирання legacy-шарів

---

## Етап 1. Підготувати Frontend-Моделі Під API

### Ціль

Зробити так, щоб фронтенд уже мислив сутностями:

- `track`
- `course`
- `lesson`
- `savedFiles`
- `lesson progress`
- `task progress`

### Що треба змінити

#### 1. Оновити або додати типи

Поточні файли:

- `src/types/lessonTypes.ts`
- `src/types/editor.ts`

Що зробити:

- додати типи для:
  - `Track`
  - `Course`
  - `Lesson`
  - `LessonFile`
  - `LessonTask`
  - `LessonTheoryBlock`
  - `StudentCodeDTO`
  - `StudentProgressDTO`
- поступово відходити від жорсткої прив’язки до:
  - `initialHtml`
  - `initialCss`

### Що важливо

На цьому етапі ще не потрібно одразу ламати весь редактор.
Потрібно спочатку створити правильні типи і узгодити модель із API.

### Результат

Фронтенд має типи, які відповідають новому `API_SPEC_UA.md`.

---

## Етап 2. Реалізувати Auth Foundation

### Ціль

Зробити справжній базовий auth flow у фронтенді.

### Які файли зараз важливі

- `src/api/authApi.ts`
- `src/store/slices/authSlice.ts`
- `src/store/thunks/authThunks.ts`
- `src/features/auth/LoginPage.tsx`
- `src/features/auth/RegisterPage.tsx`
- `src/features/auth/AuthGuard.tsx`
- `src/App.tsx`
- `src/AppInitializer.tsx`

### Що треба зробити

#### 1. Увімкнути auth routes

У `src/App.tsx`:

- повернути routes для:
  - `/login`
  - `/register`
- розділити маршрути:
  - public
  - student
  - teacher

#### 2. Завантаження session при старті

У `src/AppInitializer.tsx`:

- спочатку вантажити поточного користувача
- тільки після цього вантажити user data

#### 3. Role-aware auth state

У `authSlice`:

- user already exists
- переконатися, що `role` є обов’язковим полем у користувача

#### 4. Role-based guards

Потрібно додати окремі guard-и:

- `StudentGuard`
- `TeacherGuard`

Або один універсальний guard із required role.

### Результат

- користувач логіниться
- фронтенд знає його роль
- роль визначає доступні маршрути

---

## Етап 3. Підключити Content API

### Ціль

Прибрати залежність від статичного `lessonData.ts` як головного джерела уроків.

### Які файли зараз важливі

- `src/data/lessonData.ts`
- `src/pages/LessonsList/LessonsList.tsx`
- `src/pages/lessonPage/LessonPage.tsx`
- `src/pages/Docs/DocsPage.tsx`

### Що треба зробити

#### 1. Додати content API client

Нові або оновлені модулі:

- `src/api/contentApi.ts`

Методи:

- `getTracks()`
- `getCoursesByTrack(trackSlug)`
- `getCourse(courseId)`
- `getCourseLessons(courseId)`
- `getLesson(lessonId)`

#### 2. Додати Redux slice або async state для контенту

Рекомендація:

- створити `contentSlice`

У ньому тримати:

- tracks
- courses
- lessons
- currentLesson
- loading / error states

#### 3. Поступово прибрати прямі залежності від `lessonData.ts`

Що замінити:

- `LessonsList` має брати список уроків із API/Redux
- `LessonPage` має брати конкретний урок із API/Redux
- `DocsPage` має брати теорію з lesson data, яка прийшла з API

### Що можна зробити тимчасово

Для перехідного етапу можна:

- лишити `lessonData.ts` як fallback/mock source
- але нову логіку вже писати через `contentApi`

### Результат

Контент більше не жорстко зашитий у фронті.

---

## Етап 4. Перевести Student Progress і Code На API

### Ціль

Зробити так, щоб код і прогрес учня зберігалися через backend API, а не через локальний тимчасовий adapter.

### Які файли зараз важливі

- `src/storage/index.ts`
- `src/storage/localStorageAdapter.ts`
- `src/storage/apiAdapter.ts`
- `src/storage/types.ts`
- `src/store/thunks/syncThunks.ts`
- `src/store/slices/userCodeSlice.ts`
- `src/store/slices/progressSlice.ts`
- `src/components/CodeEditor/CodeEditor.tsx`

### Що треба зробити

#### 1. Розширити storage layer

Зараз `storage` занадто загальний і орієнтований на стару форму даних.

Потрібно перейти до API-орієнтованої моделі:

- load current student code
- save lesson code
- load current student progress
- save lesson progress

Можна:

- або переробити `storage`
- або винести окремі `studentApi` методи і не перевантажувати `storage`

Рекомендація:

- для auth і content не використовувати `storage`
- `storage` або залишити як legacy abstraction, або прибрати пізніше

#### 2. Оновити shape для student code

Зараз:

- `userCode[lessonId] = { html, css }`

Має стати ближче до:

- `userCode[lessonId] = { savedFiles: [...] }`

Але через те, що поточний редактор HTML/CSS-first, можна зробити перехід у два кроки:

1. внутрішньо все ще мати зручний adapter для `html/css`
2. на рівні API зберігати `savedFiles`

#### 3. Оновити shape для progress

Зараз:

- `completedLessons`
- `taskStatus`

Треба зробити так, щоб це відповідало бекендовим lesson/task progress DTO.

#### 4. Оновити `CodeEditor`

У `src/components/CodeEditor/CodeEditor.tsx`:

- брати initial files із lesson API data
- при `Run Code` або save відправляти `savedFiles`
- progress update робити через API-backed thunk

### Що важливо не зламати

- iframe checking
- parse5 validation
- run code flow
- task completion logic

### Результат

Student progress і student code вже реально працюють через API.

---

## Етап 5. Оновити Student Routes і Navigation

### Ціль

Побудувати зрозумілий student area поверх нового content API.

### Що треба зробити

Рекомендована структура:

- `/student`
- `/student/tracks/:trackSlug/courses`
- `/student/courses/:courseId`
- `/student/lessons/:lessonId`
- `/student/progress`

### Які файли треба переглянути

- `src/App.tsx`
- `src/pages/LessonsList/LessonsList.tsx`
- `src/pages/lessonPage/LessonPage.tsx`
- `src/components/lessonNavigation/LessonNavigation.tsx`

### Що треба змінити

- навігація має працювати від course/lesson model
- “next lesson” має шукатися в межах курсу
- список уроків має відображати lesson status через API-backed progress

### Результат

Student area стає узгодженою з backend content model.

---

## Етап 6. Адаптувати Docs Під Backend Content

### Ціль

Зробити `DocsPage` частиною тієї ж lesson/content моделі, а не окремим статичним розділом.

### Які файли зараз важливі

- `src/pages/Docs/DocsPage.tsx`

### Що треба зробити

- брати теорію з lesson content API
- відображати docs як похідне представлення lesson theory
- не дублювати контент у двох різних джерелах

### Результат

Docs більше не існує окремо від lesson content model.

---

## Етап 7. Реалізувати Teacher Flow На Фронті

### Ціль

Додати окрему викладацьку частину після стабілізації student flow.

### Нові сторінки

- `src/pages/TeacherDashboard/TeacherDashboard.tsx`
- `src/pages/TeacherStudents/TeacherStudents.tsx`
- `src/pages/TeacherStudentDetails/TeacherStudentDetails.tsx`

### Нові API-клієнти

- `src/api/teacherApi.ts`

Методи:

- `getTeacherStudents()`
- `getTeacherStudentDetails(studentId)`
- `getTeacherStudentProgress(studentId)`
- `getTeacherStudentCode(studentId, lessonId)`

### Що показувати

У списку учнів:

- ім’я
- email
- скільки уроків завершено
- скільки курсів призначено
- остання активність

На сторінці учня:

- assigned courses
- lesson progress
- task progress
- saved code по вибраному уроку

### Результат

Teacher flow існує окремо від student flow і не змішується з ним.

---

## Етап 8. Поступова Чистка Legacy-Логіки

### Ціль

Після стабілізації нової архітектури прибрати тимчасові рішення.

### Що саме зачепить

- `src/data/lessonData.ts`
- legacy local storage logic
- тимчасові mock API
- старі route shape, якщо лишаться

### Що робити

- прибирати тільки після того, як новий потік уже стабільний
- не видаляти fallback занадто рано

### Результат

Проєкт більше не має дубльованих джерел істини.

---

## Що Робити Першим Практично

Якщо переходити від документації до реалізації, правильний перший набір фронтенд-задач такий:

1. додати нові frontend types під API
2. ввімкнути auth routes і role guards
3. зробити `contentApi`
4. зробити `contentSlice`
5. перевести `LessonPage` і `LessonsList` на новий content source
6. після цього переводити `CodeEditor` на `savedFiles` + API persistence

---

## Що Не Треба Робити Зараз

- не починати з teacher dashboard
- не робити CMS для створення уроків
- не переписувати весь редактор під multi-language одразу
- не викидати стару логіку, поки нова не стабільна

---

## Рекомендований Порядок Реалізації У Коді

1. `types`
2. `auth`
3. `content api`
4. `content state`
5. `student content pages`
6. `student persistence`
7. `docs`
8. `teacher pages`
9. `cleanup`
