# PLATFORM_UA

Єдиний опис платформи: продукт, модель, контракти, план робіт.

Цей файл замінює п'ять попередніх документів (`API_SPEC_UA`, `BACKEND_FRONTEND_CONTRACT_UA`,
`CURRENT_IMPLEMENTATION_UA`, `FRONTEND_INTEGRATION_PLAN_UA`, `SCHEMA_BD_UA`).
Вони видалені з робочого дерева свідомо, щоб не було двох джерел істини.
За потреби читаються з історії:

```
git show 3558a24:API_SPEC_UA.md
```

Правила користування:

- Розділи 1–8 стабільні. Змінюються рідко й свідомо.
- Розділ 9 (план робіт) волатильний, оновлюється по ходу.
- Якщо реальність розійшлася з документом — правиться документ, а не додається новий файл.

---

## 1. Що це за продукт

Платформа для **самостійного вивчення програмування** з практикою прямо в браузері.

Учень реєструється сам, без запрошення й без викладача, і проходить курс покроково:
відео → теорія → практика в редакторі → автоматична перевірка → наступний урок.

Старт — HTML/CSS. Далі JavaScript. Згодом React/Vue, потенційно інші мови.
Архітектура зобов'язана витримувати нові мови й фреймворки **без переписування** сторінки уроку,
редактора чи моделі даних.

Викладач, групи й адмінка — надбудова, яка додається пізніше і не змінює досвід учня.

### Правило незмінності

> Прибери з системи всі викладацькі сутності — платформа має працювати повністю.

Якщо щось ламається, значить викладач вплетений туди, де йому не місце.
Це перевірка, яку варто застосовувати до кожного нового рішення.

### Де насправді складність

За спаданням ризику, а не за обсягом коду:

1. **Пайплайн створення уроків** — найдовша й найдорожча частина продукту.
2. **Runtime виконання й перевірки коду** — визначає, чи можливі JS/React взагалі.
3. **Модель довіри до перевірки** — перевірка на клієнті означає, що прогрес підробний.
4. CRUD, auth, ролі, таблиці — найпростіше.

---

## 2. Ролі й режими

### Ролі

- `student` — єдина роль у MVP.
- `teacher` — зарезервована в enum, без функціоналу.
- `admin` — зарезервована в enum, без функціоналу.

Роль **завжди приходить із сервера**. Клієнт її не обирає й не надсилає при вході.

### Два режими — один шлях

Шлях навчання один і той самий. Різниця лише в трьох речах:

| | Самостійно (MVP) | З викладачем (потім) |
|---|---|---|
| Звідки взявся курс | учень обрав сам | призначив викладач або група |
| Хто бачить прогрес | лише учень | + викладач |
| Перевірка | лише автоматична | авто + ручний фідбек зверху |

У даних це **одне поле** `enrollments.source`, а не дві підсистеми.
Сторінки учня не знають і не мають знати, яке там значення.

---

## 3. Модель контенту

```
track → course → course_module → lesson
```

### track

Напрям навчання: `frontend`, згодом `python`, `backend`.
Нова мова = новий track, без змін у структурі.

### course

**Одиниця доступу.** Саме тут вирішується платно/безкоштовно і що після чого.

- `access_level: free | paid` — рішення про монетизацію відкладене, але колонка є з першого дня.
- `prerequisite_course_ids` — CSS після HTML, React після JS.
- `progression: sequential | free` — чи можна стрибати між уроками.

### course_module

Розділ курсу. Навіть маленький курс має щонайменше один модуль.

### lesson

Атомарна одиниця. Три ортогональні характеристики:

- `lesson_kind: lesson | tech_check`
- `runtime_type: html-css-preview | js-dom | code-output | spa-preview | theory-only | video`
- `validation_type: auto | manual | none`

Урок містить: `files[]`, `theory_blocks[]`, `videos[]`, `tasks[]`.
Будь-який із цих масивів може бути порожнім — саме комбінація визначає тип уроку,
а не окремий прапорець.

### Техчек як ворота

Техчек — не окрема сутність, а `lesson_kind = tech_check`.
**Модуль вважається пройденим тоді, коли зданий його техчек.** Це дає самостійному
учневі природну структуру без викладача.

### Підказки

`lesson_tasks.hints_json` — 2–3 підказки, що розкриваються поступово.

У самостійному режимі спитати нікого. Підказки — це заміна викладача,
а не додаткова зручність. Вони входять у MVP.

