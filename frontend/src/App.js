import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import { ToastProvider } from "./contexts/ToastContext";
import Header from "./components/Header";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Students from "./pages/Students";
import Programs from "./pages/Programs";
import Season from "./pages/Season";
import Chapter from "./pages/Chapter";
import Subject from "./pages/Subject";
import Part from "./pages/Part";
import ChapterQuizzes from "./pages/ChapterQuizzes";
import QuizPlayer from "./pages/QuizPlayer";
import StudentQuizzes from "./pages/StudentQuizzes";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCRUD from "./pages/AdminCRUD";
import StudentManagement from "./pages/StudentManagement";
import StudentProfile from "./pages/StudentProfile";
import PaymentsManagement from "./pages/PaymentsManagement";
import UpdatePayment from "./pages/UpdatePayment";
import TeacherProfile from "./pages/TeacherProfile";
import TranslationManagement from "./pages/TranslationManagement";
import "./App.css";

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="App">
      <Header>
        <Routes>
          <Route
            path="/"
            element={
              user?.role === "Teacher" ? (
                <ProtectedRoute requiredRole={["Teacher", "Admin"]}>
                  <Programs />
                </ProtectedRoute>
              ) : user?.role === "Student" ? (
                <ProtectedRoute requiredRole={["Student", "Teacher", "Admin"]}>
                  <StudentProfile />
                </ProtectedRoute>
              ) : (
                <ProtectedRoute requiredRole="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminCRUD />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute requiredRole="Admin">
                <StudentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute requiredRole="Admin">
                <PaymentsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments/update"
            element={
              <ProtectedRoute requiredRole="Admin">
                <UpdatePayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/translations"
            element={
              <ProtectedRoute requiredRole="Admin">
                <TranslationManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute requiredRole={["Teacher", "Admin"]}>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute requiredRole={["Student", "Teacher", "Admin"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quizzes"
            element={
              <ProtectedRoute requiredRole={["Student", "Teacher", "Admin"]}>
                <StudentQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programs"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <Programs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/season/:seasonId"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <Season />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapter/:chapterId"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <Chapter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapter/:chapterId/quizzes"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <ChapterQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:quizId/play"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher", "Student"]}>
                <QuizPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subject/:subjectId"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <Subject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/part/:partId"
            element={
              <ProtectedRoute requiredRole={["Admin", "Teacher"]}>
                <Part />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unauthorized"
            element={
              <div className="container">
                <div className="error">
                  <h2>Unauthorized Access</h2>
                  <p>You don't have permission to access this page.</p>
                  <button onClick={() => window.history.back()}>Go Back</button>
                </div>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TranslationProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </TranslationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
