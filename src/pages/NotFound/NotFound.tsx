import { Link } from "react-router-dom";

import { uk } from "../../i18n/uk";
import styles from "./NotFound.module.scss";

/**
 * Маршрут `*`. До нього помилкова адреса давала **порожній екран**: у роутері
 * не було catch-all, тож не збігшись ні з чим, не рендерилось нічого.
 */
export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{uk.notFound.title}</h1>
      <p className={styles.hint}>{uk.notFound.hint}</p>
      <Link className={styles.back} to="/">
        {uk.notFound.back}
      </Link>
    </div>
  );
}
