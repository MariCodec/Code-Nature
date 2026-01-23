import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";
import LessonPage from "./components/lessonPage/LessonPage";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
// import LoginPage from "./features/auth/LoginPage";
// import RegisterPage from "./features/auth/RegisterPage";
// import AuthGuard from "./features/auth/AuthGuard";

import LessonsList from "./components/LessonsList/LessonsList";
import { AppInitializer } from "./AppInitializer";

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
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
