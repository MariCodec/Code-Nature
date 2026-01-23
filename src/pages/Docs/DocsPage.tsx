import { NavLink, useNavigate, useParams } from "react-router-dom";
import styles from "./DocsPage.module.scss";
import { lessons } from "../../data/lessonData";

type TheoryBlock =
  | { type: "text"; content: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: "html" | "css"; content: string };

type LessonWithTheory = {
  id: string;
  title: string;
  description: string;
  theory?: {
    title?: string;
    blocks?: TheoryBlock[];
  };
};

type LessonsMap = Record<string, LessonWithTheory[]>;

export default function DocsPage() {
  const navigate = useNavigate();
  const { category, id } = useParams<{ category?: string; id?: string }>();

  const lessonsMap = lessons as unknown as LessonsMap;
  const categories = Object.keys(lessonsMap);

  const safeCategory =
    category && lessonsMap[category] ? category : categories[0];
  const list = lessonsMap[safeCategory] ?? [];
  const safeLesson = id ? list.find((l) => l.id === id) : list[0];

  // якщо /docs відкрили без параметрів — перекидаємо на перший урок
  if (!category || !id) {
    if (safeCategory && list[0]) {
      queueMicrotask(() =>
        navigate(`/docs/${safeCategory}/${list[0].id}`, { replace: true }),
      );
    }
  }

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
            {categories.map((c) => (
              <button
                key={c}
                className={`${styles.categoryBtn} ${c === safeCategory ? styles.active : ""}`}
                onClick={() => {
                  const first = lessonsMap[c]?.[0];
                  if (first) navigate(`/docs/${c}/${first.id}`);
                }}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          <div className={styles.sectionTitle}>Уроки</div>
          <nav className={styles.lessonNav}>
            {list.map((l) => (
              <NavLink
                key={l.id}
                to={`/docs/${safeCategory}/${l.id}`}
                className={({ isActive }) =>
                  `${styles.lessonLink} ${isActive ? styles.lessonLinkActive : ""}`
                }
              >
                <div className={styles.lessonLinkTitle}>{l.title}</div>
                <div className={styles.lessonLinkDesc}>{l.description}</div>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          {!safeLesson ? (
            <div className={styles.empty}>
              <h2>Немає уроків у цій категорії</h2>
              <p>Додай хоча б один урок у lessonData.ts</p>
            </div>
          ) : (
            <>
              <header className={styles.contentHeader}>
                <h1 className={styles.h1}>
                  {safeLesson.theory?.title ?? safeLesson.title}
                </h1>
                <p className={styles.lead}>{safeLesson.description}</p>
              </header>

              <section className={styles.card}>
                {safeLesson.theory?.blocks?.length ? (
                  <div className={styles.blocks}>
                    {safeLesson.theory.blocks.map((b, idx) => {
                      if (b.type === "text")
                        return (
                          <p key={idx} className={styles.p}>
                            {b.content}
                          </p>
                        );
                      if (b.type === "list")
                        return (
                          <ul key={idx} className={styles.ul}>
                            {b.items.map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        );
                      if (b.type === "code")
                        return (
                          <div key={idx} className={styles.codeBlock}>
                            <div className={styles.codeLabel}>
                              {b.lang.toUpperCase()}
                            </div>
                            <pre className={styles.pre}>
                              <code>{b.content}</code>
                            </pre>
                          </div>
                        );
                      return null;
                    })}
                  </div>
                ) : (
                  <div className={styles.placeholder}>
                    <div className={styles.placeholderTitle}>
                      Теорія ще не додана
                    </div>
                    <div className={styles.placeholderText}>
                      Додай поле <code>theory</code> до уроку в{" "}
                      <code>lessonData.ts</code>. Я можу дати шаблон для кожного
                      уроку.
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
