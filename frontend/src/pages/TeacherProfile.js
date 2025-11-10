import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { coursesAPI, evaluationsAPI } from "../services/api";
import {
  User,
  BookOpen,
  Award,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import "./TeacherProfile.css";

const TeacherProfile = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasPermission = isTeacher || isAdmin;

  const fetchTeacherData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch courses taught by this teacher
      const coursesResponse = await coursesAPI.getByTeacher(user._id);
      setCourses(coursesResponse.data.data);

      // Fetch evaluations given by this teacher
      const evaluationsResponse = await evaluationsAPI.getAll({
        teacher: user._id,
      });
      setEvaluations(evaluationsResponse.data.data.evaluations);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      setError("Failed to load teacher profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (hasPermission && user?._id) {
      fetchTeacherData();
    }
  }, [hasPermission, fetchTeacherData, user]);

  const getTotalStudents = () => {
    // This would ideally come from a separate API endpoint
    // For now, we'll count unique students from evaluations
    const uniqueStudents = new Set(
      evaluations.map((evaluation) => evaluation.student._id)
    );
    return uniqueStudents.size;
  };

  const getTotalEvaluations = () => {
    return evaluations.length;
  };

  const getAverageScore = () => {
    if (evaluations.length === 0) return 0;
    const totalPercentage = evaluations.reduce((sum, evaluation) => {
      return sum + (evaluation.score / evaluation.maxScore) * 100;
    }, 0);
    return Math.round(totalPercentage / evaluations.length);
  };

  const getCoursesByGrade = () => {
    const coursesByGrade = {};
    courses.forEach((course) => {
      const gradeName = course.grade.name;
      if (!coursesByGrade[gradeName]) {
        coursesByGrade[gradeName] = [];
      }
      coursesByGrade[gradeName].push(course);
    });
    return coursesByGrade;
  };

  const getRecentEvaluations = () => {
    return evaluations
      .sort((a, b) => new Date(b.evaluationDate) - new Date(a.evaluationDate))
      .slice(0, 5);
  };

  if (!hasPermission) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const coursesByGrade = getCoursesByGrade();
  const recentEvaluations = getRecentEvaluations();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.fullName} />
            ) : (
              <div className="avatar-placeholder">
                <User size={32} />
              </div>
            )}
          </div>
          <div className="profile-details">
            <h1>{user.fullName}</h1>
            <p className="profile-role">Teacher</p>
            <p className="profile-email">{user.email}</p>
            {user.teacherProfile?.employeeNumber && (
              <p className="profile-id">
                Employee ID: {user.teacherProfile.employeeNumber}
              </p>
            )}
            {user.teacherProfile?.specializations &&
              user.teacherProfile.specializations.length > 0 && (
                <div className="specializations">
                  <span>Specializations: </span>
                  <span className="specialization-list">
                    {user.teacherProfile.specializations.join(", ")}
                  </span>
                </div>
              )}
          </div>
        </div>
        <div className="overall-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <BookOpen size={24} />
            </div>
            <div className="stat-content">
              <h3>{courses.length}</h3>
              <p>Courses Teaching</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>{getTotalStudents()}</h3>
              <p>Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-content">
              <h3>{getTotalEvaluations()}</h3>
              <p>Evaluations Given</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>{getAverageScore()}%</h3>
              <p>Average Score</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="profile-content">
        <div className="courses-section">
          <h2>Courses Teaching</h2>
          {courses.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <h3>No courses assigned</h3>
              <p>You haven't been assigned to any courses yet.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {Object.entries(coursesByGrade).map(
                ([gradeName, gradeCourses]) => (
                  <div key={gradeName} className="grade-section">
                    <h3 className="grade-title">{gradeName}</h3>
                    <div className="grade-courses">
                      {gradeCourses.map((course) => (
                        <div key={course._id} className="course-card">
                          <div className="course-header">
                            <h4>{course.name}</h4>
                            <span className="course-code">{course.code}</span>
                          </div>
                          {course.description && (
                            <p className="course-description">
                              {course.description}
                            </p>
                          )}
                          <div className="course-info">
                            <span className="max-score">
                              Max Score: {course.maxScore}
                            </span>
                            <span
                              className={`status ${
                                course.isActive ? "active" : "inactive"
                              }`}
                            >
                              {course.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {recentEvaluations.length > 0 && (
          <div className="recent-evaluations">
            <h2>Recent Evaluations</h2>
            <div className="evaluations-list">
              {recentEvaluations.map((evaluation) => {
                const percentage = Math.round(
                  (evaluation.score / evaluation.maxScore) * 100
                );
                return (
                  <div key={evaluation._id} className="evaluation-item">
                    <div className="evaluation-main">
                      <div className="evaluation-title">
                        <h4>{evaluation.title}</h4>
                        <span className="evaluation-type">
                          {evaluation.evaluationType}
                        </span>
                      </div>
                      <div className="evaluation-meta">
                        <div className="student-info">
                          <Users size={16} />
                          <span>{evaluation.student.fullName}</span>
                        </div>
                        <div className="course-info">
                          <BookOpen size={16} />
                          <span>{evaluation.course.name}</span>
                        </div>
                        <div className="date-info">
                          <Calendar size={16} />
                          <span>
                            {new Date(
                              evaluation.evaluationDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="evaluation-score">
                      <div
                        className={`score-display ${getScoreColor(percentage)}`}
                      >
                        <span className="score">{evaluation.score}</span>
                        <span className="max-score">
                          /{evaluation.maxScore}
                        </span>
                        <span className="percentage">({percentage}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function getScoreColor(percentage) {
    if (percentage >= 90) return "excellent";
    if (percentage >= 80) return "good";
    if (percentage >= 70) return "average";
    if (percentage >= 60) return "pass";
    return "fail";
  }
};

export default TeacherProfile;
