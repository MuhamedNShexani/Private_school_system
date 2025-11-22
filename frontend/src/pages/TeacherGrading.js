import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  studentsAPI,
  subjectsAPI,
  evaluationsAPI,
  seasonsAPI,
  chaptersAPI,
  partsAPI,
} from "../services/api";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Users,
  TrendingUp,
  Search,
} from "lucide-react";
import "./TeacherGrading.css";

const TeacherGrading = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [parts, setParts] = useState([]);

  // Ensure parts is always an array
  const safeParts = Array.isArray(parts) ? parts : [];
  const [evaluations, setEvaluations] = useState([]);

  // Debug parts state changes
  useEffect(() => {
    console.log(
      "Parts state changed:",
      parts,
      "Type:",
      typeof parts,
      "IsArray:",
      Array.isArray(parts)
    );
  }, [parts]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    student: "",
    subject: "",
    season: "",
    chapter: "",
    part: "",
    title: "",
    description: "",
    score: "",
    maxScore: 100,
    evaluationType: "Quiz",
    evaluationDate: new Date().toISOString().split("T")[0],
  });

  const hasPermission = isTeacher || isAdmin;

  useEffect(() => {
    if (hasPermission) {
      fetchData();
    }
  }, [hasPermission]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, subjectsRes, evaluationsRes] = await Promise.all([
        studentsAPI.getAll(),
        subjectsAPI.getAll(),
        evaluationsAPI.getAll(),
      ]);

      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
      setEvaluations(evaluationsRes.data.data.evaluations);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async (subjectId) => {
    try {
      const response = await seasonsAPI.getAll();
      setSeasons(response.data || []);
    } catch (error) {
      console.error("Error fetching seasons:", error);
      setSeasons([]);
    }
  };

  const fetchChapters = async (seasonId) => {
    try {
      const response = await chaptersAPI.getAll();
      setChapters(response.data || []);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
    }
  };

  const fetchParts = async (chapterId) => {
    try {
      const response = await partsAPI.getAll();
      console.log("Parts API response:", response);
      console.log("Parts data:", response.data);

      // Handle different possible response structures
      let partsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          partsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          partsData = response.data.data;
        }
      }

      console.log("Setting parts to:", partsData);
      setParts(partsData);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setParts([]);
    }
  };

  // Filter students based on teacher's assigned classes and branches
  useEffect(() => {
    if (user?.role === "Teacher" && user?.teacherProfile) {
      const teacherClasses = user.teacherProfile.classes || [];
      const teacherBranches = user.teacherProfile.branches || [];

      const filtered = students.filter((student) => {
        // If teacher has no assigned classes/branches, show all students
        if (teacherClasses.length === 0 && teacherBranches.length === 0) {
          return true;
        }

        // Check if student's class matches teacher's assigned classes
        const studentClassId =
          student.studentProfile?.class?._id || student.class?._id;
        const studentBranchId =
          student.studentProfile?.branchID || student.branchID;

        // Check class match
        const classMatch =
          teacherClasses.length === 0 ||
          teacherClasses.some(
            (cls) => cls._id === studentClassId || cls === studentClassId
          );

        // Check branch match
        const branchMatch =
          teacherBranches.length === 0 ||
          teacherBranches.some(
            (branch) =>
              branch._id === studentBranchId || branch === studentBranchId
          );

        return classMatch && branchMatch;
      });

      setFilteredStudents(filtered);
    } else {
      // For admins, show all students
      setFilteredStudents(students);
    }
  }, [students, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let evaluationData;
    try {
      evaluationData = {
        student: formData.student,
        course: formData.subject, // Map subject to course
        semester: formData.season, // Map season to semester
        unit: formData.chapter, // Map chapter to unit
        topic: formData.part, // Map part to topic
        title: formData.title,
        description: formData.description,
        score: parseFloat(formData.score),
        maxScore: parseFloat(formData.maxScore),
        evaluationType: formData.evaluationType,
        evaluationDate: formData.evaluationDate,
        teacher: user._id,
      };

      console.log("Sending evaluation data:", evaluationData);

      if (editingEvaluation) {
        await evaluationsAPI.update(editingEvaluation._id, evaluationData);
      } else {
        await evaluationsAPI.create(evaluationData);
      }
      setShowModal(false);
      setEditingEvaluation(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        evaluationData: evaluationData,
      });
      setError(
        `Failed to save evaluation: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleEdit = (evaluation) => {
    setEditingEvaluation(evaluation);
    setFormData({
      student: evaluation.student._id,
      subject: evaluation.subject?._id || evaluation.course?._id || "",
      season: evaluation.season?._id || evaluation.semester?._id || "",
      chapter: evaluation.chapter?._id || evaluation.unit?._id || "",
      part: evaluation.part?._id || evaluation.topic?._id || "",
      title: evaluation.title,
      description: evaluation.description || "",
      score: evaluation.score.toString(),
      maxScore: evaluation.maxScore.toString(),
      evaluationType: evaluation.evaluationType,
      evaluationDate: new Date(evaluation.evaluationDate)
        .toISOString()
        .split("T")[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (evaluationId) => {
    if (window.confirm("Are you sure you want to delete this evaluation?")) {
      try {
        await evaluationsAPI.delete(evaluationId);
        fetchData();
      } catch (error) {
        console.error("Error deleting evaluation:", error);
        setError("Failed to delete evaluation");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      student: "",
      subject: "",
      season: "",
      chapter: "",
      part: "",
      title: "",
      description: "",
      score: "",
      maxScore: 100,
      evaluationType: "Quiz",
      evaluationDate: new Date().toISOString().split("T")[0],
    });
  };

  const openModal = () => {
    setEditingEvaluation(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvaluation(null);
    resetForm();
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      evaluation.student?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      evaluation.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject =
      !selectedSubject ||
      evaluation.subject?._id === selectedSubject ||
      evaluation.course?._id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return "excellent";
    if (percentage >= 80) return "good";
    if (percentage >= 70) return "average";
    if (percentage >= 60) return "pass";
    return "fail";
  };

  if (!hasPermission) {
    return (
      <div className="grading-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the grading system.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grading-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t("general.loading", "Loading ... ")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grading-container">
      <div className="grading-header">
        <div className="header-content">
          <h1>
            <BookOpen size={32} />
            Grade Management
          </h1>
          <button onClick={openModal} className="add-btn">
            <Plus size={20} />
            Add Grade
          </button>
        </div>
        <div className="filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search students or evaluations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-filter"
          >
            <option value="">All Subjects</option>
            {(subjects || []).map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.title?.en ||
                  subject.title ||
                  subject.name ||
                  "Unknown Subject"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="evaluations-grid">
        {filteredEvaluations.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={48} />
            <h3>No evaluations found</h3>
            <p>Start by adding grades for your students.</p>
            <button onClick={openModal} className="add-btn">
              <Plus size={20} />
              Add Grade
            </button>
          </div>
        ) : (
          filteredEvaluations.map((evaluation) => {
            const percentage =
              evaluation.maxScore > 0
                ? Math.round((evaluation.score / evaluation.maxScore) * 100)
                : 0;
            return (
              <div key={evaluation._id} className="evaluation-card">
                <div className="evaluation-header">
                  <h3>{evaluation.title}</h3>
                  <span
                    className={`evaluation-type ${evaluation.evaluationType.toLowerCase()}`}
                  >
                    {evaluation.evaluationType}
                  </span>
                </div>
                <div className="evaluation-details">
                  <div className="student-info">
                    <Users size={16} />
                    <span>
                      {evaluation.student?.fullName || "Unknown Student"}
                    </span>
                  </div>
                  <div className="subject-info">
                    <BookOpen size={16} />
                    <span>
                      {evaluation.subject?.title?.en ||
                        evaluation.subject?.title ||
                        evaluation.course?.name ||
                        "Unknown Subject"}
                    </span>
                  </div>
                  <div className="date-info">
                    <span>
                      {new Date(evaluation.evaluationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="score-section">
                  <div className={`score-display ${getScoreColor(percentage)}`}>
                    <span className="score">{evaluation.score}</span>
                    <span className="max-score">/{evaluation.maxScore}</span>
                    <span className="percentage">({percentage}%)</span>
                  </div>
                </div>
                {evaluation.description && (
                  <div className="evaluation-description">
                    <p>{evaluation.description}</p>
                  </div>
                )}
                <div className="evaluation-actions">
                  <button
                    onClick={() => handleEdit(evaluation)}
                    className="action-btn edit"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(evaluation._id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingEvaluation ? "Edit Evaluation" : "Add New Grade"}</h2>
              <button onClick={closeModal} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Student</label>
                  <select
                    value={formData.student}
                    onChange={(e) =>
                      setFormData({ ...formData, student: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Student</option>
                    {filteredStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        subject: e.target.value,
                        season: "",
                        chapter: "",
                        part: "",
                      });
                      if (e.target.value) {
                        fetchSeasons(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Select Subject</option>
                    {(subjects || []).map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.title?.en ||
                          subject.title ||
                          subject.name ||
                          "Unknown Subject"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        season: e.target.value,
                        chapter: "",
                        part: "",
                      });
                      if (e.target.value) {
                        fetchChapters(e.target.value);
                      }
                    }}
                    required
                    disabled={!formData.subject}
                  >
                    <option value="">Select Season</option>
                    {(seasons || []).map((season) => (
                      <option key={season._id} value={season._id}>
                        {season?.name?.en || season?.name || "Unknown Season"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Chapter</label>
                  <select
                    value={formData.chapter}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        chapter: e.target.value,
                        part: "",
                      });
                      if (e.target.value) {
                        fetchParts(e.target.value);
                      }
                    }}
                    required
                    disabled={!formData.season}
                  >
                    <option value="">Select Chapter</option>
                    {(chapters || []).map((chapter) => (
                      <option key={chapter._id} value={chapter._id}>
                        {chapter?.title?.en ||
                          chapter?.title ||
                          chapter?.name ||
                          "Unknown Chapter"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Part</label>
                  <select
                    value={formData.part}
                    onChange={(e) =>
                      setFormData({ ...formData, part: e.target.value })
                    }
                    required
                    disabled={!formData.chapter}
                  >
                    <option value="">Select Part</option>
                    {safeParts.map((part) => (
                      <option key={part._id} value={part._id}>
                        {part?.title?.en ||
                          part?.title ||
                          part?.name ||
                          "Unknown Part"}{" "}
                        ({part?.difficulty || "Unknown"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Evaluation Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="e.g., Quiz 1, Midterm Exam"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Score</label>
                  <input
                    type="number"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({ ...formData, score: e.target.value })
                    }
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Max Score</label>
                  <input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) =>
                      setFormData({ ...formData, maxScore: e.target.value })
                    }
                    required
                    min="1"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Evaluation Type</label>
                  <select
                    value={formData.evaluationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evaluationType: e.target.value,
                      })
                    }
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Exam">Exam</option>
                    <option value="Project">Project</option>
                    <option value="Participation">Participation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.evaluationDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evaluationDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  placeholder="Additional notes or comments..."
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingEvaluation ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGrading;
