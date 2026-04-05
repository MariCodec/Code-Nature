import { Link } from "react-router-dom";
import styles from "./TeacherPages.module.scss";

export default function TeacherHomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Teacher Area</p>
          <h1 className={styles.title}>Кабінет викладача</h1>
          <p className={styles.lead}>
            Тут будуть зібрані учні, їхній прогрес і збережений код. На цьому етапі
            вже доступний базовий teacher flow для перегляду студентів.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryLink} to="/teacher/students">
              Перейти до учнів
            </Link>
            <Link className={styles.secondaryLink} to="/home">
              На головну
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Список учнів</h2>
            <p className={styles.cardText}>
              Перегляд усіх учнів, які вже мають збережений прогрес або код у системі.
            </p>
            <Link className={styles.cardLink} to="/teacher/students">
              Відкрити список
            </Link>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Деталі учня</h2>
            <p className={styles.cardText}>
              Окрема сторінка учня з підсумком прогресу, поточним уроком і статусами.
            </p>
            <span className={styles.cardText}>
              Доступно після переходу зі списку учнів.
            </span>
          </article>
        </section>
      </div>
    </div>
  );
}
