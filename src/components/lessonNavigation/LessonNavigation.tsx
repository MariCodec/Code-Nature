import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import styles from "./LessonNavigation.module.scss";
import { AppDispatch, RootState } from "../../store";
import {
  fetchCourseModules,
  fetchCoursesByTrack,
  fetchModuleLessons,
  selectCourseModules,
  selectCoursesByTrack,
} from "../../store/slices/contentSlice";
import {
  buildStudentLessonPath,
  buildStudentTechCheckPath,
} from "../../utils/courseMapping";
import { useModuleProgression } from "../../hooks/useModuleProgression";
import { uk } from "../../i18n/uk";
import {
  getNextStep,
  getPreviousItem,
  type ModuleItem,
} from "../../domain/progression";

const pathForItem = (item: ModuleItem) =>
  item.lessonKind === "tech_check"
    ? buildStudentTechCheckPath(item.courseId, item.moduleId, item.id)
    : buildStudentLessonPath(item.courseId, item.moduleId, item.id);

type NextAction = {
  label: string;
  hint?: string;
  disabled: boolean;
  accent: boolean;
  onClick?: () => void;
};

const LessonNavigation: React.FC<{ currentLessonId: string }> = ({
  currentLessonId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { courseId, moduleId } = useParams<{ courseId?: string; moduleId?: string }>();

  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = courseId
    ? frontendCourses.find((course) => course.id === courseId) ?? null
    : null;
  const courseModules = useSelector((state: RootState) =>
    selectedCourse ? selectCourseModules(state, selectedCourse.id) : [],
  );

  const { ctx, state, nextModule } = useModuleProgression(courseId, moduleId);

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourse) return;
    void dispatch(fetchCourseModules(selectedCourse.id));
  }, [dispatch, selectedCourse]);

  useEffect(() => {
    courseModules.forEach((module) => {
      void dispatch(fetchModuleLessons(module.id));
    });
  }, [courseModules, dispatch]);

  if (!courseId || !moduleId) {
    return <h2>Урок не знайдено</h2>;
  }

  const previousItem = getPreviousItem(currentLessonId, ctx);
  const nextStep = getNextStep(currentLessonId, ctx);
  const isCurrentDone = completedLessons.includes(currentLessonId);

  const buildNextAction = (): NextAction => {
    switch (nextStep.kind) {
      case "lesson":
        return {
          label: uk.lessonNav.nextLesson,
          hint: isCurrentDone ? undefined : uk.lessonNav.finishCurrentFirst,
          disabled: !isCurrentDone,
          accent: false,
          onClick: () => navigate(pathForItem(nextStep.item)),
        };

      case "tech-check":
        return {
          label: uk.lessonNav.goToTechCheck,
          hint: uk.lessonNav.allLessonsDone,
          disabled: false,
          accent: true,
          onClick: () => navigate(pathForItem(nextStep.item)),
        };

      case "tech-check-locked":
        return {
          label: uk.lessonNav.techCheckLocked,
          hint: uk.lessonNav.lessonsLeft(nextStep.remaining),
          disabled: true,
          accent: false,
        };

      case "module-complete":
        if (!state.isModuleComplete) {
          return {
            label: uk.lessonNav.finishTechCheck,
            hint: uk.lessonNav.finishTechCheckHint,
            disabled: true,
            accent: false,
          };
        }
        return nextModule
          ? {
              label: uk.lessonNav.nextModule,
              hint: nextModule.title,
              disabled: false,
              accent: true,
              onClick: () => navigate(`/student/courses/${courseId}`),
            }
          : {
              label: uk.lessonNav.courseDone,
              hint: uk.lessonNav.pickNextCourse,
              disabled: false,
              accent: true,
              onClick: () => navigate("/student/learning"),
            };

      default:
        return { label: uk.lessonNav.nextLesson, disabled: true, accent: false };
    }
  };

  const nextAction = buildNextAction();

  return (
    <div className={styles.navigationContainer}>
      <button
        onClick={() => previousItem && navigate(pathForItem(previousItem))}
        disabled={!previousItem}
        className={styles.navButton}
      >
        {uk.lessonNav.previous}
      </button>

      <button
        onClick={nextAction.onClick}
        disabled={nextAction.disabled}
        title={nextAction.hint}
        className={`${styles.navButton} ${nextAction.accent ? styles.accent : ""}`}
      >
        <span>{nextAction.label}</span>
        {nextAction.hint && <small className={styles.hint}>{nextAction.hint}</small>}
      </button>
    </div>
  );
};

export default LessonNavigation;
