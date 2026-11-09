import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Link, useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../store";
import { login } from "../../store/thunks/authThunks";
import {
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
  selectIsSessionResolved,
} from "../../store/slices/authSlice";
import { uk } from "../../i18n/uk";
import styles from "./AuthForm.module.scss";

const t = uk.auth.login;

/**
 * Акаунт для демо-розгортання. Мок пускає будь-яку пошту з «@» і будь-який
 * непорожній пароль (`api/authApi.ts`), тож гість — це не обхід входу, а той
 * самий вхід із заздалегідь відомими даними: одна кнопка замість форми.
 *
 * Коли Фаза 6, пункт 6.3 відкриє перший урок без акаунта, ця кнопка стає
 * зайвою — публічний шар робить те саме чесніше й без сесії.
 */
const GUEST = { email: "demo@code-nature.app", password: "demo1234" };

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isSessionResolved = useSelector(selectIsSessionResolved);
  const isAuth = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Та сама причина, що й у AuthGuard: до відповіді про сесію форму показувати
  // не можна — інакше залогінений користувач на F5 бачить спалах форми входу.
  if (!isSessionResolved) return null;

  if (isAuth) return <Navigate to="/student" replace />;

  const isLoading = status === "loading";

  // Спільний хвіст форми й гостьової кнопки: редірект лише на успіх, бо
  // `login` на помилці резолвиться теж — помилку показує `error` вище.
  const enter = async (payload: typeof GUEST) => {
    const res = await dispatch(login(payload));
    if (login.fulfilled.match(res)) navigate("/student", { replace: true });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void enter({ email, password });
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{t.title}</h2>
      <p className={styles.subtitle}>{t.subtitle}</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <input
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder={t.email}
          required
        />

        <input
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={t.password}
          required
        />

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.button} disabled={isLoading}>
          {isLoading ? t.loading : t.submit}
        </button>
      </form>

      {/* Поза формою навмисно: інакше `required` в полях не дав би натиснути. */}
      <button
        type="button"
        className={styles.buttonGhost}
        onClick={() => void enter(GUEST)}
        disabled={isLoading}
      >
        {t.guest}
      </button>
      <p className={styles.hint}>{t.guestHint}</p>

      <p className={styles.footer}>
        {t.noAccount}{" "}
        <Link className={styles.link} to="/register">
          {t.register}
        </Link>
      </p>
    </div>
  );
}
