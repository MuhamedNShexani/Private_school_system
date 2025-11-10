import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { chaptersAPI, subjectsAPI, seasonsAPI } from "../services/api";
import { ArrowLeft, FileText, Clock, Target, BookOpen } from "lucide-react";

const Chapter = () => {
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [season, setSeason] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chapterRes, subjectsRes] = await Promise.all([
          chaptersAPI.getById(chapterId),
          subjectsAPI.getByChapter(chapterId),
        ]);

        setChapter(chapterRes.data);
        setSubjects(subjectsRes.data);

        // Fetch season data if chapter has season reference
        if (chapterRes.data.season) {
          const seasonRes = await seasonsAPI.getById(
            chapterRes.data.season._id
          );
          setSeason(seasonRes.data);
        }
      } catch (err) {
        setError("Failed to load chapter data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chapterId]);

  if (loading) {
    return (
      <div className="loading">
        <div>Loading chapter...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="container">
        <div className="error">Chapter not found</div>
      </div>
    );
  }

  // Calculate total exercises and estimated time
  const totalExercises = subjects.reduce(
    (total, subject) => total + (subject.exercises?.length || 0),
    0
  );
  const totalEstimatedTime = subjects.reduce(
    (total, subject) => total + (subject.estimatedTime || 30),
    0
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "#16a34a";
      case "Medium":
        return "#d97706";
      case "Hard":
        return "#dc2626";
      default:
        return "#64748b";
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            {season && (
              <>
                <Link to={`/season/${season._id}`}>{season.name}</Link>
                <span>/</span>
              </>
            )}
            <span>Chapter {chapter.order}</span>
          </div>
          <h1>
            Chapter {chapter.order}: {chapter.title}
          </h1>
          <p>{chapter.description}</p>
        </div>
      </div>

      <div className="container">
        {/* Statistics */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{subjects.length}</div>
            <div className="stat-label">Subjects</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalExercises}</div>
            <div className="stat-label">Exercises</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {Math.round(totalEstimatedTime / 60)}h
            </div>
            <div className="stat-label">Est. Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {subjects.reduce(
                (total, subject) =>
                  total +
                  (subject.exercises?.reduce(
                    (sum, ex) => sum + (ex.points || 10),
                    0
                  ) || 0),
                0
              )}
            </div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>

        {/* Navigation */}
        <div
          style={{
            marginBottom: "30px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/" className="btn btn-outline">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          {season && (
            <Link to={`/season/${season._id}`} className="btn btn-outline">
              <BookOpen size={20} />
              Back to {season.name}
            </Link>
          )}
        </div>

        {/* Subjects */}
        <section>
          <h2
            style={{
              marginBottom: "24px",
              fontSize: "2rem",
              fontWeight: "600",
            }}
          >
            Subjects in Chapter {chapter.order}
          </h2>

          <div className="subject-grid">
            {subjects.map((subject) => (
              <div key={subject._id} className="card subject-card">
                <div className="subject-header">
                  <FileText size={24} color="#3b82f6" />
                  <div className="subject-title">
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>
                      Subject {subject.order}: {subject.title}
                    </h3>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          getDifficultyColor(subject.difficulty) + "20",
                        color: getDifficultyColor(subject.difficulty),
                      }}
                    >
                      {subject.difficulty}
                    </span>
                  </div>
                </div>

                <p style={{ color: "#64748b", marginBottom: "20px" }}>
                  {subject.description}
                </p>

                <div className="subject-stats">
                  <div className="subject-stat">
                    <Target size={16} />
                    <span>{subject.exercises?.length || 0} Exercises</span>
                  </div>
                  <div className="subject-stat">
                    <Clock size={16} />
                    <span>{subject.estimatedTime || 30} minutes</span>
                  </div>
                </div>

                <div className="subject-content-preview">
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {subject.content}
                  </p>
                </div>

                <Link
                  to={`/subject/${subject._id}`}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  Start Subject {subject.order}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .subject-card {
          transition: all 0.3s ease;
        }

        .subject-card:hover {
          transform: translateY(-4px);
        }

        .subject-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .subject-title {
          flex: 1;
        }

        .subject-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .subject-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 14px;
        }

        .subject-content-preview {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default Chapter;
