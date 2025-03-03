import Footer from "../components/layout/Footer";
import styles from "./Home.module.scss";

const Home = () => {
  return (
    <>
      <section className={styles.home}>
        <h1>
          <span className={styles.part1}>Привіт! У</span>
          <span className={styles.part2}> just Code</span>
          <span className={styles.part3}> ти створиш </span>
          <span className={styles.part4}>свій перший сайт</span>
        </h1>
        <p>Прокачай свої навички з веб-розробки разом із нами! 🎯</p>
        <button className={styles.neonButton}>Почати навчання</button>
      </section>
      <footer>
        <Footer/>
      </footer>
    </>
  );
};

export default Home;
