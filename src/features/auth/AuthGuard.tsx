import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import {
  selectAuthRole,
  selectIsAuthenticated,
  selectIsSessionResolved,
} from "../../store/slices/authSlice";

type AuthGuardProps = {
  allowedRoles?: Array<"student" | "teacher">;
};

export default function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const isSessionResolved = useSelector(selectIsSessionResolved);
  const isAuth = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);

  // Поки невідомо, хто користувач, рішення приймати не можна: `isAuth === false`
  // на першому рендері означає «сесію ще не підняли», а не «гість». Редірект тут
  // і викидав учня на /login при кожному перезавантаженні сторінки уроку.
  if (!isSessionResolved) return null;

  if (!isAuth) return <Navigate to="/login" replace />;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return <Outlet />;
}
