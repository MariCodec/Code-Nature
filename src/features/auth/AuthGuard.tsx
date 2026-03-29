import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import {
  selectAuthRole,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";

type AuthGuardProps = {
  allowedRoles?: Array<"student" | "teacher">;
};

export default function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const isAuth = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);
  if (!isAuth) return <Navigate to="/login" replace />;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return <Outlet />;
}
