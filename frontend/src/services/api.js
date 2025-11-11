import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If data is FormData, remove Content-Type header to let the browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Seasons API
export const seasonsAPI = {
  getAll: (params) => api.get("/seasons", { params }),
  getById: (id, params) => api.get(`/seasons/${id}`, { params }),
  create: (data) => api.post("/seasons", data),
  update: (id, data) => api.put(`/seasons/${id}`, data),
  delete: (id) => api.delete(`/seasons/${id}`),
};

// Chapters API
export const chaptersAPI = {
  getAll: () => api.get("/chapters"),
  getById: (id) => api.get(`/chapters/${id}`),
  getBySeason: (seasonId) => api.get(`/chapters/season/${seasonId}`),
  create: (data) => api.post("/chapters", data),
  update: (id, data) => api.put(`/chapters/${id}`, data),
  delete: (id) => api.delete(`/chapters/${id}`),
};

// Subjects API
export const subjectsAPI = {
  getAll: (params) => api.get("/subjects", { params }),
  getById: (id, params) => api.get(`/subjects/${id}`, { params }),
  getByClass: (classId, params) =>
    api.get(`/subjects/class/${classId}`, { params }),
  getByChapter: (chapterId, params) =>
    api.get(`/subjects/chapter/${chapterId}`, { params }),
  create: (data) => api.post("/subjects", data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Students API
export const studentsAPI = {
  getAll: () => api.get("/students"),
  getById: (id) => api.get(`/students/${id}`),
  getByClass: (classId) => api.get(`/students/class/${classId}`),
  getByUsername: (username) => api.get(`/students/username/${username}`),
  create: (data) => api.post("/students", data),
  update: (id, data) => api.put(`/students/${id}`, data),
  updateStatus: (id, subjectId, status) =>
    api.patch(`/students/${id}/status/${subjectId}`, { status }),
  delete: (id) => api.delete(`/students/${id}`),
  // Rating endpoints
  getByRatingBranch: (branchId) => api.get(`/students/rating/branch/${branchId}`),
  saveRating: (studentId, ratingData) => api.post(`/students/${studentId}/rating`, ratingData),
  getRatings: (studentId) => api.get(`/students/${studentId}/ratings`),
  getRatingsByDateSeason: (classId, branchId, date, season) =>
    api.get(`/students/bulk/byDateSeason/${classId}/${branchId}`, {
      params: { date, season },
    }),
  // Admin endpoints
  getAllRatings: () => api.get(`/students/admin/allRatings`),
  deleteRating: (ratingId) => api.delete(`/students/admin/rating/${ratingId}`),
  updateRating: (ratingId, ratingData) => api.put(`/students/admin/rating/${ratingId}`, ratingData),
};

// Classes API
export const classesAPI = {
  getAll: (params) => api.get("/classes", { params }),
  getById: (id, params) => api.get(`/classes/${id}`, { params }),
  getActiveWithBranches: (params) =>
    api.get("/classes/active/branches", { params }),
  create: (data) => api.post("/classes", data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  updateBranches: (id, branches) =>
    api.patch(`/classes/${id}/branches`, { branches }),
  delete: (id) => api.delete(`/classes/${id}`),
};

// Teachers API
export const teachersAPI = {
  getAll: () => api.get("/teachers"),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post("/teachers", data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/teachers/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/teachers/${id}`),
};

// Grades API
export const gradesAPI = {
  getAll: () => api.get("/grades"),
  getById: (id) => api.get(`/grades/${id}`),
  create: (data) => api.post("/grades", data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/grades/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/grades/${id}`),
};

// Courses API
export const coursesAPI = {
  getAll: () => api.get("/courses"),
  getById: (id) => api.get(`/courses/${id}`),
  getByGrade: (gradeId) => api.get(`/courses/grade/${gradeId}`),
  getByTeacher: (teacherId) => api.get(`/courses/teacher/${teacherId}`),
  create: (data) => api.post("/courses", data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/courses/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Semesters API
export const semestersAPI = {
  getAll: (params) => api.get("/semesters", { params }),
  getById: (id) => api.get(`/semesters/${id}`),
  getByCourse: (courseId) => api.get(`/semesters/course/${courseId}`),
  create: (data) => api.post("/semesters", data),
  update: (id, data) => api.put(`/semesters/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/semesters/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/semesters/${id}`),
};

// Units API
export const unitsAPI = {
  getAll: (params) => api.get("/units", { params }),
  getById: (id) => api.get(`/units/${id}`),
  getBySemester: (semesterId) => api.get(`/units/semester/${semesterId}`),
  getByCourse: (courseId) => api.get(`/units/course/${courseId}`),
  create: (data) => api.post("/units", data),
  update: (id, data) => api.put(`/units/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/units/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/units/${id}`),
};

// Topics API
export const topicsAPI = {
  getAll: (params) => api.get("/topics", { params }),
  getById: (id) => api.get(`/topics/${id}`),
  getByUnit: (unitId) => api.get(`/topics/unit/${unitId}`),
  getBySemester: (semesterId) => api.get(`/topics/semester/${semesterId}`),
  getByCourse: (courseId) => api.get(`/topics/course/${courseId}`),
  create: (data) => api.post("/topics", data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/topics/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/topics/${id}`),
};

// Parts API
export const partsAPI = {
  getAll: (params) => api.get("/parts", { params }),
  getById: (id) => api.get(`/parts/${id}`),
  getByChapter: (chapterId) => api.get(`/parts/chapter/${chapterId}`),
  create: (data) => api.post("/parts", data),
  update: (id, data) => api.put(`/parts/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/parts/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/parts/${id}`),
};

// Quizzes API
export const quizzesAPI = {
  getAll: (params) => api.get("/quizzes", { params }),
  getById: (id, params) => api.get(`/quizzes/${id}`, { params }),
  getByChapter: (chapterId, params) =>
    api.get(`/quizzes/chapter/${chapterId}`, { params }),
  create: (data) => api.post("/quizzes", data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/quizzes/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/quizzes/${id}`),
};

// Exercises API
export const exercisesAPI = {
  getAll: (params) => api.get("/exercises", { params }),
  getById: (id) => api.get(`/exercises/${id}`),
  getByPart: (partId) => api.get(`/exercises/part/${partId}`),
  getSeasonTotalPoints: (seasonName) =>
    api.get(`/exercises/season/${seasonName}/total-points`),
  create: (data) => api.post("/exercises", data),
  update: (id, data) => api.put(`/exercises/${id}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/exercises/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/exercises/${id}`),
};

// Translations API
export const translationsAPI = {
  getAll: (params) => api.get("/translations", { params }),
  getByCategory: (category, params) =>
    api.get(`/translations/category/${category}`, { params }),
  getByKey: (key) => api.get(`/translations/key/${key}`),
  // Admin routes
  getAllAdmin: (params) => api.get("/translations/admin/all", { params }),
  create: (data) => api.post("/translations", data),
  update: (id, data) => api.put(`/translations/${id}`, data),
  updateByKey: (key, data) => api.put(`/translations/key/${key}`, data),
  updateStatus: (id, isActive) =>
    api.patch(`/translations/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/translations/${id}`),
  getCategories: () => api.get("/translations/admin/categories"),
};

// Evaluations API
export const evaluationsAPI = {
  getAll: (params) => api.get("/evaluations", { params }),
  getById: (id) => api.get(`/evaluations/${id}`),
  getByStudent: (studentId) => api.get(`/evaluations/student/${studentId}`),
  getByCourse: (courseId) => api.get(`/evaluations/course/${courseId}`),
  getByTopic: (topicId) => api.get(`/evaluations/topic/${topicId}`),
  create: (data) => api.post("/evaluations", data),
  update: (id, data) => api.put(`/evaluations/${id}`, data),
  delete: (id) => api.delete(`/evaluations/${id}`),
};

// Grading API
export const gradingAPI = {
  bulkGrade: (data) => api.post("/grading/bulk", data),
  getGradesByExercise: (exerciseId, classId, branchId) =>
    api.get(
      `/grading/exercise/${exerciseId}/class/${classId}/branch/${branchId}`
    ),
  getGradesByStudent: (studentId, params) =>
    api.get(`/grading/student/${studentId}`, { params }),
  deleteGrade: (id) => api.delete(`/grading/${id}`),
};

// Student Grades API
export const studentGradesAPI = {
  getAll: (params) => api.get("/studentGrades", { params }),
  getById: (id) => api.get(`/studentGrades/${id}`),
  getByStudent: (studentId) => api.get(`/studentGrades/student/${studentId}`),
  create: (data) => api.post("/studentGrades", data),
  update: (id, data) => api.put(`/studentGrades/${id}`, data),
  delete: (id) => api.delete(`/studentGrades/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getStudentProgress: (studentId, timeRange) =>
    api.get(`/analytics/student-progress/${studentId}`, {
      params: { timeRange },
    }),
};

// Authentication API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getCurrentUser: () => api.get("/auth/me"),
  updateProfile: (userData) => api.put("/auth/me", userData),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
  getUsers: (params) => api.get("/auth/users", { params }),
  updateUserStatus: (userId, isActive) =>
    api.put(`/auth/users/${userId}/status`, { isActive }),
};

export default api;
