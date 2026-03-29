import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { contentApi } from "../../api/contentApi";
import type { RootState } from "..";
import type { CourseDTO, LessonDTO, LessonListItemDTO, TrackDTO } from "../../types/content";

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

type ContentState = {
  tracks: TrackDTO[];
  coursesByTrack: Record<string, CourseDTO[]>;
  courseById: Record<string, CourseDTO>;
  lessonsByCourse: Record<string, LessonListItemDTO[]>;
  lessonById: Record<string, LessonDTO>;
  status: {
    tracks: LoadingStatus;
    coursesByTrack: Record<string, LoadingStatus>;
    lessonsByCourse: Record<string, LoadingStatus>;
    lessonById: Record<string, LoadingStatus>;
  };
  error: string | null;
};

const initialState: ContentState = {
  tracks: [],
  coursesByTrack: {},
  courseById: {},
  lessonsByCourse: {},
  lessonById: {},
  status: {
    tracks: "idle",
    coursesByTrack: {},
    lessonsByCourse: {},
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

export const fetchCourseLessons = createAsyncThunk(
  "content/fetchCourseLessons",
  async (courseId: string) => {
    const lessons = await contentApi.getCourseLessons(courseId);
    return { courseId, lessons };
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
      .addCase(fetchCourseLessons.pending, (state, action) => {
        state.status.lessonsByCourse[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchCourseLessons.fulfilled, (state, action) => {
        const { courseId, lessons } = action.payload;
        state.lessonsByCourse[courseId] = lessons;
        state.status.lessonsByCourse[courseId] = "succeeded";
      })
      .addCase(fetchCourseLessons.rejected, (state, action) => {
        state.status.lessonsByCourse[action.meta.arg] = "failed";
        state.error = action.error.message ?? "Не вдалося завантажити уроки";
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

export const { hydrateCourse } = contentSlice.actions;

export const selectTracks = (state: RootState) => state.content.tracks;
export const selectCoursesByTrack = (state: RootState, trackSlug: string) =>
  state.content.coursesByTrack[trackSlug] ?? [];
export const selectCourseLessons = (state: RootState, courseId: string) =>
  state.content.lessonsByCourse[courseId] ?? [];
export const selectLessonById = (state: RootState, lessonId: string) =>
  state.content.lessonById[lessonId] ?? null;
export const selectTracksStatus = (state: RootState) => state.content.status.tracks;
export const selectCoursesByTrackStatus = (state: RootState, trackSlug: string) =>
  state.content.status.coursesByTrack[trackSlug] ?? "idle";
export const selectCourseLessonsStatus = (state: RootState, courseId: string) =>
  state.content.status.lessonsByCourse[courseId] ?? "idle";
export const selectLessonStatus = (state: RootState, lessonId: string) =>
  state.content.status.lessonById[lessonId] ?? "idle";
export const selectContentError = (state: RootState) => state.content.error;

export default contentSlice.reducer;
