import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { partsAPI, exercisesAPI } from "../services/api";
import {
  ArrowLeft,
  FileText,
  Target,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";

const Part = () => {
  const { partId } = useParams();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [part, setPart] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    degree: 10,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [partRes, exercisesRes] = await Promise.all([
          partsAPI.getById(partId),
          exercisesAPI.getByPart(partId),
        ]);

        setPart(partRes.data.data || partRes.data);
        setExercises(exercisesRes.data.data || exercisesRes.data);

        // No additional chapter fetch needed here
      } catch (err) {
        setError("Failed to load part data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [partId]);

  const openModal = (exercise = null) => {
    setError(null); // Clear any previous errors
    setEditingExercise(exercise);
    setFormData(
      exercise
        ? { name: exercise.name, degree: exercise.degree }
        : { name: "", degree: 10 }
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setError(null); // Clear errors when closing modal
    setShowModal(false);
    setEditingExercise(null);
    setFormData({ name: "", degree: 10 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExercise) {
        await exercisesAPI.update(editingExercise._id, {
          ...formData,
          part: partId,
        });
      } else {
        await exercisesAPI.create({ ...formData, part: partId });
      }
      closeModal();

      // Refresh exercises
      const exercisesRes = await exercisesAPI.getByPart(partId);
      setExercises(exercisesRes.data.data || exercisesRes.data);
    } catch (error) {
      console.error("Error saving exercise:", error);
      setError(error.response?.data?.message || "Failed to save exercise");
    }
  };

  const handleDelete = async (exercise) => {
    if (
      window.confirm(
        t(
          "confirm.delete_exercise",
          "Are you sure you want to delete this exercise?"
        )
      )
    ) {
      try {
        await exercisesAPI.delete(exercise._id);

        // Refresh exercises
        const exercisesRes = await exercisesAPI.getByPart(partId);
        setExercises(exercisesRes.data.data || exercisesRes.data);
      } catch (error) {
        console.error("Error deleting exercise:", error);
        setError("Failed to delete exercise");
      }
    }
  };

  const handleStatusToggle = async (exercise) => {
    try {
      await exercisesAPI.updateStatus(exercise._id, !exercise.isActive);

      // Refresh exercises
      const exercisesRes = await exercisesAPI.getByPart(partId);
      setExercises(exercisesRes.data.data || exercisesRes.data);
    } catch (error) {
      console.error("Error updating exercise status:", error);
      setError("Failed to update exercise status");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div>{t("general.loading", "Loading ... ")}</div>
      </div>
    );
  }

  if (error && !part) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="container">
        <div className="error">
          {t("error.part_not_found", "Part not found")}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div style={{ marginBottom: "16px" }}>
            <Link
              to="/programs"
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ArrowLeft size={16} />
              {t("btn.back", "Back")}
            </Link>
          </div>
          <h1>
            <FileText
              size={32}
              style={{ marginRight: "12px", verticalAlign: "middle" }}
            />
            {part.title}
          </h1>
          <p>{part.description}</p>
        </div>
      </div>

      <div className="container">
        {/* Part Content */}
        <div className="card" style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <FileText size={24} color="#3b82f6" />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
              {t("part.content", "Part Content")}
            </h2>
          </div>

          <div
            style={{
              lineHeight: "1.8",
              fontSize: "16px",
              color: "#374151",
            }}
            dangerouslySetInnerHTML={{ __html: part.content }}
          />

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={16} color="#64748b" />
              <span style={{ color: "#64748b" }}>
                {exercises.length} {t("exercises", "exercises")}
              </span>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Target size={24} color="#ef4444" />
              {t("exercises.title", "Exercises")}
            </h2>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={16} style={{ marginRight: "4px" }} />
                {t("btn.add_exercise", "Add Exercise")}
              </button>
            )}
          </div>

          {!exercises || !Array.isArray(exercises) || exercises.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}
            >
              {t("msg.no_exercises", "No exercises available yet.")}
            </div>
          ) : (
            <div className="exercises-grid">
              {exercises.map((exercise) => (
                <div key={exercise._id} className="exercise-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        {exercise.name}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#64748b",
                        }}
                      >
                        <Target size={14} />
                        <span>
                          {exercise.degree} {t("points", "points")}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="control-btn status"
                          onClick={() => handleStatusToggle(exercise)}
                          title={
                            exercise.isActive
                              ? t("btn.deactivate", "Deactivate")
                              : t("btn.activate", "Activate")
                          }
                        >
                          {exercise.isActive ? (
                            <Eye size={16} />
                          ) : (
                            <EyeOff size={16} />
                          )}
                        </button>
                        <button
                          className="control-btn edit"
                          onClick={() => openModal(exercise)}
                          title={t("btn.edit", "Edit")}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="control-btn delete"
                          onClick={() => handleDelete(exercise)}
                          title={t("btn.delete", "Delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exercise Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {editingExercise
                  ? t("modal.edit_exercise", "Edit Exercise")
                  : t("modal.add_exercise", "Add Exercise")}
              </h2>
              <button onClick={closeModal} className="close-btn">
                ×
              </button>
            </div>
            {error && (
              <div
                className="error"
                style={{
                  margin: "16px",
                  padding: "12px",
                  backgroundColor: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "4px",
                  color: "#c33",
                }}
              >
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>{t("form.exercise_name", "Exercise Name")} *</label>
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
                <label>{t("form.degree_points", "Degree/Points")} *</label>
                <input
                  type="number"
                  value={formData.degree}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      degree: parseInt(e.target.value) || 10,
                    })
                  }
                  min="0"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cancel-btn"
                >
                  {t("btn.cancel", "Cancel")}
                </button>
                <button type="submit" className="save-btn">
                  {editingExercise
                    ? t("btn.update", "Update")
                    : t("btn.create", "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .exercises-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .exercise-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .exercise-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .exercise-card h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .control-btn {
          background: none;
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .control-btn:hover {
          background: #f3f4f6;
        }

        .control-btn.status {
          color: #3b82f6;
        }

        .control-btn.edit {
          color: #10b981;
        }

        .control-btn.delete {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default Part;
