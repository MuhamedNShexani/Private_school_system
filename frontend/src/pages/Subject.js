import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { subjectsAPI, chaptersAPI, seasonsAPI } from "../services/api";
import {
  ArrowLeft,
  FileText,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  Circle,
} from "lucide-react";

const Subject = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subjectRes, chapterRes] = await Promise.all([
          subjectsAPI.getById(subjectId),
          chaptersAPI.getById(subjectRes.data.chapter._id),
        ]);

        setSubject(subjectRes.data);
        setChapter(chapterRes.data);

        // Fetch season data
        if (chapterRes.data.season) {
          const seasonRes = await seasonsAPI.getById(
            chapterRes.data.season._id
          );
          setSeason(seasonRes.data);
        }
      } catch (err) {
        setError("Failed to load subject data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const currentExercise = subject.exercises[currentExerciseIndex];
    if (answer === currentExercise.correctAnswer) {
      setScore(score + (currentExercise.points || 10));
      setCompletedExercises(
        new Set([...completedExercises, currentExerciseIndex])
      );
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < subject.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setSelectedAnswer("");
      setShowResult(false);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setSelectedAnswer("");
      setShowResult(false);
    }
  };

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

  if (loading) {
    return (
      <div className="loading">
        <div>Loading subject...</div>
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

  if (!subject) {
    return (
      <div className="container">
        <div className="error">Subject not found</div>
      </div>
    );
  }

  const currentExercise = subject.exercises?.[currentExerciseIndex];
  const totalPoints =
    subject.exercises?.reduce((total, ex) => total + (ex.points || 10), 0) || 0;

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
            {chapter && (
              <>
                <Link to={`/chapter/${chapter._id}`}>
                  Chapter {chapter.order}
                </Link>
                <span>/</span>
              </>
            )}
            <span>Subject {subject.order}</span>
          </div>
          <h1>
            Subject {subject.order}: {subject.title}
          </h1>
          <p>{subject.description}</p>
        </div>
      </div>

      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "40px",
          }}
        >
          {/* Main Content */}
          <div>
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
              {chapter && (
                <Link
                  to={`/chapter/${chapter._id}`}
                  className="btn btn-outline"
                >
                  <FileText size={20} />
                  Back to Chapter {chapter.order}
                </Link>
              )}
            </div>

            {/* Subject Content */}
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
                  Subject Content
                </h2>
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

              <div
                style={{
                  lineHeight: "1.8",
                  fontSize: "16px",
                  color: "#374151",
                }}
                dangerouslySetInnerHTML={{ __html: subject.content }}
              />
            </div>

            {/* Exercises */}
            {subject.exercises && subject.exercises.length > 0 && (
              <div className="card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <Target size={24} color="#3b82f6" />
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
                    Exercise {currentExerciseIndex + 1} of{" "}
                    {subject.exercises.length}
                  </h2>
                </div>

                {currentExercise && (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>
                        {currentExercise.question}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {currentExercise.options?.map((option, index) => (
                          <button
                            key={index}
                            className={`exercise-option ${
                              selectedAnswer === option ? "selected" : ""
                            } ${
                              showResult &&
                              option === currentExercise.correctAnswer
                                ? "correct"
                                : ""
                            } ${
                              showResult &&
                              selectedAnswer === option &&
                              option !== currentExercise.correctAnswer
                                ? "incorrect"
                                : ""
                            }`}
                            onClick={() =>
                              !showResult && handleAnswerSelect(option)
                            }
                            disabled={showResult}
                          >
                            <span style={{ marginRight: "12px" }}>
                              {showResult &&
                              option === currentExercise.correctAnswer ? (
                                <CheckCircle size={20} color="#16a34a" />
                              ) : (
                                <Circle size={20} />
                              )}
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {showResult && (
                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "8px",
                          marginBottom: "20px",
                          backgroundColor:
                            selectedAnswer === currentExercise.correctAnswer
                              ? "#f0fdf4"
                              : "#fef2f2",
                          border: `1px solid ${
                            selectedAnswer === currentExercise.correctAnswer
                              ? "#bbf7d0"
                              : "#fecaca"
                          }`,
                          color:
                            selectedAnswer === currentExercise.correctAnswer
                              ? "#16a34a"
                              : "#dc2626",
                        }}
                      >
                        <strong>
                          {selectedAnswer === currentExercise.correctAnswer
                            ? "Correct!"
                            : "Incorrect!"}
                        </strong>
                        {currentExercise.explanation && (
                          <p style={{ marginTop: "8px", color: "#374151" }}>
                            {currentExercise.explanation}
                          </p>
                        )}
                        <p style={{ marginTop: "8px", fontSize: "14px" }}>
                          Points:{" "}
                          {selectedAnswer === currentExercise.correctAnswer
                            ? currentExercise.points || 10
                            : 0}
                        </p>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-outline"
                        onClick={handlePreviousExercise}
                        disabled={currentExerciseIndex === 0}
                      >
                        Previous
                      </button>

                      <span style={{ color: "#64748b", fontSize: "14px" }}>
                        {completedExercises.size} / {subject.exercises.length}{" "}
                        completed
                      </span>

                      <button
                        className="btn btn-primary"
                        onClick={handleNextExercise}
                        disabled={
                          currentExerciseIndex === subject.exercises.length - 1
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="card">
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "20px",
                }}
              >
                Subject Progress
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Score
                  </span>
                  <span style={{ fontWeight: "600" }}>
                    {score} / {totalPoints}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(score / totalPoints) * 100}%`,
                      height: "100%",
                      backgroundColor: "#3b82f6",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Progress
                  </span>
                  <span style={{ fontWeight: "600" }}>
                    {completedExercises.size} / {subject.exercises?.length || 0}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${
                        (completedExercises.size /
                          (subject.exercises?.length || 1)) *
                        100
                      }%`,
                      height: "100%",
                      backgroundColor: "#16a34a",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                <Clock size={16} />
                <span>
                  Estimated time: {subject.estimatedTime || 30} minutes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .exercise-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          width: 100%;
        }

        .exercise-option:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .exercise-option.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .exercise-option.correct {
          border-color: #16a34a;
          background-color: #f0fdf4;
        }

        .exercise-option.incorrect {
          border-color: #dc2626;
          background-color: #fef2f2;
        }

        .exercise-option:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Subject;
