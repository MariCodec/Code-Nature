import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import {
  fetchTeacherStudentById,
  selectTeacherError,
  selectTeacherStudentById,
  selectTeacherStudentStatus,
} from "../../store/slices/teacherSlice";
import styles from "./TeacherPages.module.scss";

const getStatusClassName = (status: "not_started" | "in_progress" | "completed") => {
  if (status === "completed") return `${styles.status} ${styles.statusCompleted}`;
  if (status === "in_progress") return `${styles.status} ${styles.statusProgress}`;
  return `${styles.status} ${styles.statusIdle}`;
};

const getStatusLabel = (status: "not_started" | "in_progress" | "completed") => {
  if (status === "completed") return "Завершено";
  if (status === "in_progress") return "В процесі";
  return "Не почато";
};

export default function TeacherStudentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { studentId } = useParams<{ studentId?: string }>();
  const student = useSelector((state: RootState) =>
    studentId ? selectTeacherStudentById(state, studentId) : null,
  );
  const status = useSelector((state: RootState) =>
    studentId ? selectTeacherStudentStatus(state, studentId) : "idle",
  );
  const error = useSelector(selectTeacherError);

  useEffect(() => {
    if (!studentId) return;
    void dispatch(fetchTeacherStudentById(studentId));
  }, [dispatch, studentId]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Student Details</p>
          <h1 className={styles.title}>{student?.name ?? "Учень"}</h1>
          <p className={styles.lead}>
            {student?.email ?? "Завантаження даних учня..."}
          </p>

          <div className={styles.actions}>
            <Link className={styles.secondaryLink} to="/teacher/students">
              До списку учнів
            </Link>
          </div>
        </section>

        {error ? (
          <div className={styles.empty}>{error}</div>
        ) : status === "loading" && !student ? (
          <div className={styles.empty}>Завантаження даних учня...</div>
        ) : !student ? (
          <div className={styles.empty}>Учня не знайдено.</div>
        ) : (
          <>
            <section className={styles.stats}>
              <article className={styles.stat}>
                <p className={styles.statLabel}>Завершено уроків</p>
                <p className={styles.statValue}>{student.completedLessonsCount}</p>
              </article>

              <article className={styles.stat}>
                <p className={styles.statLabel}>Поточний урок</p>
                <p className={styles.statValue}>{student.currentLessonId ?? "немає"}</p>
              </article>

              <article className={styles.stat}>
                <p className={styles.statLabel}>Остання активність</p>
                <p className={styles.statValue}>{student.lastActivityAt ?? "немає"}</p>
              </article>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Прогрес по уроках</h2>
                  <p className={styles.panelText}>
                    Базовий teacher view для перевірки статусів учня.
                  </p>
                </div>
              </div>

              {student.lessonProgress.length === 0 ? (
                <div className={styles.empty}>Учень ще не починав жодного уроку.</div>
              ) : (
                <div className={styles.progressList}>
                  {student.lessonProgress.map((lesson) => (
                    <article key={lesson.lessonId} className={styles.progressRow}>
                      <div>
                        <p className={styles.progressLesson}>{lesson.lessonId}</p>
                        <p className={styles.progressMeta}>
                          Курс: {lesson.courseId}
                        </p>
                      </div>

                      <span className={getStatusClassName(lesson.status)}>
                        {getStatusLabel(lesson.status)}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Прогрес по задачах</h2>
                  <p className={styles.panelText}>
                    Видно, які окремі задачі були зараховані всередині уроків.
                  </p>
                </div>
              </div>

              {student.taskProgress.length === 0 ? (
                <div className={styles.empty}>Поки що немає завершених задач.</div>
              ) : (
                <div className={styles.taskList}>
                  {student.taskProgress.map((task) => (
                    <article
                      key={`${task.lessonId}_${task.taskId}`}
                      className={styles.taskRow}
                    >
                      <div>
                        <p className={styles.progressLesson}>{task.taskId}</p>
                        <p className={styles.taskMeta}>
                          Урок: {task.lessonId} · Курс: {task.courseId}
                        </p>
                      </div>

                      <span
                        className={
                          task.isCompleted
                            ? `${styles.status} ${styles.statusCompleted}`
                            : `${styles.status} ${styles.statusIdle}`
                        }
                      >
                        {task.isCompleted ? "Завершено" : "Не завершено"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Збережений код</h2>
                  <p className={styles.panelText}>
                    Поточні snapshots файлів, які учень зберігав по уроках.
                  </p>
                </div>
              </div>

              {student.codeSnapshots.length === 0 ? (
                <div className={styles.empty}>Учень ще не зберігав код.</div>
              ) : (
                <div className={styles.codeSnapshots}>
                  {student.codeSnapshots.map((snapshot) => (
                    <article key={snapshot.lessonId} className={styles.codeCard}>
                      <div className={styles.subPanel}>
                        <h3 className={styles.codeTitle}>{snapshot.lessonId}</h3>
                        <p className={styles.panelText}>
                          Оновлено: {snapshot.updatedAt ?? "немає даних"}
                        </p>
                      </div>

                      <div className={styles.fileList}>
                        {snapshot.savedFiles.map((file) => (
                          <span
                            key={`${snapshot.lessonId}_${file.name}`}
                            className={styles.fileBadge}
                          >
                            {file.name} · {file.language}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