---

## 4. Шлях учня

```
1. Лендинг → реєстрація                  роль student з сервера, id = UUID
2. Каталог курсів                        ← ⊕ нова мова = новий track
                                         ← ⊕ платно = перевірка access_level саме тут
3. Старт курсу → enrollment(source=self) ← ⊕ викладач = той самий рядок, source=teacher
4. Курс: модулі → уроки, прогрес і замки
5. Урок:
     intro-відео (якщо є)
     теорія
     практика: редактор(files[]) + preview + завдання
     Run → пісочниця виконує → валідатор повертає результат по кожній задачі
     застряг → підказки
     усі задачі ✓ → урок completed → наступний відкривається
                                         ← ⊕ JS/React = інший runtime, кроки ті самі
6. Кінець модуля → техчек (ворота)
7. Кінець курсу → наступний за prerequisites
                                         ← ⊕ викладач: ручний фідбек поверх автоперевірки
8. Профіль: прогрес, «продовжити навчання»
```

**Жоден крок не змінюється** від додавання JS/React, появи викладача чи введення оплати.
Змінюється лише вміст кроку 5 і одна перевірка перед кроком 3.

Якщо якась нова фіча вимагає переписати цю послідовність — це сигнал,
що модель десь неправильна.

---

## 5. Runtime-контракт

Найважливіший технічний розділ. Саме він вирішує, чи виросте платформа в JS і React.

### Драбина runtime-ів

| Рівень | `runtime_type` | Механіка | Статус |
|---|---|---|---|
| HTML/CSS | `html-css-preview` | пісочниця + перевірка DOM і computed styles | MVP |
| Vanilla JS, DOM | `js-dom` | те саме + виконання скриптів, асинхронні перевірки | одразу після |
| Алгоритми | `code-output` | потік console, звірка виводу | одразу після |
| React/Vue | `spa-preview` | бандлер у браузері (Sandpack) | згодом |
| Інші мови | `server-run` | Pyodide або серверний sandbox | не планується поки |

### Принцип валідації

> **Перевіряй результат, а не код.**

Не «чи використав учень `querySelector`», а «чи з'явився в DOM потрібний елемент».
Завдяки цьому **один DOM-валідатор обслуговує HTML, CSS, JS, React і Vue** — усі вони
врешті рендерять DOM. Окремий тип перевірки потрібен лише алгоритмам.

### Пісочниця

Виконання коду учня — **лише** в ізольованому iframe:

```html
<iframe sandbox="allow-scripts" srcdoc="...">
```

`allow-same-origin` **не вказується ніколи**. Наслідок: код учня отримує opaque origin
і не має доступу ні до `parent`, ні до `localStorage` з токеном сесії.

Це не опція. Без цього `<script>` в уроці HTML читає сесію користувача,
а після появи teacher-review стає збереженим XSS проти акаунта викладача.

Оскільки `contentDocument` з батьківської сторінки стає недоступним, зв'язок —
**тільки повідомленнями**. Це і є те, що змушує написати правильно.

### Протокол

```ts
type RunnerFile = { name: string; language: string; content: string };

// батько → пісочниця
type RunnerRequest =
  | { type: "run"; files: RunnerFile[] }
  | { type: "check"; checkId: string; tasks: { id: string; rules: TaskRules }[] };

// пісочниця → батько
type RunnerEvent =
  | { type: "ready" }
  | { type: "console"; level: "log" | "warn" | "error"; args: string[] }
  | { type: "runtime-error"; message: string; stack?: string }
  | { type: "result"; checkId: string; results: TaskResult[] };

type TaskResult = { taskId: string; passed: boolean; message?: string };
```

Всередині пісочниці працює невеликий агент: приймає `run`, збирає документ, виконує;
приймає `check`, ганяє перевірки по **живому** DOM, відповідає `result`.

Чому саме така форма витримує весь роадмап:

- асинхронність — можна дочекатися `ready`, таймерів, подій; без цього JS не перевірити;
- `console` — runtime `code-output` виходить майже безкоштовно;
- валідатор живе поруч із живим DOM, тобто перевіряє результат;
- Sandpack для React/Vue підключається як **ще одна реалізація того самого протоколу**,
  а не як окрема підсистема.

### Правила перевірки

`TaskRules` — тегований union. Кожен runtime розуміє свої види:

