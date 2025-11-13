import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { studentsAPI, gradesAPI, classesAPI } from "../services/api";
import { Plus, Edit, Trash2, Users, Search } from "lucide-react";
import "./StudentManagement.css";

const StudentManagement = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    grade: "",
    class: "",
    branchID: "",
    studentNumber: "",
    photo: "",
  });

  const hasPermission = isAdmin || isTeacher;

  useEffect(() => {
    if (hasPermission) {
      fetchData();
    }
  }, [hasPermission]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, gradesRes, classesRes] = await Promise.all([
        studentsAPI.getAll(),
        gradesAPI.getAll(),
        classesAPI.getAll(),
      ]);

      setStudents(studentsRes.data);
      setGrades(gradesRes.data.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, formData);
      } else {
        await studentsAPI.create(formData);
      }
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving student:", error);
      setError("Failed to save student");
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.fullName,
      gender: student.gender,
      grade: student.grade,
      class: student.class,
      branchID: student.branchID,
      studentNumber: student.studentNumber || "",
      photo: student.photo || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await studentsAPI.delete(studentId);
        fetchData();
      } catch (error) {
        console.error("Error deleting student:", error);
        setError("Failed to delete student");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "Male",
      grade: "",
      class: "",
      branchID: "",
      studentNumber: "",
      photo: "",
    });
  };

  const openModal = () => {
    setEditingStudent(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    resetForm();
  };

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasPermission) {
    return (
      <div className="management-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access student management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="management-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div className="header-content">
          <h1>
            <Users size={32} />
            Student Management
          </h1>
          <button onClick={openModal} className="add-btn">
            <Plus size={20} />
            Add Student
          </button>
        </div>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="students-grid">
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No students found</h3>
            <p>Get started by adding your first student.</p>
            <button onClick={openModal} className="add-btn">
              <Plus size={20} />
              Add Student
            </button>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student._id} className="student-card">
              <div className="student-photo">
                {student.photo ? (
                  <img src={student.photo} alt={student.fullName} />
                ) : (
                  <div className="photo-placeholder">
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="student-info">
                <h3>{student.fullName}</h3>
                <p className="student-gender">{student.gender}</p>
                <p className="student-number">
                  {student.studentNumber || "No ID"}
                </p>
              </div>
              <div className="student-actions">
                <button
                  onClick={() => handleEdit(student)}
                  className="action-btn edit"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(student._id)}
                  className="action-btn delete"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingStudent ? "Edit Student" : "Add New Student"}</h2>
              <button onClick={closeModal} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Grade</label>
                <select
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  required
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade._id} value={grade._id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Student Number</label>
                <input
                  type="text"
                  value={formData.studentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, studentNumber: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Photo URL</label>
                <input
                  type="url"
                  value={formData.photo}
                  onChange={(e) =>
                    setFormData({ ...formData, photo: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
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
                  {editingStudent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
