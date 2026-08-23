import { Link } from "react-router-dom";

import Footer from "../../components/layout/Footer";
import styles from "./Marketing.module.scss";

const teachingFeatures = [
  "Створення навчального маршруту для курсу",
  "Групи учнів і доступ до матеріалів",
  "Практичні завдання та техчеки",
  "Перегляд прогресу кожного учня",
  "Основа для фідбеку, review та підготовки до інтерв'ю",
];

const TeachPage = () => {
  return (
    <>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Для викладачів</p>
            <h1>Ведіть навчання, перевіряйте практику і бачте прогрес учнів</h1>
            <p>
              Code Nature допомагає зібрати курс, домашні завдання, техчеки та
              прогрес учнів в одному місці. Менше хаосу в чатах і таблицях,
              більше контролю над навчанням.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryAction} to="/register">
                Створити акаунт
              </Link>
              <Link className={styles.secondaryAction} to="/">
                На головну
              </Link>
            </div>
          </div>

          <div className={styles.routeCard} aria-label="Можливості викладача">
            <span>Робочий простір викладача</span>
            <strong>Курс, учні й перевірка в одному процесі</strong>
            <div className={styles.stepList}>
              {teachingFeatures.map((feature, index) => (
                <div key={feature}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.beforeAfter}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>До / Після</p>
            <h2>Навчальний процес стає видимим</h2>
          </div>

          <div className={styles.cardGrid}>
            <article>
              <span>До</span>
              <h3>Завдання, код і прогрес розкидані по різних місцях.</h3>
              <p>Важко швидко зрозуміти, хто відстає і кому потрібен фідбек.</p>
            </article>
            <article>
              <span>Після</span>
              <h3>Викладач бачить прогрес і працює з конкретними задачами.</h3>
              <p>Матеріали, практика і результати учнів зібрані в одному кабінеті.</p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default TeachPage;
