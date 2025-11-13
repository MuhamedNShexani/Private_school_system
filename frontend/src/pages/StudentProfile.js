import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  studentsAPI,
  studentGradesAPI,
  subjectsAPI,
  seasonsAPI,
  chaptersAPI,
  quizzesAPI,
  gradingAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  MapPin,
  Edit,
  Save,
  X,
  ClipboardList,
  PlayCircle,
} from "lucide-react";

const StudentProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null);
  const [gradeForm, setGradeForm] = useState({});
  const [exerciseGrades, setExerciseGrades] = useState([]); // Activities log
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainingFilterSeason, setTrainingFilterSeason] = useState("");
  const [trainingFilterSubject, setTrainingFilterSubject] = useState("");
  const [trainingFilterChapter, setTrainingFilterChapter] = useState("");
  const [gradesPage, setGradesPage] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [studentRatings, setStudentRatings] = useState([]);
  const [ratingFilterSeason, setRatingFilterSeason] = useState("");
  const [ratingFilterMode, setRatingFilterMode] = useState("evaluation"); // month, date-range, evaluation
  const [ratingFilterFromDate, setRatingFilterFromDate] = useState("");
  const [ratingFilterToDate, setRatingFilterToDate] = useState("");
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const interpolateTemplate = (template, values) => {
    if (typeof template !== "string") {
      return template;
    }
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(values, key)
        ? String(values[key])
        : match
    );
  };

  // Helper function to format Date to YYYY-MM-DD using local time (not UTC)
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === "object") {
      if (value._id) return value._id.toString();
      if (value.id) return value.id.toString();
    }
    return value.toString ? value.toString() : `${value}`;
  };

  const subjectIsAllowed = useCallback(
    (subjectId) => {
      if (!isTeacher) return true;
      if (!teacherSubjectSet.size) return false;
      const normalized = normalizeId(subjectId);
      return normalized && teacherSubjectSet.has(normalized);
    },
    [isTeacher, teacherSubjectSet]
  );

  const chapterMap = useMemo(() => {
    const map = new Map();
    chapters.forEach((chapter) => {
      const id = normalizeId(chapter?._id || chapter?.id);
      if (id) {
        map.set(id, chapter);
      }
    });
    return map;
  }, [chapters]);

  const subjectMap = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject) => {
      const id = normalizeId(subject?._id || subject);
      if (id) {
        map.set(id, subject);
      }
    });
    return map;
  }, [subjects]);

  const seasonMap = useMemo(() => {
    const map = new Map();
    seasons.forEach((season) => {
      const id = normalizeId(season?._id || season?.id || season?.name);
      if (id) {
        map.set(id, season);
      }
    });
    return map;
  }, [seasons]);

  const gradeSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        subjectIsAllowed(normalizeId(subject?._id || subject))
      ),
    [subjects, subjectIsAllowed]
  );

  const activityRows = useMemo(() => {
    return exerciseGrades
      .filter((exerciseGrade) =>
        subjectIsAllowed(
          exerciseGrade.subject?._id ||
            exerciseGrade.subject ||
            exerciseGrade.subjectId
        )
      )
      .filter((exerciseGrade) => {
        if (
          isTeacher &&
          !subjectIsAllowed(
            exerciseGrade.subject?._id ||
              exerciseGrade.subject ||
              exerciseGrade.subjectId
          )
        ) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.gradedAt || b.createdAt) -
          new Date(a.gradedAt || a.createdAt)
      );
  }, [exerciseGrades, subjectIsAllowed, isTeacher]);

  const getBranchDisplayName = (studentData) => {
    const branchId =
      studentData?.branchID ||
      studentData?.studentProfile?.branchID ||
      studentData?.branch?._id ||
      studentData?.branch;

    if (!branchId) {
      return t("studentProfile.notAssigned", "Not assigned");
    }

    const branchObject = studentData?.class?.branches?.find(
      (branch) => normalizeId(branch?._id) === normalizeId(branchId)
    );

    if (branchObject) {
      return (
        getLocalizedText(
          branchObject.nameMultilingual || branchObject.name,
          branchObject.name ||
            branchObject.code ||
            t("studentProfile.notAssigned", "Not assigned")
        ) || t("studentProfile.notAssigned", "Not assigned")
      );
    }

    if (typeof branchId === "object" && branchId?.name) {
      return getLocalizedText(
        branchId.nameMultilingual || branchId.name,
        branchId.name
      );
    }

    if (typeof branchId === "string") {
      return branchId;
    }

    return t("studentProfile.notAssigned", "Not assigned");
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        // Extract data helper function - handle both { data: [...] } and [...] formats
        const extractData = (response, isArray = false) => {
          if (isArray) {
            if (response.data?.data)
              return Array.isArray(response.data.data)
                ? response.data.data
                : [];
            if (Array.isArray(response.data)) return response.data;
            return [];
          }
          // For single object response
          if (
            response.data?.data &&
            typeof response.data.data === "object" &&
            !Array.isArray(response.data.data)
          ) {
            return response.data.data;
          }
          return response.data;
        };

        // Get student profile based on user role and URL params
        let studentData;
        const usernameParam = searchParams.get("username");

        console.log("StudentProfile - User role:", user?.role);
        console.log("StudentProfile - Username param:", usernameParam);

        if (user?.role === "Student") {
          // Student can only see their own profile
          console.log("StudentProfile - Getting own profile for student");
          const response = await studentsAPI.getByUsername(user.username);
          studentData = extractData(response);
        } else if (usernameParam) {
          // If username is provided in URL, get that specific student
          console.log(
            "StudentProfile - Getting profile for username:",
            usernameParam
          );
          const response = await studentsAPI.getByUsername(usernameParam);
          studentData = extractData(response);
        } else {
          // For teachers/admins without specific username, get the first student as example
          console.log("StudentProfile - Getting first student as example");
          const response = await studentsAPI.getAll();
          const allStudents = extractData(response, true);
          studentData = allStudents?.[0] || null;
        }

        if (studentData) {
          setStudent(studentData);

          // Fetch student grades
          try {
            const gradesResponse = await studentGradesAPI.getByStudent(
              studentData._id
            );
            const gradesData =
              gradesResponse.data?.data || gradesResponse.data || [];
            const gradesArray = Array.isArray(gradesData) ? gradesData : [];
            const filteredGrades = gradesArray.filter((grade) =>
              subjectIsAllowed(grade.subject?._id || grade.subject)
            );
            setGrades(filteredGrades);
          } catch (err) {
            console.log("No grades found for student:", err);
            setGrades([]);
          }

          // Fetch exercise grades for activities log
          try {
            const exerciseGradesResponse = await gradingAPI.getGradesByStudent(
              studentData._id
            );
            const exerciseGradesData =
              exerciseGradesResponse.data?.data ||
              exerciseGradesResponse.data ||
              [];
            const filteredExercises = (
              Array.isArray(exerciseGradesData) ? exerciseGradesData : []
            ).filter((exerciseGrade) =>
              subjectIsAllowed(
                exerciseGrade.subject?._id ||
                  exerciseGrade.subject ||
                  exerciseGrade.subjectId
              )
            );
            setExerciseGrades(filteredExercises);
          } catch (err) {
            console.log("No exercise grades found for student:", err);
            setExerciseGrades([]);
          }

          // Fetch student ratings
          try {
            const ratingsResponse = await studentsAPI.getRatings(
              studentData._id
            );
            const ratingsData =
              ratingsResponse.data?.data?.ratings ||
              ratingsResponse.data?.ratings ||
              [];
            setStudentRatings(Array.isArray(ratingsData) ? ratingsData : []);
            console.log("Ratings fetched:", ratingsData);
          } catch (err) {
            console.log("No ratings found for student:", err);
            setStudentRatings([]);
          }

          // Fetch subjects and seasons for grade entry
          try {
            const [
              subjectsResult,
              seasonsResult,
              chaptersResult,
              quizzesResult,
            ] = await Promise.allSettled([
              subjectsAPI.getAll(),
              seasonsAPI.getAll(),
              chaptersAPI.getAll(),
              quizzesAPI.getAll({ trainingOnly: true }),
            ]);

            if (subjectsResult.status === "fulfilled") {
              const subjectsData =
                subjectsResult.value.data?.data ||
                subjectsResult.value.data ||
                [];
              const filteredSubjects = subjectsData.filter((subject) =>
                subjectIsAllowed(subject?._id || subject)
              );
              setSubjects(filteredSubjects);
            } else {
              console.warn(
                "Failed to load subjects for student profile:",
                subjectsResult.reason
              );
              setSubjects([]);
            }

            let seasonsDataForDefaults = [];
            if (seasonsResult.status === "fulfilled") {
              seasonsDataForDefaults =
                seasonsResult.value.data?.data ||
                seasonsResult.value.data ||
                [];
              setSeasons(seasonsDataForDefaults);
            } else {
              console.warn(
                "Failed to load seasons for student profile:",
                seasonsResult.reason
              );
              setSeasons([]);
            }

            if (chaptersResult.status === "fulfilled") {
              const chaptersData =
                chaptersResult.value.data?.data ||
                chaptersResult.value.data ||
                [];
              setChapters(Array.isArray(chaptersData) ? chaptersData : []);
            } else {
              console.warn(
                "Failed to load chapters for student profile:",
                chaptersResult.reason
              );
              setChapters([]);
            }

            if (quizzesResult.status === "fulfilled") {
              const quizzesData =
                quizzesResult.value.data?.data ||
                quizzesResult.value.data ||
                [];
              setQuizzes(
                (Array.isArray(quizzesData) ? quizzesData : []).filter(
                  (quiz) => quiz.trainingOnly !== false
                )
              );
            } else {
              console.warn(
                "Failed to load training quizzes for student profile:",
                quizzesResult.reason
              );
              setQuizzes([]);
            }

            // Set default season filter based on date
            const now = new Date();
            const currentYear = now.getFullYear();
            const september10 = new Date(currentYear, 8, 10); // Month is 0-indexed, so 8 = September

            // Filter to only Season 1 and Season 2
            const seasonsToFilter = seasonsDataForDefaults
              .filter((s) => {
                const order =
                  s.order ||
                  (s.nameMultilingual
                    ? s.nameMultilingual?.en?.includes("1")
                      ? 1
                      : s.nameMultilingual?.en?.includes("2")
                      ? 2
                      : null
                    : null);
                return order === 1 || order === 2;
              })
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            // Set default: after Sep 10 = Season 1, else Season 2
            if (now >= september10) {
              // After or on Sep 10, default to Season 1
              const season1 = seasonsToFilter.find((s) => {
                const order =
                  s.order ||
                  (s.nameMultilingual
                    ? s.nameMultilingual?.en?.includes("1")
                      ? 1
                      : null
                    : null);
                return order === 1;
              });
              if (season1) {
                const seasonName =
                  season1.nameMultilingual?.[currentLanguage] ||
                  season1.nameMultilingual?.en ||
                  season1.name ||
                  t("studentProfile.seasonDefaultOne", "Season 1");
                setSelectedSeasonFilter(seasonName);
              }
            } else {
              // Before Sep 10, default to Season 2
              const season2 = seasonsToFilter.find((s) => {
                const order =
                  s.order ||
                  (s.nameMultilingual
                    ? s.nameMultilingual?.en?.includes("2")
                      ? 2
                      : null
                    : null);
                return order === 2;
              });
              if (season2) {
                const seasonName =
                  season2.nameMultilingual?.[currentLanguage] ||
                  season2.nameMultilingual?.en ||
                  season2.name ||
                  t("studentProfile.seasonDefaultTwo", "Season 2");
                setSelectedSeasonFilter(seasonName);
              }
            }
          } catch (err) {
            console.log("Error fetching subjects/seasons or quizzes:", err);
            setSubjects([]);
            setSeasons([]);
            setChapters([]);
            setQuizzes([]);
          }
        }
      } catch (err) {
        setError(
          t(
            "studentProfile.error.loadFailed",
            "Failed to load student data. Please try again."
          )
        );
        console.error("Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user, searchParams, currentLanguage]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#10b981";
      case "inactive":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      case "completed":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  // Get grade color
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "#10b981";
    if (percentage >= 80) return "#22c55e";
    if (percentage >= 70) return "#f59e0b";
    if (percentage >= 60) return "#f97316";
    return "#ef4444";
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case "male":
        return "♂";
      case "female":
        return "♀";
      default:
        return "⚧";
    }
  };

  const getLocalizedText = useCallback(
    (value, fallback = "") => {
      if (!value) return fallback;
      if (typeof value === "string") return value;

      if (typeof value === "object") {
        const directMatch =
          value[currentLanguage] || value.en || value.ar || value.ku;
        if (directMatch) return directMatch;

        if (value.name) {
          return getLocalizedText(value.name, fallback);
        }
        if (value.title) {
          return getLocalizedText(value.title, fallback);
        }
        if (value.label) {
          return getLocalizedText(value.label, fallback);
        }
      }

      return fallback;
    },
    [currentLanguage]
  );

  const getGenderLabel = (gender) => {
    if (!gender) {
      return t("studentProfile.gender.unknown", "Not specified");
    }
    const normalized = gender.toLowerCase();
    if (normalized === "male" || normalized === "female") {
      return t(`studentProfile.gender.${normalized}`, gender);
    }
    return t("studentProfile.gender.other", gender);
  };

  const getActivityTypeLabel = (type) => {
    switch ((type || "").toLowerCase()) {
      case "exercise":
        return t("studentProfile.activityType.exercise", "Exercise");
      case "monthly_exam":
        return t("studentProfile.activityType.monthlyExam", "Monthly Exam");
      case "attendance":
        return t("studentProfile.activityType.attendance", "Attendance");
      case "behaviour":
        return t("studentProfile.activityType.behaviour", "Behaviour");
      case "season_exam":
        return t("studentProfile.activityType.seasonExam", "Season Exam");
      default:
        return t("studentProfile.activityType.unknown", "Unknown");
    }
  };

  const getMonthlyExamLabel = (monthlyExamNumber) => {
    const normalized = monthlyExamNumber?.toString();
    if (normalized === "1") {
      return t("studentProfile.monthlyExam.first", "First Exam");
    }
    if (normalized === "2") {
      return t("studentProfile.monthlyExam.second", "Second Exam");
    }
    return t("common.na", "N/A");
  };

  const getRatingLabel = (rating) => {
    const ratingNum = Number(rating);
    if (ratingNum === 5) {
      return t("studentProfile.rating.excellent", "Excellent");
    } else if (ratingNum === 4) {
      return t("studentProfile.rating.good", "Good");
    } else if (ratingNum === 3) {
      return t("studentProfile.rating.fair", "Fair");
    } else if (ratingNum === 2) {
      return t("studentProfile.rating.poor", "Poor");
    } else if (ratingNum === 1) {
      return t("common.na", "N/A");
    }

    // Handle string values
    switch (rating?.toLowerCase?.() || rating) {
      case "excellent":
        return t("studentProfile.rating.excellent", "Excellent");
      case "good":
        return t("studentProfile.rating.good", "Good");
      case "fair":
        return t("studentProfile.rating.fair", "Fair");
      case "poor":
        return t("studentProfile.rating.poor", "Poor");
      default:
        return rating || t("common.na", "N/A");
    }
  };

  const getRatingColor = (rating) => {
    const ratingNum = Number(rating);
    if (ratingNum === 5) {
      return "#10b981"; // Excellent - Green
    } else if (ratingNum === 4) {
      return "#3b82f6"; // Good - Blue
    } else if (ratingNum === 3) {
      return "#f59e0b"; // Fair - Yellow
    } else if (ratingNum === 2) {
      return "#ef4444"; // Poor - Red
    } else if (ratingNum === 1) {
      return "#6b7280"; // N/A - Gray
    }

    // Handle string values
    switch (rating?.toLowerCase?.() || rating) {
      case "excellent":
        return "#10b981";
      case "good":
        return "#3b82f6";
      case "fair":
        return "#f59e0b";
      case "poor":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // Filter ratings based on season and date range
  const getFilteredRatings = useCallback(() => {
    let filtered = [...studentRatings];

    // Filter by season
    if (ratingFilterSeason) {
      filtered = filtered.filter((r) => r.season === ratingFilterSeason);
    }

    // Filter by mode
    if (ratingFilterMode === "evaluation") {
      // Show last record vs previous record comparison
      filtered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      // Keep only the last 2 records per subject
      const lastTwo = {};
      filtered.forEach((r) => {
        const key = r.subjectId;
        if (!lastTwo[key]) {
          lastTwo[key] = [];
        }
        if (lastTwo[key].length < 2) {
          lastTwo[key].push(r);
        }
      });
      filtered = Object.values(lastTwo).flat();
    } else if (ratingFilterMode === "month" && ratingFilterFromDate) {
      // Extract date part only (YYYY-MM-DD) to avoid timezone issues
      const fromDateStr = ratingFilterFromDate; // Already in YYYY-MM-DD format
      const toDateStr = ratingFilterToDate || ratingFilterFromDate;

      filtered = filtered.filter((r) => {
        // Extract date part from rating date using local time
        const rDate = new Date(r.date);
        const year = rDate.getFullYear();
        const month = String(rDate.getMonth() + 1).padStart(2, "0");
        const day = String(rDate.getDate()).padStart(2, "0");
        const rDateStr = `${year}-${month}-${day}`;

        return rDateStr >= fromDateStr && rDateStr <= toDateStr;
      });
    } else if (
      ratingFilterMode === "date-range" &&
      ratingFilterFromDate &&
      ratingFilterToDate
    ) {
      // Extract date part only (YYYY-MM-DD) to avoid timezone issues
      const fromDateStr = ratingFilterFromDate; // Already in YYYY-MM-DD format
      const toDateStr = ratingFilterToDate;

      filtered = filtered.filter((r) => {
        // Extract date part from rating date using local time
        const rDate = new Date(r.date);
        const year = rDate.getFullYear();
        const month = String(rDate.getMonth() + 1).padStart(2, "0");
        const day = String(rDate.getDate()).padStart(2, "0");
        const rDateStr = `${year}-${month}-${day}`;

        return rDateStr >= fromDateStr && rDateStr <= toDateStr;
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    studentRatings,
    ratingFilterSeason,
    ratingFilterMode,
    ratingFilterFromDate,
    ratingFilterToDate,
  ]);

  // Get ratings info for comparison
  const formatDate = (date) => {
    if (!date) {
      return t("common.na", "N/A");
    }
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const availableTrainingQuizzes = useMemo(() => {
    if (!student) {
      return [];
    }

    const studentClassId = normalizeId(
      student.class?._id || student.class || student.classId
    );

    return quizzes
      .filter((quiz) => {
        if (!quiz) return false;
        if (quiz.trainingOnly === false) return false;
        if (quiz.isActive === false) return false;
        const chapterId = normalizeId(quiz.chapter?._id || quiz.chapter);
        if (!chapterId) return false;
        const chapter = chapterMap.get(chapterId);
        if (!chapter) return false;
        const subjectId = normalizeId(chapter.subject?._id || chapter.subject);
        if (!subjectId || !subjectIsAllowed(subjectId)) {
          return false;
        }
        if (studentClassId) {
          const subject = subjectMap.get(subjectId);
          const subjectClassId = normalizeId(
            subject?.class?._id || subject?.class
          );
          if (subjectClassId && subjectClassId !== studentClassId) {
            return false;
          }
        }
        return true;
      })
      .map((quiz) => {
        const chapterId = normalizeId(quiz.chapter?._id || quiz.chapter);
        const chapter = chapterMap.get(chapterId);
        if (!chapter) return null;

        const subjectId = normalizeId(
          chapter?.subject?._id || chapter?.subject
        );
        const subject = subjectMap.get(subjectId);
        if (!subject) return null;

        const chapterSeason = chapter?.season;
        let seasonId = normalizeId(
          chapterSeason?._id || chapterSeason?.id || chapterSeason
        );
        let season =
          (chapterSeason && typeof chapterSeason === "object"
            ? chapterSeason
            : null) || (seasonId ? seasonMap.get(seasonId) : null);

        if (!seasonId && season) {
          seasonId = normalizeId(season?._id || season?.id || season?.name);
        }

        return {
          quiz,
          chapter,
          subject,
          chapterId,
          subjectId,
          seasonId,
          season,
        };
      })
      .filter(Boolean);
  }, [student, quizzes, chapterMap, subjectMap, seasonMap, subjectIsAllowed]);

  const trainingFilterOptions = useMemo(() => {
    const seasonOptions = new Map();
    const subjectOptions = new Map();
    const chapterOptions = new Map();

    availableTrainingQuizzes.forEach(
      ({ chapter, subject, season, seasonId, chapterId, subjectId }) => {
        if (seasonId) {
          const label = getLocalizedText(
            season?.nameMultilingual || season?.name,
            season?.name || t("studentProfile.unknownSeason", "Unknown Season")
          );
          seasonOptions.set(seasonId, { id: seasonId, label });
        }

        if (subjectId) {
          const label = getLocalizedText(
            subject?.titleMultilingual || subject?.title,
            subject?.title ||
              t("studentProfile.unknownSubject", "Unknown Subject")
          );
          subjectOptions.set(subjectId, { id: subjectId, label });
        }

        if (chapterId) {
          const label = getLocalizedText(
            chapter?.titleMultilingual || chapter?.title,
            chapter?.title ||
              t("studentProfile.unknownChapter", "Unknown Chapter")
          );
          chapterOptions.set(chapterId, {
            id: chapterId,
            label,
            subjectId,
          });
        }
      }
    );

    return {
      seasons: Array.from(seasonOptions.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
      subjects: Array.from(subjectOptions.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
      chapters: Array.from(chapterOptions.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    };
  }, [availableTrainingQuizzes, getLocalizedText, t]);

  const filteredChapterOptions = useMemo(
    () =>
      trainingFilterOptions.chapters.filter(
        (chapter) =>
          !trainingFilterSubject || chapter.subjectId === trainingFilterSubject
      ),
    [trainingFilterOptions.chapters, trainingFilterSubject]
  );

  const trainingQuizzes = useMemo(() => {
    // Show only the last 5 quizzes, sorted by most recent first
    return availableTrainingQuizzes
      .sort((a, b) => {
        const dateA = new Date(a.quiz?.updatedAt || a.quiz?.createdAt || 0);
        const dateB = new Date(b.quiz?.updatedAt || b.quiz?.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [availableTrainingQuizzes]);

  useEffect(() => {
    setGradesPage((prev) => {
      if (gradeSubjects.length === 0) {
        return 0;
      }
      return Math.min(prev, gradeSubjects.length - 1);
    });
  }, [gradeSubjects.length]);

  useEffect(() => {
    setActivityPage((prev) => {
      if (activityRows.length === 0) {
        return 0;
      }
      return Math.min(prev, activityRows.length - 1);
    });
  }, [activityRows.length]);

  useEffect(() => {
    if (!trainingFilterSubject) {
      return;
    }
    const hasMatch = filteredChapterOptions.some(
      (chapter) => chapter.id === trainingFilterChapter
    );
    if (!hasMatch) {
      setTrainingFilterChapter("");
    }
  }, [trainingFilterSubject, filteredChapterOptions, trainingFilterChapter]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Start editing a grade
  const startEditingGrade = (grade) => {
    setEditingGrade(grade._id);
    setGradeForm({
      season_exam: grade.season_exam || 0,
      exercises: grade.exercises || 0,
      attendance: grade.attendance || 0,
      behaviour: grade.behaviour || 0,
      monthly_exam: grade.monthly_exam || [],
      notes: grade.notes || "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingGrade(null);
    setGradeForm({});
  };

  // Save grade
  const saveGrade = async (gradeId) => {
    try {
      const grade = grades.find((g) => g._id === gradeId);
      if (!grade) return;

      await studentGradesAPI.update(gradeId, {
        ...gradeForm,
        monthly_exam: Array.isArray(gradeForm.monthly_exam)
          ? gradeForm.monthly_exam
          : gradeForm.monthly_exam
          ? [gradeForm.monthly_exam]
          : [],
      });

      // Refresh grades
      const gradesResponse = await studentGradesAPI.getByStudent(student._id);
      const gradesData = gradesResponse.data?.data || gradesResponse.data || [];
      const filteredGrades = gradesData.filter((grade) =>
        subjectIsAllowed(grade.subject?._id || grade.subject)
      );
      setGrades(filteredGrades);
      setEditingGrade(null);
      setGradeForm({});
    } catch (err) {
      console.error("Error saving grade:", err);
      setError(
        err.response?.data?.message ||
          t("studentProfile.error.saveGrade", "Failed to save grade")
      );
    }
  };

  // Create new grade
  const createGrade = async (subjectId, season) => {
    try {
      await studentGradesAPI.create({
        student: student._id,
        subject: subjectId,
        season: season,
        season_exam: gradeForm.season_exam || 0,
        exercises: gradeForm.exercises || 0,
        attendance: gradeForm.attendance || 0,
        behaviour: gradeForm.behaviour || 0,
        monthly_exam: Array.isArray(gradeForm.monthly_exam)
          ? gradeForm.monthly_exam
          : gradeForm.monthly_exam
          ? [gradeForm.monthly_exam]
          : [],
        notes: gradeForm.notes || "",
      });

      // Refresh grades
      const gradesResponse = await studentGradesAPI.getByStudent(student._id);
      const gradesData = gradesResponse.data?.data || gradesResponse.data || [];
      const filteredGrades = gradesData.filter((grade) =>
        subjectIsAllowed(grade.subject?._id || grade.subject)
      );
      setGrades(filteredGrades);
      setEditingGrade(null);
      setGradeForm({});
    } catch (err) {
      console.error("Error creating grade:", err);
      setError(
        err.response?.data?.message ||
          t("studentProfile.error.createGrade", "Failed to create grade")
      );
    }
  };

  // Check if user can edit (Teacher or Admin)
  const canEdit = user?.role === "Teacher" || user?.role === "Admin";

  const cardDirectionStyle = useMemo(
    () =>
      currentLanguage === "ku" || currentLanguage === "ar"
        ? { direction: "rtl", textAlign: "right" }
        : {},
    [currentLanguage]
  );

  const itemDirectionStyle = useMemo(
    () =>
      currentLanguage === "ku" || currentLanguage === "ar"
        ? { flexDirection: "row-reverse", textAlign: "right" }
        : {},
    [currentLanguage]
  );

  if (loading) {
    return (
      <div className="loading">
        <div>{t("studentProfile.loading", "Loading student profile...")}</div>
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

  if (!student) {
    return (
      <div className="container">
        <div className="empty-state">
          <User size={64} color="#9ca3af" />
          <h3>{t("studentProfile.empty.title", "No Student Found")}</h3>
          <p>
            {t(
              "studentProfile.empty.message",
              "Student profile not found or you don't have permission to view it."
            )}
          </p>
        </div>
      </div>
    );
  }

  const classDisplayName = getLocalizedText(
    student.class?.nameMultilingual || student.class?.name,
    t("studentProfile.notAssigned", "Not assigned")
  );

  const branchDisplayName = getBranchDisplayName(student);

  return (
    <div>
      {/* <div className="page-header">
        <div className="container">
          <h1>
            <User
              size={32}
              style={{ marginRight: "12px", verticalAlign: "middle" }}
            />
            {t("studentProfile.title", "Student Profile")}
          </h1>
          <p>
            {t("studentProfile.subtitle", "Detailed information about")}{" "}
            {student.fullName}
          </p>
        </div>
      </div> */}

      <div className="container">
        <div className="profile-layout">
          {/* Student Information Card */}
          <div className="profile-hero-card">
            <div className="profile-hero-banner">
              <div className="student-avatar">
                {student.photo ? (
                  <>
                    <img
                      src={
                        student.photo.startsWith("http")
                          ? student.photo
                          : (() => {
                              // Get base URL from environment or default (same as api.js)
                              const apiUrl =
                                process.env.REACT_APP_API_URL ||
                                "http://localhost:5000/api";

                              // Remove /api suffix if present to get base URL
                              // Backend serves static files at /uploads (not /api/uploads)
                              let baseUrl = apiUrl.replace(/\/api\/?$/, "");

                              // Ensure we have a valid base URL
                              if (!baseUrl || baseUrl.trim() === "") {
                                baseUrl = "http://localhost:5000";
                              }

                              // Remove trailing slash if present
                              baseUrl = baseUrl.replace(/\/$/, "");

                              // Ensure photo path starts with /
                              const photoPath = student.photo.startsWith("/")
                                ? student.photo
                                : `/${student.photo}`;

                              const fullUrl = `${baseUrl}${photoPath}`;

                              // Debug logging (remove in production if needed)
                              if (process.env.NODE_ENV === "development") {
                                console.log("Photo URL constructed:", {
                                  apiUrl,
                                  baseUrl,
                                  photoPath,
                                  fullUrl,
                                  studentPhoto: student.photo,
                                });
                              }

                              return fullUrl;
                            })()
                      }
                      alt={student.fullName}
                      onError={(e) => {
                        console.error("Failed to load student photo:", {
                          src: e.target.src,
                          studentPhoto: student.photo,
                        });
                        // Hide image and show placeholder on error
                        e.target.style.display = "none";
                        const placeholder =
                          e.target.parentElement.querySelector(
                            ".avatar-placeholder"
                          );
                        if (placeholder) {
                          placeholder.style.display = "flex";
                        }
                      }}
                      style={{ display: "block" }}
                    />
                    <div
                      className="avatar-placeholder"
                      style={{ display: "none" }}
                    >
                      {student.fullName && student.fullName.length > 0
                        ? student.fullName.charAt(0).toUpperCase()
                        : student.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  </>
                ) : (
                  <div className="avatar-placeholder">
                    {student.fullName && student.fullName.length > 0
                      ? student.fullName.charAt(0).toUpperCase()
                      : student.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="profile-hero-content">
                <div className="profile-hero-info">
                  <h2>
                    {student.fullName ||
                      student.username ||
                      t("studentProfile.unknownStudent", "Unknown Student")}
                  </h2>
                  <div className="profile-hero-meta">
                    <span className="profile-hero-gender">
                      {getGenderIcon(student.gender)}{" "}
                      {getGenderLabel(student.gender)}
                    </span>

                    {/* <span className="profile-hero-chip">
                    <Calendar size={14} />
                    {joinedDateLabel}
                    </span> */}
                  </div>
                  {/* <div className="profile-hero-id">
                  <span className="id-badge">
                    {t("studentProfile.id", "ID")}:{" "}
                    {student.studentNumber || t("common.na", "N/A")}
                  </span>
                  </div> */}
                </div>
                <div className="profile-hero-status">
                  <span className="profile-hero-chip">
                    <GraduationCap size={14} />
                    {classDisplayName}
                  </span>
                  <span className="profile-hero-chip">
                    <MapPin size={14} />
                    {branchDisplayName}
                  </span>
                  {/* <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(student.status) }}
                >
                  {getStatusLabel(student.status)}
                  </span> */}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="info-card" style={cardDirectionStyle}>
              <h3>{t("studentProfile.contactInfo", "Contact Information")}</h3>
              <div className="info-list">
                <div className="info-item" style={itemDirectionStyle}>
                  <Mail size={16} />
                  <span>{student.email}</span>
                </div>
                <div className="info-item" style={itemDirectionStyle}>
                  <Phone size={16} />
                  <span>
                    {student.phone ||
                      t("studentProfile.notProvided", "Not provided")}
                  </span>
                </div>
                {/* <div className="info-item" style={itemDirectionStyle}>
                  <User size={16} />
                  <span>
                    {t("studentProfile.username", "Username")}:{" "}
                    {student.username}
                  </span>
                </div> */}
                {student.parentsNumber && (
                  <div className="info-item" style={itemDirectionStyle}>
                    <Phone size={16} />
                    <span>
                      {t("studentProfile.parents", "Parents")}:{" "}
                      {student.parentsNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          {/* <div className="profile-card">
            <h3>
              {t("studentProfile.academicPerformance", "Academic Performance")}
            </h3>
            {!Array.isArray(evaluations) || evaluations.length === 0 ? (
              <div className="empty-section">
                <Award size={32} color="#9ca3af" />
                <p>
                  {t("studentProfile.noEvaluations", "No evaluations found")}
                </p>
              </div>
            ) : (
              <div className="evaluations-list">
                {evaluations.map((evaluation) => (
                  <div key={evaluation._id} className="evaluation-item">
                    <div className="evaluation-header">
                      <h4>
                        {getLocalizedText(
                          evaluation.titleMultilingual || evaluation.title,
                          evaluation.title ||
                            t("studentProfile.evaluation.untitled", "Untitled")
                        )}
                      </h4>
                      <span
                        className="grade-badge"
                        style={{
                          backgroundColor: getGradeColor(evaluation.score),
                        }}
                      >
                        {evaluation.score}%
                      </span>
                    </div>
                    <div className="evaluation-details">
                      <div className="evaluation-meta">
                        <span className="course-name">
                          <BookOpen size={14} />
                          {getLocalizedText(
                            evaluation.course?.nameMultilingual ||
                              evaluation.course?.name,
                            t("studentProfile.unknownCourse", "Unknown Course")
                          )}
                        </span>
                        <span className="evaluation-type">
                          {getEvaluationTypeLabel(evaluation.evaluationType)}
                        </span>
                        <span className="evaluation-date">
                          <Clock size={14} />
                          {formatDate(evaluation.date)}
                        </span>
                      </div>
                      {evaluation.comments && (
                        <p className="evaluation-comments">
                          {getLocalizedText(
                            evaluation.commentsMultilingual ||
                              evaluation.comments,
                            evaluation.comments
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Available Courses */}
          {/* <div className="profile-card">
            <h3>{t("studentProfile.availableCourses", "Available Courses")}</h3>
            {!Array.isArray(courses) || courses.length === 0 ? (
              <div className="empty-section">
                <BookOpen size={32} color="#9ca3af" />
                <p>{t("studentProfile.noCourses", "No courses available")}</p>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course._id} className="course-item">
                    <div className="course-header">
                      <BookOpen size={20} />
                      <h4>
                        {getLocalizedText(
                          course.nameMultilingual || course.name,
                          course.name ||
                            t("studentProfile.unknownCourse", "Unknown Course")
                        )}
                      </h4>
                    </div>
                    <p className="course-description">
                      {getLocalizedText(
                        course.descriptionMultilingual || course.description,
                        t(
                          "studentProfile.noDescription",
                          "No description available"
                        )
                      )}
                    </p>
                    <div className="course-meta">
                      <span className="course-duration">
                        {t("studentProfile.duration", "Duration")}:{" "}
                        {course.duration || t("common.na", "N/A")}
                      </span>
                      <span className="course-credits">
                        {t("studentProfile.credits", "Credits")}:{" "}
                        {course.credits || t("common.na", "N/A")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Training Quizzes */}
          <div className="profile-card">
            <div className="training-quizzes-header">
              <div className="training-quizzes-header-text">
                <h3>
                  {t("studentProfile.trainingQuizzes", "Training Quizzes")}
                </h3>
                <span className="training-quizzes-note">
                  {t(
                    "studentProfile.trainingQuizzesNote",
                    "Practice quizzes for revision – results do not impact the degree."
                  )}
                </span>
              </div>
              <button
                type="button"
                className="all-quizzes-btn"
                onClick={() => navigate("/student/quizzes")}
              >
                {t("studentProfile.allQuizzes", "All Quizzes")}
              </button>
            </div>
            {trainingQuizzes.length === 0 ? (
              <div className="empty-section">
                <ClipboardList size={32} color="#9ca3af" />
                <p>
                  {t(
                    "studentProfile.noTrainingQuizzes",
                    "No training quizzes available yet."
                  )}
                </p>
              </div>
            ) : (
              <div className="training-quizzes-list" style={{ width: "300px" }}>
                {trainingQuizzes.map(({ quiz, chapter, subject, season }) => {
                  const quizTitle = getLocalizedText(
                    quiz.titleMultilingual || quiz.title,
                    quiz.title ||
                      t("studentProfile.quizUntitled", "Untitled Quiz")
                  );
                  const chapterTitle =
                    chapter &&
                    getLocalizedText(
                      chapter.titleMultilingual || chapter.title,
                      chapter.title ||
                        t("studentProfile.unknownChapter", "Unknown Chapter")
                    );
                  const subjectTitle =
                    subject &&
                    getLocalizedText(
                      subject.titleMultilingual || subject.title,
                      subject.title ||
                        t("studentProfile.unknownSubject", "Unknown Subject")
                    );
                  const seasonTitle =
                    season &&
                    getLocalizedText(
                      season.nameMultilingual || season.name,
                      season.name ||
                        t("studentProfile.unknownSeason", "Unknown Season")
                    );
                  const metadata = [subjectTitle, chapterTitle, seasonTitle]
                    .filter(Boolean)
                    .join(" • ");
                  const questionCount = quiz.questions?.length || 0;
                  const previewPrompt = quiz.questions?.[0]?.prompt || "";
                  const updatedAt = quiz.updatedAt || quiz.createdAt;

                  return (
                    <div key={quiz._id} className="training-quiz-card">
                      <div className="training-quiz-header">
                        <ClipboardList size={18} />
                        <div className="training-quiz-titles">
                          <h4>{quizTitle}</h4>
                          {metadata && (
                            <span className="training-quiz-meta-line">
                              {metadata}
                            </span>
                          )}
                        </div>
                        <span className="training-quiz-pill">
                          {t("studentProfile.trainingOnly", "Training")}
                        </span>
                      </div>

                      <div className="training-quiz-overview">
                        <span>
                          {interpolateTemplate(
                            t(
                              "studentProfile.trainingQuizQuestions",
                              "{{count}} questions"
                            ),
                            { count: questionCount }
                          )}
                        </span>
                        {previewPrompt && (
                          <span className="training-quiz-preview">
                            “{previewPrompt}”
                          </span>
                        )}
                      </div>

                      <div className="training-quiz-footer">
                        <span>
                          {t("studentProfile.trainingQuizStatus", "Status")}:{" "}
                          {quiz.isActive !== false
                            ? t("status.active", "Active")
                            : t("status.inactive", "Inactive")}
                        </span>
                        {updatedAt && (
                          <span>
                            {t("studentProfile.trainingQuizUpdated", "Updated")}
                            : {formatDate(updatedAt)}
                          </span>
                        )}
                      </div>
                      <div className="training-quiz-actions">
                        <button
                          type="button"
                          className="training-play-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log(
                              "Quiz play button clicked for quiz:",
                              quiz._id
                            );
                            navigate(`/quizzes/${quiz._id}/play`, {
                              state: { quiz, from: "/student/profile" },
                            });
                          }}
                        >
                          <PlayCircle size={16} />
                          {t("studentProfile.playTrainingQuiz", "Play Quiz")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Header - School Info */}

          {/* Student Ratings */}
          <div className="profile-card" style={{ gridColumn: "1 / -1" }}>
            <h3>{t("studentProfile.studentRatings", "Student Ratings")}</h3>

            {studentRatings.length === 0 ? (
              <div className="empty-section">
                <BookOpen size={32} color="#9ca3af" />
                <p>
                  {t(
                    "studentProfile.noRatings",
                    "No ratings have been recorded yet."
                  )}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    marginTop: "8px",
                    fontStyle: "italic",
                  }}
                >
                  {t(
                    "studentProfile.noRatingsExplanation",
                    "Ratings will appear here once teachers add them for this student."
                  )}
                </p>
              </div>
            ) : (
              <>
                {/* Ratings Filter */}
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {/* Season Filter */}
                  <div>
                    <label
                      style={{
                        fontWeight: "600",
                        fontSize: "13px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      🎓 {t("form.season", "Season")}
                    </label>
                    <select
                      value={ratingFilterSeason}
                      onChange={(e) => setRatingFilterSeason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="">-- All Seasons --</option>
                      {seasons.map((season) => (
                        <option key={season._id} value={season._id}>
                          {season.name?.en || season.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Mode - Radio Buttons with Icons Only */}
                  <div>
                    <label
                      style={{
                        fontWeight: "600",
                        fontSize: "13px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      📅 {t("form.filter", "Filter")}
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Evaluation Filter */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          gap: "6px",
                        }}
                        title="Evaluation (Last vs Previous)"
                      >
                        <input
                          type="radio"
                          name="ratingFilterMode"
                          value="evaluation"
                          checked={ratingFilterMode === "evaluation"}
                          onChange={(e) => {
                            const newMode = e.target.value;
                            setRatingFilterMode(newMode);
                            setRatingFilterFromDate("");
                            setRatingFilterToDate("");
                          }}
                          style={{
                            cursor: "pointer",
                            accentColor: "#3b82f6",
                          }}
                        />
                        <span style={{ fontSize: "20px" }} title="Evaluation">
                          📊
                        </span>
                      </label>

                      {/* By Month Filter */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          gap: "6px",
                        }}
                        title="By Month"
                      >
                        <input
                          type="radio"
                          name="ratingFilterMode"
                          value="month"
                          checked={ratingFilterMode === "month"}
                          onChange={(e) => {
                            const newMode = e.target.value;
                            setRatingFilterMode(newMode);

                            // Auto-select this month when "month" filter is selected
                            const today = new Date();
                            const thisMonth = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              1
                            );
                            const thisMonthStr =
                              formatDateToYYYYMMDD(thisMonth);

                            // Set to last day of this month
                            const lastDay = new Date(
                              today.getFullYear(),
                              today.getMonth() + 1,
                              0
                            );
                            const lastDayStr = formatDateToYYYYMMDD(lastDay);

                            setRatingFilterFromDate(thisMonthStr);
                            setRatingFilterToDate(lastDayStr);

                            // Also update selected month state
                            setSelectedMonthYear({
                              year: today.getFullYear(),
                              month: today.getMonth(),
                            });
                          }}
                          style={{
                            cursor: "pointer",
                            accentColor: "#3b82f6",
                          }}
                        />
                        <span style={{ fontSize: "20px" }} title="By Month">
                          📆
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* By Month Navigation */}
                  {ratingFilterMode === "month" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const nextMonth = new Date(
                            selectedMonthYear.year,
                            selectedMonthYear.month + 1,
                            1
                          );
                          setSelectedMonthYear({
                            year: nextMonth.getFullYear(),
                            month: nextMonth.getMonth(),
                          });

                          // Set filter dates to next month (1st to last day)
                          const fromDate = new Date(
                            nextMonth.getFullYear(),
                            nextMonth.getMonth(),
                            1
                          ); // First day of the month
                          const toDate = new Date(
                            nextMonth.getFullYear(),
                            nextMonth.getMonth() + 1,
                            0
                          ); // Last day of the month
                          setRatingFilterFromDate(
                            formatDateToYYYYMMDD(fromDate)
                          );
                          setRatingFilterToDate(formatDateToYYYYMMDD(toDate));
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        ► {t("studentProfile.next", "Next")}
                      </button>

                      <div
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "15px",
                          color: "#1f2937",
                        }}
                      >
                        {new Date(
                          selectedMonthYear.year,
                          selectedMonthYear.month,
                          1
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const prevMonth = new Date(
                            selectedMonthYear.year,
                            selectedMonthYear.month - 1,
                            1
                          );
                          setSelectedMonthYear({
                            year: prevMonth.getFullYear(),
                            month: prevMonth.getMonth(),
                          });

                          // Set filter dates to previous month (1st to last day)
                          const fromDate = new Date(
                            prevMonth.getFullYear(),
                            prevMonth.getMonth(),
                            1
                          ); // First day of the month
                          const toDate = new Date(
                            prevMonth.getFullYear(),
                            prevMonth.getMonth() + 1,
                            0
                          ); // Last day of the month
                          setRatingFilterFromDate(
                            formatDateToYYYYMMDD(fromDate)
                          );
                          setRatingFilterToDate(formatDateToYYYYMMDD(toDate));
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {t("studentProfile.previous", "Previous")} ◄
                      </button>
                    </div>
                  )}
                </div>

                {/* Empty State for Filtered Results */}
                {getFilteredRatings().length === 0 ? (
                  <div className="empty-section">
                    <BookOpen size={32} color="#9ca3af" />
                    <p>
                      {t(
                        "studentProfile.noRatingsFiltered",
                        "No ratings found for the selected filters."
                      )}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#9ca3af",
                        marginTop: "8px",
                        fontStyle: "italic",
                      }}
                    >
                      {t(
                        "studentProfile.noRatingsFilteredExplanation",
                        "Try changing the filter mode, season, or selected month to see available ratings."
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Show evaluation per subject in one row */}
                    {isMobile && ratingFilterMode === "evaluation" ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {/* Column Headers */}
                        <div
                          style={{
                            padding: "10px 12px",
                            backgroundColor: "#1f2937",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div style={{ flex: "0 0 auto", minWidth: "100px" }}>
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "12px",
                                color: "#ffffff",
                              }}
                            >
                              {t("studentProfile.subject", "Subject")}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "11px",
                                color: "#ffffff",
                              }}
                            >
                              {t("studentProfile.latest", "LATEST")}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "11px",
                                color: "#ffffff",
                              }}
                            >
                              {t("studentProfile.previous", "PREVIOUS")}
                            </div>
                          </div>
                        </div>

                        {Array.from(
                          new Set(getFilteredRatings().map((r) => r.subjectId))
                        ).map((subjectId) => {
                          const subjectName = (() => {
                            const subject = subjects.find(
                              (s) =>
                                normalizeId(s?._id || s) ===
                                normalizeId(subjectId)
                            );
                            return subject
                              ? getLocalizedText(
                                  subject.titleMultilingual || subject.title,
                                  subject.title || subjectId
                                )
                              : subjectId;
                          })();

                          const sortedRatings = getFilteredRatings()
                            .filter((r) => r.subjectId === subjectId)
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 2);

                          const lastRating = sortedRatings[0];
                          const previousRating = sortedRatings[1];

                          return (
                            <div
                              key={subjectId}
                              style={{
                                padding: "10px 12px",
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              {/* Subject Name */}
                              <div
                                style={{ flex: "0 0 auto", minWidth: "100px" }}
                              >
                                <div
                                  style={{
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    color: "#1f2937",
                                  }}
                                >
                                  {subjectName}
                                </div>
                              </div>

                              {/* Last Rating */}
                              {lastRating && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      backgroundColor: getRatingColor(
                                        lastRating.rating
                                      ),
                                      color: "white",
                                      fontWeight: "bold",
                                      fontSize: "11px",
                                      minWidth: "60px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {getRatingLabel(lastRating.rating)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      color: "#9ca3af",
                                    }}
                                  >
                                    {formatDate(lastRating.date)}
                                  </span>
                                </div>
                              )}

                              {/* Previous Rating */}
                              {previousRating && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      backgroundColor: getRatingColor(
                                        previousRating.rating
                                      ),
                                      color: "white",
                                      fontWeight: "bold",
                                      fontSize: "11px",
                                      minWidth: "60px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {getRatingLabel(previousRating.rating)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      color: "#9ca3af",
                                    }}
                                  >
                                    {formatDate(previousRating.date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="ratings-table-container"
                        style={{
                          overflowX:
                            getFilteredRatings().length > 2 &&
                            !ratingFilterMode.includes("evaluation")
                              ? "auto"
                              : "visible",
                          maxWidth: "100%",
                        }}
                      >
                        <table className="ratings-table">
                          <thead>
                            <tr>
                              <th>{t("studentProfile.subject", "Subject")}</th>
                              {/* Get unique dates sorted newest first */}
                              {Array.from(
                                new Set(
                                  getFilteredRatings()
                                    .map((r) => r.date)
                                    .sort((a, b) => new Date(b) - new Date(a))
                                )
                              ).map((date) => (
                                <th key={date}>{formatDate(date)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Get unique subjects */}
                            {Array.from(
                              new Set(
                                getFilteredRatings().map((r) => r.subjectId)
                              )
                            ).map((subjectId) => {
                              // Map subject ID to subject name
                              const subjectName = (() => {
                                const subject = subjects.find(
                                  (s) =>
                                    normalizeId(s?._id || s) ===
                                    normalizeId(subjectId)
                                );
                                return subject
                                  ? getLocalizedText(
                                      subject.titleMultilingual ||
                                        subject.title,
                                      subject.title || subjectId
                                    )
                                  : subjectId;
                              })();

                              return (
                                <tr key={subjectId}>
                                  <td
                                    className="mobile-grid-cell"
                                    data-label={t(
                                      "studentProfile.subject",
                                      "Subject"
                                    )}
                                  >
                                    {subjectName}
                                  </td>
                                  {/* For each date, show the rating for this subject */}
                                  {Array.from(
                                    new Set(
                                      getFilteredRatings()
                                        .map((r) => r.date)
                                        .sort(
                                          (a, b) => new Date(b) - new Date(a)
                                        )
                                    )
                                  ).map((date) => {
                                    const rating = getFilteredRatings().find(
                                      (r) =>
                                        r.subjectId === subjectId &&
                                        r.date === date
                                    );
                                    return (
                                      <td
                                        key={`${subjectId}-${date}`}
                                        className="mobile-grid-cell"
                                        data-label={formatDate(date)}
                                      >
                                        {rating ? (
                                          <span
                                            className="rating-badge"
                                            style={{
                                              backgroundColor: getRatingColor(
                                                rating.rating
                                              ),
                                            }}
                                          >
                                            {getRatingLabel(rating.rating)}
                                          </span>
                                        ) : (
                                          <span className="no-rating">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Student Grades */}
          <div className="profile-card" style={{ gridColumn: "1 / -1" }}>
            <div className="grades-header">
              <h3 style={{ margin: 0 }}>
                {t("studentProfile.grades", "Student Grades")}
              </h3>
              <div className="filter-controls">
                <label htmlFor="season-filter">
                  {t("studentProfile.filterSeason", "Filter by Season")}:
                </label>
                <select
                  id="season-filter"
                  value={selectedSeasonFilter || ""}
                  onChange={(e) => setSelectedSeasonFilter(e.target.value)}
                  className="season-filter-select"
                >
                  <option value="">
                    {t("studentProfile.allSeasons", "All Seasons")}
                  </option>
                  {seasons
                    .filter((s) => {
                      const order =
                        s.order ||
                        (s.nameMultilingual
                          ? s.nameMultilingual?.en?.includes("1")
                            ? 1
                            : s.nameMultilingual?.en?.includes("2")
                            ? 2
                            : null
                          : null);
                      return order === 1 || order === 2;
                    })
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((season) => {
                      const seasonName = getLocalizedText(
                        season.nameMultilingual || season.name,
                        t("studentProfile.unknownSeason", "Unknown Season")
                      );
                      return (
                        <option
                          key={season._id || seasonName}
                          value={seasonName}
                        >
                          {seasonName}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
            {gradeSubjects.length === 0 ? (
              <div className="empty-section">
                <BookOpen size={32} color="#9ca3af" />
                <p>{t("studentProfile.noSubjects", "No subjects available")}</p>
              </div>
            ) : (
              <div className="grades-table-container">
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>{t("studentProfile.subject", "Subject")}</th>
                      <th>{t("studentProfile.season", "Season")}</th>
                      <th>{t("studentProfile.exercises", "Exercises")} (10)</th>
                      <th>
                        {t("studentProfile.monthlyExam", "Monthly Exam")} (20)
                      </th>
                      <th>
                        {t("studentProfile.attendance", "Attendance")} (5)
                      </th>
                      <th>{t("studentProfile.behaviour", "Behaviour")} (5)</th>
                      <th>
                        {t("studentProfile.seasonExam", "Season Exam")} (60)
                      </th>
                      <th>{t("studentProfile.total", "Total")} (100)</th>
                      {canEdit && (
                        <th>{t("studentProfile.actions", "Actions")}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Filter seasons to show only Season 1 and Season 2 (by order)
                      const seasonsToShow = seasons
                        .filter((s) => {
                          const order =
                            s.order ||
                            (s.nameMultilingual
                              ? s.nameMultilingual?.en?.includes("1")
                                ? 1
                                : s.nameMultilingual?.en?.includes("2")
                                ? 2
                                : null
                              : null);
                          return order === 1 || order === 2;
                        })
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                      // Filter seasons based on selected filter
                      const filteredSeasonsToShow = selectedSeasonFilter
                        ? seasonsToShow.filter((s) => {
                            const seasonNames = [];
                            if (s.nameMultilingual) {
                              if (s.nameMultilingual.en)
                                seasonNames.push(s.nameMultilingual.en);
                              if (s.nameMultilingual.ar)
                                seasonNames.push(s.nameMultilingual.ar);
                              if (s.nameMultilingual.ku)
                                seasonNames.push(s.nameMultilingual.ku);
                            } else if (s.name) {
                              seasonNames.push(s.name);
                            }
                            return seasonNames.includes(selectedSeasonFilter);
                          })
                        : seasonsToShow;

                      const subjectsToDisplay = isMobile
                        ? gradeSubjects.slice(gradesPage, gradesPage + 1)
                        : gradeSubjects;

                      return subjectsToDisplay
                        .map((subject) => {
                          const subjectId = normalizeId(
                            subject?._id || subject
                          );

                          return filteredSeasonsToShow.map((season) => {
                            // Get season name in all languages for matching
                            const seasonNames = [];
                            if (season.nameMultilingual) {
                              if (season.nameMultilingual.en)
                                seasonNames.push(season.nameMultilingual.en);
                              if (season.nameMultilingual.ar)
                                seasonNames.push(season.nameMultilingual.ar);
                              if (season.nameMultilingual.ku)
                                seasonNames.push(season.nameMultilingual.ku);
                            } else if (season.name) {
                              seasonNames.push(season.name);
                            }

                            // Use the first available name for display
                            const seasonName = getLocalizedText(
                              season.nameMultilingual || season.name,
                              t(
                                "studentProfile.unknownSeason",
                                "Unknown Season"
                              )
                            );

                            // Try to find grade by matching any of the season names
                            const grade = grades.find((g) => {
                              const gradeSubjectId = normalizeId(
                                g.subject?._id || g.subject || g.subjectId
                              );
                              if (
                                !gradeSubjectId ||
                                !subjectIsAllowed(gradeSubjectId)
                              ) {
                                return false;
                              }
                              // Check if the grade's subject matches the current subject
                              const subjectMatch = gradeSubjectId === subjectId;
                              const seasonMatch = seasonNames.includes(
                                g.season
                              );
                              if (!seasonMatch || !subjectMatch) {
                                console.log(
                                  `Grade not matched - Subject: ${subjectMatch} (grade: ${gradeSubjectId}, current: ${subjectId}), Season: ${
                                    g.season
                                  }, Looking for: ${JSON.stringify(
                                    seasonNames
                                  )}`
                                );
                              }
                              return subjectMatch && seasonMatch;
                            });

                            if (grade) {
                              console.log(
                                `Found grade for ${
                                  subject.title?.en || subject.title
                                }: exercises=${grade.exercises}, total=${
                                  grade.total
                                }, season=${grade.season}, subjectId=${
                                  grade.subject?._id || grade.subject
                                }`
                              );
                            } else {
                              console.log(
                                `No grade found for subject: ${
                                  subject.title?.en || subject.title
                                }, subjectId: ${subjectId}, seasonNames:`,
                                seasonNames
                              );
                            }

                            const isEditing = editingGrade === grade?._id;
                            const gradeKey = `${subjectId}-${seasonName}`;

                            return (
                              <tr key={gradeKey}>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={t(
                                    "studentProfile.subject",
                                    "Subject"
                                  )}
                                >
                                  {getLocalizedText(
                                    subject.titleMultilingual || subject.title,
                                    t(
                                      "studentProfile.unknownSubject",
                                      "Unknown Subject"
                                    )
                                  )}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={t(
                                    "studentProfile.season",
                                    "Season"
                                  )}
                                >
                                  {seasonName}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={
                                    t("studentProfile.exercises", "Exercises") +
                                    " (10)"
                                  }
                                >
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={gradeForm.exercises || 0}
                                      onChange={(e) =>
                                        setGradeForm({
                                          ...gradeForm,
                                          exercises:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      style={{ width: "60px", padding: "4px" }}
                                    />
                                  ) : (
                                    grade?.exercises || 0
                                  )}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={
                                    t(
                                      "studentProfile.monthlyExam",
                                      "Monthly Exam"
                                    ) + " (20)"
                                  }
                                >
                                  {isEditing ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "4px",
                                        alignItems: "center",
                                      }}
                                    >
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        placeholder={t(
                                          "studentProfile.monthlyExamPlaceholder1",
                                          "Exam 1"
                                        )}
                                        value={
                                          Array.isArray(gradeForm.monthly_exam)
                                            ? gradeForm.monthly_exam[0] || 0
                                            : 0
                                        }
                                        onChange={(e) => {
                                          const exams = Array.isArray(
                                            gradeForm.monthly_exam
                                          )
                                            ? [...gradeForm.monthly_exam]
                                            : [];
                                          exams[0] =
                                            parseFloat(e.target.value) || 0;
                                          setGradeForm({
                                            ...gradeForm,
                                            monthly_exam: exams,
                                          });
                                        }}
                                        style={{
                                          width: "60px",
                                          padding: "4px",
                                        }}
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        placeholder={t(
                                          "studentProfile.monthlyExamPlaceholder2",
                                          "Exam 2"
                                        )}
                                        value={
                                          Array.isArray(gradeForm.monthly_exam)
                                            ? gradeForm.monthly_exam[1] || 0
                                            : 0
                                        }
                                        onChange={(e) => {
                                          const exams = Array.isArray(
                                            gradeForm.monthly_exam
                                          )
                                            ? [...gradeForm.monthly_exam]
                                            : [0];
                                          exams[1] =
                                            parseFloat(e.target.value) || 0;
                                          setGradeForm({
                                            ...gradeForm,
                                            monthly_exam: exams,
                                          });
                                        }}
                                        style={{
                                          width: "60px",
                                          padding: "4px",
                                        }}
                                      />
                                    </div>
                                  ) : grade?.monthly_exam &&
                                    grade.monthly_exam.length > 0 ? (
                                    grade.monthly_exam.length === 2 ? (
                                      `${
                                        grade.monthly_exam.reduce(
                                          (a, b) => a + b,
                                          0
                                        ) / 2
                                      } (${grade.monthly_exam.join(", ")})`
                                    ) : (
                                      grade.monthly_exam[0]
                                    )
                                  ) : (
                                    0
                                  )}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={
                                    t(
                                      "studentProfile.attendance",
                                      "Attendance"
                                    ) + " (5)"
                                  }
                                >
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="5"
                                      value={gradeForm.attendance || 0}
                                      onChange={(e) =>
                                        setGradeForm({
                                          ...gradeForm,
                                          attendance:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      style={{ width: "60px", padding: "4px" }}
                                    />
                                  ) : (
                                    grade?.attendance || 0
                                  )}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={
                                    t("studentProfile.behaviour", "Behaviour") +
                                    " (5)"
                                  }
                                >
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="5"
                                      value={gradeForm.behaviour || 0}
                                      onChange={(e) =>
                                        setGradeForm({
                                          ...gradeForm,
                                          behaviour:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      style={{ width: "60px", padding: "4px" }}
                                    />
                                  ) : (
                                    grade?.behaviour || 0
                                  )}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={
                                    t(
                                      "studentProfile.seasonExam",
                                      "Season Exam"
                                    ) + " (60)"
                                  }
                                >
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="60"
                                      value={gradeForm.season_exam || 0}
                                      onChange={(e) =>
                                        setGradeForm({
                                          ...gradeForm,
                                          season_exam:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      style={{ width: "60px", padding: "4px" }}
                                    />
                                  ) : (
                                    grade?.season_exam || 0
                                  )}
                                </td>
                                <td
                                  className="mobile-grid-cell"
                                  data-label={
                                    t("studentProfile.total", "Total") +
                                    " (100)"
                                  }
                                >
                                  <div className="mobile-badge-wrapper">
                                    <span
                                      className="grade-badge mobile-block-badge"
                                      style={{
                                        backgroundColor: getGradeColor(
                                          grade?.total || 0
                                        ),
                                      }}
                                    >
                                      {grade?.total || 0}
                                    </span>
                                  </div>
                                </td>
                                {canEdit && (
                                  <td
                                    className="mobile-actions-cell"
                                    data-label={t(
                                      "studentProfile.actions",
                                      "Actions"
                                    )}
                                  >
                                    {isEditing ? (
                                      <div
                                        style={{ display: "flex", gap: "8px" }}
                                      >
                                        <button
                                          onClick={() => saveGrade(grade._id)}
                                          style={{
                                            padding: "4px 8px",
                                            background: "#10b981",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <Save size={14} />
                                        </button>
                                        <button
                                          onClick={cancelEditing}
                                          style={{
                                            padding: "4px 8px",
                                            background: "#ef4444",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : grade ? (
                                      <button
                                        onClick={() => startEditingGrade(grade)}
                                        style={{
                                          padding: "4px 8px",
                                          background: "#3b82f6",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <Edit size={14} />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingGrade(gradeKey);
                                          setGradeForm({
                                            season_exam: 0,
                                            exercises: 0,
                                            attendance: 0,
                                            behaviour: 0,
                                            monthly_exam: [],
                                            notes: "",
                                          });
                                        }}
                                        style={{
                                          padding: "4px 8px",
                                          background: "#10b981",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {t("studentProfile.addGrade", "Add")}
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          });
                        })
                        .flat();
                    })()}
                    {editingGrade &&
                      !grades.find((g) => g._id === editingGrade) &&
                      (() => {
                        // Filter seasons to show only Season 1 and Season 2 (by order)
                        const seasonsToShow = seasons
                          .filter((s) => {
                            const order =
                              s.order ||
                              (s.nameMultilingual
                                ? s.nameMultilingual?.en?.includes("1")
                                  ? 1
                                  : s.nameMultilingual?.en?.includes("2")
                                  ? 2
                                  : null
                                : null);
                            return order === 1 || order === 2;
                          })
                          .sort((a, b) => (a.order || 0) - (b.order || 0));

                        const [subjectId, ...seasonNameParts] =
                          editingGrade.split("-");
                        const seasonName = seasonNameParts.join("-");
                        const subject = subjects.find(
                          (s) => (s._id || s) === subjectId
                        );
                        const season = seasonsToShow.find((s) => {
                          const names = [];
                          if (s.nameMultilingual) {
                            if (s.nameMultilingual.en)
                              names.push(s.nameMultilingual.en);
                            if (s.nameMultilingual.ar)
                              names.push(s.nameMultilingual.ar);
                            if (s.nameMultilingual.ku)
                              names.push(s.nameMultilingual.ku);
                          } else if (s.name) {
                            names.push(s.name);
                          }
                          return names.includes(seasonName);
                        });

                        return season ? (
                          <tr key={`new-${editingGrade}`}>
                            <td
                              className="mobile-grid-cell"
                              data-label={t(
                                "studentProfile.subject",
                                "Subject"
                              )}
                            >
                              {getLocalizedText(
                                subject?.titleMultilingual || subject?.title,
                                t(
                                  "studentProfile.unknownSubject",
                                  "Unknown Subject"
                                )
                              )}
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={t("studentProfile.season", "Season")}
                            >
                              {seasonName}
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={
                                t("studentProfile.exercises", "Exercises") +
                                " (10)"
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={gradeForm.exercises || 0}
                                onChange={(e) =>
                                  setGradeForm({
                                    ...gradeForm,
                                    exercises: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{ width: "60px", padding: "4px" }}
                              />
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={
                                t(
                                  "studentProfile.monthlyExam",
                                  "Monthly Exam"
                                ) + " (20)"
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "4px",
                                  alignItems: "center",
                                }}
                              >
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  placeholder={t(
                                    "studentProfile.monthlyExamPlaceholder1",
                                    "Exam 1"
                                  )}
                                  value={
                                    Array.isArray(gradeForm.monthly_exam)
                                      ? gradeForm.monthly_exam[0] || 0
                                      : 0
                                  }
                                  onChange={(e) => {
                                    const exams = Array.isArray(
                                      gradeForm.monthly_exam
                                    )
                                      ? [...gradeForm.monthly_exam]
                                      : [];
                                    exams[0] = parseFloat(e.target.value) || 0;
                                    setGradeForm({
                                      ...gradeForm,
                                      monthly_exam: exams,
                                    });
                                  }}
                                  style={{ width: "60px", padding: "4px" }}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  placeholder={t(
                                    "studentProfile.monthlyExamPlaceholder2",
                                    "Exam 2"
                                  )}
                                  value={
                                    Array.isArray(gradeForm.monthly_exam)
                                      ? gradeForm.monthly_exam[1] || 0
                                      : 0
                                  }
                                  onChange={(e) => {
                                    const exams = Array.isArray(
                                      gradeForm.monthly_exam
                                    )
                                      ? [...gradeForm.monthly_exam]
                                      : [0];
                                    exams[1] = parseFloat(e.target.value) || 0;
                                    setGradeForm({
                                      ...gradeForm,
                                      monthly_exam: exams,
                                    });
                                  }}
                                  style={{ width: "60px", padding: "4px" }}
                                />
                              </div>
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={
                                t("studentProfile.attendance", "Attendance") +
                                " (5)"
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                max="5"
                                value={gradeForm.attendance || 0}
                                onChange={(e) =>
                                  setGradeForm({
                                    ...gradeForm,
                                    attendance: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{ width: "60px", padding: "4px" }}
                              />
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={
                                t("studentProfile.behaviour", "Behaviour") +
                                " (5)"
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                max="5"
                                value={gradeForm.behaviour || 0}
                                onChange={(e) =>
                                  setGradeForm({
                                    ...gradeForm,
                                    behaviour: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{ width: "60px", padding: "4px" }}
                              />
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={
                                t("studentProfile.seasonExam", "Season Exam") +
                                " (60)"
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                max="60"
                                value={gradeForm.season_exam || 0}
                                onChange={(e) =>
                                  setGradeForm({
                                    ...gradeForm,
                                    season_exam:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{ width: "60px", padding: "4px" }}
                              />
                            </td>
                            <td
                              className="mobile-grid-cell"
                              data-label={
                                t("studentProfile.total", "Total") + " (100)"
                              }
                            >
                              <div className="mobile-badge-wrapper">
                                <span
                                  className="grade-badge mobile-block-badge"
                                  style={{
                                    backgroundColor: getGradeColor(
                                      (gradeForm.season_exam || 0) +
                                        (gradeForm.exercises || 0) +
                                        (gradeForm.attendance || 0) +
                                        (gradeForm.behaviour || 0) +
                                        (Array.isArray(
                                          gradeForm.monthly_exam
                                        ) && gradeForm.monthly_exam.length > 0
                                          ? Math.min(
                                              gradeForm.monthly_exam.length ===
                                                2
                                                ? gradeForm.monthly_exam.reduce(
                                                    (a, b) => a + b,
                                                    0
                                                  ) / 2
                                                : gradeForm.monthly_exam[0],
                                              20
                                            )
                                          : 0) || 0
                                    ),
                                  }}
                                >
                                  {Math.min(
                                    (gradeForm.season_exam || 0) +
                                      (gradeForm.exercises || 0) +
                                      (gradeForm.attendance || 0) +
                                      (gradeForm.behaviour || 0) +
                                      (Array.isArray(gradeForm.monthly_exam) &&
                                      gradeForm.monthly_exam.length > 0
                                        ? Math.min(
                                            gradeForm.monthly_exam.length === 2
                                              ? gradeForm.monthly_exam.reduce(
                                                  (a, b) => a + b,
                                                  0
                                                ) / 2
                                              : gradeForm.monthly_exam[0],
                                            20
                                          )
                                        : 0) || 0,
                                    100
                                  )}
                                </span>
                              </div>
                            </td>
                            {canEdit && (
                              <td
                                className="mobile-actions-cell"
                                data-label={t(
                                  "studentProfile.actions",
                                  "Actions"
                                )}
                              >
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={() =>
                                      createGrade(subjectId, seasonName)
                                    }
                                    style={{
                                      padding: "4px 8px",
                                      background: "#10b981",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    style={{
                                      padding: "4px 8px",
                                      background: "#ef4444",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ) : null;
                      })()}
                  </tbody>
                </table>
                {isMobile && gradeSubjects.length > 1 && (
                  <div className="table-pagination">
                    <button
                      type="button"
                      onClick={() =>
                        setGradesPage((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={gradesPage === 0}
                    >
                      {t("studentProfile.prevSubject", "Previous Subject")}
                    </button>
                    <span>
                      {interpolateTemplate(
                        t(
                          "studentProfile.subjectPage",
                          "Subject {{current}} of {{total}}"
                        ),
                        {
                          current: gradesPage + 1,
                          total: gradeSubjects.length,
                        }
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGradesPage((prev) =>
                          Math.min(prev + 1, gradeSubjects.length - 1)
                        )
                      }
                      disabled={gradesPage >= gradeSubjects.length - 1}
                    >
                      {t("studentProfile.nextSubject", "Next Subject")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activities Log */}
          <div className="profile-card" style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {t("studentProfile.activitiesLog", "Activities Log")}
              </h3>
            </div>
            {activityRows.length === 0 ? (
              <div className="empty-section">
                <BookOpen size={32} color="#9ca3af" />
                <p>
                  {t(
                    "studentProfile.noActivities",
                    "No exercises completed yet"
                  )}
                </p>
              </div>
            ) : (
              <div className="grades-table-container">
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>{t("studentProfile.type", "Type")}</th>
                      <th>{t("studentProfile.exerciseName", "Exercise")}</th>
                      <th>{t("studentProfile.part", "Part")}</th>
                      <th>{t("studentProfile.season", "Season")}</th>
                      <th>{t("studentProfile.subject", "Subject")}</th>
                      <th>{t("studentProfile.date", "Date")}</th>
                      <th>{t("studentProfile.degree", "Degree")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isMobile
                      ? activityRows.slice(activityPage, activityPage + 1)
                      : activityRows
                    ).map((exerciseGrade) => {
                      // Handle different grading types
                      const gradingType =
                        exerciseGrade.gradingType || "exercise";
                      const isExercise = gradingType === "exercise";

                      // Get type display name
                      const typeDisplayName = getActivityTypeLabel(gradingType);

                      // Exercise name - for monthly exam, show "First Exam" or "Second Exam"
                      const exerciseName = isExercise
                        ? getLocalizedText(
                            exerciseGrade.exercise?.nameMultilingual ||
                              exerciseGrade.exercise?.name ||
                              exerciseGrade.exercise,
                            t(
                              "studentProfile.unknownExercise",
                              "Unknown Exercise"
                            )
                          )
                        : gradingType === "monthly_exam"
                        ? getMonthlyExamLabel(exerciseGrade.monthlyExamNumber)
                        : t("common.na", "N/A");

                      const partName = isExercise
                        ? getLocalizedText(
                            exerciseGrade.part?.titleMultilingual ||
                              exerciseGrade.part?.title ||
                              exerciseGrade.part,
                            t("studentProfile.unknownPart", "Unknown Part")
                          )
                        : t("common.na", "N/A");

                      const seasonName = getLocalizedText(
                        exerciseGrade.season?.nameMultilingual ||
                          exerciseGrade.season?.name ||
                          exerciseGrade.season,
                        t("studentProfile.unknownSeason", "Unknown Season")
                      );
                      const subjectName = getLocalizedText(
                        exerciseGrade.subject?.titleMultilingual ||
                          exerciseGrade.subject?.title ||
                          exerciseGrade.subject,
                        t("studentProfile.unknownSubject", "Unknown Subject")
                      );
                      if (
                        isTeacher &&
                        !subjectIsAllowed(
                          exerciseGrade.subject?._id ||
                            exerciseGrade.subject ||
                            exerciseGrade.subjectId
                        )
                      ) {
                        return null;
                      }
                      const date =
                        exerciseGrade.gradedAt || exerciseGrade.createdAt;
                      const formattedDate = formatDate(date);
                      // Handle grade value - 0 is valid, so check for null/undefined specifically
                      const grade =
                        exerciseGrade.grade !== null &&
                        exerciseGrade.grade !== undefined
                          ? Number(exerciseGrade.grade)
                          : 0;

                      // For non-exercise types, determine max based on grading type
                      let maxGrade = 0;
                      if (isExercise) {
                        maxGrade =
                          exerciseGrade.exercise?.degree ||
                          exerciseGrade.exerciseDegree ||
                          0;
                      } else if (gradingType === "monthly_exam") {
                        maxGrade = 20;
                      } else if (
                        gradingType === "attendance" ||
                        gradingType === "behaviour"
                      ) {
                        maxGrade = 5;
                      } else if (gradingType === "season_exam") {
                        maxGrade = 60;
                      }

                      return (
                        <tr key={exerciseGrade._id}>
                          <td data-label={t("studentProfile.type", "Type")}>
                            {typeDisplayName}
                          </td>
                          <td
                            data-label={t(
                              "studentProfile.exerciseName",
                              "Exercise"
                            )}
                          >
                            {exerciseName}
                          </td>
                          <td data-label={t("studentProfile.part", "Part")}>
                            {partName}
                          </td>
                          <td data-label={t("studentProfile.season", "Season")}>
                            {seasonName}
                          </td>
                          <td
                            data-label={t("studentProfile.subject", "Subject")}
                          >
                            {subjectName}
                          </td>
                          <td data-label={t("studentProfile.date", "Date")}>
                            {formattedDate}
                          </td>
                          <td data-label={t("studentProfile.degree", "Degree")}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#ffffff",
                                backgroundColor:
                                  grade === maxGrade
                                    ? "#10b981"
                                    : grade >= maxGrade * 0.8
                                    ? "#3b82f6"
                                    : grade >= maxGrade * 0.6
                                    ? "#f59e0b"
                                    : "#ef4444",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                display: "inline-block",
                                minWidth: "60px",
                                textAlign: "center",
                              }}
                            >
                              {grade}/{maxGrade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {isMobile && activityRows.length > 1 && (
                  <div className="table-pagination">
                    <button
                      type="button"
                      onClick={() =>
                        setActivityPage((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={activityPage === 0}
                    >
                      {t("studentProfile.prevActivity", "Previous Activity")}
                    </button>
                    <span>
                      {interpolateTemplate(
                        t(
                          "studentProfile.activityPage",
                          "Activity {{current}} of {{total}}"
                        ),
                        {
                          current: activityPage + 1,
                          total: activityRows.length,
                        }
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActivityPage((prev) =>
                          Math.min(prev + 1, activityRows.length - 1)
                        )
                      }
                      disabled={activityPage >= activityRows.length - 1}
                    >
                      {t("studentProfile.nextActivity", "Next Activity")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-layout {
          display: grid;
          gap: 28px;
          grid-template-columns: 1fr;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
          border-color: rgba(102, 126, 234, 0.2);
        }

        .profile-card h3 {
          margin: 0 0 24px 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .profile-hero-card {
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-hero-banner {
          background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 50%,
            #f093fb 100%
          );
          border-radius: 32px;
          padding: 32px 40px;
          display: flex;
          align-items: flex-start;
          gap: 32px;
          position: relative;
          overflow: hidden;
          min-height: 240px;
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
        }

        .profile-hero-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: space-between;
        }

        .profile-hero-banner::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at 80% 20%,
              rgba(255, 255, 255, 0.3),
              transparent 50%
            ),
            radial-gradient(
              circle at 20% 80%,
              rgba(255, 255, 255, 0.15),
              transparent 50%
            );
          pointer-events: none;
        }

        .profile-hero-banner::after {
          content: "";
          position: absolute;
          inset: 0;
          background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
          opacity: 0.5;
          pointer-events: none;
        }

        .profile-hero-banner > * {
          position: relative;
          z-index: 1;
        }

        .student-avatar {
          width: 160px;
          height: 160px;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          border: 6px solid rgba(255, 255, 255, 0.95);
          position: relative;
          flex-shrink: 0;
          align-self: center;
        }

        .student-avatar::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 24px;
          padding: 2px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4),
            rgba(255, 255, 255, 0.1)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .student-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #e0e7ff 0%, #fce7f3 100%);
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .profile-hero-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .profile-hero-info h2 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -1px;
          line-height: 1.1;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        /* RTL Support for Desktop Layout */
        [dir="rtl"] .profile-hero-info h2 {
          text-align: right;
        }

        [dir="rtl"] .profile-hero-banner {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .profile-hero-content {
          align-items: flex-end;
        }

        [dir="rtl"] .profile-hero-info {
          align-items: flex-end;
        }

        [dir="rtl"] .profile-hero-meta {
          justify-content: flex-end;
        }

        [dir="rtl"] .profile-hero-status {
          justify-content: flex-end;
        }

        .profile-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .profile-hero-gender {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .profile-hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .profile-hero-chip:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .profile-hero-chip svg {
          flex-shrink: 0;
        }

        .profile-hero-id .id-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .profile-hero-status {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .status-badge {
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .status-badge:hover {
          transform: scale(1.05);
        }

        .profile-info-grid {
          display: grid;
          gap: 24px;
          margin-top: 28px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }

        .info-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.6);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .info-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(
            90deg,
            #667eea 0%,
            #764ba2 50%,
            #f093fb 100%
          );
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
          border-color: rgba(102, 126, 234, 0.2);
        }

        .info-card:hover::before {
          transform: scaleX(1);
        }

        .info-card h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .info-card h3::before {
          content: "";
          width: 4px;
          height: 20px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: #475569;
          font-size: 0.95rem;
          padding: 14px 18px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          flex-direction: row;
          text-align: center;
        }

        .info-item:hover {
          border-color: #667eea;
          background: linear-gradient(135deg, #eef2ff 0%, #f3f4f6 100%);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        /* RTL Support for info-item */
        [dir="rtl"] .info-item {
          text-align: center;
        }

        .info-item svg {
          color: #667eea;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .info-item:hover svg {
          transform: scale(1.1);
        }

        .evaluations-list {
          display: grid;
          gap: 16px;
        }

        .evaluation-item {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .evaluation-item::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .evaluation-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .evaluation-item:hover::before {
          opacity: 1;
        }

        .evaluation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .evaluation-header h4 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .grade-badge {
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          letter-spacing: 0.5px;
        }

        .evaluation-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 0.8125rem;
          color: #64748b;
          flex-wrap: wrap;
        }

        .evaluation-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 8px;
        }

        .evaluation-comments {
          margin: 0;
          font-size: 0.9375rem;
          color: #475569;
          font-style: italic;
          line-height: 1.6;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .training-quizzes-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .training-quizzes-header-text h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .training-quizzes-note {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.6;
          font-weight: 500;
        }

        .all-quizzes-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          white-space: nowrap;
        }

        .all-quizzes-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .all-quizzes-btn:active {
          transform: translateY(0);
        }

        .training-quizzes-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .filter-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-control label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-control select {
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          padding: 10px 12px;
          font-size: 0.9rem;
          color: #0f172a;
          background: #ffffff;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .filter-control select:hover {
          border-color: #667eea;
          background: #f8fafc;
        }

        .filter-control select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .training-quizzes-list {
          display: flex;
          flex-direction: row;
          gap: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 12px;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          width: 100%;
          scroll-padding: 0;
          max-width: 100%;
        }

        .training-quizzes-list::-webkit-scrollbar {
          height: 8px;
        }

        .training-quizzes-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
          margin-bottom: 4px;
        }

        .training-quizzes-list::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .training-quizzes-list::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #5568d3 0%, #6a4090 100%);
        }

        .training-quiz-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
          flex: 0 0 calc(100% - 28px);
          min-width: calc(100% - 28px);
          scroll-snap-align: center;
          scroll-snap-stop: always;
        }

        .training-quiz-card::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(
            90deg,
            #667eea 0%,
            #764ba2 50%,
            #f093fb 100%
          );
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          z-index: -1;
        }

        .training-quiz-card:hover {
          border-color: #667eea;
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
        }

        .training-quiz-card:hover::before {
          transform: scaleX(1);
        }

        .training-quiz-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .training-quiz-header svg {
          color: #667eea;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .training-quiz-card:hover .training-quiz-header svg {
          transform: rotate(-5deg) scale(1.1);
        }

        .training-quiz-titles h4 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
        }

        .training-quiz-meta-line {
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .training-quiz-pill {
          margin-left: auto;
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          color: #92400e;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(146, 64, 14, 0.15);
        }

        .training-quiz-overview {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 0.82rem;
          color: #475569;
          padding: 12px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
        }

        .training-quiz-preview {
          font-style: italic;
          color: #64748b;
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .training-quiz-footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 500;
        }

        .training-quiz-actions {
          display: flex;
          justify-content: flex-end;
        }

        .training-play-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          position: relative;
          z-index: 10;
          pointer-events: auto;
        }

        .training-play-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .training-play-btn:active {
          transform: translateY(0);
        }

        .training-play-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .table-pagination {
          display: none;
        }

        .course-item {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .course-item::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .course-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .course-item:hover::before {
          transform: scaleX(1);
        }

        .course-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .course-header svg {
          color: #667eea;
        }

        .course-header h4 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .course-description {
          margin: 0 0 16px 0;
          font-size: 0.9375rem;
          color: #64748b;
          line-height: 1.6;
        }

        .course-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
          color: #94a3b8;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .empty-section {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }

        .empty-section svg {
          opacity: 0.5;
          margin-bottom: 16px;
        }

        .empty-section p {
          margin: 12px 0 0 0;
          font-size: 1rem;
          color: #64748b;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #94a3b8;
        }

        .empty-state h3 {
          margin: 24px 0 12px 0;
          color: #475569;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .empty-state p {
          font-size: 1.125rem;
          color: #64748b;
        }

        .grades-table-container {
          overflow-x: auto;
          margin-top: 20px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .grades-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9375rem;
          background: white;
        }

        .grades-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 16px;
          text-align: center;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .grades-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-weight: 500;
          text-align: center;
        }

        .grades-table tr {
          transition: all 0.2s ease;
        }

        .grades-table tbody tr:hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
          transform: scale(1.01);
        }

        .grades-table input {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          width: 80px;
        }

        .grades-table input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .grades-table button {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
        }

        .grades-table button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .activities-table-container {
          overflow-x: auto;
          margin-top: 20px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .activities-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9375rem;
          background: white;
        }

        .activities-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 16px;
          text-align: center;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .activities-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-weight: 500;
          text-align: center;
        }

        .activities-table tr {
          transition: all 0.2s ease;
        }

        .activities-table tbody tr:hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
          transform: scale(1.01);
        }

        .activities-table td span {
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          background: #f1f5f9;
        }

        .rating-badge {
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          letter-spacing: 0.5px;
          display: inline-block;
        }

        .no-rating {
          color: #cbd5e1;
          font-size: 1.5rem;
          font-weight: 300;
        }

        .ratings-table-container {
          overflow-x: auto;
          margin-top: 20px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .ratings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9375rem;
          background: white;
        }

        .ratings-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 16px;
          text-align: center;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .ratings-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-weight: 500;
          text-align: center;
        }

        .ratings-table tr {
          transition: all 0.2s ease;
        }

        .ratings-table tbody tr:hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
          transform: scale(1.01);
        }

        .grades-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-controls label {
          font-weight: 600;
          color: #475569;
          font-size: 0.9375rem;
        }

        .season-filter-select {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          font-size: 0.9375rem;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          min-width: 180px;
        }

        .season-filter-select:hover {
          border-color: #cbd5e1;
        }

        .season-filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        @media (min-width: 768px) {
          .profile-layout {
            grid-template-columns: 1fr 1fr;
          }

          .profile-hero-card,
          .profile-info-grid {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .training-quizzes-header {
            flex-direction: column;
            align-items: stretch;
          }

          .all-quizzes-btn {
            width: 100%;
            text-align: center;
          }

          .training-quizzes-list {
            flex-direction: row;
            gap: 12px;
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 8px;
            scroll-snap-type: x mandatory;
          }

          .training-quizzes-list::-webkit-scrollbar {
            height: 6px;
            width: auto;
          }

          .training-quiz-card {
            flex: 0 0 calc(100% - 24px);
            min-width: calc(100% - 24px);
            scroll-snap-align: center;
            scroll-snap-stop: always;
          }

          .training-quizzes-filters {
            grid-template-columns: 1fr;
          }

          .table-pagination {
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: nowrap;
          }

          .table-pagination span {
            font-size: 0.75rem;
            color: #475569;
            white-space: nowrap;
            flex-shrink: 0;
            order: 2;
          }

          .table-pagination button {
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            background: #2563eb;
            color: #ffffff;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.2s ease;
            font-size: 0.75rem;
            flex: 1;
            white-space: nowrap;
          }

          .table-pagination button:first-child {
            order: 1;
          }

          .table-pagination button:last-child {
            order: 3;
          }

          .table-pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .table-pagination button:not(:disabled):hover {
            background: #1d4ed8;
            transform: translateY(-1px);
          }

          .profile-card {
            padding: 24px;
          }

          .profile-hero-banner {
            flex-direction: row;
            align-items: flex-start;
            text-align: left;
            padding: 24px;
            gap: 20px;
          }

          .profile-hero-content {
            flex: 1;
            align-items: flex-start;
          }

          .profile-hero-info {
            align-items: flex-start;
          }

          .profile-hero-info h2 {
            font-size: 1.6rem;
            text-align: left;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          /* RTL Support for Medium Mobile Layout */
          [dir="rtl"] .profile-hero-info h2 {
            text-align: right;
          }

          [dir="rtl"] .profile-hero-banner {
            flex-direction: row-reverse;
            text-align: right;
          }

          [dir="rtl"] .profile-hero-content {
            align-items: flex-end;
          }

          [dir="rtl"] .profile-hero-info {
            align-items: flex-end;
          }

          [dir="rtl"] .profile-hero-meta {
            justify-content: flex-end;
          }

          [dir="rtl"] .profile-hero-status {
            justify-content: flex-end;
          }

          .profile-hero-meta {
            justify-content: flex-start;
            gap: 6px;
          }

          .profile-hero-status {
            justify-content: flex-start;
          }

          .profile-info-grid {
            grid-template-columns: 1fr;
          }

          .student-avatar {
            width: 120px;
            height: 120px;
            flex-shrink: 0;
          }
        }

        @media (max-width: 600px) {
          .profile-layout {
            gap: 20px;
          }

          .ratings-table-container {
            display: flex;
            justify-content: center;
            width: 100%;
            padding: 0 10px;
          }

          .ratings-table {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 90%;
          }

          .ratings-table th {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .profile-hero-card {
            border-radius: 28px;
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.15);
          }

          .profile-card,
          .info-card {
            padding: 24px;
            border-radius: 20px;
          }

          .profile-card h3 {
            font-size: 1.25rem;
            margin-bottom: 18px;
          }

          .profile-hero-banner {
            border-radius: 28px;
            padding: 20px 16px;
            flex-direction: row;
            align-items: flex-start;
            text-align: left;
            gap: 16px;
            min-height: auto;
            background: linear-gradient(
              135deg,
              #667eea 0%,
              #764ba2 50%,
              #f093fb 100%
            );
          }

          .profile-hero-content {
            flex: 1;
            align-items: flex-start;
          }

          .profile-hero-info {
            align-items: flex-start;
            gap: 8px;
            width: 100%;
          }

          .profile-hero-info h2 {
            font-size: 1.4rem;
            text-align: left;
            line-height: 1.2;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }

          /* RTL Support for Mobile Layout */
          [dir="rtl"] .profile-hero-info h2 {
            text-align: right;
          }

          [dir="rtl"] .profile-hero-banner {
            flex-direction: row-reverse;
            text-align: right;
          }

          [dir="rtl"] .profile-hero-content {
            align-items: flex-end;
          }

          [dir="rtl"] .profile-hero-info {
            align-items: flex-end;
          }

          [dir="rtl"] .profile-hero-meta {
            justify-content: flex-end;
          }

          [dir="rtl"] .profile-hero-status {
            justify-content: flex-end;
          }

          .profile-hero-meta {
            justify-content: flex-start;
            width: 100%;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 6px;
          }

          .profile-hero-chip,
          .profile-hero-gender {
            font-size: 0.7rem;
            padding: 4px 8px;
          }

          .profile-hero-id {
            width: 100%;
            display: flex;
            justify-content: flex-start;
          }

          .profile-hero-id .id-badge {
            font-size: 0.75rem;
            padding: 6px 12px;
          }

          .profile-hero-status {
            justify-content: flex-start;
            margin-top: 0;
          }

          .profile-hero-status .status-badge {
            font-size: 0.7rem;
            padding: 8px 16px;
            min-width: 100px;
          }

          .student-avatar {
            width: 100px;
            height: 100px;
            border-radius: 20px;
            flex-shrink: 0;
          }

          .info-card h3 {
            font-size: 1.1rem;
          }

          .info-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            text-align: start !important;
            gap: 10px;
          }

          .info-item svg {
            margin-inline-end: 0;
          }

          .grades-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .season-filter-select {
            width: 100%;
          }

          .grades-table,
          .grades-table thead,
          .grades-table tbody,
          .grades-table th,
          .grades-table td,
          .grades-table tr {
            display: block;
            width: 100%;
          }

          .grades-table thead {
            display: none;
          }

          .grades-table tr {
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 18px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 16px;
            transition: all 0.2s ease;
          }

          .grades-table tr:hover {
            border-color: #667eea;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
          }

          .grades-table td {
            padding: 10px 0;
            border: none;
            font-size: 0.9rem;
            position: relative;
            padding-inline-start: 0;
            min-height: 42px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .grades-table td::before {
            content: attr(data-label);
            position: relative;
            top: auto;
            left: auto;
            transform: none;
            font-weight: 700;
            color: #667eea;
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
          }

          .grades-table td .grade-badge {
            align-self: center;
          }

          .grades-table td .mobile-block-badge {
            width: fit-content;
            min-width: 64px;
            text-align: center;
          }

          .mobile-badge-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          .mobile-actions-cell {
            grid-column: 1 / -1;
          }

          .mobile-grid-cell {
            width: 100%;
          }

          .grades-table td:last-child {
            padding-bottom: 0;
          }

          .grades-table button {
            width: 100%;
            justify-content: center;
            margin-top: 8px;
          }

          .activities-table,
          .activities-table thead,
          .activities-table tbody,
          .activities-table th,
          .activities-table td,
          .activities-table tr {
            display: block;
            width: 100%;
          }

          .activities-table thead {
            display: none;
          }

          .activities-table tr {
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 18px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
            transition: all 0.2s ease;
          }

          .activities-table tr:hover {
            border-color: #667eea;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
          }

          .activities-table td {
            padding: 12px 0;
            border: none;
            font-size: 0.9rem;
            padding-inline-start: 130px;
            position: relative;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .activities-table td::before {
            content: attr(data-label);
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            font-weight: 700;
            color: #667eea;
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.5px;
            width: 120px;
          }

          .activities-table td:last-child {
            padding-bottom: 0;
          }

          .profile-card .grade-badge {
            font-size: 0.82rem;
          }

          .ratings-table,
          .ratings-table thead,
          .ratings-table tbody,
          .ratings-table th,
          .ratings-table td,
          .ratings-table tr {
            display: block;
            width: 100%;
          }

          .ratings-table thead {
            display: none;
          }

          .ratings-table tr {
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 18px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 16px;
            transition: all 0.2s ease;
          }

          .ratings-table tr:hover {
            border-color: #667eea;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
          }

          .ratings-table td {
            padding: 10px 0;
            border: none;
            font-size: 0.9rem;
            position: relative;
            padding-inline-start: 0;
            min-height: 42px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .ratings-table td::before {
            content: attr(data-label);
            position: relative;
            top: auto;
            left: auto;
            transform: none;
            font-weight: 700;
            color: #667eea;
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
          }

          .ratings-table td .rating-badge {
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentProfile;
