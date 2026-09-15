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
import StudentProgressPage from "./pages/Student/StudentProgressPage";
import StudentLearningPage from "./pages/Student/StudentLearningPage";
import StudentTechChecksPage from "./pages/Student/StudentTechChecksPage";
import LearnPage from "./pages/Marketing/LearnPage";
import TeachPage from "./pages/Marketing/TeachPage";
import NotFound from "./pages/NotFound/NotFound";

function StudentHomeRedirect() {
  return <Navigate to="/student/learning" replace />;
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
            <Route path="learn" element={<LearnPage />} />
            <Route path="teach" element={<TeachPage />} />
            <Route path="docs" element={<DocsPage />} />
            <Route path="docs/:category/:id" element={<DocsPage />} />
          </Route>

          {/* Роль більше не розгалужує вхід: у MVP вона одна (PLATFORM_UA, розділ 2). */}
          <Route path="/app" element={<Navigate to="/student" replace />} />

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

          {/*
            Викладацьких маршрутів тут немає свідомо: розділ 2 каже «роль зарезервована,
            без функціоналу», розділ 7 — «Teacher API прибрано з MVP цілком». Поки вони
            були підключені, правило незмінності («прибери викладача — платформа має
            працювати повністю») неможливо було перевірити.

            Самі екрани лишились на диску як орієнтир — див. позначку в `pages/Teacher/`.
          */}

          <Route element={<Layout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
