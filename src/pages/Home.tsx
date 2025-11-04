import Footer from "../components/layout/Footer";
import styles from "./Home.module.scss";

const Home = () => {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <span>{"<"}</span>
          <span>{"{ }"}</span>
          <span>{"/>"}</span>
          <span>{"<div>"}</span>
        </div>

        <div className={styles.heroContent}>
          <h1>Створити сайт? - та легко 🌿</h1>
          <p>
           Створи свій перший сайт на безкоштовному пробному уроці
          </p>
          <div className={styles.buttons}>
            <button className={styles.primary}>Почати безкоштовно</button>
            <button className={styles.secondary}>Увійти</button>
          </div>
        </div>

        <div className={styles.heroImage}>
          <div className={styles.codePreview}>{"<h1>Привіт, HTML!</h1>"}</div>
          <div className={styles.plant}></div>
        </div>
      </section>

      <section className={styles.about}>
        <h2>Що таке Code Nature?</h2>
        <p>
          Code Nature — це інтерактивна платформа для навчання HTML, CSS та
          JavaScript. Пиши код прямо у браузері й одразу бач результат.
        </p>
        <div className={styles.icons}>
          <div>🧱 HTML</div>
          <div>🎨 CSS</div>
          <div>⚙️ JS</div>
        </div>
      </section>

      <section className={styles.steps}>
        <h2>Як це працює</h2>
        <ul>
          <li>
            <span>1.</span> Залишай заявку
          </li>
          <li>
            <span>2.</span> Пиши код
          </li>
          <li>
            <span>3.</span> Дивись результат 🌱
          </li>
        </ul>
      </section>

      <section className={styles.freeLesson}>
        <h2>Спробуй безкоштовно</h2>
        <p>Перший урок абсолютно безкоштовний. Почни вже сьогодні!</p>
        <button className={styles.primary}>Пройти пробний урок</button>
      </section>

      <footer>
        <Footer />
      </footer>
    </>
  );
};

export default Home;
