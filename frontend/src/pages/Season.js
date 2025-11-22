import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { seasonsAPI, chaptersAPI, subjectsAPI } from "../services/api";
import { ArrowLeft, BookOpen, FileText, Clock, Users } from "lucide-react";
import { useTranslation } from "../contexts/TranslationContext";

const Season = () => {
  const { seasonId } = useParams();
  const [season, setSeason] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [seasonRes, chaptersRes, subjectsRes] = await Promise.all([
          seasonsAPI.getById(seasonId),
          chaptersAPI.getBySeason(seasonId),
          subjectsAPI.getAll(),
        ]);

        setSeason(seasonRes.data);
        setChapters(chaptersRes.data);
        setSubjects(subjectsRes.data);
      } catch (err) {
        setError("Failed to load season data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div>{t("general.loading", "Loading ... ")}</div>
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

  if (!season) {
    return (
      <div className="container">
        <div className="error">Season not found</div>
      </div>
    );
  }

  // Calculate total subjects and exercises for this season
  const totalSubjects = subjects.filter((subject) =>
    chapters.some((chapter) => chapter._id === subject.chapter?._id)
  ).length;

  const totalExercises = subjects
    .filter((subject) =>
      chapters.some((chapter) => chapter._id === subject.chapter?._id)
    )
    .reduce((total, subject) => total + (subject.exercises?.length || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>{season.name}</span>
          </div>
          <h1>{season.name}</h1>
          <p>{season.description}</p>
        </div>
      </div>

      <div className="container">
        {/* Statistics */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{chapters.length}</div>
            <div className="stat-label">Chapters</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalSubjects}</div>
            <div className="stat-label">Subjects</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalExercises}</div>
            <div className="stat-label">Exercises</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {Math.round((totalSubjects * 30) / 60)}h
            </div>
            <div className="stat-label">Est. Time</div>
          </div>
        </div>

        {/* Back Button */}
        <div style={{ marginBottom: "30px" }}>
          <Link to="/" className="btn btn-outline">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        {/* Chapters */}
        <section>
          <h2
            style={{
              marginBottom: "24px",
              fontSize: "2rem",
              fontWeight: "600",
            }}
          >
            Chapters in {season.name}
          </h2>

          <div className="chapter-grid">
            {chapters.map((chapter) => {
              const chapterSubjects = subjects.filter(
                (subject) => subject.chapter?._id === chapter._id
              );
              const chapterExercises = chapterSubjects.reduce(
                (total, subject) => total + (subject.exercises?.length || 0),
                0
              );

              return (
                <div key={chapter._id} className="card chapter-card">
                  <div className="chapter-header">
                    <BookOpen size={24} color="#3b82f6" />
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        marginTop: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      Chapter {chapter.order}: {chapter.title}
                    </h3>
                  </div>

                  <p style={{ color: "#64748b", marginBottom: "20px" }}>
                    {chapter.description}
                  </p>

                  <div className="chapter-stats">
                    <div className="chapter-stat">
                      <FileText size={16} />
                      <span>{chapterSubjects.length} Subjects</span>
                    </div>
                    <div className="chapter-stat">
                      <Users size={16} />
                      <span>{chapterExercises} Exercises</span>
                    </div>
                    <div className="chapter-stat">
                      <Clock size={16} />
                      <span>{chapterSubjects.length * 30}m</span>
                    </div>
                  </div>

                  <Link
                    to={`/chapter/${chapter._id}`}
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "20px" }}
                  >
                    Start Chapter {chapter.order}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <style jsx>{`
        .chapter-card {
          transition: all 0.3s ease;
        }

        .chapter-card:hover {
          transform: translateY(-4px);
        }

        .chapter-header {
          text-align: center;
        }

        .chapter-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .chapter-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default Season;
