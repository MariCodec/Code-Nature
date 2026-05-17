import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { contentApi } from "../../api/contentApi";
import type { RootState } from "..";
import type {
  CourseDTO,
  CourseModuleDTO,
  LessonDTO,
  LessonListItemDTO,
  TrackDTO,
} from "../../types/content";

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

type ContentState = {
  tracks: TrackDTO[];
  coursesByTrack: Record<string, CourseDTO[]>;
  courseById: Record<string, CourseDTO>;
  modulesByCourse: Record<string, CourseModuleDTO[]>;
  moduleById: Record<string, CourseModuleDTO>;
  lessonsByModule: Record<string, LessonListItemDTO[]>;
  lessonById: Record<string, LessonDTO>;
  status: {
    tracks: LoadingStatus;
    coursesByTrack: Record<string, LoadingStatus>;
    modulesByCourse: Record<string, LoadingStatus>;
    lessonsByModule: Record<string, LoadingStatus>;
    lessonById: Record<string, LoadingStatus>;
  };
  error: string | null;
};

const initialState: ContentState = {
  tracks: [],
  coursesByTrack: {},
  courseById: {},
  modulesByCourse: {},
  moduleById: {},
  lessonsByModule: {},
  lessonById: {},
  status: {
    tracks: "idle",
    coursesByTrack: {},
    modulesByCourse: {},
    lessonsByModule: {},
    lessonById: {},
  },
  error: null,
};

export const fetchTracks = createAsyncThunk("content/fetchTracks", async () => {
  return contentApi.getTracks();
});

export const fetchCoursesByTrack = createAsyncThunk(
  "content/fetchCoursesByTrack",
  async (trackSlug: string) => {
    const courses = await contentApi.getCoursesByTrack(trackSlug);
    return { trackSlug, courses };
  },
);

export const fetchCourseModules = createAsyncThunk(
  "content/fetchCourseModules",
  async (courseId: string) => {
    const modules = await contentApi.getCourseModules(courseId);
    return { courseId, modules };
  },
);

export const fetchModuleLessons = createAsyncThunk(
  "content/fetchModuleLessons",
  async (moduleId: string) => {
    const lessons = await contentApi.getModuleLessons(moduleId);
    return { moduleId, lessons };
  },
);

export const fetchLessonById = createAsyncThunk(
  "content/fetchLessonById",
  async (lessonId: string, { rejectWithValue }) => {
    const lesson = await contentApi.getLesson(lessonId);
    if (!lesson) {
      return rejectWithValue("Урок не знайдено");
    }
    return lesson;
  },
);

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    hydrateCourse(state, action: PayloadAction<CourseDTO>) {
      state.courseById[action.payload.id] = action.payload;
    },
    hydrateCourseModule(state, action: PayloadAction<CourseModuleDTO>) {
      state.moduleById[action.payload.id] = action.payload;
      const existing = state.modulesByCourse[action.payload.courseId] ?? [];
      state.modulesByCourse[action.payload.courseId] = [
        ...existing.filter((item) => item.id !== action.payload.id),
        action.payload,
      ].sort((a, b) => a.orderIndex - b.orderIndex);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTracks.pending, (state) => {
        state.status.tracks = "loading";
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.tracks = action.payload;
        state.status.tracks = "succeeded";
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.status.tracks = "failed";
        state.error = action.error.message ?? "Не вдалося завантажити треки";
      })
      .addCase(fetchCoursesByTrack.pending, (state, action) => {
        state.status.coursesByTrack[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchCoursesByTrack.fulfilled, (state, action) => {
        const { trackSlug, courses } = action.payload;
        state.coursesByTrack[trackSlug] = courses;
        courses.forEach((course) => {
          state.courseById[course.id] = course;
        });
        state.status.coursesByTrack[trackSlug] = "succeeded";
      })
      .addCase(fetchCoursesByTrack.rejected, (state, action) => {
        state.status.coursesByTrack[action.meta.arg] = "failed";
        state.error = action.error.message ?? "Не вдалося завантажити курси";
      })
      .addCase(fetchCourseModules.pending, (state, action) => {
        state.status.modulesByCourse[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchCourseModules.fulfilled, (state, action) => {
        const { courseId, modules } = action.payload;
        state.modulesByCourse[courseId] = modules;
        modules.forEach((module) => {
          state.moduleById[module.id] = module;
        });
        state.status.modulesByCourse[courseId] = "succeeded";
      })
      .addCase(fetchCourseModules.rejected, (state, action) => {
        state.status.modulesByCourse[action.meta.arg] = "failed";
        state.error = action.error.message ?? "Не вдалося завантажити модулі";
      })
      .addCase(fetchModuleLessons.pending, (state, action) => {
        state.status.lessonsByModule[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchModuleLessons.fulfilled, (state, action) => {
        const { moduleId, lessons } = action.payload;
        state.lessonsByModule[moduleId] = lessons;
        state.status.lessonsByModule[moduleId] = "succeeded";
      })
      .addCase(fetchModuleLessons.rejected, (state, action) => {
        state.status.lessonsByModule[action.meta.arg] = "failed";
        state.error = action.error.message ?? "Не вдалося завантажити уроки модуля";
      })
      .addCase(fetchLessonById.pending, (state, action) => {
        state.status.lessonById[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.lessonById[action.payload.id] = action.payload;
        state.status.lessonById[action.payload.id] = "succeeded";
      })
      .addCase(fetchLessonById.rejected, (state, action) => {
        state.status.lessonById[action.meta.arg] = "failed";
        state.error =
          (typeof action.payload === "string" ? action.payload : null) ??
          action.error.message ??
          "Не вдалося завантажити урок";
      });
  },
});

export const { hydrateCourse, hydrateCourseModule } = contentSlice.actions;

export const selectTracks = (state: RootState) => state.content.tracks;
export const selectCoursesByTrack = (state: RootState, trackSlug: string) =>
  state.content.coursesByTrack[trackSlug] ?? [];
export const selectCourseLessons = (state: RootState, courseId: string) =>
  state.content.modulesByCourse[courseId]?.flatMap(
    (module) => state.content.lessonsByModule[module.id] ?? [],
  ) ?? [];
export const selectCourseModules = (state: RootState, courseId: string) =>
  state.content.modulesByCourse[courseId] ?? [];
export const selectModuleLessons = (state: RootState, moduleId: string) =>
  state.content.lessonsByModule[moduleId] ?? [];
export const selectLessonById = (state: RootState, lessonId: string) =>
  state.content.lessonById[lessonId] ?? null;
export const selectTracksStatus = (state: RootState) => state.content.status.tracks;
export const selectCoursesByTrackStatus = (state: RootState, trackSlug: string) =>
  state.content.status.coursesByTrack[trackSlug] ?? "idle";
export const selectCourseLessonsStatus = (state: RootState, courseId: string) =>
  state.content.modulesByCourse[courseId]?.some((module) => {
    const status = state.content.status.lessonsByModule[module.id] ?? "idle";
    return status === "idle" || status === "loading";
  })
    ? "loading"
    : state.content.modulesByCourse[courseId]
      ? "succeeded"
      : "idle";
export const selectCourseModulesStatus = (state: RootState, courseId: string) =>
  state.content.status.modulesByCourse[courseId] ?? "idle";
export const selectModuleLessonsStatus = (state: RootState, moduleId: string) =>
  state.content.status.lessonsByModule[moduleId] ?? "idle";
export const selectLessonStatus = (state: RootState, lessonId: string) =>
  state.content.status.lessonById[lessonId] ?? "idle";
export const selectContentError = (state: RootState) => state.content.error;

export default contentSlice.reducer;