```ts
type TaskRules =
  | { kind: "dom";     selectors?: SelectorRule[];
                       cssChecks?: CssRule[];
                       textContains?: TextRule[] }
  | { kind: "js-test"; tests: { name: string; code: string }[] }
  | { kind: "output";  stdin?: string; expected: string }
  | { kind: "manual";  rubric: string[] };
```

Без тега кожен новий runtime означав би міграцію БД і переписування редактора завдань.
З тегом — новий варіант union і новий обробник в агенті.

### Реєстр runtime-ів

```ts
type LessonRuntime = {
  id: LessonRuntimeType;
  hasEditor: boolean;
  buildDocument(files: RunnerFile[]): string;  // що завантажується в пісочницю
  Chrome: FC<PreviewProps>;                    // вікно браузера / консоль / нічого
};

const runtimes: Record<LessonRuntimeType, LessonRuntime> = { ... };
```

Сторінка уроку стає тонкою: завантажити урок → взяти runtime за `runtime_type` → відрендерити.
Додати новий тип уроку = один файл, нуль правок у сторінці.

### Редактор

Monaco. Вибір правильний і не переглядається: мовні сервіси для HTML/CSS/JS/TS,
підтримка JSX/TSX, знайоме середовище.

Обов'язкова умова — **окрема модель на кожен файл**
(`monaco.editor.createModel(content, lang, uri)`, `editor.setModel()` на перемиканні вкладки).
Інакше: спільна історія undo на всі файли, втрата курсора, і головне — TS/JSX language service
не побачить граф файлів, тобто React-уроки лишаться без автодоповнення й перевірки типів.

---

## 6. Модель даних MVP

**13 таблиць.** Решта — свідомо відкладені, див. розділ 8.

Спільні правила:

- `id` — UUID. **Ніколи не похідний від email, slug чи індексу масиву.**
- Усі дати — timestamp, в API віддаються як ISO string.
- Контент належить БД з першої реалізації.
- Публічний контент фільтрується по `is_published` **з першого дня**.
- Видалення контенту — soft delete.

### Користувачі

```
users
  id · name · email (unique) · password_hash
  role (student | teacher | admin)
  created_at · updated_at
```

### Контент

```
tracks
  id · slug · title · description · order_index · created_at · updated_at

courses
  id · track_id → tracks
  slug · title · description · level
  access_level (free | paid)
  progression (sequential | free)
  prerequisite_course_ids (json)
  is_published · deleted_at
  created_by_user_id · updated_by_user_id → users
  created_at · updated_at

course_modules
  id · course_id → courses
  slug · title · description · order_index
  is_published · deleted_at · created_at · updated_at

lessons
  id · course_id → courses · module_id → course_modules
  slug · title · description
  lesson_kind (lesson | tech_check)
  runtime_type · validation_type
  order_index · is_published · deleted_at
  created_by_user_id · updated_by_user_id → users
  created_at · updated_at

lesson_files
  id · lesson_id → lessons
  name · language · initial_content · order_index · is_editable
  created_at · updated_at

lesson_theory_blocks
  id · lesson_id → lessons
  block_type (text | list | code | note)
  content_json · order_index
  created_at · updated_at

lesson_videos
  id · lesson_id → lessons
  provider (upload | youtube | vimeo | mux | external)
  source_url · asset_id · title · description
  duration_seconds · thumbnail_url · transcript · captions_url
  order_index · is_required
  created_at · updated_at

lesson_tasks
  id · lesson_id → lessons
  title · description · order_index
  rules_json      (TaskRules, тегований union)
  hints_json      (масив підказок)
  created_at · updated_at
```

Відео **не** дублюється як `block_type = video` у теорії. Одне джерело — `lesson_videos`.

### Учень

```
enrollments
  id · student_id → users · course_id → courses
  source (self | teacher | group)
  assigned_by_user_id → users   (null для self)
  status (active | completed | dropped)
  started_at · completed_at · created_at
  unique (student_id, course_id)

student_lesson_progress
  id · student_id → users · course_id → courses · lesson_id → lessons
  status (not_started | in_progress | completed)
  video_watched_at
  attempts_count
  started_at · completed_at · updated_at
  unique (student_id, lesson_id)

student_task_progress
  id · student_id → users · course_id → courses
  lesson_id → lessons · task_id → lesson_tasks
  is_completed · hints_used
  completed_at · updated_at
  unique (student_id, task_id)

student_code
  id · student_id → users · course_id → courses · lesson_id → lessons
  saved_files_json
  updated_at
  unique (student_id, lesson_id)
```

