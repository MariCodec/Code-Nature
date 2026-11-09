import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import Footer from "../../components/layout/Footer";
import { selectIsAuthenticated } from "../../store/slices/authSlice";
import styles from "./Home.module.scss";

const Home = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Роль у MVP одна, тож вибір лише між «уже вчиться» і «ще не зареєстрований».
  const primaryPath = isAuthenticated ? "/student/learning" : "/register";
  const primaryLabel = isAuthenticated ? "Продовжити навчання" : "Почати навчання";
  const secondaryPath = isAuthenticated ? "/student/progress" : "/login";
  const secondaryLabel = isAuthenticated ? "Мій прогрес" : "Увійти";

  return (
    <>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Code Nature</p>
            <h1>Одна платформа для самостійного навчання і роботи з учнями</h1>
            <p className={styles.lead}>
              Відеоуроки, теорія, практика, техчеки й підготовка до інтерв&apos;ю
              зібрані в одному навчальному маршруті. Оберіть сценарій, щоб
              побачити можливості платформи для себе.
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

          <div className={styles.choiceGrid} aria-label="Оберіть сценарій">
            <Link className={styles.choiceCard} to="/learn">
              <span className={styles.choiceTag}>Для учня</span>
              <h2>Навчатись самостійно</h2>
              <p>
                Зрозумілий маршрут від відео й теорії до практики, техчеків і
                питань для інтерв&apos;ю.
              </p>
              <strong>Переглянути можливості</strong>
            </Link>

            <Link className={styles.choiceCard} to="/teach">
              <span className={styles.choiceTag}>Для викладача</span>
              <h2>Вести учнів</h2>
              <p>
                Курси, групи, перевірка практики та прогрес учнів в одному
                робочому просторі.
              </p>
              <strong>Дізнатись для викладача</strong>
            </Link>
          </div>
        </section>

        <section className={styles.platformStrip} aria-label="Що всередині платформи">
          <span>Відеоуроки</span>
          <span>Теорія</span>
          <span>Практика</span>
          <span>Техчеки</span>
          <span>Інтерв&apos;ю питання</span>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Home;
