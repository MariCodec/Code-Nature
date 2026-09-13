/**
 * Рядки інтерфейсу українською.
 *
 * Поки без бібліотеки — простий обʼєкт, нуль залежностей. Правило одне:
 * **нові рядки інтерфейсу пишемо сюди, а не в компоненти.** Коли дійде до другої
 * мови, цей файл стане локальним бандлом `uk`, а заміна на бібліотеку буде механічною.
 *
 * Сюди не потрапляє контент уроків — він живе в даних і локалізується через
 * `courses.locale`, див. PLATFORM_UA, розділ 8.
 */

export const uk = {
  theme: {
    toLight: "Світла тема",
    toDark: "Темна тема",
  },

  techCheck: {
    badge: "Контрольна перевірка",
    intro:
      "Спершу кілька питань на розуміння. Помилка нічого не псує — покажу чому і спробуєш ще раз.",
    questionCounter: (current: number, total: number) =>
      `Питання ${current} з ${total}`,
    modeSingle: "Обери одну відповідь",
    modeMultiple: "Обери всі правильні",
    check: "Перевірити",
    retry: "Спробувати ще",
    correct: "Правильно",
    nextQuestion: "Наступне питання",
    toPractice: "До практики",
    backToLesson: "Повернутись до уроку",
    feedback: {
      empty: "Обери варіант відповіді.",
      extraSingle: "Це не та відповідь.",
      extraMultiple: "Один із обраних варіантів тут зайвий.",
      missing: "Правильно, але не все — є ще один варіант.",
    },
  },

  taskCheck: {
    /** Текст до ключів `RuleFailure` з `domain/taskValidation`. */
    selectorMissing: (selector: string) => `Не знайшла ${selector} на сторінці.`,
    selectorTooFew: (selector: string, expected: number, actual: number) =>
      `${selector}: потрібно щонайменше ${expected}, а зараз ${actual}.`,
    textMismatch: (selector: string, expected: string) =>
      `${selector} є, але в ньому немає тексту «${expected}».`,
    textTooShort: (selector: string, expected: number) =>
      `${selector} є, але текст закороткий — треба хоча б ${expected} символів.`,
    cssMismatch: (selector: string, property: string, expected: string, actual: string) =>
      actual
        ? `${selector}: ${property} зараз ${actual}, а має бути ${expected}.`
        : `${selector}: ${property} ще не задано, а має бути ${expected}.`,
    /** Три помилки автора уроку, не учня — формулюємо так, щоб учень не шукав їх у себе. */
    selectorInvalid: (selector: string) =>
      `Перевірку не вдалося виконати: у завданні неправильний селектор ${selector}.`,
    ruleEmpty: "Перевірку не вдалося виконати: у завданні порожнє правило.",
    rulesEmpty: "Перевірку не вдалося виконати: до завдання не написані правила.",
    rulesUnsupported: (kind: string) =>
      `Перевірку не вдалося виконати: правило «${kind}» тут не перевіряється.`,
    notPassed: "Ще не зараховано.",
    allPassed: "Усі завдання зараховані.",
  },

  moduleSummary: {
    eyebrow: "Модуль пройдено",
    withTechCheck:
      "Ти не просто пройшов уроки, а склав перевірку — тобто зібрав рішення самостійно.",
    withoutTechCheck: "Усі уроки модуля пройдені.",
    lessonsDone: "Уроків пройдено",
    techCheckLabel: "Перевірка модуля",
    techCheckPassed: "складена",
    techCheckNone: "не потрібна",
    next: (moduleTitle: string) => `Далі: ${moduleTitle}`,
    toCourses: "До списку курсів",
    stay: "Лишитись тут",
  },

  lessonNav: {
    previous: "Попередній урок",
    nextLesson: "Наступний урок",
    finishCurrentFirst: "Заверши поточний урок, щоб рухатись далі",
    goToTechCheck: "Пройти перевірку модуля",
    allLessonsDone: "Усі уроки модуля пройдені",
    techCheckLocked: "Перевірка модуля",
    lessonsLeft: (count: number) =>
      `Ще ${count} ${count === 1 ? "урок" : count < 5 ? "уроки" : "уроків"} до перевірки`,
    finishTechCheck: "Завершити перевірку",
    finishTechCheckHint: "Виконай усі завдання перевірки",
    nextModule: "Наступний модуль",
    courseDone: "Курс завершено",
    pickNextCourse: "Обрати наступний курс",
  },
} as const;
