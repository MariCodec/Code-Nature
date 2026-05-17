import { Link } from "react-router-dom";
import styles from "./TeacherPages.module.scss";

export default function TeacherHomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Кабінет викладача</p>
          <h1 className={styles.title}>Кабінет викладача</h1>
          <p className={styles.lead}>
            Тут зібрані учні, їхній прогрес, виконані задачі та збережений код.
            Спочатку відкрий список учнів, а потім вибери конкретного учня для
            перегляду деталей.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryLink} to="/teacher/students">
              Перейти до учнів
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={`${styles.card} ${styles.cardMuted}`}>
            <h2 className={styles.cardTitle}>Групи</h2>
            <p className={styles.cardText}>
              Тут буде керування класами, списками учнів і призначенням курсів.
            </p>
            <span className={styles.statusPill}>Заплановано</span>
          </article>

          <article className={`${styles.card} ${styles.cardMuted}`}>
            <h2 className={styles.cardTitle}>Перевірка робіт</h2>
            <p className={styles.cardText}>
              Тут зʼявляться submissions, review status і коментарі викладача.
            </p>
            <span className={styles.statusPill}>Заплановано</span>
          </article>

          <article className={`${styles.card} ${styles.cardMuted}`}>
            <h2 className={styles.cardTitle}>Курси</h2>
            <p className={styles.cardText}>
              Тут буде керування навчальними програмами, модулями, уроками й відео.
            </p>
            <span className={styles.statusPill}>Заплановано</span>
          </article>
        </section>
      </div>
    </div>
  );
}
