import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Link, useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../store";
import { login } from "../../store/thunks/authThunks";
import {
  selectAuthError,
  selectAuthRole,
  selectAuthStatus,
  selectIsAuthenticated,
  selectIsSessionResolved,
} from "../../store/slices/authSlice";
import styles from "./RegisterPage.module.scss";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isSessionResolved = useSelector(selectIsSessionResolved);
  const isAuth = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");

  // Та сама причина, що й у AuthGuard: до відповіді про сесію форму показувати
  // не можна — інакше залогінений користувач на F5 бачить спалах форми входу.
  if (!isSessionResolved) return null;

  if (isAuth) return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(login({ email, password, role: selectedRole }));
    if (login.fulfilled.match(res)) {
      const nextRole = res.payload.user.role;
      navigate(nextRole === "teacher" ? "/teacher" : "/student", { replace: true });
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

        <select
          className={styles.input}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as "student" | "teacher")}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

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
