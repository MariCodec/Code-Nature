import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";
import LessonPage from "./components/lessonPage/LessonPage";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";

import LessonsList from "./components/LessonsList/LessonsList";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* <Route path="html" element={<HtmlLessons />} /> */}
            {/* <Route path="css" element={<CssLessons />} />  */}
            <Route path=":category" element={<LessonsList />} />
            {/* Універсальний маршрут для уроків HTML і CSS */}
            <Route path=":category/:id" element={<LessonPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
