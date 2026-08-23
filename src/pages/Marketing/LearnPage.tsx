import { Link } from "react-router-dom";

import Footer from "../../components/layout/Footer";
import styles from "./Marketing.module.scss";

const learningSteps = [
  "Відео",
  "Теорія",
  "Практика",
  "Техчек",
  "Інтерв'ю",
];

const transformationCards = [
  {
    beforeTitle: "Я боюсь програмувати, бо це здається складним.",
    beforeText: "Не знаю, з чого почати і як не загубитись у матеріалах.",
    afterTitle: "Я проходжу короткі кроки й бачу прогрес.",
    afterText: "Кожна тема має пояснення, практику і зрозумілий наступний крок.",
  },
  {
    beforeTitle: "Я дивлюсь уроки, але не розумію, чи справді навчився.",
    beforeText: "Без практики легко створити відчуття руху без реального результату.",
    afterTitle: "Я закріплюю тему практикою і техчеком.",
    afterText: "Після уроку є завдання, перевірка і контроль розуміння.",
  },
  {
    beforeTitle: "Я не знаю, які питання можуть бути на співбесіді.",
    beforeText: "Теорія розкидана, а підготовка до інтерв'ю відкладається на потім.",
    afterTitle: "Я готуюсь до інтерв'ю під час навчання.",
    afterText: "Питання прив'язані до тем, які вже пройдені на платформі.",
  },
];

const withoutPlatform = [
  "Матеріали розкидані по відео, статтях і нотатках",
  "Незрозуміло, яку тему вчити наступною",
  "Практика відкладається, бо немає чітких завдань",
  "Прогрес відчувається приблизно, але не видно результату",
];

const withPlatform = [
  "Уроки, теорія, практика і техчеки зібрані в одному маршруті",
  "Після кожної теми зрозуміло, що робити далі",
  "Практичні завдання одразу закріплюють матеріал",
  "Ви бачите пройдені теми, виконані задачі й наступний крок",
];

const studentAudienceItems = [
  "Навчання у власному темпі",
  "Короткі уроки без перевантаження",
  "Практика після кожної теми",
  "Техчеки для самоперевірки",
  "Підготовка до інтерв'ю",
  "Видимий прогрес",
  "Зрозумілий маршрут",
  "Менше хаосу з матеріалами",
];

const workflowSteps = [
  {
    title: "Обираєте тему",
    text: "Починаєте з поточного уроку або продовжуєте маршрут із місця, де зупинились.",
  },
  {
    title: "Дивитесь пояснення",
    text: "Коротке відео й теорія дають контекст без зайвого перевантаження.",
  },
  {
    title: "Пишете код",
    text: "Практика допомагає одразу застосувати тему, а не просто запам'ятати її.",
  },
  {
    title: "Проходите техчек",
    text: "Контрольні завдання показують, що вже зрозуміло, а до чого варто повернутись.",
  },
];

const LearnPage = () => {
  return (
    <>
      <main className={styles.page}>
        <section className={`${styles.hero} ${styles.studentHero}`}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Для самостійного навчання</p>
            <h1>Frontend без хаосу: зрозумілий шлях від уроку до практики</h1>
            <p>
              Code Nature збирає відеоуроки, теорію, практичні завдання, техчеки
              та питання для інтерв&apos;ю в один навчальний маршрут. Ви не
              здогадуєтесь, що вчити далі, а рухаєтесь за планом.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryAction} to="/register">
                Почати навчання
              </Link>
              <Link className={styles.secondaryAction} to="/">
                На головну
              </Link>
            </div>

            <div className={styles.heroSteps} aria-label="Етапи навчання">
              {learningSteps.map((step, index) => (
                <div key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.stackSection}>
          <div className={styles.stackIntro}>
            <h2>Від розгубленості до відчутного прогресу</h2>
            <p>
              Навчання розбите на короткі кроки:
              ви бачите, що робити зараз, і розумієте, куди рухатись далі.
            </p>
          </div>

          <div className={styles.stickyCards} aria-label="Картки до і після">
            {transformationCards.map((card, index) => (
              <article className={styles.transformCard} key={card.beforeTitle}>
                <div className={styles.cardHalf}>
                  <span>До</span>
                  <h3>{card.beforeTitle}</h3>
                  <p>{card.beforeText}</p>
                </div>
                <div className={styles.cardDivider} />
                <div className={styles.cardHalf}>
                  <span>Після</span>
                  <h3>{card.afterTitle}</h3>
                  <p>{card.afterText}</p>
                </div>
                <strong className={styles.cardNumber}>
                  {String(index + 1).padStart(2, "0")}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.claritySection}>
          <div className={styles.clarityText}>
            <p className={styles.eyebrow}>Навчання без хаосу</p>
            <h2>Не потрібно збирати маршрут по шматках</h2>
            <p>
              Коли матеріали лежать у різних місцях, легко втратити фокус:
              дивитись уроки без практики, перескакувати між темами або не
              розуміти, чи є прогрес. Code Nature тримає навчання в одному
              процесі: від першого пояснення до конкретного результату.
            </p>
          </div>

          <div className={styles.compareGrid}>
            <article>
              <span>Без платформи</span>
              <ul>
                {withoutPlatform.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <span>З платформою</span>
              <ul>
                {withPlatform.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.audienceSection}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Для кого платформа</p>
            <h2>Для тих, хто хоче вчитись самостійно, але не наосліп</h2>
            <p>
              Платформа підходить, якщо ви стартуєте з нуля, повертаєтесь до
              навчання після паузи або хочете закріпити frontend через практику,
              а не просто переглядати уроки.
            </p>
          </div>

          <div className={styles.marquee} aria-label="Переваги для учня">
            <div className={styles.marqueeTrack}>
              {[...studentAudienceItems, ...studentAudienceItems].map((item, index) => (
                <span key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.workflowSection}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Як це працює</p>
            <h2>Один урок завжди веде до наступної дії</h2>
            <p>
              Учень не лишається з питанням “і що тепер?”. Після пояснення є
              практика, після практики - перевірка, після перевірки - наступний
              крок у маршруті.
            </p>
          </div>

          <div className={styles.workflowGrid}>
            {workflowSteps.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default LearnPage;
