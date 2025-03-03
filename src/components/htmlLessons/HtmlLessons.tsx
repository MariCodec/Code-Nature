import { Link } from "react-router-dom";
import { htmlLessons } from "../../data/lessonData";

const HtmlLessons = () => {
  return (
    <div>
      <h2>HTML Уроки</h2>
      <ul>
        {htmlLessons.map((lesson) => (
          <li key={lesson.id}>
            <Link to={`/html/${lesson.id}`}>{lesson.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HtmlLessons;
