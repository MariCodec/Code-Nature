import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";
import LessonPage from "./components/lessonPage/LessonPage";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import HtmlLessons from "./components/htmlLessons/HtmlLessons";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/html" element={<HtmlLessons />} />
            {/* Окремий HTML урок */}
            <Route path="/html/:id" element={<LessonPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
