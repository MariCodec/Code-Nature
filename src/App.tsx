import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import TeacherHomePage from "./pages/Teacher/TeacherHomePage";
import TeacherStudentsPage from "./pages/Teacher/TeacherStudentsPage";
import TeacherStudentPage from "./pages/Teacher/TeacherStudentPage";
import StudentProgressPage from "./pages/Student/StudentProgressPage";
import StudentLearningPage from "./pages/Student/StudentLearningPage";
import StudentTechChecksPage from "./pages/Student/StudentTechChecksPage";

function StudentHomeRedirect() {
  return <Navigate to="/student/learning" replace />;
}

function AppEntryRedirect() {
  const role = useSelector(selectAuthRole);
  return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
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

          <Route path="/student" element={<AuthGuard allowedRoles={["student"]} />}>
            <Route element={<Layout />}>
              <Route index element={<StudentHomeRedirect />} />
              <Route path="learning" element={<StudentLearningPage />} />
              <Route path="tech-checks" element={<StudentTechChecksPage />} />
              <Route path="progress" element={<StudentProgressPage />} />
              <Route path="courses/:courseId" element={<LessonsList />} />
              <Route
                path="courses/:courseId/modules/:moduleId/lessons/:id"
                element={<LessonPage />}
              />
              <Route
                path="courses/:courseId/modules/:moduleId/tech-checks/:id"
                element={<LessonPage />}
              />
            </Route>
          </Route>

          <Route path="/teacher" element={<AuthGuard allowedRoles={["teacher"]} />}>
            <Route element={<Layout />}>
              <Route index element={<TeacherHomePage />} />
              <Route path="students" element={<TeacherStudentsPage />} />
              <Route path="students/:studentId" element={<TeacherStudentPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
