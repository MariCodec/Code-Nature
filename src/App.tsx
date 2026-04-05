import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import "./App.scss";
import LessonPage from "./pages/lessonPage/LessonPage";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home/Home";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import AuthGuard from "./features/auth/AuthGuard";

import LessonsList from "./pages/LessonsList/LessonsList";
import { AppInitializer } from "./AppInitializer";
import DocsPage from "./pages/Docs/DocsPage";
import { useSelector } from "react-redux";
import { selectAuthRole } from "./store/slices/authSlice";

function StudentHomeRedirect() {
  return <Navigate to="/student/html" replace />;
}

function TeacherHomePlaceholder() {
  return (
    <div style={{ padding: "40px 20px" }}>
      <h1>Teacher Area</h1>
      <p>Кабінет викладача буде реалізований наступним етапом.</p>
    </div>
  );
}

function AppEntryRedirect() {
  const role = useSelector(selectAuthRole);
  return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
}

function LegacyLessonRedirect() {
  const { category, id } = useParams<{ category?: string; id?: string }>();

  if (!category || !id) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to={`/student/${category}/${id}`} replace />;
}

function App() {
  return (
    <>
      <AppInitializer />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="docs" element={<DocsPage />} />
            <Route path="docs/:category/:id" element={<DocsPage />} />
          </Route>

          <Route path="/app" element={<AppEntryRedirect />} />
          <Route path="/html" element={<Navigate to="/student/html" replace />} />
          <Route path="/css" element={<Navigate to="/student/css" replace />} />
          <Route path="/:category/:id" element={<LegacyLessonRedirect />} />

          <Route path="/student" element={<AuthGuard allowedRoles={["student"]} />}>
            <Route element={<Layout />}>
              <Route index element={<StudentHomeRedirect />} />
              <Route path=":category" element={<LessonsList />} />
              <Route path=":category/:id" element={<LessonPage />} />
            </Route>
          </Route>

          <Route path="/teacher" element={<AuthGuard allowedRoles={["teacher"]} />}>
            <Route element={<Layout />}>
              <Route index element={<TeacherHomePlaceholder />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
