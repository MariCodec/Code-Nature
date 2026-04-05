import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";
import {
  fetchTeacherStudents,
  selectTeacherError,
  selectTeacherStudents,
  selectTeacherStudentsStatus,
} from "../../store/slices/teacherSlice";
import styles from "./TeacherPages.module.scss";

export default function TeacherStudentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const students = useSelector(selectTeacherStudents);
  const status = useSelector(selectTeacherStudentsStatus);
  const error = useSelector(selectTeacherError);

  useEffect(() => {
    void dispatch(fetchTeacherStudents());
  }, [dispatch]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h1 className={styles.panelTitle}>Учні</h1>
              <p className={styles.panelText}>
                Список формується з реальних student-даних, які вже збережені в системі.
              </p>
            </div>

            <Link className={styles.secondaryLink} to="/teacher">
              До кабінету
            </Link>
          </div>

          {error ? (
            <div className={styles.empty}>{error}</div>
          ) : status === "loading" && students.length === 0 ? (
            <div className={styles.empty}>Завантаження учнів...</div>
          ) : students.length === 0 ? (
            <div className={styles.empty}>
              Поки що немає учнів з прогресом або збереженим кодом.
            </div>
          ) : (
            <div className={styles.studentsList}>
              {students.map((student) => (
                <article key={student.id} className={styles.studentCard}>
                  <div className={styles.studentTop}>
                    <div>
                      <h2 className={styles.studentName}>{student.name}</h2>
                      <p className={styles.studentMeta}>{student.email}</p>
                    </div>

                    <div className={styles.studentBadges}>
                      <span className={styles.badge}>
                        Завершено уроків: {student.completedLessonsCount}
                      </span>
                      <span className={styles.badge}>
                        Поточний урок: {student.currentLessonId ?? "немає"}
                      </span>
                      <span className={styles.badge}>
                        Активність: {student.lastActivityAt ?? "немає"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.studentActions}>
                    <Link
                      className={styles.primaryLink}
                      to={`/teacher/students/${student.id}`}
                    >
                      Відкрити учня
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
