import { useEffect, useMemo } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styles from "./DocsPage.module.scss";
import type { AppDispatch, RootState } from "../../store";
import type { LessonTheoryBlockDTO } from "../../types/content";
import type { LessonCategory } from "../../types/lessonTypes";
import {
  fetchCourseLessons,
  fetchCoursesByTrack,
  fetchLessonById,
  selectContentError,
  selectCourseLessons,
  selectCourseLessonsStatus,
  selectCoursesByTrack,
  selectLessonById,
  selectLessonStatus,
} from "../../store/slices/contentSlice";
import { findCourseByLegacyCategory } from "../../utils/courseMapping";

const DOC_CATEGORIES: LessonCategory[] = ["html", "css"];

const getCategoryLabel = (category: LessonCategory) => category.toUpperCase();

const renderTheoryBlock = (
  block: LessonTheoryBlockDTO,
  index: number,
  classNames: typeof styles,
) => {
  switch (block.blockType) {
    case "text":
      return (
        <p key={block.id ?? index} className={classNames.p}>
          {block.content.text}
        </p>
      );

    case "list":
      return (
        <ul key={block.id ?? index} className={classNames.ul}>
          {block.content.items.map((item, itemIndex) => (
            <li key={`${block.id}_${itemIndex}`}>{item}</li>
          ))}
        </ul>
      );

    case "code":
      return (
        <div key={block.id ?? index} className={classNames.codeBlock}>
          <div className={classNames.codeLabel}>{block.content.lang.toUpperCase()}</div>
          <pre className={classNames.pre}>
            <code>{block.content.code}</code>
          </pre>
        </div>
      );

    case "note":
      return (
        <p key={block.id ?? index} className={classNames.p}>
          {block.content.text}
        </p>
      );
  }
};

const isLessonCategory = (value: string | undefined): value is LessonCategory =>
  value === "html" || value === "css";

export default function DocsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { category, id } = useParams<{ category?: string; id?: string }>();
  const safeCategory: LessonCategory = isLessonCategory(category) ? category : "html";

  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = useMemo(
    () => findCourseByLegacyCategory(frontendCourses, safeCategory),
    [frontendCourses, safeCategory],
  );
  const lessons = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessons(state, selectedCourse.id) : [],
  );
  const lessonsStatus = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessonsStatus(state, selectedCourse.id) : "idle",
  );
  const lessonDto = useSelector((state: RootState) =>
    id ? selectLessonById(state, id) : null,
  );
  const lessonStatus = useSelector((state: RootState) =>
    id ? selectLessonStatus(state, id) : "idle",
  );
  const contentError = useSelector(selectContentError);

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourse) return;
    void dispatch(fetchCourseLessons(selectedCourse.id));
  }, [dispatch, selectedCourse]);

  useEffect(() => {
    if (!selectedCourse || lessons.length === 0) return;

    const targetLessonId = id ?? lessons[0]?.id;
    if (!targetLessonId) return;

    void dispatch(fetchLessonById(targetLessonId));
  }, [dispatch, id, lessons, selectedCourse]);

  useEffect(() => {
    if (!selectedCourse || lessons.length === 0) return;

    if (!isLessonCategory(category) || !id) {
      navigate(`/docs/${safeCategory}/${lessons[0].id}`, { replace: true });
      return;
    }

    const lessonExists = lessons.some((lesson) => lesson.id === id);
    if (!lessonExists) {
      navigate(`/docs/${safeCategory}/${lessons[0].id}`, { replace: true });
    }
  }, [category, id, lessons, navigate, safeCategory, selectedCourse]);

  if (contentError) {
    return <h2>{contentError}</h2>;
  }

  if (!selectedCourse) {
    return <h2>Категорія не знайдена</h2>;
  }

  if (lessonsStatus === "loading" && lessons.length === 0) {
    return <h2>Завантаження документації...</h2>;
  }

  const activeLesson = lessons.find((lesson) => lesson.id === id) ?? lessons[0] ?? null;
  const isCurrentLessonLoading =
    !!activeLesson &&
    (!lessonDto || lessonDto.id !== activeLesson.id || lessonStatus === "loading");

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>Документація</div>
            <div className={styles.sidebarSub}>Теорія до уроків</div>
          </div>

          <div className={styles.sectionTitle}>Категорії</div>
          <div className={styles.categories}>
            {DOC_CATEGORIES.map((item) => (
              <button
                key={item}
                className={`${styles.categoryBtn} ${
                  item === safeCategory ? styles.active : ""
                }`}
                onClick={() => navigate(`/docs/${item}`)}
              >
                {getCategoryLabel(item)}
              </button>
            ))}
          </div>

          <div className={styles.sectionTitle}>Уроки</div>
          <nav className={styles.lessonNav}>
            {lessons.map((lesson) => (
              <NavLink
                key={lesson.id}
                to={`/docs/${safeCategory}/${lesson.id}`}
                className={({ isActive }) =>
                  `${styles.lessonLink} ${isActive ? styles.lessonLinkActive : ""}`
                }
              >
                <div className={styles.lessonLinkTitle}>{lesson.title}</div>
                <div className={styles.lessonLinkDesc}>{lesson.description}</div>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          {!activeLesson ? (
            <div className={styles.empty}>
              <h2>Немає уроків у цій категорії</h2>
              <p>Курс ще не містить доступних уроків.</p>
            </div>
          ) : isCurrentLessonLoading ? (
            <div className={styles.empty}>
              <h2>Завантаження уроку...</h2>
            </div>
          ) : !lessonDto ? (
            <div className={styles.empty}>
              <h2>Урок не знайдено</h2>
            </div>
          ) : (
            <>
              <header className={styles.contentHeader}>
                <h1 className={styles.h1}>{lessonDto.title}</h1>
                <p className={styles.lead}>{lessonDto.description}</p>
              </header>

              <section className={styles.card}>
                {lessonDto.theoryBlocks.length ? (
                  <div className={styles.blocks}>
                    {lessonDto.theoryBlocks.map((block, index) =>
                      renderTheoryBlock(block, index, styles),
                    )}
                  </div>
                ) : (
                  <div className={styles.placeholder}>
                    <div className={styles.placeholderTitle}>Теорія ще не додана</div>
                    <div className={styles.placeholderText}>
                      Для цього уроку поки немає теоретичного блоку.
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
