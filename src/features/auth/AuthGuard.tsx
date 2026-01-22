import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectIsAuthenticated } from "../../store/slices/authSlice";

export default function AuthGuard() {
  const isAuth = useSelector(selectIsAuthenticated);
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}
