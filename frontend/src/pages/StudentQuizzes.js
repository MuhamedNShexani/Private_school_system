import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  quizzesAPI,
  chaptersAPI,
  subjectsAPI,
  seasonsAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import {
  PlayCircle,
  Search,
  Filter,
  ChevronLeft,
  Calendar,
  MapPin,
  GraduationCap,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import "./StudentQuizzes.css";

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

  const [quizzes, setQuizzes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeason, setFilterSeason] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");

  const isTeacher = user?.role === "Teacher";
  const teacherSubjectIds = useMemo(() => {
    if (!isTeacher) return [];
    return (user?.teacherProfile?.subjects || [])
      .map((subject) =>
        typeof subject === "object" && subject?._id
          ? subject._id.toString()
          : subject?.toString?.() || null
      )
      .filter(Boolean);
  }, [isTeacher, user]);

  const teacherSubjectSet = useMemo(
    () => new Set(teacherSubjectIds),
    [teacherSubjectIds]
  );

  const getLocalizedText = useCallback(
    (value, fallback = "") => {
      if (!value) return fallback;
      if (typeof value === "string") return value;
      if (typeof value === "object") {
        return value[currentLanguage] || value.en || fallback;
      }
      return fallback;
    },
    [currentLanguage]
  );

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch seasons, subjects, chapters, and quizzes
        const [seasonsRes, subjectsRes, chaptersRes, quizzesRes] =
          await Promise.all([
            seasonsAPI.getAll(),
            subjectsAPI.getAll(),
            chaptersAPI.getAll(),
            quizzesAPI.getAll(),
          ]);

        const seasonsData = seasonsRes.data?.data || seasonsRes.data || [];
        const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
        const chaptersData = chaptersRes.data?.data || chaptersRes.data || [];
        let quizzesData = quizzesRes.data?.data || quizzesRes.data || [];

        // Filter quizzes based on teacher subjects if applicable
        if (isTeacher) {
          quizzesData = quizzesData.filter((quiz) => {
            if (!quiz.chapter?.subject) return false;
            const subjectId =
              quiz.chapter.subject._id?.toString?.() || quiz.chapter.subject;
            return teacherSubjectSet.has(subjectId);
          });
        }

        setSeasons(seasonsData);
        setSubjects(subjectsData);
        setChapters(chaptersData);
        setQuizzes(quizzesData);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError(t("studentQuizzes.errorLoading", "Error loading quizzes"));
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isTeacher, teacherSubjectSet, t]);

  // Filter quizzes based on search and filters
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      if (!quiz || !quiz.chapter) return false;

      const title = getLocalizedText(
        quiz.titleMultilingual || quiz.title,
        quiz.title || ""
      ).toLowerCase();
      const searchMatch =
        !searchTerm || title.includes(searchTerm.toLowerCase());

      const seasonId =
        typeof quiz.chapter?.season === "object"
          ? quiz.chapter.season?._id
          : quiz.chapter?.season;
      const seasonMatch = !filterSeason || seasonId === filterSeason;

      const subjectId =
        typeof quiz.chapter?.subject === "object"
          ? quiz.chapter.subject?._id
          : quiz.chapter?.subject;
      const subjectMatch = !filterSubject || subjectId === filterSubject;

      const chapterId =
        typeof quiz.chapter === "object" ? quiz.chapter?._id : quiz.chapter;
      const chapterMatch = !filterChapter || chapterId === filterChapter;

      return searchMatch && seasonMatch && subjectMatch && chapterMatch;
    });
  }, [
    quizzes,
    searchTerm,
    filterSeason,
    filterSubject,
    filterChapter,
    getLocalizedText,
  ]);

  // Get chapters filtered by selected subject
  const filteredChapters = useMemo(() => {
    if (!filterSubject || !chapters) {
      return chapters || [];
    }
    return chapters.filter((chapter) => {
      if (!chapter || !chapter.subject) {
        return false;
      }
      const chapterSubjectId =
        typeof chapter.subject === "object"
          ? chapter.subject?._id
          : chapter.subject;
      return chapterSubjectId === filterSubject;
    });
  }, [chapters, filterSubject]);

  // Reset chapter filter when subject changes
  useEffect(() => {
    if (filterSubject && filterChapter && filteredChapters.length > 0) {
      const isChapterValid = filteredChapters.some(
        (ch) => ch && ch._id === filterChapter
      );
      if (!isChapterValid) {
        setFilterChapter("");
      }
    }
  }, [filterSubject, filterChapter, filteredChapters]);

  // Group quizzes by subject
  const groupedBySubject = useMemo(() => {
    const groups = {};
    filteredQuizzes.forEach((quiz) => {
      if (!quiz || !quiz.chapter || !quiz.chapter.subject) return;

      const subjectId =
        typeof quiz.chapter.subject === "object"
          ? quiz.chapter.subject?._id
          : quiz.chapter.subject;

      if (!subjectId) return;

      if (!groups[subjectId]) {
        groups[subjectId] = {
          subject: quiz.chapter.subject,
          quizzes: [],
        };
      }
      groups[subjectId].quizzes.push(quiz);
    });
    return Object.values(groups);
  }, [filteredQuizzes]);

  const handlePlayQuiz = (quizId) => {
    const quiz = quizzes.find((q) => q._id === quizId);
    navigate(`/quizzes/${quizId}/play`, {
      state: { quiz, from: "/student/quizzes" },
    });
  };

  if (loading) {
    return (
      <div className="student-quizzes-container">
        <div className="loading">
          <p>{t("studentQuizzes.loadingMessage", "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-quizzes-container">
      {/* Header */}
      <div className="quizzes-header">
        <div className="quizzes-header-top">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/student/profile")}
          >
            <ChevronLeft size={20} />
            {t("studentQuizzes.backButton", "Back")}
          </button>
          <h1>{t("studentQuizzes.pageTitle", "All Quizzes")}</h1>
        </div>

        {/* Search and Filters */}
        <div className="quizzes-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={t("studentQuizzes.searchLabel", "Search quizzes...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-box">
            <select
              value={filterSeason}
              onChange={(e) => setFilterSeason(e.target.value)}
              className="filter-select"
            >
              <option value="">
                {t("studentQuizzes.seasonFilter", "All Seasons")}
              </option>
              {seasons.map((season) => (
                <option key={season._id} value={season._id}>
                  {getLocalizedText(
                    season.nameMultilingual || season.name,
                    season.name
                  )}
                </option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">
                {t("studentQuizzes.subjectFilter", "All Subjects")}
              </option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {getLocalizedText(
                    subject.titleMultilingual || subject.title,
                    subject.title
                  )}
                </option>
              ))}
            </select>

            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className="filter-select"
              disabled={!filterSubject}
            >
              <option value="">
                {filterSubject
                  ? t("studentQuizzes.chapterFilter", "All Chapters")
                  : t(
                      "studentQuizzes.selectSubjectMessage",
                      "Select a subject first"
                    )}
              </option>
              {filteredChapters.map((chapter) => (
                <option key={chapter._id} value={chapter._id}>
                  {getLocalizedText(
                    chapter.titleMultilingual || chapter.title,
                    chapter.title
                  )}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="quizzes-content">
        {filteredQuizzes.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <h3>{t("studentQuizzes.noQuizzesFound", "No quizzes found")}</h3>
            <p>
              {searchTerm || filterSeason || filterSubject || filterChapter
                ? t(
                    "studentQuizzes.noMatchingQuizzes",
                    "No quizzes match your filters"
                  )
                : t(
                    "studentQuizzes.noAvailableQuizzes",
                    "No quizzes available yet"
                  )}
            </p>
          </div>
        ) : (
          <div className="subjects-groups">
            {groupedBySubject.map((group) => {
              const subjectTitle =
                group.subject && typeof group.subject === "object"
                  ? getLocalizedText(
                      group.subject.titleMultilingual || group.subject.title,
                      group.subject.title
                    )
                  : group.subject &&
                    subjects.find((s) => s._id === group.subject)
                  ? getLocalizedText(
                      subjects.find((s) => s._id === group.subject)
                        .titleMultilingual ||
                        subjects.find((s) => s._id === group.subject).title,
                      subjects.find((s) => s._id === group.subject).title
                    )
                  : t("studentQuizzes.unknownSubject", "Unknown Subject");

              return (
                <div key={group.subject || "unknown"} className="subject-group">
                  <h2 className="subject-title">{subjectTitle}</h2>
                  <div className="quizzes-scroll">
                    {group.quizzes.map((quiz) => {
                      const title = getLocalizedText(
                        quiz.titleMultilingual || quiz.title,
                        quiz.title ||
                          t("studentQuizzes.quizCardTitle", "Untitled Quiz")
                      );
                      const chapterTitle =
                        quiz.chapter &&
                        getLocalizedText(
                          quiz.chapter.titleMultilingual || quiz.chapter.title,
                          quiz.chapter.title ||
                            t(
                              "studentQuizzes.unknownChapter",
                              "Unknown Chapter"
                            )
                        );

                      // Get subject title - handle both object and ID cases
                      let subjectTitle = "";
                      if (quiz.chapter?.subject) {
                        if (typeof quiz.chapter.subject === "object") {
                          subjectTitle = getLocalizedText(
                            quiz.chapter.subject.titleMultilingual ||
                              quiz.chapter.subject.title,
                            quiz.chapter.subject.title
                          );
                        } else {
                          // It's an ID, look it up in subjects array
                          const subjectObj = subjects.find(
                            (s) => s._id === quiz.chapter.subject
                          );
                          if (subjectObj) {
                            subjectTitle = getLocalizedText(
                              subjectObj.titleMultilingual || subjectObj.title,
                              subjectObj.title
                            );
                          }
                        }
                      }

                      // Get season title - handle both object and ID cases
                      let seasonTitle = "";
                      if (quiz.chapter?.season) {
                        if (typeof quiz.chapter.season === "object") {
                          seasonTitle = getLocalizedText(
                            quiz.chapter.season.nameMultilingual ||
                              quiz.chapter.season.name,
                            quiz.chapter.season.name
                          );
                        } else {
                          // It's an ID, look it up in seasons array
                          const seasonObj = seasons.find(
                            (s) => s._id === quiz.chapter.season
                          );
                          if (seasonObj) {
                            seasonTitle = getLocalizedText(
                              seasonObj.nameMultilingual || seasonObj.name,
                              seasonObj.name
                            );
                          }
                        }
                      }

                      const questionCount = quiz.questions?.length || 0;
                      const updatedAt = quiz.updatedAt || quiz.createdAt;

                      return (
                        <div key={quiz._id} className="quiz-card">
                          <div className="quiz-card-header">
                            <ClipboardList size={24} className="quiz-icon" />
                            <div className="quiz-title-section">
                              <h3>{title}</h3>
                              {subjectTitle && (
                                <p className="quiz-subject">{subjectTitle}</p>
                              )}
                            </div>
                          </div>

                          <div className="quiz-card-meta">
                            {chapterTitle && (
                              <span className="meta-item">
                                <BookOpen size={14} />
                                {chapterTitle}
                              </span>
                            )}
                            {seasonTitle && (
                              <span className="meta-item">
                                <Calendar size={14} />
                                {seasonTitle}
                              </span>
                            )}
                          </div>

                          <div className="quiz-card-info">
                            <div className="info-row">
                              <span className="info-label">
                                {t(
                                  "studentQuizzes.questionsLabel",
                                  "Questions"
                                )}
                                :
                              </span>
                              <span className="info-value">
                                {questionCount}
                              </span>
                            </div>
                            {updatedAt && (
                              <div className="info-row">
                                <span className="info-label">
                                  {t("studentQuizzes.updatedLabel", "Updated")}:
                                </span>
                                <span className="info-value">
                                  {new Date(updatedAt).toLocaleDateString(
                                    currentLanguage
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="play-btn"
                            onClick={() => handlePlayQuiz(quiz._id)}
                          >
                            <PlayCircle size={18} />
                            {t("studentQuizzes.playButtonText", "Play Quiz")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredQuizzes.length > 0 && (
        <div className="results-count">
          {filteredQuizzes.length}{" "}
          {t("studentQuizzes.resultsCount", "quizzes found")}
        </div>
      )}
    </div>
  );
};

export default StudentQuizzes;
