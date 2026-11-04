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
    /**
     * Структура документа. Порожній `actual` означає «не задано взагалі» —
     * це різні поради, тож і речення різні, як уже зроблено для `cssMismatch`.
     */
    doctypeMissing: "На початку документа немає <!doctype html>.",
    langMismatch: (expected: string, actual: string) =>
      actual
        ? `У <html> вказана мова «${actual}», а має бути «${expected}».`
        : `У <html> не вказана мова: потрібен lang="${expected}".`,
    titleMismatch: (expected: string, actual: string) =>
      actual
        ? `У <title> зараз «${actual}», а має бути «${expected}».`
        : `У <head> немає <title> з текстом «${expected}».`,
    charsetMismatch: (expected: string, actual: string) =>
      actual
        ? `Кодування вказане як «${actual}», а має бути «${expected}».`
        : `У <head> немає <meta charset="${expected}">.`,
    /** Дія перед перевіркою не виконалась: клікати не було куди. */
    actTargetMissing: (selector: string) =>
      `Перевірка мала звернутись до ${selector}, але такого елемента на сторінці немає.`,
    actTargetNotTypeable: (selector: string) =>
      `Перевірка мала ввести текст у ${selector}, але це не поле вводу.`,
    actTargetNotClickable: (selector: string) =>
      `Перевірка мала натиснути ${selector}, але такий елемент не натискається.`,
    /** Три помилки автора уроку, не учня — формулюємо так, щоб учень не шукав їх у себе. */
    selectorInvalid: (selector: string) =>
      `Перевірку не вдалося виконати: у завданні неправильний селектор ${selector}.`,
    ruleEmpty: "Перевірку не вдалося виконати: у завданні порожнє правило.",
    rulesEmpty: "Перевірку не вдалося виконати: до завдання не написані правила.",
    rulesUnsupported: (kind: string) =>
      `Перевірку не вдалося виконати: правило «${kind}» тут не перевіряється.`,
    notPassed: "Ще не зараховано.",
    allPassed: "Усі завдання зараховані.",
    /**
     * Пісочниця не відповіла. Найчастіша причина — нескінченний цикл у коді учня,
     * і сказати це прямо корисніше, ніж «щось пішло не так».
     */
    timedOut:
      "Перевірка не завершилась: сторінка не відповідає. Найчастіше так буває через нескінченний цикл у коді. Пісочницю перезапущено — виправ і спробуй ще раз.",
  },

  editor: {
    /** Заблокована вкладка. `isEditable: false` — педагогічний прийом: розмітку
     * не чіпай, задача розвʼязується в іншому файлі. Тому вкладку видно, її можна
     * відкрити й прочитати — не можна лише редагувати. */
    lockedTab: (fileName: string) => `${fileName} — лише для читання`,
    lockedNotice: (fileName: string) =>
      `Файл ${fileName} заблокований у цьому уроці: його можна читати, але не змінювати. Задача розвʼязується в інших файлах.`,
    noFiles: "У цьому уроці немає файлів для редагування.",
    loadingCode: "Завантажую твій код…",
    /** Підпис вікна пісочниці: для екранного доступу воно має бути назване. */
    previewTitle: "Сторінка, яку ти зібрав",
    /** Службове вікно перевірки: сховане, але в дереві доступності воно є. */
    checkFrameTitle: "Службове вікно перевірки",
    showDetails: "Деталі уроку",
    hideDetails: "Приховати деталі уроку",
    /**
     * Підписи кнопок англійські — це стара копія, перенесена сюди дослівно.
     * Фаза 3 про транспорт, а не про формулювання; переклад — разом із рештою
     * поверхні у Фазі 6b, щоб не судити копію окремо від екрана.
     */
    run: "Run Code",
    clear: "Clear Code",
    format: "Format Code",
    fixHtmlFirst: "Виправте помилки в HTML, щоб запустити код",
    /** Перевірка стала round-trip: очікування має бути видиме, а не здогадне. */
    running: "Перевіряю…",
    runtimeUnsupported: (runtimeType: string) =>
      `Цей урок має тип «${runtimeType}», який застосунок ще не вміє показувати.`,

    /**
     * Консоль пісочниці. Не devtools: ввести команду не можна, обʼєкт не
     * розгортається — через `postMessage` проходить лише те, що клонується,
     * тож агент віддає рядки. Для «виведи суму» цього досить, і саме так
     * це має бути названо учневі — «вивід», а не «консоль розробника».
     */
    console: {
      label: "Вивід",
      /** Скільки рядків надрукувала програма — видно й коли смужка згорнута. */
      count: (lines: number) => `${lines}`,
      errorMark: "є помилка",
      hidden: (count: number) =>
        `…ще ${count} — показую лише перші рядки, щоб сторінка лишилась живою`,
      toggle: "Показати або сховати вивід програми",
    },
  },

  hints: {
    show: "Підказка",
    next: "Ще підказка",
    counter: (current: number, total: number) => `${current} з ${total}`,
    hide: "Сховати підказки",
  },

  videoLesson: {
    watchToFinish: "Додивись відео, щоб завершити урок",
    finish: "Урок пройдено",
    finished: "Урок пройдено ✓",
    /** Відео ще не змонтоване: додивлятись нема чого, лишається явна дія учня. */
    noVideoYet: "Відео для цього уроку ще не додане — познач урок пройденим, коли прочитаєш теорію.",
  },

  theory: {
    title: "Теорія",
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
    /** Модуль без техчека: закриває його останній урок, а не неіснуюча перевірка. */
    finishModule: "Завершити модуль",
    finishModuleHint: "Заверши цей урок",
    nextModule: "Наступний модуль",
    courseDone: "Курс завершено",
    pickNextCourse: "Обрати наступний курс",
  },

  notFound: {
    title: "Такої сторінки немає",
    hint: "Можливо, посилання застаріло або в адресі одрук.",
    back: "На головну",
  },
} as const;