`course_id` **обов'язковий** у прогресі й коді. Ніяких fallback-значень типу `unknown_course` —
без нього неможливо згрупувати прогрес по курсах.

`attempts_count`, `hints_used`, `video_watched_at` коштують три колонки зараз і дають
майбутньому викладачу сигнал «де учень застряг». Заднім числом ці дані не відновити.

`saved_files_json`:

```json
[{ "name": "index.html", "language": "html", "content": "<h1>Hello</h1>" }]
```

---

## 7. API MVP

### Формат

```json
{ "data": {} }
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

Пагінація там, де списки можуть рости: `{ "data": [], "meta": { page, pageSize, total } }`.

### Автентифікація

JWT: короткоживучий access + refresh. Пароль хешується **лише на сервері** (argon2 або bcrypt).

```
POST /auth/register     { name, email, password }  → user + tokens
POST /auth/login        { email, password }        → user + tokens
POST /auth/refresh      { refreshToken }           → tokens
POST /auth/logout
GET  /auth/me                                      → user
```

`role` у `register` **не приймається**. Усі, хто реєструється самостійно — `student`.

### Контент (читання, лише `is_published`)

```
GET /tracks
GET /tracks/:trackSlug/courses
GET /courses/:courseId
GET /courses/:courseId/modules
GET /modules/:moduleId/lessons        техчек приходить у цьому ж списку
GET /lessons/:lessonId                повний урок: files, theoryBlocks, videos, tasks
```

`GET /lessons/:lessonId` повертає урок цілком. Фронтенд не має здогадуватися про тип уроку —
його визначають `lesson_kind`, `runtime_type`, `validation_type` і наявність масивів.

### Учень

Простір `/me/` — це поточний автентифікований користувач. Викладацькі endpoint-и
з'являться пізніше в `/teacher/` і не конфліктують.

```
GET  /me/enrollments
POST /me/enrollments              { courseId }   самостійний старт курсу
GET  /me/progress
PUT  /me/progress/:lessonId       { courseId, status, videoWatched?, taskProgress[] }
GET  /me/code
GET  /me/code/:lessonId
PUT  /me/code/:lessonId           { courseId, savedFiles[] }
```

Прогрес відео — поле в `PUT /me/progress/:lessonId`, не окремий endpoint.

### Виправлені суперечності старих документів

- Teacher API прибрано з MVP цілком — разом із розбіжністю між `TeacherStudentListItemDTO`
  і прикладами відповідей у `API_SPEC`.
- Прогрес відео отримав місце в контракті (раніше був на фронті, але не в API).
- `POST /auth/refresh` додано (раніше refresh-токен видавався, але не використовувався).
- `block_type = video` прибрано — відео лише в `lesson_videos`.
- `validation_type` спрощено до `auto | manual | none`; конкретний спосіб перевірки
  визначає `TaskRules.kind`, а не окремий enum уроку.

---

## 8. Відкладено, шви, відкриті питання

### Головне правило

> **Відкладаємо адитивне. Будуємо структурне.**

Таблиця чи endpoint додаються потім без дотику до наявного коду — відкладаємо сміливо.
Абстракція виконання коду ретрофітиться лише переписуванням сторінки уроку, редактора,
валідатора **і** міграцією всього контенту — робимо одразу.

Асиметрія ризику: додати таблицю потім дешево, змінити таблицю з даними користувачів — дорого.
Тому відкладати сутності майже безкоштовно, а **вгадувати їхню форму наперед — ні**.

### Що відкладено і до якого шва приєднається

| Відкладено | Шов, який лишається зараз |
|---|---|
| `groups`, `group_students` | `enrollments.source = group` |
| Призначення курсу викладачем | `enrollments.source = teacher` + `assigned_by_user_id` |
| `submissions`, `submission_reviews` | `student_code.saved_files_json` — snapshot береться звідти |
| `teacher_comments` | стабільні UUID уроків, задач і файлів |
| `code_versions` | той самий формат `saved_files_json` |
| `admin_audit_log` | `created_by_user_id` / `updated_by_user_id` у контенті |
| Адмінка | контент уже в БД; адмінка стане CRUD над наявними таблицями |
| Білінг | `courses.access_level` |

**Ручна перевірка: чесне застереження.** Для HTML/CSS автоперевірка закриває майже все.
Для React — ні: декомпозиція компонентів, ідіоматичність і структура DOM-чеками не ловляться.
Тобто рецензія стане **потрібнішою** саме там, куди ми плануємо рости.
Викидати з MVP правильно, вважати непотрібною — ні.

### Адмінка не є залежністю

Оскільки контент лежить у БД, а JSON-сід має ту саму форму, що й API,
уроки можна писати файлами скільки завгодно довго. Адмінка — зручність, а не умова запуску.
Робити її тоді, коли писати JSON стане реально незручно.

### Відкриті питання

| Питання | Стан | Коли треба вирішити |
|---|---|---|
| **Мобільний досвід** | Пропозиція: теорія й відео читаються з телефона, практика — десктоп, з явним станом «продовжити на комп'ютері». Monaco на телефоні непридатний, а трафік самостійних учнів здебільшого мобільний | до Фази 1 — впливає на модель уроку |
| **Стек беку** | Не вирішено. Не блокує Фази 0–6 | до Фази 7 |
| **Монетизація** | Не вирішено. Рекомендація: запускатися повністю безкоштовно | будь-коли, колонка вже є |
| **Обсяг контенту на запуск** | Не вирішено | до Фази 5 |
| **Локалізація** | Тексти зашиті українською в компонентах. Друга мова = наскрізна правка | не в MVP, але знати про це |
| **Наявні дані в localStorage** | Ключі `student_code_v1:*`, `student_progress_v1:*` у старому форматі. Рекомендація: скинути, користувачів немає | до Фази 6 |

---

## 9. План робіт

Волатильний розділ. Без оцінок у днях — свідомо: порядок і відносний розмір надійні,
точні числа були б вигадкою.

### Фаза 0 — Фундамент

- Цей документ.
- **Написати 3–4 справжні уроки** в цільовому форматі, руками.
  Це не наповнення контентом, а **перевірка моделі уроку**: чи вистачає `theory_blocks`
  для нормального пояснення, чи описуються реальні завдання наявними правилами,
  чи достатньо одного відео. Дешевше знайти дірку тут, ніж на сороковому уроці.
- Рішення по мобільному режиму.

### Фаза 1 — Контракти в коді

Типи й порожні реалізації, без логіки: `TaskRules` як union, `RunnerRequest`/`RunnerEvent`,
інтерфейс `LessonRuntime`, оновлені DTO контенту й прогресу.

### Фаза 2 — Контент як дані (один урок)

Формат JSON, ідентичний відповіді API. Переписати **один** урок і провести його наскрізь.
`lessonData.ts` і `courseMapping.ts` ще живі.

### Фаза 3 — Runner

Пісочниця з `sandbox="allow-scripts"`, агент, протокол повідомлень.
`html-css-preview` як перша реалізація. Валідатор — **чиста функція** `(files, rules) => results`,
без диспатчу в Redux. Тести на валідатор і протокол.

### Фаза 4 — Другий runtime: JS

`js-dom` або `code-output` + один справжній JS-урок.

**Абстракцію доводить друга реалізація, а не перша.** Поки є лише HTML/CSS, ми не знаємо,
чи реєстр правильний — ми просто загорнули наявний код в інтерфейс.
Якщо тут щось не влізе — краще дізнатись зараз, ніж після React і сорока уроків.

### Фаза 5 — Масова конвертація контенту

Тільки після того, як форму `TaskRules` доведено Фазою 4. Смерть `lessonData.ts`
і `courseMapping.ts`.

### Фаза 6 — Редактор і стан

Моделі Monaco на файл, вкладки з `files[]`. Прибрати дуальність `html`/`css`,
прогрес у формі DTO з таймстемпами, прибрати `unknown_course`, каркас HTTP-транспорту
з конфігом оточення.

*Точка контролю: фронт архітектурно готовий, усе ще на моках.*

### Фаза 7 — Бек: walking skeleton

`users` + реальний auth (UUID, роль із сервера, JWT + refresh, хешування),
контент read-only з БД, засіяної тими самими JSON, `enrollments`, прогрес, код.
**Задеплоїти одразу**, ще до наповнення.

Один урок з реальної БД через реальний auth — перш ніж наповнювати.

### Фаза 8 — З'єднання

Заміна начинки `api/*` на HTTP. UI не змінюється.

### Фаза 9+ — Далі

Контент у повному обсязі · викладач і групи · адмінка · рецензування.
