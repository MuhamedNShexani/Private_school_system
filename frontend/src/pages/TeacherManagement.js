import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { teachersAPI } from "../services/api";
import { Plus, Edit, Trash2, GraduationCap, Search } from "lucide-react";
import "./TeacherManagement.css";

const TeacherManagement = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    employeeNumber: "",
    email: "",
    phone: "",
    specializations: [],
    photo: "",
  });

  const hasPermission = isAdmin || isTeacher;

  useEffect(() => {
    if (hasPermission) {
      fetchTeachers();
    }
  }, [hasPermission]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.data.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await teachersAPI.update(editingTeacher._id, formData);
      } else {
        await teachersAPI.create(formData);
      }
      setShowModal(false);
      setEditingTeacher(null);
      resetForm();
      fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);
      setError("Failed to save teacher");
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      employeeNumber: teacher.employeeNumber || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      specializations: teacher.specializations || [],
      photo: teacher.photo || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await teachersAPI.delete(teacherId);
        fetchTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        setError("Failed to delete teacher");
      }
    }
  };

  const handleSpecializationChange = (e) => {
    const value = e.target.value;
    const specializations = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setFormData({ ...formData, specializations });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      employeeNumber: "",
      email: "",
      phone: "",
      specializations: [],
      photo: "",
    });
  };

  const openModal = () => {
    setEditingTeacher(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    resetForm();
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasPermission) {
    return (
      <div className="management-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access teacher management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="management-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t("general.loading", "Loading ... ")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div className="header-content">
          <h1>
            <GraduationCap size={32} />
            Teacher Management
          </h1>
          <button onClick={openModal} className="add-btn">
            <Plus size={20} />
            Add Teacher
          </button>
        </div>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search teachers..."
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

      <div className="teachers-grid">
        {filteredTeachers.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={48} />
            <h3>No teachers found</h3>
            <p>Get started by adding your first teacher.</p>
            <button onClick={openModal} className="add-btn">
              <Plus size={20} />
              Add Teacher
            </button>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher._id} className="teacher-card">
              <div className="teacher-photo">
                {teacher.photo ? (
                  <img src={teacher.photo} alt={teacher.name} />
                ) : (
                  <div className="photo-placeholder">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="teacher-info">
                <h3>{teacher.name}</h3>
                <p className="teacher-employee">
                  {teacher.employeeNumber || "No ID"}
                </p>
                <p className="teacher-email">{teacher.email || "No email"}</p>
                <div className="specializations">
                  {teacher.specializations && teacher.specializations.length > 0
                    ? teacher.specializations.map((spec, index) => (
                        <span key={index} className="specialization-tag">
                          {spec}
                        </span>
                      ))
                    : "No specializations"}
                </div>
              </div>
              <div className="teacher-actions">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="action-btn edit"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(teacher._id)}
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
              <h2>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h2>
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
                <label>Employee Number</label>
                <input
                  type="text"
                  value={formData.employeeNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeNumber: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Specializations (comma-separated)</label>
                <input
                  type="text"
                  value={formData.specializations.join(", ")}
                  onChange={handleSpecializationChange}
                  placeholder="Mathematics, Physics, Chemistry"
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
                  {editingTeacher ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
