import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { teacherApi } from "../../api/teacherApi";
import type {
  TeacherStudentCodeSnapshotDTO,
  TeacherStudentDetailsDTO,
  TeacherStudentListItemDTO,
} from "../../types/content";

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

type TeacherState = {
  students: TeacherStudentListItemDTO[];
  studentById: Record<string, TeacherStudentDetailsDTO>;
  status: {
    students: LoadingStatus;
    studentById: Record<string, LoadingStatus>;
    studentProgressById: Record<string, LoadingStatus>;
    studentCodeById: Record<string, LoadingStatus>;
  };
  studentCodeByLesson: Record<string, Record<string, TeacherStudentCodeSnapshotDTO | null>>;
  error: string | null;
};

const initialState: TeacherState = {
  students: [],
  studentById: {},
  status: {
    students: "idle",
    studentById: {},
    studentProgressById: {},
    studentCodeById: {},
  },
  studentCodeByLesson: {},
  error: null,
};

export const fetchTeacherStudents = createAsyncThunk(
  "teacher/fetchStudents",
  async () => {
    return teacherApi.getStudents();
  },
);

export const fetchTeacherStudentById = createAsyncThunk(
  "teacher/fetchStudentById",
  async (studentId: string, { rejectWithValue }) => {
    const student = await teacherApi.getStudentById(studentId);
    if (!student) {
      return rejectWithValue("Учня не знайдено");
    }
    return student;
  },
);

export const fetchTeacherStudentProgress = createAsyncThunk(
  "teacher/fetchStudentProgress",
  async (studentId: string, { rejectWithValue }) => {
    const progress = await teacherApi.getStudentProgress(studentId);
    if (!progress) {
      return rejectWithValue("Прогрес учня не знайдено");
    }
    return { studentId, progress };
  },
);

export const fetchTeacherStudentCode = createAsyncThunk(
  "teacher/fetchStudentCode",
  async (
    { studentId, lessonId }: { studentId: string; lessonId: string },
    { rejectWithValue },
  ) => {
    const code = await teacherApi.getStudentCode(studentId, lessonId);
    if (!code) {
      return rejectWithValue("Код учня не знайдено");
    }
    return { studentId, lessonId, code };
  },
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeacherStudents.pending, (state) => {
        state.status.students = "loading";
        state.error = null;
      })
      .addCase(fetchTeacherStudents.fulfilled, (state, action) => {
        state.students = action.payload;
        state.status.students = "succeeded";
      })
      .addCase(fetchTeacherStudents.rejected, (state, action) => {
        state.status.students = "failed";
        state.error = action.error.message ?? "Не вдалося завантажити учнів";
      })
      .addCase(fetchTeacherStudentById.pending, (state, action) => {
        state.status.studentById[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchTeacherStudentById.fulfilled, (state, action) => {
        state.studentById[action.payload.id] = action.payload;
        state.status.studentById[action.payload.id] = "succeeded";
      })
      .addCase(fetchTeacherStudentById.rejected, (state, action) => {
        state.status.studentById[action.meta.arg] = "failed";
        state.error =
          (typeof action.payload === "string" ? action.payload : null) ??
          action.error.message ??
          "Не вдалося завантажити дані учня";
      })
      .addCase(fetchTeacherStudentProgress.pending, (state, action) => {
        state.status.studentProgressById[action.meta.arg] = "loading";
        state.error = null;
      })
      .addCase(fetchTeacherStudentProgress.fulfilled, (state, action) => {
        const { studentId, progress } = action.payload;
        const existingStudent = state.studentById[studentId];

        if (existingStudent) {
          existingStudent.currentLessonId = progress.currentLessonId;
          existingStudent.lessonProgress = progress.lessonProgress;
          existingStudent.taskProgress = progress.taskProgress;
          existingStudent.completedLessonsCount = progress.lessonProgress.filter(
            (lesson) => lesson.status === "completed",
          ).length;
        }

        state.status.studentProgressById[studentId] = "succeeded";
      })
      .addCase(fetchTeacherStudentProgress.rejected, (state, action) => {
        state.status.studentProgressById[action.meta.arg] = "failed";
        state.error =
          (typeof action.payload === "string" ? action.payload : null) ??
          action.error.message ??
          "Не вдалося завантажити прогрес учня";
      })
      .addCase(fetchTeacherStudentCode.pending, (state, action) => {
        state.status.studentCodeById[action.meta.arg.studentId] = "loading";
        state.error = null;
      })
      .addCase(fetchTeacherStudentCode.fulfilled, (state, action) => {
        const { studentId, lessonId, code } = action.payload;

        if (!state.studentCodeByLesson[studentId]) {
          state.studentCodeByLesson[studentId] = {};
        }

        state.studentCodeByLesson[studentId][lessonId] = code;
        state.status.studentCodeById[studentId] = "succeeded";
      })
      .addCase(fetchTeacherStudentCode.rejected, (state, action) => {
        state.status.studentCodeById[action.meta.arg.studentId] = "failed";
        state.error =
          (typeof action.payload === "string" ? action.payload : null) ??
          action.error.message ??
          "Не вдалося завантажити код учня";
      });
  },
});

export const selectTeacherStudents = (state: RootState) => state.teacher.students;
export const selectTeacherStudentsStatus = (state: RootState) =>
  state.teacher.status.students;
export const selectTeacherStudentById = (state: RootState, studentId: string) =>
  state.teacher.studentById[studentId] ?? null;
export const selectTeacherStudentStatus = (state: RootState, studentId: string) =>
  state.teacher.status.studentById[studentId] ?? "idle";
export const selectTeacherStudentProgressStatus = (
  state: RootState,
  studentId: string,
) => state.teacher.status.studentProgressById[studentId] ?? "idle";
export const selectTeacherStudentCodeStatus = (
  state: RootState,
  studentId: string,
) => state.teacher.status.studentCodeById[studentId] ?? "idle";
export const selectTeacherStudentCodeByLesson = (
  state: RootState,
  studentId: string,
  lessonId: string,
) => state.teacher.studentCodeByLesson[studentId]?.[lessonId] ?? null;
export const selectTeacherError = (state: RootState) => state.teacher.error;

export default teacherSlice.reducer;
