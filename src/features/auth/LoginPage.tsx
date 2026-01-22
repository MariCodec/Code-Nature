import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Link, useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../store";
import { login } from "../../store/thunks/authThunks";
import {
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";

import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isAuth = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuth) return <Navigate to="/" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(login({ email, password }));
    if (login.fulfilled.match(res)) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Login</h2>
      <p className={styles.subtitle}>Welcome back! Continue learning ✨</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <input
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
        />

        <input
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
        />

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.button} disabled={status === "loading"}>
          {status === "loading" ? "Loading..." : "Login"}
        </button>
      </form>

      <p className={styles.link}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
