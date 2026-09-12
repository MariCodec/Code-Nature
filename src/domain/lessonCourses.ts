/**
 * Курс уроку для запису прогресу.
 *
 * Поки прогрес у стані тримає лише булеві прапорці без `courseId`, курс доводиться
 * відновлювати щоразу при збереженні — з кількох джерел різної свіжості. Правильне
 * місце для нього — сам прогрес (Фаза 6); доти живе тут.
 *
 * **Порядок джерел — це рішення, а не деталь реалізації.** Збережене стоїть найнижче,
 * бо може містити маркер `unknown_course` від міграції записів старого формату
 * (розділ 6 PLATFORM_UA). Поки контент вище за нього, маркер перезаписується справжнім
 * курсом. Помінявши джерела місцями, маркер почав би вигравати над правдою — тихо,
 * без падінь, із зеленими тестами й прогресом, приписаним неіснуючому курсу.
 */

/** Урок так, як його знає контент. */
export type LessonCourseRef = { id: string; courseId: string };

/** Рядок збереженого прогресу — будь-який, вони всі несуть цю пару. */
export type SavedCourseRow = { lessonId: string; courseId: string };

export type LessonCourseSources = {
  /** Найнижча довіра: могло бути записане до того, як курс став відомий. */
  saved: SavedCourseRow[];
  /** Списки уроків завантажених модулів. */
  lessonsByModule: Record<string, LessonCourseRef[]>;
  /** Найвища довіра: повні DTO уроків, завантажені щойно. */
  lessonById: Record<string, LessonCourseRef>;
};

export const buildLessonCourseMap = ({
  saved,
  lessonsByModule,
  lessonById,
}: LessonCourseSources): Record<string, string> => {
  const fromSaved = saved.reduce<Record<string, string>>((acc, row) => {
    acc[row.lessonId] = row.courseId;
    return acc;
  }, {});

  const fromModuleLessonLists = Object.values(lessonsByModule).reduce<
    Record<string, string>
  >((acc, lessons) => {
    lessons.forEach((lesson) => {
      acc[lesson.id] = lesson.courseId;
    });
    return acc;
  }, {});

  const fromLessonDetails = Object.values(lessonById).reduce<Record<string, string>>(
    (acc, lesson) => {
      acc[lesson.id] = lesson.courseId;
      return acc;
    },
    {},
  );

  return {
    ...fromSaved,
    ...fromModuleLessonLists,
    ...fromLessonDetails,
  };
};
