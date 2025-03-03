import { Link } from "react-router-dom";
import styles from "./Layout.module.scss";
const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <span className={styles.part2}> just Code</span>
      </div>
      <nav className={styles.navLinks}>
        <Link className={styles.navLink} to="/">
          Home
        </Link>
        <Link className={styles.navLink} to="/html">
          HTML{" "}
        </Link>
        <Link className={styles.navLink} to="/css">
          CSS{" "}
        </Link>
        {/* <Link to="/js">JavaScript Lessons</Link> */}
        <Link className={styles.navLink} to="/docs">
          Docs
        </Link>
      </nav>
    </header>
  );
};

export default Header;
