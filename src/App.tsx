import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";
import LessonPage from "./pages/lessonPage/LessonPage";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home/Home";
// import LoginPage from "./features/auth/LoginPage";
// import RegisterPage from "./features/auth/RegisterPage";
// import AuthGuard from "./features/auth/AuthGuard";

import LessonsList from "./pages/LessonsList/LessonsList";
import { AppInitializer } from "./AppInitializer";
import DocsPage from "./pages/Docs/DocsPage";

function App() {
  return (
    <>
      <AppInitializer />
      <Router>
        <Routes>
          {/* <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<AuthGuard />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path=":category" element={<LessonsList />} />
              <Route path=":category/:id" element={<LessonPage />} />
            </Route>
          </Route> */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path=":category" element={<LessonsList />} />
            <Route path=":category/:id" element={<LessonPage />} />
            <Route path=":category" element={<DocsPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
