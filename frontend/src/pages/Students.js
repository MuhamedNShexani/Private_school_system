import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  studentsAPI,
  classesAPI,
  gradingAPI,
  subjectsAPI,
  seasonsAPI,
  chaptersAPI,
  partsAPI,
  exercisesAPI,
  studentGradesAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import {
  Users,
  User,
  Eye,
  Phone,
  UserCheck,
  CheckSquare,
  Table,
} from "lucide-react";

const Students = () => {
  const { user, isAdmin } = useAuth();
  const { t, currentLanguage } = useTranslation();
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

  const filterSubjectsForTeacher = useCallback(
    (list = []) => {
      if (!isTeacher) return list;
      if (!teacherSubjectSet.size) return [];
      return list.filter((subject) =>
        teacherSubjectSet.has(normalizeId(subject?._id || subject))
      );
    },
    [isTeacher, teacherSubjectSet]
  );

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);

  // Bulk grading modal states
  const [showBulkGradingModal, setShowBulkGradingModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkGradingData, setBulkGradingData] = useState({
    classId: "",
    branchId: "",
    gradingType: "", // exercise, monthly_exam, attendance, behaviour, season_exam
    monthlyExamNumber: "", // "1" or "2" for first/second exam
    subjectId: "",
    seasonId: "",
    chapterId: "",
    partId: "",
    exerciseId: "",
    gradedDate: new Date().toISOString().split("T")[0], // Default to today
  });
  const [subjects, setSubjects] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [parts, setParts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [studentGrades, setStudentGrades] = useState({}); // {studentId: {grade: number, notes: string}}
  const [loadingDependencies, setLoadingDependencies] = useState(false); // Track loading of dependent data
  const [showGradesSection, setShowGradesSection] = useState(false);
  const [selectedGradesSubject, setSelectedGradesSubject] = useState("");
  const [studentsGradesData, setStudentsGradesData] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState(null);
  const [subjectsCache, setSubjectsCache] = useState({});
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [showStudentCardSection, setShowStudentCardSection] = useState(false);
  const [selectedCardStudent, setSelectedCardStudent] = useState("");
  const [studentCardsData, setStudentCardsData] = useState([]);
  const [studentCardsLoading, setStudentCardsLoading] = useState(false);
  const [studentCardsError, setStudentCardsError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsRes, classesRes] = await Promise.all([
          studentsAPI.getAll(),
          classesAPI.getAll(),
        ]);

        setStudents(studentsRes.data);
        setClasses(classesRes.data);

        // Set default to Class 10 Branch A
        const defaultClass = classesRes.data.find(
          (cls) =>
            cls.name?.en?.includes("10") || cls.name?.en?.includes("Class 10")
        );
        if (defaultClass) {
          setSelectedClass(defaultClass._id);
          const defaultBranch = defaultClass.branches?.find(
            (branch) =>
              branch.name?.en?.includes("A") ||
              branch.name?.en?.includes("Branch A")
          );
          if (defaultBranch) {
            setSelectedBranch(defaultBranch._id);
          }
        }
      } catch (err) {
        setError(
          t(
            "students.error.loadFailed",
            "Failed to load students. Please try again."
          )
        );
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Update available branches when class changes
  useEffect(() => {
    if (selectedClass) {
      const selectedClassData = classes.find(
        (cls) => cls._id === selectedClass
      );
      if (selectedClassData) {
        setAvailableBranches(selectedClassData.branches || []);
        // Reset branch selection if current branch is not available in new class
        if (
          selectedBranch &&
          !selectedClassData.branches?.some(
            (branch) => branch._id === selectedBranch
          )
        ) {
          setSelectedBranch("");
        }
      }
    } else {
      setAvailableBranches([]);
      setSelectedBranch("");
    }
  }, [selectedClass, classes, selectedBranch]);

  // Filter students based on selected class and branch
  useEffect(() => {
    let filtered = students;

    // Apply role-based filtering first
    if (user?.role === "Student") {
      // Students can only see their own profile
      filtered = students.filter(
        (student) =>
          student._id === user.studentProfile?._id ||
          student.username === user.username
      );
    } else if (user?.role === "Teacher" && user?.teacherProfile) {
      // Get teacher's assigned classes and branches from the teacher profile
      const teacherClasses = user.teacherProfile.classes || [];
      const teacherBranches = user.teacherProfile.branches || [];

      filtered = students.filter((student) => {
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
    }

    // Apply class and branch filtering
    if (selectedClass) {
      filtered = filtered.filter(
        (student) =>
          student.class?._id === selectedClass ||
          student.class === selectedClass
      );
    }

    if (selectedBranch) {
      filtered = filtered.filter(
        (student) => student.branchID === selectedBranch
      );
    }

    setFilteredStudents(filtered);
  }, [students, user, selectedClass, selectedBranch]);

  // Ensure seasons are available for grade views
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const seasonsRes = await seasonsAPI.getAll();
        setSeasons(seasonsRes.data?.data || seasonsRes.data || []);
      } catch (err) {
        console.error("Error fetching seasons:", err);
      }
    };

    loadSeasons();
  }, []);

  // Load subjects whenever class changes (used for both bulk grading and grades view)
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedGradesSubject("");
      setStudentsGradesData([]);
      setSubjectsLoading(false);
      return;
    }

    const cachedSubjects = subjectsCache[selectedClass];
    if (cachedSubjects) {
      const filteredCached = filterSubjectsForTeacher(cachedSubjects);
      setSubjects(filteredCached);
      setSubjectsLoading(false);
      return;
    }

    let isMounted = true;
    const loadSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const subjectsRes = await subjectsAPI.getAll({ class: selectedClass });
        const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
        if (isMounted) {
          const filteredSubjects = filterSubjectsForTeacher(subjectsData);
          setSubjects(filteredSubjects);
          setSubjectsCache((prev) => ({
            ...prev,
            [selectedClass]: subjectsData,
          }));
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        if (isMounted) {
          setSubjectsLoading(false);
        }
      }
    };

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, [selectedClass, subjectsCache, filterSubjectsForTeacher]);

  // Reset grades data when class or branch changes
  useEffect(() => {
    setStudentsGradesData([]);
    setGradesError(null);
    setStudentCardsData([]);
    setStudentCardsError(null);
    setSelectedCardStudent("");
  }, [selectedClass, selectedBranch]);

  // Get selected class and branch names for display
  const selectedClassData = classes.find((cls) => cls._id === selectedClass);
  const selectedBranchData = availableBranches.find(
    (branch) => branch._id === selectedBranch
  );
  const selectedSubjectData = subjects.find(
    (subject) => subject?._id === selectedGradesSubject
  );
  const selectedCardStudentData = filteredStudents.find(
    (student) => student?._id === selectedCardStudent
  );

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
    [currentLanguage, t]
  );

  const getEntityName = useCallback(
    (entity, fallback = "") => {
      if (!entity) return fallback;
      if (typeof entity === "string") return entity;

      const bestMatch =
        entity.nameMultilingual ||
        entity.titleMultilingual ||
        entity.title ||
        entity.name ||
        entity.label;

      return getLocalizedText(bestMatch, fallback);
    },
    [getLocalizedText]
  );

  const getSeasonDisplayName = useCallback(
    (season, fallback) => {
      if (!season) return fallback;
      return (
        getLocalizedText(
          season.nameMultilingual ||
            season.name ||
            season.title ||
            season.code ||
            season.label,
          fallback
        ) || fallback
      );
    },
    [getLocalizedText]
  );

  const getGenderLabel = (gender) => {
    if (!gender) {
      return t("students.gender.unknown", "Not specified");
    }
    const normalized = gender.toLowerCase();
    if (normalized === "male" || normalized === "female") {
      return t(`students.gender.${normalized}`, gender);
    }
    return t("students.gender.other", gender);
  };

  const getSeasonNameVariants = useCallback(
    (season) => {
      const names = new Set();

      if (season?.nameMultilingual) {
        Object.values(season.nameMultilingual).forEach((value) => {
          if (value) names.add(value);
        });
      }

      if (season?.name) {
        if (typeof season.name === "string") {
          names.add(season.name);
        } else if (typeof season.name === "object") {
          Object.values(season.name).forEach((value) => {
            if (value) names.add(value);
          });
        }
      }

      if (season?.title) {
        if (typeof season.title === "string") {
          names.add(season.title);
        } else if (typeof season.title === "object") {
          Object.values(season.title).forEach((value) => {
            if (value) names.add(value);
          });
        }
      }

      if (season?.code) {
        names.add(season.code);
      }

      const localizedName = getSeasonDisplayName(
        season,
        t("students.season.fallback", "Season")
      );
      if (localizedName) {
        names.add(localizedName);
      }

      return Array.from(names).filter(Boolean);
    },
    [getSeasonDisplayName, t]
  );

  const getSeasonOrder = useCallback(
    (season) => {
      if (season?.order) {
        return season.order;
      }

      const variants = getSeasonNameVariants(season);
      if (
        variants.some((name) =>
          typeof name === "string" ? name.includes("1") : false
        )
      ) {
        return 1;
      }

      if (
        variants.some((name) =>
          typeof name === "string" ? name.includes("2") : false
        )
      ) {
        return 2;
      }

      return null;
    },
    [getSeasonNameVariants]
  );

  const seasonsToDisplay = useMemo(() => {
    if (!Array.isArray(seasons)) {
      return [];
    }

    return seasons
      .filter((season) => {
        const order = getSeasonOrder(season);
        return order === 1 || order === 2;
      })
      .sort((a, b) => {
        const orderA = getSeasonOrder(a) || 0;
        const orderB = getSeasonOrder(b) || 0;
        return orderA - orderB;
      })
      .map((season, index) => {
        const order = getSeasonOrder(season);
        const variants = getSeasonNameVariants(season);
        if (order && !variants.length) {
          variants.push(`Season ${order}`);
        }

        const fallbackName = order
          ? t("students.season.orderLabel", `Season ${order}`)
          : t("students.season.defaultLabel", `Season ${index + 1}`);

        const displayName = getSeasonDisplayName(season, fallbackName);

        return {
          key:
            season?._id ||
            variants[0] ||
            `season-${order || index + 1}-${index}`,
          displayName,
          names: variants,
        };
      });
  }, [seasons, t, getSeasonDisplayName, getSeasonNameVariants, getSeasonOrder]);

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

  const normalizeScoreValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }

    return Number.isInteger(numeric)
      ? numeric
      : Math.round(numeric * 100) / 100;
  };

  const handleLoadStudentsGrades = async () => {
    if (!selectedClass || !selectedBranch) {
      setGradesError(
        t(
          "studentsGrades.error.selectClassBranch",
          "Please select a class and branch first."
        )
      );
      return;
    }

    if (!selectedGradesSubject) {
      setGradesError(
        t(
          "studentsGrades.error.selectSubject",
          "Please choose a subject before loading grades."
        )
      );
      return;
    }

    if (seasonsToDisplay.length === 0) {
      setGradesError(
        t(
          "studentsGrades.error.noSeasons",
          "No seasons available to display. Please configure seasons first."
        )
      );
      return;
    }

    try {
      setGradesLoading(true);
      setGradesError(null);

      const subjectId = selectedGradesSubject;
      const results = await Promise.all(
        filteredStudents.map(async (student) => {
          try {
            const gradesRes = await studentGradesAPI.getByStudent(student._id);
            const gradesList = gradesRes.data?.data || gradesRes.data || [];

            const relevantGrades = gradesList.filter((grade) => {
              const gradeSubjectId =
                grade.subject?._id || grade.subject || grade.subjectId;
              return (
                gradeSubjectId &&
                gradeSubjectId.toString() === subjectId.toString()
              );
            });

            const gradesBySeason = {};
            seasonsToDisplay.forEach((season) => {
              const gradeForSeason = relevantGrades.find((grade) =>
                season.names.includes(grade.season)
              );

              if (gradeForSeason) {
                const monthlyArray = Array.isArray(gradeForSeason.monthly_exam)
                  ? gradeForSeason.monthly_exam
                  : typeof gradeForSeason.monthly_exam === "number"
                  ? [gradeForSeason.monthly_exam]
                  : [];

                gradesBySeason[season.key] = {
                  exercises: normalizeScoreValue(gradeForSeason.exercises),
                  monthlyExam1: normalizeScoreValue(monthlyArray[0]),
                  monthlyExam2: normalizeScoreValue(monthlyArray[1]),
                  behaviour: normalizeScoreValue(gradeForSeason.behaviour),
                  attendance: normalizeScoreValue(gradeForSeason.attendance),
                  seasonExam: normalizeScoreValue(gradeForSeason.season_exam),
                  total: normalizeScoreValue(gradeForSeason.total),
                };
              } else {
                gradesBySeason[season.key] = {
                  exercises: "",
                  monthlyExam1: "",
                  monthlyExam2: "",
                  behaviour: "",
                  attendance: "",
                  seasonExam: "",
                  total: "",
                };
              }
            });

            return {
              studentId: student._id,
              studentName:
                student.fullName || student.username || t("common.na", "N/A"),
              grades: gradesBySeason,
            };
          } catch (err) {
            console.error("Error fetching grades for student:", err);
            return {
              studentId: student._id,
              studentName:
                student.fullName || student.username || t("common.na", "N/A"),
              grades: {},
            };
          }
        })
      );

      const sortedResults = results.sort((a, b) =>
        (a.studentName || "").localeCompare(b.studentName || "", undefined, {
          sensitivity: "base",
        })
      );

      setStudentsGradesData(sortedResults);
    } catch (err) {
      console.error("Error loading students grades:", err);
      setGradesError(
        err.response?.data?.message ||
          t(
            "studentsGrades.error.loadFailed",
            "Failed to load grades for the selected filters. Please try again."
          )
      );
    } finally {
      setGradesLoading(false);
    }
  };

  const handleLoadStudentCards = async () => {
    if (!selectedClass || !selectedBranch) {
      setStudentCardsError(
        t(
          "studentCards.error.selectClassBranch",
          "Please select a class and branch first."
        )
      );
      return;
    }

    const targetStudents = selectedCardStudent
      ? filteredStudents.filter(
          (student) => student._id === selectedCardStudent
        )
      : filteredStudents;

    if (targetStudents.length === 0) {
      setStudentCardsError(
        t(
          "studentCards.error.noStudents",
          "No students available for the selected filters."
        )
      );
      setStudentCardsData([]);
      return;
    }

    if (seasonsToDisplay.length === 0) {
      setStudentCardsError(
        t(
          "studentCards.error.noSeasons",
          "No seasons available to display. Please configure seasons first."
        )
      );
      return;
    }

    try {
      setStudentCardsLoading(true);
      setStudentCardsError(null);

      const subjectsById = {};
      subjects.forEach((subject) => {
        if (subject?._id) {
          subjectsById[subject._id] = subject;
        }
      });

      const results = await Promise.all(
        targetStudents.map(async (student) => {
          try {
            const gradesRes = await studentGradesAPI.getByStudent(student._id);
            const gradesList = gradesRes.data?.data || gradesRes.data || [];

            const subjectMap = {};

            const ensureSubjectEntry = (subjectId, grade) => {
              if (!subjectId) return null;
              const normalizedSubjectId = subjectId.toString();
              if (
                isTeacher &&
                teacherSubjectSet.size > 0 &&
                !teacherSubjectSet.has(normalizedSubjectId)
              ) {
                return null;
              }

              if (!subjectMap[normalizedSubjectId]) {
                const subjectInfo = subjectsById[normalizedSubjectId] ||
                  grade?.subject || {
                    title: grade?.subjectName
                      ? { en: grade.subjectName }
                      : undefined,
                    name: grade?.subjectName,
                  };

                subjectMap[normalizedSubjectId] = {
                  subjectId: normalizedSubjectId,
                  name:
                    getEntityName(
                      subjectInfo,
                      grade?.subjectName ||
                        t("studentsGrades.unnamedSubject", "Unnamed Subject")
                    ) ||
                    grade?.subjectName ||
                    t("studentsGrades.unnamedSubject", "Unnamed Subject"),
                  seasons: {},
                };

                seasonsToDisplay.forEach((season) => {
                  subjectMap[normalizedSubjectId].seasons[season.key] = {
                    exercises: "",
                    monthly: "",
                    participation: "",
                    seasonExam: "",
                    total: "",
                  };
                });
              }

              return subjectMap[normalizedSubjectId];
            };

            gradesList.forEach((grade) => {
              const subjectId =
                grade.subject?._id || grade.subject || grade.subjectId;
              const subjectEntry = ensureSubjectEntry(subjectId, grade);
              if (!subjectEntry) return;

              const seasonMatch = seasonsToDisplay.find((season) =>
                season.names.includes(grade.season)
              );

              if (!seasonMatch) return;

              const monthlyArray = Array.isArray(grade.monthly_exam)
                ? grade.monthly_exam
                : typeof grade.monthly_exam === "number"
                ? [grade.monthly_exam]
                : [];

              let monthlyTotal = "";
              if (monthlyArray.length > 0) {
                if (monthlyArray.length === 2) {
                  monthlyTotal = Math.min(
                    (Number(monthlyArray[0] || 0) +
                      Number(monthlyArray[1] || 0)) /
                      2,
                    20
                  );
                } else {
                  monthlyTotal = Math.min(Number(monthlyArray[0] || 0), 20);
                }
              }

              const attendance =
                grade.attendance === null || grade.attendance === undefined
                  ? null
                  : Number(grade.attendance) || 0;
              const behaviour =
                grade.behaviour === null || grade.behaviour === undefined
                  ? null
                  : Number(grade.behaviour) || 0;

              let participation = "";
              if (attendance !== null || behaviour !== null) {
                participation = Math.min(
                  Number(attendance || 0) + Number(behaviour || 0),
                  10
                );
              }

              subjectEntry.seasons[seasonMatch.key] = {
                exercises: normalizeScoreValue(grade.exercises),
                monthly: normalizeScoreValue(monthlyTotal),
                participation: normalizeScoreValue(participation),
                seasonExam: normalizeScoreValue(grade.season_exam),
                total: normalizeScoreValue(grade.total),
              };
            });

            Object.keys(subjectsById).forEach((subjectId) => {
              ensureSubjectEntry(subjectId, subjectsById[subjectId]);
            });

            const subjectsArray = Object.values(subjectMap).sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", undefined, {
                sensitivity: "base",
              })
            );

            return {
              studentId: student._id,
              studentName:
                student.fullName || student.username || t("common.na", "N/A"),
              subjects: subjectsArray,
            };
          } catch (err) {
            console.error("Error fetching student card grades:", err);
            return {
              studentId: student._id,
              studentName:
                student.fullName || student.username || t("common.na", "N/A"),
              subjects: [],
            };
          }
        })
      );

      setStudentCardsData(results);
    } catch (err) {
      console.error("Error loading student cards:", err);
      setStudentCardsError(
        err.response?.data?.message ||
          t(
            "studentCards.error.loadFailed",
            "Failed to load student cards. Please try again."
          )
      );
    } finally {
      setStudentCardsLoading(false);
    }
  };

  // Open bulk grading modal
  const openBulkGradingModal = async () => {
    setShowBulkGradingModal(true);
    const initialData = {
      classId: selectedClass || "",
      branchId: selectedBranch || "",
      gradingType: "",
      monthlyExamNumber: "",
      subjectId: "",
      seasonId: "",
      chapterId: "",
      partId: "",
      exerciseId: "",
      gradedDate: new Date().toISOString().split("T")[0], // Default to today
    };
    setBulkGradingData(initialData);
    setSelectedStudents(filteredStudents.map((s) => s._id));
    setStudentGrades({});

    // Fetch initial data when modal opens
    try {
      setLoadingDependencies(true);
      const [subjectsRes, seasonsRes] = await Promise.all([
        initialData.classId
          ? subjectsAPI.getAll({ class: initialData.classId })
          : Promise.resolve({ data: { data: [] } }),
        seasonsAPI.getAll(),
      ]);
      const fetchedSubjects = subjectsRes.data?.data || subjectsRes.data || [];
      const filteredForTeacher = filterSubjectsForTeacher(fetchedSubjects);
      setSubjects(filteredForTeacher);
      setSeasons(seasonsRes.data?.data || seasonsRes.data || []);

      if (isTeacher && filteredForTeacher.length > 0) {
        setBulkGradingData((prev) => ({
          ...prev,
          subjectId:
            prev.subjectId &&
            filteredForTeacher.some(
              (subject) => normalizeId(subject._id) === prev.subjectId
            )
              ? prev.subjectId
              : normalizeId(filteredForTeacher[0]?._id),
        }));
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
    } finally {
      setLoadingDependencies(false);
    }
  };

  // Close bulk grading modal
  const closeBulkGradingModal = () => {
    setShowBulkGradingModal(false);
    setBulkGradingData({
      classId: selectedClass || "",
      branchId: selectedBranch || "",
      gradingType: "",
      monthlyExamNumber: "",
      subjectId: "",
      seasonId: "",
      chapterId: "",
      partId: "",
      exerciseId: "",
      gradedDate: new Date().toISOString().split("T")[0], // Default to today
    });
    setSelectedStudents([]);
    setStudentGrades({});
    setError(null);
    setChapters([]);
    setParts([]);
    setExercises([]);
  };

  // Handle dependent data loading when selections change
  useEffect(() => {
    const loadDependentData = async () => {
      if (!showBulkGradingModal) return;

      try {
        setLoadingDependencies(true);

        // Load chapters when subject and season are selected
        if (bulkGradingData.subjectId && bulkGradingData.seasonId) {
          const allChaptersRes = await chaptersAPI.getAll();
          const allChapters =
            allChaptersRes.data?.data || allChaptersRes.data || [];

          // Get season object to match multilingual names
          let selectedSeason = seasons.find(
            (s) =>
              s._id === bulkGradingData.seasonId ||
              s._id?.toString() === bulkGradingData.seasonId?.toString()
          );
          if (!selectedSeason) {
            const seasonRes = await seasonsAPI.getById(
              bulkGradingData.seasonId
            );
            selectedSeason = seasonRes.data?.data || seasonRes.data;
          }

          // Get all season name variants
          const seasonNames = [];
          if (selectedSeason?.name) {
            if (
              typeof selectedSeason.name === "object" &&
              selectedSeason.name !== null
            ) {
              if (selectedSeason.name.en)
                seasonNames.push(selectedSeason.name.en);
              if (selectedSeason.name.ar)
                seasonNames.push(selectedSeason.name.ar);
              if (selectedSeason.name.ku)
                seasonNames.push(selectedSeason.name.ku);
            } else if (typeof selectedSeason.name === "string") {
              seasonNames.push(selectedSeason.name);
            }
          }
          if (selectedSeason?.nameMultilingual) {
            if (selectedSeason.nameMultilingual.en)
              seasonNames.push(selectedSeason.nameMultilingual.en);
            if (selectedSeason.nameMultilingual.ar)
              seasonNames.push(selectedSeason.nameMultilingual.ar);
            if (selectedSeason.nameMultilingual.ku)
              seasonNames.push(selectedSeason.nameMultilingual.ku);
          }

          // Filter chapters by subject and season
          const filteredChapters = allChapters.filter((ch) => {
            const matchesSubject =
              ch.subject?.toString() === bulkGradingData.subjectId ||
              ch.subject?._id?.toString() === bulkGradingData.subjectId;
            const matchesSeason =
              seasonNames.length > 0 && seasonNames.includes(ch.season);
            return matchesSubject && matchesSeason;
          });

          setChapters(filteredChapters);
        } else {
          setChapters([]);
        }

        // Load parts when chapter is selected
        if (bulkGradingData.chapterId) {
          const partsRes = await partsAPI.getByChapter(
            bulkGradingData.chapterId
          );
          setParts(partsRes.data?.data || partsRes.data || []);
        } else {
          setParts([]);
        }

        // Load exercises when part is selected
        if (bulkGradingData.partId) {
          const exercisesRes = await exercisesAPI.getByPart(
            bulkGradingData.partId
          );
          setExercises(exercisesRes.data?.data || exercisesRes.data || []);

          // Load existing grades when exercise is selected
          if (bulkGradingData.exerciseId) {
            try {
              const existingGradesRes = await gradingAPI.getGradesByExercise(
                bulkGradingData.exerciseId,
                bulkGradingData.classId,
                bulkGradingData.branchId
              );
              const existingGrades =
                existingGradesRes.data?.data || existingGradesRes.data || [];

              const gradesMap = {};
              existingGrades.forEach((grade) => {
                if (grade.student && grade.student._id) {
                  gradesMap[grade.student._id] = {
                    grade: grade.grade || null,
                    notes: grade.notes || "",
                  };
                } else if (grade.student && typeof grade.student === "string") {
                  gradesMap[grade.student] = {
                    grade: grade.grade || null,
                    notes: grade.notes || "",
                  };
                }
              });

              // Initialize grades - use existing if found, otherwise null (empty)
              const initialGrades = {};
              selectedStudents.forEach((studentId) => {
                if (gradesMap[studentId]) {
                  initialGrades[studentId] = gradesMap[studentId];
                } else {
                  initialGrades[studentId] = { grade: null, notes: "" };
                }
              });
              setStudentGrades(initialGrades);
            } catch (err) {
              console.log("No existing grades found:", err);
              // Initialize all to empty
              const initialGrades = {};
              selectedStudents.forEach((studentId) => {
                initialGrades[studentId] = { grade: null, notes: "" };
              });
              setStudentGrades(initialGrades);
            }
          }
        } else {
          setExercises([]);
        }

        // Load existing grades for non-exercise types
        if (
          bulkGradingData.gradingType &&
          bulkGradingData.gradingType !== "exercise" &&
          bulkGradingData.subjectId &&
          bulkGradingData.seasonId &&
          selectedStudents.length > 0 &&
          (bulkGradingData.gradingType !== "monthly_exam" ||
            bulkGradingData.monthlyExamNumber)
        ) {
          try {
            // Get season name for matching
            let selectedSeason = seasons.find(
              (s) =>
                s._id === bulkGradingData.seasonId ||
                s._id?.toString() === bulkGradingData.seasonId?.toString()
            );
            if (!selectedSeason) {
              const seasonRes = await seasonsAPI.getById(
                bulkGradingData.seasonId
              );
              selectedSeason = seasonRes.data?.data || seasonRes.data;
            }

            // Get season name (handle multilingual)
            let seasonName = selectedSeason?.name;
            if (selectedSeason?.nameMultilingual) {
              seasonName =
                selectedSeason.nameMultilingual.en ||
                selectedSeason.nameMultilingual.ku ||
                selectedSeason.nameMultilingual.ar ||
                seasonName;
            } else if (
              typeof selectedSeason?.name === "object" &&
              selectedSeason?.name !== null
            ) {
              seasonName =
                selectedSeason.name.en ||
                selectedSeason.name.ku ||
                selectedSeason.name.ar ||
                "Season";
            }

            // Fetch all student grades for the selected students
            const initialGrades = {};

            // Fetch grades for each student
            for (const studentId of selectedStudents) {
              try {
                const gradesRes = await studentGradesAPI.getByStudent(
                  studentId
                );
                const allGrades = gradesRes.data?.data || gradesRes.data || [];

                // Find grade for this subject and season
                const studentGrade = allGrades.find((g) => {
                  const matchesSubject =
                    g.subject?._id?.toString() === bulkGradingData.subjectId ||
                    g.subject?.toString() === bulkGradingData.subjectId;

                  // Try to match season by name (handle multilingual)
                  const matchesSeason = g.season === seasonName;

                  return matchesSubject && matchesSeason;
                });

                if (studentGrade) {
                  let gradeValue = null;
                  let notes = studentGrade.notes || "";

                  // Extract the appropriate field based on grading type
                  if (bulkGradingData.gradingType === "monthly_exam") {
                    if (bulkGradingData.monthlyExamNumber) {
                      const examIndex =
                        parseInt(bulkGradingData.monthlyExamNumber, 10) - 1;
                      if (
                        studentGrade.monthly_exam &&
                        studentGrade.monthly_exam.length > examIndex
                      ) {
                        gradeValue = studentGrade.monthly_exam[examIndex];
                      }
                    }
                  } else if (bulkGradingData.gradingType === "attendance") {
                    gradeValue = studentGrade.attendance;
                  } else if (bulkGradingData.gradingType === "behaviour") {
                    gradeValue = studentGrade.behaviour;
                  } else if (bulkGradingData.gradingType === "season_exam") {
                    gradeValue = studentGrade.season_exam;
                  }

                  // Only set if gradeValue is not null/undefined
                  if (gradeValue !== null && gradeValue !== undefined) {
                    initialGrades[studentId] = { grade: gradeValue, notes };
                  } else {
                    initialGrades[studentId] = { grade: null, notes: "" };
                  }
                } else {
                  initialGrades[studentId] = { grade: null, notes: "" };
                }
              } catch (err) {
                console.log(
                  `No existing grade found for student ${studentId}:`,
                  err
                );
                initialGrades[studentId] = { grade: null, notes: "" };
              }
            }

            setStudentGrades(initialGrades);
          } catch (err) {
            console.log("Error loading existing grades:", err);
            // Initialize all to empty
            const initialGrades = {};
            selectedStudents.forEach((studentId) => {
              initialGrades[studentId] = { grade: null, notes: "" };
            });
            setStudentGrades(initialGrades);
          }
        }
      } catch (err) {
        console.error("Error loading dependent data:", err);
      } finally {
        setLoadingDependencies(false);
      }
    };

    loadDependentData();
  }, [
    bulkGradingData.subjectId,
    bulkGradingData.seasonId,
    bulkGradingData.chapterId,
    bulkGradingData.partId,
    bulkGradingData.exerciseId,
    bulkGradingData.gradingType,
    bulkGradingData.monthlyExamNumber,
    showBulkGradingModal,
    selectedStudents,
    seasons,
    bulkGradingData.classId,
    bulkGradingData.branchId,
  ]);

  // Handle bulk grading submission
  const handleBulkGradingSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);

      // Filter out students with empty grades (null, undefined, or empty string)
      const grades = selectedStudents
        .map((studentId) => {
          const gradeValue = studentGrades[studentId]?.grade;
          // Only include if grade is provided (not null, undefined, or empty string)
          if (
            gradeValue === null ||
            gradeValue === undefined ||
            gradeValue === ""
          ) {
            return null;
          }
          const grade = Number(gradeValue);
          // Only include if grade is a valid number (not NaN)
          if (isNaN(grade)) {
            return null;
          }
          return {
            studentId,
            grade,
            notes: studentGrades[studentId]?.notes || "",
          };
        })
        .filter((grade) => grade !== null); // Remove null entries

      // Only submit if there are grades to save
      if (grades.length === 0) {
        setError(
          t(
            "students.bulkGrading.errors.noGrades",
            "Please enter at least one grade."
          )
        );
        return;
      }

      // Get student IDs that have grades
      const studentIdsWithGrades = grades.map((g) => g.studentId);

      await gradingAPI.bulkGrade({
        studentIds: studentIdsWithGrades,
        gradingType: bulkGradingData.gradingType,
        monthlyExamNumber: bulkGradingData.monthlyExamNumber || null,
        exerciseId: bulkGradingData.exerciseId || null,
        partId: bulkGradingData.partId || null,
        chapterId: bulkGradingData.chapterId || null,
        seasonId: bulkGradingData.seasonId,
        subjectId: bulkGradingData.subjectId,
        classId: bulkGradingData.classId,
        branchId: bulkGradingData.branchId,
        grades,
        gradedDate:
          bulkGradingData.gradedDate || new Date().toISOString().split("T")[0],
      });

      alert(t("students.bulkGrading.success", "Grades saved successfully!"));
      closeBulkGradingModal();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          t(
            "students.bulkGrading.errors.saveFailed",
            "Failed to save grades. Please try again."
          )
      );
      console.error("Error saving grades:", err);
    }
  };

  useEffect(() => {
    if (!isTeacher) return;
    if (!selectedGradesSubject) return;
    const subjectStillAvailable = subjects.some(
      (subject) => normalizeId(subject._id) === selectedGradesSubject
    );
    if (!subjectStillAvailable) {
      setSelectedGradesSubject("");
    }
  }, [subjects, selectedGradesSubject, isTeacher]);

  if (loading) {
    return (
      <div className="loading">
        <div>{t("students.loading", "Loading students...")}</div>
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

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>
            <Users
              size={32}
              style={{ marginRight: "12px", verticalAlign: "middle" }}
            />
            {t("students.title", "Students")}
          </h1>
          <p>
            {t(
              "students.subtitle",
              "View and manage students by class and branch"
            )}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Class and Branch Selection */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="class-select">
              {t("students.filter.class", "Select Class")}:
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="filter-select"
            >
              <option value="">
                {t("students.filter.allClasses", "All Classes")}
              </option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {getEntityName(
                    cls,
                    t("students.unnamedClass", "Unnamed Class")
                  )}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="branch-select">
              {t("students.filter.branch", "Select Branch")}:
            </label>
            <select
              id="branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="filter-select"
              disabled={!selectedClass}
            >
              <option value="">
                {t("students.filter.allBranches", "All Branches")}
              </option>
              {availableBranches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {getEntityName(
                    branch,
                    t("students.unnamedBranch", "Unnamed Branch")
                  )}
                </option>
              ))}
            </select>
          </div>
          <div className="filters-actions">
            <button
              className={`btn btn-secondary ${
                showGradesSection ? "active" : ""
              }`}
              onClick={() => setShowGradesSection((prev) => !prev)}
              disabled={!selectedClass || !selectedBranch}
            >
              <Table size={16} />
              {showGradesSection
                ? t("studentsGrades.hideAction", "Hide Students Grades")
                : t("studentsGrades.showAction", "Students Grades")}
            </button>
            <button
              className={`btn btn-secondary ${
                showStudentCardSection ? "active" : ""
              }`}
              onClick={() => setShowStudentCardSection((prev) => !prev)}
              disabled={!selectedClass || !selectedBranch}
            >
              <User size={16} />
              {showStudentCardSection
                ? t("studentCards.hideAction", "Hide Student Cards")
                : t("studentCards.showAction", "Student Cards")}
            </button>
            {(isAdmin || user?.role === "Teacher") && (
              <button
                className="btn btn-primary"
                onClick={openBulkGradingModal}
                disabled={
                  !selectedClass ||
                  !selectedBranch ||
                  filteredStudents.length === 0
                }
              >
                <CheckSquare size={16} />
                {t("students.bulkGrade", "Bulk Grade Students")}
              </button>
            )}
          </div>
        </div>

        {/* Current Selection Display */}
        {(selectedClass || selectedBranch) && (
          <div className="current-selection">
            <h3>
              {t("students.currentSelection", "Current Selection")}:
              {selectedClassData && (
                <span className="selection-item">
                  {t("students.filter.class", "Class")}:{" "}
                  {getEntityName(
                    selectedClassData,
                    t("students.unnamedClass", "Unnamed Class")
                  )}
                </span>
              )}
              {selectedBranchData && (
                <span className="selection-item">
                  {t("students.filter.branch", "Branch")}:{" "}
                  {getEntityName(
                    selectedBranchData,
                    t("students.unnamedBranch", "Unnamed Branch")
                  )}
                </span>
              )}
            </h3>
          </div>
        )}

        {showStudentCardSection && (
          <div className="student-cards-section">
            <div className="student-cards-card">
              <div className="student-cards-header">
                <div className="student-cards-meta">
                  <span>
                    {t("studentCards.classLabel", "Class")}:{" "}
                    <strong>
                      {selectedClassData
                        ? getEntityName(
                            selectedClassData,
                            t("common.na", "N/A")
                          )
                        : t("common.na", "N/A")}
                    </strong>
                  </span>
                  <span>
                    {t("studentCards.branchLabel", "Branch")}:{" "}
                    <strong>
                      {selectedBranchData
                        ? getEntityName(
                            selectedBranchData,
                            t("common.na", "N/A")
                          )
                        : t("common.na", "N/A")}
                    </strong>
                  </span>
                  <span>
                    {t("studentCards.studentLabel", "Student")}:{" "}
                    <strong>
                      {selectedCardStudent
                        ? selectedCardStudentData?.fullName ||
                          selectedCardStudentData?.username ||
                          t("common.na", "N/A")
                        : t("studentCards.allStudents", "All students")}
                    </strong>
                  </span>
                </div>
                <div className="student-cards-controls">
                  <label htmlFor="student-card-select">
                    {t(
                      "studentCards.selectStudent",
                      "Choose student (optional)"
                    )}
                    :
                  </label>
                  <div className="student-cards-control-row">
                    <select
                      id="student-card-select"
                      value={selectedCardStudent}
                      onChange={(e) => setSelectedCardStudent(e.target.value)}
                      disabled={filteredStudents.length === 0}
                    >
                      <option value="">
                        {t("studentCards.allStudentsOption", "All students")}
                      </option>
                      {filteredStudents.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.fullName ||
                            student.username ||
                            t("common.na", "N/A")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="student-cards-load-btn"
                      onClick={handleLoadStudentCards}
                      disabled={
                        studentCardsLoading || filteredStudents.length === 0
                      }
                    >
                      {studentCardsLoading
                        ? t("studentCards.loadingAction", "Loading...")
                        : t("studentCards.loadAction", "Show Student Cards")}
                    </button>
                  </div>
                </div>
              </div>

              {studentCardsError && (
                <div className="student-cards-error">{studentCardsError}</div>
              )}

              {filteredStudents.length === 0 ? (
                <div className="student-cards-placeholder">
                  {t(
                    "studentCards.noStudents",
                    "No students available for the selected class and branch."
                  )}
                </div>
              ) : studentCardsLoading ? (
                <div className="student-cards-placeholder loading">
                  {t("studentCards.loadingState", "Preparing student cards...")}
                </div>
              ) : studentCardsData.length === 0 ? (
                <div className="student-cards-placeholder">
                  {t(
                    "studentCards.emptyState",
                    "Click Show Student Cards to display the report."
                  )}
                </div>
              ) : (
                <div className="student-cards-list">
                  {studentCardsData.map((card) => (
                    <div key={card.studentId} className="student-card-report">
                      <div className="student-card-report-header">
                        <div>
                          {t("studentCards.headerClass", "Class")}:{" "}
                          <strong>
                            {selectedClassData
                              ? getEntityName(
                                  selectedClassData,
                                  t("common.na", "N/A")
                                )
                              : t("common.na", "N/A")}
                          </strong>
                        </div>
                        <div>
                          {t("studentCards.headerBranch", "Branch")}:{" "}
                          <strong>
                            {selectedBranchData
                              ? getEntityName(
                                  selectedBranchData,
                                  t("common.na", "N/A")
                                )
                              : t("common.na", "N/A")}
                          </strong>
                        </div>
                        <div>
                          {t("studentCards.headerStudent", "Student")}:{" "}
                          <strong>{card.studentName}</strong>
                        </div>
                      </div>

                      <div className="student-card-report-table-wrapper">
                        <table className="student-card-report-table">
                          <thead>
                            <tr>
                              <th rowSpan={2}>
                                {t("studentCards.tableSubject", "Subject")}
                              </th>
                              {seasonsToDisplay.map((season) => (
                                <th
                                  key={season.key}
                                  colSpan={5}
                                  className="student-card-season-header"
                                >
                                  {season.displayName}
                                </th>
                              ))}
                            </tr>
                            <tr>
                              {seasonsToDisplay.map((season) => (
                                <React.Fragment key={`${season.key}-card-head`}>
                                  <th
                                    title={t(
                                      "studentCards.exercisesAlt",
                                      "Exercises (max 10)"
                                    )}
                                  >
                                    {t("studentCards.exercises", "10")}
                                  </th>
                                  <th
                                    title={t(
                                      "studentCards.monthlyAlt",
                                      "Monthly exam (max 20)"
                                    )}
                                  >
                                    {t("studentCards.monthly", "20")}
                                  </th>
                                  <th
                                    title={t(
                                      "studentCards.participationAlt",
                                      "Behaviour + attendance (max 10)"
                                    )}
                                  >
                                    {t("studentCards.participation", "10")}
                                  </th>
                                  <th
                                    title={t(
                                      "studentCards.seasonExamAlt",
                                      "Final exam (max 60)"
                                    )}
                                  >
                                    {t("studentCards.seasonExam", "60")}
                                  </th>
                                  <th
                                    title={t(
                                      "studentCards.totalAlt",
                                      "Total (max 100)"
                                    )}
                                  >
                                    {t("studentCards.total", "100")}
                                  </th>
                                </React.Fragment>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {card.subjects.length === 0 ? (
                              <tr>
                                <td colSpan={1 + seasonsToDisplay.length * 5}>
                                  {t(
                                    "studentCards.noSubjects",
                                    "No subjects available for this student."
                                  )}
                                </td>
                              </tr>
                            ) : (
                              card.subjects.map((subject) => (
                                <tr
                                  key={`${card.studentId}-${
                                    subject.subjectId || subject.name
                                  }`}
                                >
                                  <td>{subject.name}</td>
                                  {seasonsToDisplay.map((season) => {
                                    const seasonData =
                                      subject.seasons[season.key] || {};
                                    return (
                                      <React.Fragment
                                        key={`${card.studentId}-${subject.subjectId}-${season.key}`}
                                      >
                                        <td>
                                          {seasonData.exercises !== ""
                                            ? seasonData.exercises
                                            : ""}
                                        </td>
                                        <td>
                                          {seasonData.monthly !== ""
                                            ? seasonData.monthly
                                            : ""}
                                        </td>
                                        <td>
                                          {seasonData.participation !== ""
                                            ? seasonData.participation
                                            : ""}
                                        </td>
                                        <td>
                                          {seasonData.seasonExam !== ""
                                            ? seasonData.seasonExam
                                            : ""}
                                        </td>
                                        <td>
                                          {seasonData.total !== ""
                                            ? seasonData.total
                                            : ""}
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showGradesSection && (
          <div className="students-grades-section">
            <div className="students-grades-card">
              <div className="students-grades-header">
                <div className="students-grades-meta">
                  <span>
                    {t("studentsGrades.classLabel", "Class")}:{" "}
                    <strong>
                      {selectedClassData
                        ? getEntityName(
                            selectedClassData,
                            t("common.na", "N/A")
                          )
                        : t("common.na", "N/A")}
                    </strong>
                  </span>
                  <span>
                    {t("studentsGrades.branchLabel", "Branch")}:{" "}
                    <strong>
                      {selectedBranchData
                        ? getEntityName(
                            selectedBranchData,
                            t("common.na", "N/A")
                          )
                        : t("common.na", "N/A")}
                    </strong>
                  </span>
                  <span>
                    {t("studentsGrades.subjectLabel", "Subject")}:{" "}
                    <strong>
                      {selectedSubjectData
                        ? getEntityName(
                            selectedSubjectData,
                            t("common.na", "N/A")
                          )
                        : t(
                            "studentsGrades.subjectPlaceholder",
                            "Select a subject"
                          )}
                    </strong>
                  </span>
                </div>
                <div className="students-grades-controls">
                  <label htmlFor="grades-subject-select">
                    {t("studentsGrades.selectSubject", "Choose subject")}:
                  </label>
                  <div className="grades-control-row">
                    <select
                      id="grades-subject-select"
                      value={selectedGradesSubject}
                      onChange={(e) => setSelectedGradesSubject(e.target.value)}
                      disabled={subjectsLoading || !selectedClass}
                    >
                      <option value="">
                        {subjectsLoading
                          ? t(
                              "studentsGrades.loadingSubjects",
                              "Loading subjects..."
                            )
                          : t(
                              "studentsGrades.subjectSelectPlaceholder",
                              "Select subject"
                            )}
                      </option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {getEntityName(
                            subject,
                            t(
                              "studentsGrades.unnamedSubject",
                              "Unnamed Subject"
                            )
                          )}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="grades-load-btn"
                      onClick={handleLoadStudentsGrades}
                      disabled={
                        gradesLoading ||
                        !selectedGradesSubject ||
                        filteredStudents.length === 0
                      }
                    >
                      {gradesLoading
                        ? t("studentsGrades.loadingAction", "Loading...")
                        : t("studentsGrades.loadAction", "Show Grades")}
                    </button>
                  </div>
                </div>
              </div>

              {gradesError && (
                <div className="grades-error-banner">{gradesError}</div>
              )}

              {filteredStudents.length === 0 ? (
                <div className="grades-placeholder">
                  {t(
                    "studentsGrades.noStudents",
                    "No students available for the selected class and branch."
                  )}
                </div>
              ) : !selectedGradesSubject ? (
                <div className="grades-placeholder">
                  {t(
                    "studentsGrades.promptSelectSubject",
                    "Select a subject and click Show Grades to view the report."
                  )}
                </div>
              ) : seasonsToDisplay.length === 0 ? (
                <div className="grades-placeholder">
                  {t(
                    "studentsGrades.noSeasonsConfigured",
                    "No seasons configured to display. Please add Season 1 and Season 2."
                  )}
                </div>
              ) : gradesLoading ? (
                <div className="grades-placeholder loading">
                  {t(
                    "studentsGrades.loadingState",
                    "Loading student grades..."
                  )}
                </div>
              ) : studentsGradesData.length === 0 ? (
                <div className="grades-placeholder">
                  {t(
                    "studentsGrades.emptyState",
                    "No grades found for the selected filters."
                  )}
                </div>
              ) : (
                <div className="students-grades-table-wrapper">
                  <table className="students-grades-table">
                    <thead>
                      <tr>
                        <th rowSpan={2}>{t("studentsGrades.index", "n")}</th>
                        <th rowSpan={2}>
                          {t("studentsGrades.studentName", "Name")}
                        </th>
                        {seasonsToDisplay.map((season) => (
                          <th
                            key={season.key}
                            colSpan={7}
                            className="season-group-header"
                          >
                            {season.displayName}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        {seasonsToDisplay.map((season) => (
                          <React.Fragment key={`${season.key}-metrics`}>
                            <th
                              title={t(
                                "studentsGrades.exercisesAlt",
                                "Exercises (max 10)"
                              )}
                            >
                              {t("studentsGrades.exercises", "10")}
                            </th>
                            <th
                              title={t(
                                "studentsGrades.monthly1Alt",
                                "Monthly Exam 1 (max 20)"
                              )}
                            >
                              {t("studentsGrades.monthly1", "20 (1)")}
                            </th>
                            <th
                              title={t(
                                "studentsGrades.monthly2Alt",
                                "Monthly Exam 2 (max 20)"
                              )}
                            >
                              {t("studentsGrades.monthly2", "20 (2)")}
                            </th>
                            <th
                              title={t(
                                "studentsGrades.behaviourAlt",
                                "Behaviour (max 5)"
                              )}
                            >
                              {t("studentsGrades.behaviour", "5")}
                            </th>
                            <th
                              title={t(
                                "studentsGrades.attendanceAlt",
                                "Attendance (max 5)"
                              )}
                            >
                              {t("studentsGrades.attendance", "5")}
                            </th>
                            <th
                              title={t(
                                "studentsGrades.seasonExamAlt",
                                "Final Season Exam (max 60)"
                              )}
                            >
                              {t("studentsGrades.seasonExam", "60")}
                            </th>
                            <th
                              title={t(
                                "studentsGrades.totalAlt",
                                "Total Score (max 100)"
                              )}
                            >
                              {t("studentsGrades.total", "100")}
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studentsGradesData.map((row, index) => (
                        <tr key={row.studentId}>
                          <td>{index + 1}</td>
                          <td className="student-name-cell">
                            {row.studentName}
                          </td>
                          {seasonsToDisplay.map((season) => {
                            const seasonGrade = row.grades[season.key] || {};
                            return (
                              <React.Fragment
                                key={`${row.studentId}-${season.key}`}
                              >
                                <td>
                                  {seasonGrade.exercises !== ""
                                    ? seasonGrade.exercises
                                    : ""}
                                </td>
                                <td>
                                  {seasonGrade.monthlyExam1 !== ""
                                    ? seasonGrade.monthlyExam1
                                    : ""}
                                </td>
                                <td>
                                  {seasonGrade.monthlyExam2 !== ""
                                    ? seasonGrade.monthlyExam2
                                    : ""}
                                </td>
                                <td>
                                  {seasonGrade.behaviour !== ""
                                    ? seasonGrade.behaviour
                                    : ""}
                                </td>
                                <td>
                                  {seasonGrade.attendance !== ""
                                    ? seasonGrade.attendance
                                    : ""}
                                </td>
                                <td>
                                  {seasonGrade.seasonExam !== ""
                                    ? seasonGrade.seasonExam
                                    : ""}
                                </td>
                                <td>
                                  {seasonGrade.total !== ""
                                    ? seasonGrade.total
                                    : ""}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{filteredStudents.length}</div>
            <div className="stat-label">
              {user?.role === "Teacher"
                ? t("students.stats.myStudents", "My Students")
                : t("students.stats.totalStudents", "Total Students")}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {filteredStudents.filter((s) => s.gender === "Female").length}
            </div>
            <div className="stat-label">
              {t("students.stats.femaleStudents", "Female Students")}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {filteredStudents.filter((s) => s.gender === "Male").length}
            </div>
            <div className="stat-label">
              {t("students.stats.maleStudents", "Male Students")}
            </div>
          </div>
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={64} color="#9ca3af" />
            <h3>{t("students.empty.title", "No Students Found")}</h3>
            <p>
              {t(
                "students.empty.message",
                "No students found for the selected class and branch."
              )}
            </p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>{t("students.table.name", "Name")}</th>
                  <th>{t("students.table.picture", "Picture")}</th>
                  <th>{t("students.table.gender", "Gender")}</th>
                  <th>{t("students.table.phone", "Phone")}</th>
                  <th>{t("students.table.parentsPhone", "Parents Phone")}</th>
                  <th>{t("students.table.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td className="name-cell">
                      <div className="student-name">
                        {student.fullName ||
                          student.username ||
                          t("common.na", "N/A")}
                      </div>
                    </td>
                    <td className="picture-cell">
                      <div className="student-avatar">
                        {student.fullName ? (
                          <div className="avatar-circle">
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <User size={24} color="#6b7280" />
                        )}
                      </div>
                    </td>
                    <td className="gender-cell">
                      <div className="gender-info">
                        <span className="gender-icon">
                          {getGenderIcon(student.gender)}
                        </span>
                        <span className="gender-text">
                          {getGenderLabel(student.gender)}
                        </span>
                      </div>
                    </td>
                    <td className="phone-cell">
                      <div className="phone-info">
                        <Phone size={16} color="#6b7280" />
                        <span>{student.phone || t("common.na", "N/A")}</span>
                      </div>
                    </td>
                    <td className="parents-phone-cell">
                      <div className="parents-phone-info">
                        <UserCheck size={16} color="#6b7280" />
                        <span>
                          {student.parentsNumber || t("common.na", "N/A")}
                        </span>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <Link
                        to={`/student/profile?username=${student.username}`}
                        className="view-profile-btn"
                      >
                        <Eye size={16} />
                        {t("students.viewProfile", "View Profile")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Grading Modal */}
      {showBulkGradingModal && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ maxWidth: "900px", maxHeight: "90vh", overflow: "auto" }}
          >
            <div className="modal-header">
              <h2>{t("students.bulkGrade", "Bulk Grade Students")}</h2>
              <button onClick={closeBulkGradingModal} className="close-btn">
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

            <form onSubmit={handleBulkGradingSubmit}>
              <div className="modal-body">
                {/* Single Form - All Selections at Top */}
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ marginBottom: "16px" }}>
                    {t(
                      "students.bulkGrading.section.details",
                      "Select Exercise Details"
                    )}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div className="form-group">
                      <label>
                        {t("students.bulkGrading.labels.subject", "Subject")} *
                      </label>
                      <select
                        value={bulkGradingData.subjectId}
                        onChange={(e) =>
                          setBulkGradingData({
                            ...bulkGradingData,
                            subjectId: e.target.value,
                            chapterId: "",
                            partId: "",
                            exerciseId: "",
                          })
                        }
                        required
                        disabled={loadingDependencies}
                      >
                        <option value="">
                          {t(
                            "students.bulkGrading.options.selectSubject",
                            "Select Subject"
                          )}
                        </option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {getEntityName(
                              subject,
                              t(
                                "studentsGrades.unnamedSubject",
                                "Unnamed Subject"
                              )
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        {t("students.bulkGrading.labels.season", "Season")} *
                      </label>
                      <select
                        value={bulkGradingData.seasonId}
                        onChange={(e) =>
                          setBulkGradingData({
                            ...bulkGradingData,
                            seasonId: e.target.value,
                            chapterId: "",
                            partId: "",
                            exerciseId: "",
                          })
                        }
                        required
                        disabled={loadingDependencies}
                      >
                        <option value="">
                          {t(
                            "students.bulkGrading.options.selectSeason",
                            "Select Season"
                          )}
                        </option>
                        {seasons.map((season) => (
                          <option key={season._id} value={season._id}>
                            {getSeasonDisplayName(
                              season,
                              t("students.season.defaultLabel", "Season")
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        {t("students.bulkGrading.labels.type", "Type")} *
                      </label>
                      <select
                        value={bulkGradingData.gradingType}
                        onChange={(e) =>
                          setBulkGradingData({
                            ...bulkGradingData,
                            gradingType: e.target.value,
                            monthlyExamNumber: "",
                            chapterId: "",
                            partId: "",
                            exerciseId: "",
                          })
                        }
                        required
                        disabled={loadingDependencies}
                      >
                        <option value="">
                          {t(
                            "students.bulkGrading.options.selectType",
                            "Select Type"
                          )}
                        </option>
                        <option value="exercise">
                          {t("students.bulkGrading.types.exercise", "Exercise")}
                        </option>
                        <option value="monthly_exam">
                          {t(
                            "students.bulkGrading.types.monthlyExam",
                            "Monthly Exam"
                          )}
                        </option>
                        <option value="attendance">
                          {t(
                            "students.bulkGrading.types.attendance",
                            "Attendance"
                          )}
                        </option>
                        <option value="behaviour">
                          {t(
                            "students.bulkGrading.types.behaviour",
                            "Behaviour"
                          )}
                        </option>
                        <option value="season_exam">
                          {t(
                            "students.bulkGrading.types.seasonExam",
                            "Season Exam"
                          )}
                        </option>
                      </select>
                    </div>

                    {bulkGradingData.gradingType === "monthly_exam" && (
                      <div className="form-group">
                        <label>
                          {t(
                            "students.bulkGrading.labels.examNumber",
                            "Exam Number"
                          )}{" "}
                          *
                        </label>
                        <select
                          value={bulkGradingData.monthlyExamNumber}
                          onChange={(e) =>
                            setBulkGradingData({
                              ...bulkGradingData,
                              monthlyExamNumber: e.target.value,
                            })
                          }
                          required
                          disabled={loadingDependencies}
                        >
                          <option value="">
                            {t(
                              "students.bulkGrading.options.selectExam",
                              "Select Exam"
                            )}
                          </option>
                          <option value="1">
                            {t("students.bulkGrading.exam.first", "First Exam")}
                          </option>
                          <option value="2">
                            {t(
                              "students.bulkGrading.exam.second",
                              "Second Exam"
                            )}
                          </option>
                        </select>
                      </div>
                    )}

                    {bulkGradingData.gradingType === "exercise" && (
                      <>
                        <div className="form-group">
                          <label>
                            {t(
                              "students.bulkGrading.labels.chapter",
                              "Chapter"
                            )}{" "}
                            *
                          </label>
                          <select
                            value={bulkGradingData.chapterId}
                            onChange={(e) =>
                              setBulkGradingData({
                                ...bulkGradingData,
                                chapterId: e.target.value,
                                partId: "",
                                exerciseId: "",
                              })
                            }
                            required
                            disabled={
                              !bulkGradingData.subjectId ||
                              !bulkGradingData.seasonId ||
                              loadingDependencies
                            }
                          >
                            <option value="">
                              {t(
                                "students.bulkGrading.options.selectChapter",
                                "Select Chapter"
                              )}
                            </option>
                            {chapters.map((chapter) => (
                              <option key={chapter._id} value={chapter._id}>
                                {getEntityName(
                                  chapter,
                                  t(
                                    "students.bulkGrading.unnamedChapter",
                                    "Unnamed Chapter"
                                  )
                                )}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>
                            {t("students.bulkGrading.labels.part", "Part")} *
                          </label>
                          <select
                            value={bulkGradingData.partId}
                            onChange={(e) =>
                              setBulkGradingData({
                                ...bulkGradingData,
                                partId: e.target.value,
                                exerciseId: "",
                              })
                            }
                            required
                            disabled={
                              !bulkGradingData.chapterId || loadingDependencies
                            }
                          >
                            <option value="">
                              {t(
                                "students.bulkGrading.options.selectPart",
                                "Select Part"
                              )}
                            </option>
                            {parts.map((part) => (
                              <option key={part._id} value={part._id}>
                                {getEntityName(
                                  part,
                                  t(
                                    "students.bulkGrading.unnamedPart",
                                    "Unnamed Part"
                                  )
                                )}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>
                            {t(
                              "students.bulkGrading.labels.exercise",
                              "Exercise"
                            )}{" "}
                            *
                          </label>
                          <select
                            value={bulkGradingData.exerciseId}
                            onChange={(e) =>
                              setBulkGradingData({
                                ...bulkGradingData,
                                exerciseId: e.target.value,
                              })
                            }
                            required
                            disabled={
                              !bulkGradingData.partId || loadingDependencies
                            }
                          >
                            <option value="">
                              {t(
                                "students.bulkGrading.options.selectExercise",
                                "Select Exercise"
                              )}
                            </option>
                            {exercises.map((exercise) => (
                              <option key={exercise._id} value={exercise._id}>
                                {`${getEntityName(
                                  exercise,
                                  t(
                                    "students.bulkGrading.unnamedExercise",
                                    "Unnamed Exercise"
                                  )
                                )} (${exercise.degree || 0} ${t(
                                  "students.bulkGrading.degreePoints",
                                  "points"
                                )})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label>
                        {t(
                          "students.bulkGrading.labels.gradeDate",
                          "Grade Date"
                        )}{" "}
                        *
                      </label>
                      <input
                        type="date"
                        value={
                          bulkGradingData.gradedDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setBulkGradingData({
                            ...bulkGradingData,
                            gradedDate: e.target.value,
                          })
                        }
                        required
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          width: "100%",
                          fontSize: "0.875rem",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Student Grades Table - One Row Per Student */}
                {((bulkGradingData.gradingType === "exercise" &&
                  bulkGradingData.exerciseId) ||
                  (bulkGradingData.gradingType &&
                    bulkGradingData.gradingType !== "exercise")) && (
                  <div style={{ marginTop: "24px" }}>
                    <h3 style={{ marginBottom: "16px" }}>
                      {t(
                        "students.bulkGrading.section.grades",
                        "Enter Grades for Students"
                      )}
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        marginBottom: "16px",
                        fontSize: "0.875rem",
                      }}
                    >
                      {t(
                        "students.bulkGrading.helper.instructions",
                        `Enter grades for ${selectedStudents.length} student(s). Leave grade empty to skip a student.`
                      )}
                    </p>

                    <div
                      style={{
                        maxHeight: "400px",
                        overflow: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    >
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: "#f9fafb",
                              borderBottom: "2px solid #e5e7eb",
                            }}
                          >
                            <th
                              style={{
                                padding: "12px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "#374151",
                              }}
                            >
                              {t("students.bulkGrading.table.name", "Name")}
                            </th>
                            <th
                              style={{
                                padding: "12px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "#374151",
                              }}
                            >
                              {(() => {
                                if (
                                  bulkGradingData.gradingType === "exercise"
                                ) {
                                  const exerciseDegree =
                                    exercises.find(
                                      (e) =>
                                        e._id === bulkGradingData.exerciseId
                                    )?.degree || 10;
                                  return t(
                                    "students.bulkGrading.table.degreeMax",
                                    `Degree (Max: ${exerciseDegree})`,
                                    { max: exerciseDegree }
                                  );
                                }
                                if (
                                  bulkGradingData.gradingType === "monthly_exam"
                                ) {
                                  return t(
                                    "students.bulkGrading.table.gradeMax20",
                                    "Grade (Max: 20)"
                                  );
                                }
                                if (
                                  bulkGradingData.gradingType ===
                                    "attendance" ||
                                  bulkGradingData.gradingType === "behaviour"
                                ) {
                                  return t(
                                    "students.bulkGrading.table.gradeMax5",
                                    "Grade (Max: 5)"
                                  );
                                }
                                if (
                                  bulkGradingData.gradingType === "season_exam"
                                ) {
                                  return t(
                                    "students.bulkGrading.table.gradeMax60",
                                    "Grade (Max: 60)"
                                  );
                                }
                                return t(
                                  "students.bulkGrading.table.grade",
                                  "Grade"
                                );
                              })()}
                            </th>
                            <th
                              style={{
                                padding: "12px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "#374151",
                              }}
                            >
                              {t("students.bulkGrading.table.notes", "Notes")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudents.map((studentId) => {
                            const student = filteredStudents.find(
                              (s) => s._id === studentId
                            );
                            let currentMaxGrade = 10;
                            if (bulkGradingData.gradingType === "exercise") {
                              currentMaxGrade =
                                exercises.find(
                                  (e) => e._id === bulkGradingData.exerciseId
                                )?.degree || 10;
                            } else if (
                              bulkGradingData.gradingType === "monthly_exam"
                            ) {
                              currentMaxGrade = 20;
                            } else if (
                              bulkGradingData.gradingType === "attendance" ||
                              bulkGradingData.gradingType === "behaviour"
                            ) {
                              currentMaxGrade = 5;
                            } else if (
                              bulkGradingData.gradingType === "season_exam"
                            ) {
                              currentMaxGrade = 60;
                            }
                            const currentGrade =
                              studentGrades[studentId]?.grade;

                            return (
                              <tr
                                key={studentId}
                                style={{ borderBottom: "1px solid #e5e7eb" }}
                              >
                                <td
                                  style={{ padding: "12px", fontWeight: 500 }}
                                >
                                  {student?.fullName ||
                                    student?.username ||
                                    t(
                                      "students.bulkGrading.unknownStudent",
                                      "Unknown Student"
                                    )}
                                </td>
                                <td style={{ padding: "12px" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={currentMaxGrade}
                                    value={
                                      currentGrade === null ||
                                      currentGrade === undefined
                                        ? ""
                                        : currentGrade
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Allow empty string (null grade) - don't save if empty
                                      const gradeValue =
                                        value === ""
                                          ? null
                                          : parseInt(value, 10) || null;
                                      setStudentGrades({
                                        ...studentGrades,
                                        [studentId]: {
                                          ...studentGrades[studentId],
                                          grade: gradeValue,
                                        },
                                      });
                                    }}
                                    placeholder={t(
                                      "students.bulkGrading.placeholders.grade",
                                      "Enter grade..."
                                    )}
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      width: "100%",
                                      maxWidth: "120px",
                                      fontSize: "0.875rem",
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "12px" }}>
                                  <input
                                    type="text"
                                    value={
                                      studentGrades[studentId]?.notes || ""
                                    }
                                    onChange={(e) =>
                                      setStudentGrades({
                                        ...studentGrades,
                                        [studentId]: {
                                          ...studentGrades[studentId],
                                          notes: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder={t(
                                      "students.bulkGrading.placeholders.notes",
                                      "Optional notes..."
                                    )}
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      width: "100%",
                                      fontSize: "0.875rem",
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e5e7eb",
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeBulkGradingModal}
                >
                  {t("students.bulkGrading.actions.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    !bulkGradingData.gradingType ||
                    !bulkGradingData.subjectId ||
                    !bulkGradingData.seasonId ||
                    (bulkGradingData.gradingType === "exercise" &&
                      !bulkGradingData.exerciseId) ||
                    (bulkGradingData.gradingType === "monthly_exam" &&
                      !bulkGradingData.monthlyExamNumber) ||
                    loadingDependencies
                  }
                >
                  {t("students.bulkGrading.actions.save", "Save Grades")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .filters-section {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .filters-actions {
          display: flex;
          gap: 12px;
          margin-left: auto;
          flex-wrap: wrap;
          align-items: center;
        }

        .filters-actions .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .filters-actions .btn-secondary {
          background: #eef2ff;
          color: #312e81;
        }

        .filters-actions .btn-secondary:hover:not(:disabled) {
          background: #e0e7ff;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(49, 46, 129, 0.18);
        }

        .filters-actions .btn-secondary.active {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(67, 56, 202, 0.28);
        }

        .filters-actions .btn-primary {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(34, 197, 94, 0.28);
        }

        .filters-actions .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(34, 197, 94, 0.32);
        }

        .filters-actions .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .filter-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 0.875rem;
          color: #374151;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-select:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .current-selection {
          margin-bottom: 24px;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
        }

        .current-selection h3 {
          margin: 0;
          color: #1e40af;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .student-cards-section {
          margin-bottom: 32px;
        }

        .student-cards-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .student-cards-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-end;
        }

        .student-cards-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.95rem;
          color: #1f2937;
        }

        .student-cards-meta span {
          display: flex;
          gap: 6px;
          align-items: baseline;
        }

        .student-cards-meta strong {
          font-size: 1rem;
          color: #111827;
        }

        .student-cards-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 280px;
        }

        .student-cards-controls label {
          font-weight: 600;
          color: #374151;
        }

        .student-cards-control-row {
          display: flex;
          gap: 12px;
        }

        .student-cards-control-row select {
          flex: 1;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          font-size: 0.95rem;
          color: #111827;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .student-cards-control-row select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .student-cards-load-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .student-cards-load-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 24px rgba(249, 115, 22, 0.25);
        }

        .student-cards-load-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .student-cards-error {
          background: #fef2f2;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #fecaca;
          font-weight: 500;
        }

        .student-cards-placeholder {
          padding: 36px 24px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          text-align: center;
          font-size: 0.98rem;
          color: #475569;
          font-weight: 500;
        }

        .student-cards-placeholder.loading {
          background: linear-gradient(
            120deg,
            rgba(241, 245, 249, 0.8),
            rgba(226, 232, 240, 0.9),
            rgba(241, 245, 249, 0.8)
          );
          background-size: 200% 200%;
          animation: shimmer 1.5s ease infinite;
        }

        .student-cards-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .student-card-report {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
        }

        .student-card-report-header {
          display: flex;
          gap: 24px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
          color: #1f2937;
          font-weight: 600;
          flex-wrap: wrap;
        }

        .student-card-report-table-wrapper {
          overflow-x: auto;
          background: #ffffff;
        }

        .student-card-report-table {
          width: 100%;
          min-width: 720px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .student-card-report-table th,
        .student-card-report-table td {
          border: 1px solid #e2e8f0;
          padding: 12px 10px;
          text-align: center;
          background: #ffffff;
          font-size: 0.95rem;
        }

        .student-card-report-table th {
          font-weight: 700;
          color: #1e293b;
        }

        .student-card-season-header {
          background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
          color: #1f2937;
          font-size: 1rem;
          border-top: 0;
          border-bottom: 0;
        }

        .student-card-report-table tbody tr:nth-child(odd) td {
          background: #f8fafc;
        }

        .student-card-report-table tbody tr:nth-child(even) td {
          background: #ffffff;
        }

        .student-card-report-table td:first-child,
        .student-card-report-table th:first-child {
          position: sticky;
          left: 0;
          background: #f1f5f9;
          z-index: 2;
          text-align: left;
          padding-left: 16px;
          font-weight: 600;
        }

        .student-card-report-table td:first-child {
          color: #0f172a;
        }

        .students-grades-section {
          margin-bottom: 32px;
        }

        .students-grades-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .students-grades-header {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          justify-content: space-between;
          align-items: flex-end;
        }

        .students-grades-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.95rem;
          color: #1f2937;
        }

        .students-grades-meta span {
          display: flex;
          gap: 6px;
          align-items: baseline;
        }

        .students-grades-meta strong {
          font-size: 1rem;
          color: #111827;
        }

        .students-grades-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 280px;
        }

        .students-grades-controls label {
          font-weight: 600;
          color: #374151;
        }

        .grades-control-row {
          display: flex;
          gap: 12px;
        }

        .grades-control-row select {
          flex: 1;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          font-size: 0.95rem;
          color: #111827;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .grades-control-row select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .grades-control-row select:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .grades-load-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }

        .grades-load-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 24px rgba(14, 165, 233, 0.25);
        }

        .grades-load-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .grades-error-banner {
          background: #fef2f2;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #fecaca;
          font-weight: 500;
        }

        .grades-placeholder {
          padding: 36px 24px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          text-align: center;
          font-size: 0.98rem;
          color: #475569;
          font-weight: 500;
        }

        .grades-placeholder.loading {
          background: linear-gradient(
            120deg,
            rgba(241, 245, 249, 0.8),
            rgba(226, 232, 240, 0.9),
            rgba(241, 245, 249, 0.8)
          );
          background-size: 200% 200%;
          animation: shimmer 1.5s ease infinite;
        }

        .students-grades-table-wrapper {
          overflow-x: auto;
        }

        .students-grades-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 720px;
          font-size: 0.95rem;
        }

        .students-grades-table th,
        .students-grades-table td {
          border: 1px solid #e2e8f0;
          padding: 12px 10px;
          text-align: center;
          background: #ffffff;
        }

        .students-grades-table th {
          font-weight: 700;
          color: #1e293b;
        }

        .students-grades-table tbody tr:nth-child(odd) td {
          background: #f8fafc;
        }

        .students-grades-table tbody tr:nth-child(even) td {
          background: #ffffff;
        }

        .students-grades-table th:first-child,
        .students-grades-table td:first-child {
          position: sticky;
          left: 0;
          background: #f8fafc;
          z-index: 2;
          min-width: 60px;
          width: 60px;
        }

        .students-grades-table th:nth-child(2),
        .students-grades-table td:nth-child(2) {
          position: sticky;
          left: 60px;
          background: #f8fafc;
          z-index: 2;
          text-align: left;
        }

        .student-name-cell {
          text-align: left;
          font-weight: 600;
          color: #0f172a;
          padding-left: 16px;
          min-width: 180px;
        }

        .season-group-header {
          background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
          color: #1f2937;
          font-size: 1.05rem;
          border-top: 0;
          border-bottom: 0;
        }

        .students-grades-table thead tr:nth-child(2) th {
          background: #1d4ed8;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .selection-item {
          background: #dbeafe;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .students-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .students-table {
          width: 100%;
          border-collapse: collapse;
        }

        .students-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .students-table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .students-table tr:hover {
          background: #f8fafc;
        }

        .name-cell {
          font-weight: 600;
          color: #111827;
        }

        .student-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .gender-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gender-icon {
          font-size: 1.25rem;
          color: #6b7280;
        }

        .gender-text {
          font-size: 0.875rem;
          color: #374151;
          text-transform: capitalize;
        }

        .phone-info,
        .parents-phone-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .view-profile-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .view-profile-btn:hover {
          background: #2563eb;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-state h3 {
          margin: 16px 0 8px 0;
          color: #374151;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .filters-section {
            flex-direction: column;
            gap: 16px;
          }

          .filter-group {
            min-width: auto;
          }

          .students-grades-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .grades-control-row {
            flex-direction: column;
          }

          .grades-control-row select {
            width: 100%;
          }

          .grades-load-btn {
            width: 100%;
          }

          .student-cards-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .student-cards-control-row {
            flex-direction: column;
          }

          .student-cards-control-row select,
          .student-cards-load-btn {
            width: 100%;
          }

          .student-card-report-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .student-card-report-table th:first-child,
          .student-card-report-table td:first-child {
            position: static;
            background: #ffffff;
            padding-left: 10px;
          }

          .students-grades-table th:first-child,
          .students-grades-table td:first-child,
          .students-grades-table th:nth-child(2),
          .students-grades-table td:nth-child(2) {
            position: static;
            background: #ffffff;
          }

          .students-table-container {
            overflow-x: auto;
          }

          .students-table {
            min-width: 600px;
          }

          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Students;
