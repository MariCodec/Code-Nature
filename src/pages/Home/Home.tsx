import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import Footer from "../../components/layout/Footer";
import { selectAuthRole, selectIsAuthenticated } from "../../store/slices/authSlice";
import styles from "./Home.module.scss";

const Home = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);

  const primaryPath =
    role === "teacher"
      ? "/teacher"
      : isAuthenticated
        ? "/student/learning"
        : "/register";
  const primaryLabel =
    role === "teacher"
      ? "Відкрити кабінет"
      : isAuthenticated
        ? "Продовжити навчання"
        : "Почати навчання";
  const secondaryPath =
    role === "teacher"
      ? "/teacher/students"
      : isAuthenticated
        ? "/student/progress"
        : "/login";
  const secondaryLabel =
    role === "teacher"
      ? "Переглянути учнів"
      : isAuthenticated
        ? "Мій прогрес"
        : "Увійти";

  return (
    <>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Code Nature</p>
            <h1>Платформа для практичного навчання frontend</h1>
            <p className={styles.lead}>
              Учні проходять готову програму з відео, теорією, редактором коду і
              перевіркою завдань. Викладачі бачать прогрес, код і можуть вести
              навчання груп.
            </p>

            <div className={styles.actions}>
              <Link className={styles.primaryAction} to={primaryPath}>
                {primaryLabel}
              </Link>
              <Link className={styles.secondaryAction} to={secondaryPath}>
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <aside className={styles.productPreview} aria-label="Можливості платформи">
            <div className={styles.previewTop}>
              <span>HTML</span>
              <span>CSS</span>
              <span>Video</span>
            </div>
            <div className={styles.previewCode}>
              <span>{"<main>"}</span>
              <span>{"  <h1>Мій перший сайт</h1>"}</span>
              <span>{"  <p>Навчаюсь через практику.</p>"}</span>
              <span>{"</main>"}</span>
            </div>
            <div className={styles.previewProgress}>
              <span>Прогрес курсу</span>
              <strong>0/2 уроки</strong>
            </div>
          </aside>
        </section>

        <section className={styles.paths}>
          <article className={styles.pathCard}>
            <p className={styles.eyebrow}>Для самостійного навчання</p>
            <h2>Студент проходить готову програму</h2>
            <p>
              Платформа веде учня через курси, модулі, уроки і техчеки. Код і
              прогрес зберігаються для конкретного користувача.
            </p>
            <Link to="/student/learning">Перейти до навчання</Link>
          </article>

          <article className={styles.pathCard}>
            <p className={styles.eyebrow}>Для навчання з викладачем</p>
            <h2>Викладач бачить учнів і їхній прогрес</h2>
            <p>
              Поточний teacher flow уже показує учнів, статуси уроків, задачі та
              snapshots коду. Далі сюди додадуться групи, коментарі й review.
            </p>
            <Link to="/teacher/students">Перейти до учнів</Link>
          </article>
        </section>

        <section className={styles.capabilities}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Що вже закладено</p>
            <h2>Одна платформа для двох сценаріїв</h2>
          </div>

          <div className={styles.capabilityGrid}>
            <article>
              <h3>Готова програма</h3>
              <p>Курси, модулі, уроки, техчеки, відео і практичні завдання.</p>
            </article>
            <article>
              <h3>Практика в браузері</h3>
              <p>Monaco Editor, preview у iframe і client-side перевірка задач.</p>
            </article>
            <article>
              <h3>Прогрес учня</h3>
              <p>Поточний урок, завершені уроки, виконані задачі і збережений код.</p>
            </article>
            <article>
              <h3>Teacher flow</h3>
              <p>Базовий кабінет викладача вже готовий для перегляду student data.</p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Home;
