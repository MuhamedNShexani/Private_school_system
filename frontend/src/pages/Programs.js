import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import {
  subjectsAPI,
  seasonsAPI,
  chaptersAPI,
  classesAPI,
  partsAPI,
  quizzesAPI,
} from "../services/api";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ClipboardList,
} from "lucide-react";

const Programs = () => {
  const { user, isAdmin } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isTeacher = user?.role === "Teacher";
  const navigate = useNavigate();

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === "object") {
      if (value._id) return value._id.toString();
      if (value.id) return value.id.toString();
    }
    return value.toString ? value.toString() : `${value}`;
  };

  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parts, setParts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState(
    isTeacher ? "subjects" : "classes"
  );
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const teacherClassIds = useMemo(() => {
    if (!isTeacher) return [];
    return (user?.teacherProfile?.classes || [])
      .map((cls) => normalizeId(cls))
      .filter(Boolean);
  }, [isTeacher, user]);

  const teacherClasses = useMemo(() => {
    if (!isTeacher) return [];
    return classes.filter((cls) =>
      teacherClassIds.includes(normalizeId(cls._id))
    );
  }, [isTeacher, classes, teacherClassIds]);

  useEffect(() => {
    if (!isTeacher) return;
    if (!teacherClasses.length) {
      setSelectedClass(null);
      return;
    }

    const currentClassId = normalizeId(selectedClass?._id);
    if (!currentClassId || !teacherClassIds.includes(currentClassId)) {
      setSelectedClass(teacherClasses[0]);
      setSelectedSubject(null);
      setSelectedSeason(null);
      setSelectedChapter(null);
    }
  }, [isTeacher, teacherClasses, teacherClassIds, selectedClass]);

  useEffect(() => {
    if (isTeacher && currentView === "classes") {
      setCurrentView("subjects");
    }
  }, [isTeacher, currentView]);

  const canManageClasses = isAdmin;
  const canManageSubjects = isAdmin;
  const canManageSeasons = isAdmin;
  const canManageChapters = isAdmin || isTeacher;
  const canManageParts = isAdmin || isTeacher;

  // Modal states for CRUD operations
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const getLocalizedText = (value, fallback = "") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;

    if (typeof value === "object") {
      const directMatch =
        value[currentLanguage] || value.en || value.ar || value.ku;
      if (directMatch) return directMatch;
    }

    return fallback;
  };

  const getEntityName = (entity, fallback = "") => {
    if (!entity) return fallback;
    if (typeof entity === "string") return entity;

    const candidate =
      entity.nameMultilingual ||
      entity.name ||
      entity.titleMultilingual ||
      entity.title ||
      entity.label;

    return getLocalizedText(candidate, fallback);
  };

  const getSeasonName = (season, fallback = "") => {
    if (!season) return fallback;
    return (
      getLocalizedText(
        season.nameMultilingual || season.name || season.title || season.code,
        fallback
      ) || fallback
    );
  };

  const getClassName = (cls) =>
    getEntityName(cls, typeof cls?.name === "string" ? cls.name : "");

  const getSubjectTitle = (subject) =>
    getLocalizedText(
      subject?.titleMultilingual || subject?.title,
      typeof subject?.title === "string" ? subject.title : ""
    );

  const getChapterTitle = (chapter) =>
    getLocalizedText(
      chapter?.titleMultilingual || chapter?.title,
      typeof chapter?.title === "string" ? chapter.title : ""
    );

  const getPartTitle = (part) =>
    getLocalizedText(
      part?.titleMultilingual || part?.title,
      typeof part?.title === "string" ? part.title : ""
    );

  const getDescription = (entity) =>
    getLocalizedText(
      entity?.descriptionMultilingual || entity?.description,
      ""
    );

  const getSeasonNameVariants = (season) => {
    const names = new Set();
    const add = (value) => {
      if (!value) return;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) names.add(trimmed);
      }
    };
    const addFromObject = (obj) => {
      if (!obj || typeof obj !== "object") return;
      Object.values(obj).forEach(add);
    };

    if (typeof season === "string") {
      add(season);
    } else if (season) {
      add(season.name);
      addFromObject(season.name);
      add(season.title);
      addFromObject(season.title);
      addFromObject(season.nameMultilingual);
      add(season.code);
      if (season.order) {
        add(`Season ${season.order}`);
      }
    }

    return Array.from(names);
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const currentLang = localStorage.getItem("language") || "en";
      const [
        subjectsResult,
        seasonsResult,
        chaptersResult,
        classesResult,
        partsResult,
        quizzesResult,
      ] = await Promise.allSettled([
        subjectsAPI.getAll({ lang: currentLang }),
        seasonsAPI.getAll({ lang: currentLang }),
        chaptersAPI.getAll(),
        classesAPI.getAll({ lang: currentLang }),
        partsAPI.getAll(),
        quizzesAPI.getAll({ lang: currentLang }),
      ]);

      if (subjectsResult.status === "fulfilled") {
        const res = subjectsResult.value;
        setSubjects(res.data?.data || res.data || []);
      } else {
        console.warn("Failed to load subjects:", subjectsResult.reason);
        setSubjects([]);
      }

      if (seasonsResult.status === "fulfilled") {
        const res = seasonsResult.value;
        setSeasons(res.data?.data || res.data || []);
      } else {
        console.warn("Failed to load seasons:", seasonsResult.reason);
        setSeasons([]);
      }

      if (chaptersResult.status === "fulfilled") {
        const res = chaptersResult.value;
        setChapters(res.data?.data || res.data || []);
      } else {
        console.warn("Failed to load chapters:", chaptersResult.reason);
        setChapters([]);
      }

      if (classesResult.status === "fulfilled") {
        const res = classesResult.value;
        setClasses(res.data || []);
      } else {
        console.warn("Failed to load classes:", classesResult.reason);
        setClasses([]);
      }

      if (partsResult.status === "fulfilled") {
        const res = partsResult.value;
        setParts(res.data?.data || res.data || []);
      } else {
        console.warn("Failed to load parts:", partsResult.reason);
        setParts([]);
      }

      if (quizzesResult.status === "fulfilled") {
        const res = quizzesResult.value;
        setQuizzes(res.data?.data || res.data || []);
      } else {
        console.warn("Failed to load quizzes:", quizzesResult.reason);
        setQuizzes([]);
      }

      setError(null);
    } catch (err) {
      setError(
        t(
          "msg.failed_load_programs",
          "Failed to load programs data. Please try again."
        )
      );
      console.error("Error fetching programs data:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter subjects based on teacher's assigned subjects
  useEffect(() => {
    if (user?.role === "Teacher" && user?.teacherProfile?.subjects) {
      const teacherSubjectIds = user.teacherProfile.subjects.map((subject) =>
        typeof subject === "object" ? subject._id : subject
      );

      const filtered = subjects.filter((subject) =>
        teacherSubjectIds.includes(subject._id)
      );

      setFilteredSubjects(filtered);
    } else {
      // For admins and students, show all subjects
      setFilteredSubjects(subjects);
    }
  }, [subjects, user]);

  // Refetch classes, subjects, and seasons when language changes
  useEffect(() => {
    const refetchData = async () => {
      try {
        const currentLang = localStorage.getItem("language") || "en";
        const [classesResult, subjectsResult, seasonsResult, quizzesResult] =
          await Promise.allSettled([
            classesAPI.getAll({ lang: currentLang }),
            subjectsAPI.getAll({ lang: currentLang }),
            seasonsAPI.getAll({ lang: currentLang }),
            quizzesAPI.getAll({ lang: currentLang }),
          ]);

        if (classesResult.status === "fulfilled") {
          setClasses(classesResult.value.data || []);
        }

        if (subjectsResult.status === "fulfilled") {
          const res = subjectsResult.value;
          setSubjects(res.data?.data || res.data || []);
        }

        if (seasonsResult.status === "fulfilled") {
          const res = seasonsResult.value;
          setSeasons(res.data?.data || res.data || []);
        }

        if (quizzesResult.status === "fulfilled") {
          const res = quizzesResult.value;
          setQuizzes(res.data?.data || res.data || []);
        }
      } catch (err) {
        console.error("Error refetching data:", err);
      }
    };

    refetchData();
  }, [t]); // t function changes when language changes

  // Get subjects for a specific class
  const getSubjectsByClass = (classId) => {
    const classIdNormalized = normalizeId(classId);
    return filteredSubjects.filter((subject) => {
      const subjectClassId = normalizeId(subject.class?._id || subject.class);
      return classIdNormalized && subjectClassId === classIdNormalized;
    });
  };

  // Get seasons for a specific subject
  const getSeasonsForSubject = (subject) => {
    const subjectId = normalizeId(subject?._id || subject);
    const subjectChapters = chapters.filter((chapter) => {
      const chapterSubjectId = normalizeId(
        chapter.subject?._id || chapter.subject
      );
      return subjectId && chapterSubjectId === subjectId;
    });
    const uniqueSeasonNames = [
      ...new Set(
        subjectChapters
          .map((chapter) => (chapter.season || "").toString())
          .filter(Boolean)
      ),
    ];

    console.log("Subject:", subject);
    console.log("Subject chapters:", subjectChapters);
    console.log("Unique season names from chapters:", uniqueSeasonNames);
    console.log(
      "Available seasons:",
      seasons.map((s) => ({
        name: getSeasonName(s, s.name || ""),
        _id: s._id,
        order: s.order,
      }))
    );

    const seasonObjects = uniqueSeasonNames
      .map((seasonName) => {
        const nameLower = seasonName.toLowerCase();

        let foundSeason = seasons.find((season) =>
          getSeasonNameVariants(season)
            .map((name) => name.toLowerCase())
            .includes(nameLower)
        );

        if (!foundSeason) {
          const seasonMatch = seasonName.match(/\d+/);
          if (seasonMatch) {
            const seasonNumber = parseInt(seasonMatch[0], 10);
            foundSeason = seasons.find((s) => s.order === seasonNumber);
          }
        }

        return foundSeason;
      })
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log("Final season objects:", seasonObjects);

    if (seasonObjects.length === 0 && seasons.length > 0) {
      console.log(
        "No seasons found from chapters, returning all seasons as fallback"
      );
      return [...seasons].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return seasonObjects;
  };

  // Get chapters for a specific season and subject
  const getChaptersForSeason = (season, subject) => {
    const seasonVariantSet = new Set(
      getSeasonNameVariants(season).map((name) => name.toLowerCase())
    );

    if (typeof season === "string" && season.trim()) {
      seasonVariantSet.add(season.trim().toLowerCase());
    }

    const resolvedSeason =
      typeof season === "string"
        ? seasons.find((s) =>
            getSeasonNameVariants(s)
              .map((name) => name.toLowerCase())
              .includes(season.trim().toLowerCase())
          )
        : season;

    if (resolvedSeason?.order) {
      seasonVariantSet.add(`season ${resolvedSeason.order}`.toLowerCase());
    }

    const seasonVariants = Array.from(seasonVariantSet);
    const subjectId = normalizeId(subject?._id || subject);

    return chapters.filter((chapter) => {
      const chapterSubjectId = normalizeId(
        chapter.subject?._id || chapter.subject
      );
      const subjectMatches = subjectId ? chapterSubjectId === subjectId : true;

      const chapterSeason = (chapter.season || "")
        .toString()
        .trim()
        .toLowerCase();

      const seasonMatches =
        seasonVariants.length === 0
          ? true
          : seasonVariants.includes(chapterSeason);

      return subjectMatches && seasonMatches;
    });
  };

  // Get parts for a specific chapter
  const getPartsByChapter = (chapterId) => {
    const normalizedChapterId = normalizeId(chapterId);
    return parts.filter((part) => {
      const partChapterId = normalizeId(part.chapter?._id || part.chapter);
      return normalizedChapterId && partChapterId === normalizedChapterId;
    });
  };

  // Get quizzes for a specific chapter
  const getQuizzesByChapter = (chapterId) => {
    const normalizedChapterId = normalizeId(chapterId);
    return quizzes.filter((quiz) => {
      const quizChapterId = normalizeId(quiz.chapter?._id || quiz.chapter);
      return normalizedChapterId && quizChapterId === normalizedChapterId;
    });
  };

  // CRUD Functions
  const openModal = (type, item = null) => {
    if (
      (type === "class" && !canManageClasses) ||
      (type === "subject" && !canManageSubjects) ||
      (type === "season" && !canManageSeasons) ||
      (type === "chapter" && !canManageChapters) ||
      (type === "part" && !canManageParts)
    ) {
      return;
    }

    setModalType(type);
    setEditingItem(item);

    if (item) {
      // For classes, use the multilingual name structure if available
      if (type === "class" && item.nameMultilingual) {
        setFormData({
          ...item,
          name: item.nameMultilingual,
          branches:
            item.branches?.map((branch) => ({
              ...branch,
              name: branch.nameMultilingual || branch.name,
            })) || [],
        });
      }
      // For subjects, use the multilingual title structure if available
      else if (type === "subject" && item.titleMultilingual) {
        setFormData({
          ...item,
          title: item.titleMultilingual,
          class: item.class?._id || item.class || "",
        });
      }
      // For seasons, use the multilingual name structure if available
      else if (type === "season" && item.nameMultilingual) {
        setFormData({
          ...item,
          name: item.nameMultilingual,
        });
      }
      // For chapters, ensure subject and season are properly set
      else if (type === "chapter") {
        // Find the matching season from the seasons array
        // The chapter's season is stored as "Season 1", "Season 2", etc.
        // We need to find a season whose name matches this value
        const chapterSeasonValue = item.season;
        let matchingSeason = seasons.find(
          (s) =>
            s.name === chapterSeasonValue ||
            s.nameMultilingual?.en === chapterSeasonValue ||
            s.nameMultilingual?.ar === chapterSeasonValue ||
            s.nameMultilingual?.ku === chapterSeasonValue
        );

        // If no direct match, try to extract the number and match by order
        if (!matchingSeason && chapterSeasonValue) {
          const seasonMatch = chapterSeasonValue.match(/\d+/);
          if (seasonMatch) {
            const seasonNumber = parseInt(seasonMatch[0]);
            matchingSeason = seasons.find((s) => s.order === seasonNumber);
          }
        }

        setFormData({
          ...item,
          subject: item.subject?._id || item.subject || "",
          season: matchingSeason?.name || chapterSeasonValue || "",
        });
      }
      // For parts, ensure chapter is properly set
      else if (type === "part") {
        console.log("Editing part with item:", item);
        console.log("Item chapter:", item.chapter);
        console.log(
          "Setting chapter to:",
          item.chapter?._id || item.chapter || ""
        );
        setFormData({
          ...item,
          chapter: item.chapter?._id || item.chapter || "",
        });
      } else {
        setFormData(item);
      }
    } else {
      const defaults = {
        class: {
          name: { en: "", ar: "", ku: "" },
          branches: [],
          sort: 0,
          isActive: true,
        },
        subject: {
          title: { en: "", ar: "", ku: "" },
          description: "",
          content: "",
          class: selectedClass?._id || "",
          order: 1,
          difficulty: "Medium",
          estimatedTime: 30,
          exercises: [],
          isActive: true,
        },
        season: {
          name: { en: "", ar: "", ku: "" },
          description: "",
          order: 1,
          isActive: true,
        },
        chapter: {
          title: "",
          description: "",
          subject: selectedSubject?._id || "",
          season: selectedSeason?.name || "Season 1",
          order: 1,
          isActive: true,
        },
        part: {
          title: "",
          description: "",
          content: "",
          chapter: selectedChapter?._id || "",
          order: 1,
          learningObjectives: [],
          resources: [],
          isActive: true,
        },
      };

      // Debug logging for parts modal
      if (type === "part") {
        console.log(
          "Opening part modal with selectedChapter:",
          selectedChapter
        );
        console.log("Setting chapter to:", selectedChapter?._id || "");
      }

      setFormData(defaults[type] || {});
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setModalType("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate that part has a chapter if we're creating a part
      if (modalType === "part" && !formData.chapter) {
        setError(
          t(
            "error.select_chapter_for_part",
            "Please select a chapter for the part"
          )
        );
        return;
      }

      // Validate class branches if we're creating/updating a class
      if (modalType === "class" && formData.branches) {
        for (let i = 0; i < formData.branches.length; i++) {
          const branch = formData.branches[i];
          if (!branch.name?.en || branch.name.en.trim() === "") {
            setError(
              t(
                "error.branch_name_english_required",
                `Branch ${i + 1} English name is required`
              )
            );
            return;
          }
        }
      }

      const apiMap = {
        class: classesAPI,
        subject: subjectsAPI,
        season: seasonsAPI,
        chapter: chaptersAPI,
        part: partsAPI,
      };

      const api = apiMap[modalType];

      // Normalize season value for chapters to match enum format
      let dataToSubmit = { ...formData };
      if (modalType === "chapter" && dataToSubmit.season) {
        // Ensure season matches enum format: "Season 1", "Season 2", etc.
        const validSeasons = ["Season 1", "Season 2", "Season 3", "Season 4"];
        const seasonValue = dataToSubmit.season.trim();

        // Check if it's already in the correct format
        if (!validSeasons.includes(seasonValue)) {
          // Normalize: extract number and format as "Season X"
          const seasonMatch = seasonValue.match(/\d+/);
          if (seasonMatch) {
            const seasonNumber = seasonMatch[0];
            dataToSubmit.season = `Season ${seasonNumber}`;
          }
        }
      }

      // Debug logging for parts
      if (modalType === "part") {
        console.log("Creating part with formData:", formData);
        console.log("Selected chapter:", selectedChapter);
        console.log("FormData chapter:", formData.chapter);
      }

      if (editingItem) {
        // Debug logging for parts update
        if (modalType === "part") {
          console.log("Updating part with formData:", formData);
          console.log("Editing item:", editingItem);
          console.log("FormData chapter:", formData.chapter);
        }
        await api.update(editingItem._id, dataToSubmit);
      } else {
        await api.create(dataToSubmit);
      }

      closeModal();
      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error("Error saving data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("error.failed_to_save", "Failed to save data");
      setError(errorMessage);
    }
  };

  const handleDelete = async (item, type) => {
    if (
      window.confirm(
        t(
          `confirm.delete_${type}`,
          `Are you sure you want to delete this ${type}?`
        )
      )
    ) {
      try {
        const apiMap = {
          class: classesAPI,
          subject: subjectsAPI,
          season: seasonsAPI,
          chapter: chaptersAPI,
          part: partsAPI,
        };

        await apiMap[type].delete(item._id);
        // Refresh data
        await fetchAllData();
      } catch (error) {
        console.error("Error deleting data:", error);
        setError(t("error.failed_to_delete", "Failed to delete data"));
      }
    }
  };

  const handleStatusToggle = async (item, type) => {
    try {
      const apiMap = {
        class: classesAPI,
        subject: subjectsAPI,
        season: seasonsAPI,
        chapter: chaptersAPI,
        part: partsAPI,
      };

      await apiMap[type].updateStatus(item._id, !item.isActive);
      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error("Error updating status:", error);
      setError(t("error.failed_to_update_status", "Failed to update status"));
    }
  };

  const handleClassClick = (classData) => {
    setSelectedClass(classData);
    setCurrentView("subjects");
    setSelectedSubject(null);
    setSelectedSeason(null);
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setCurrentView("chapters-by-season");
    setSelectedSeason(null);
  };

  const handleSeasonClick = (season) => {
    setSelectedSeason(season);
    setCurrentView("chapters");
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setCurrentView("parts");
  };

  const handleBack = () => {
    switch (currentView) {
      case "subjects":
        setCurrentView("classes");
        setSelectedClass(null);
        break;
      case "chapters-by-season":
        setCurrentView("subjects");
        setSelectedSubject(null);
        break;
      case "seasons":
        setCurrentView("subjects");
        setSelectedSubject(null);
        break;
      case "seasons-management":
        setCurrentView("classes");
        break;
      case "chapters":
        setCurrentView("seasons");
        setSelectedSeason(null);
        break;
      case "parts":
        setCurrentView("chapters-by-season");
        setSelectedChapter(null);
        break;
      default:
        setCurrentView("classes");
    }
  };

  const getBreadcrumb = () => {
    const breadcrumbs = [t("nav.programs", "Programs")];
    if (currentView === "seasons-management") {
      breadcrumbs.push(t("programs.manage_seasons", "Manage Seasons"));
    } else {
      if (selectedClass) breadcrumbs.push(getClassName(selectedClass));
      if (selectedSubject) breadcrumbs.push(getSubjectTitle(selectedSubject));
      if (selectedSeason)
        breadcrumbs.push(
          getSeasonName(selectedSeason, selectedSeason?.name || "")
        );
      if (selectedChapter) breadcrumbs.push(getChapterTitle(selectedChapter));
    }
    return breadcrumbs.join(" > ");
  };

  const getCurrentViewType = () => {
    switch (currentView) {
      case "subjects":
        return "subject";
      case "chapters-by-season":
        return "chapter";
      case "seasons":
        return "season";
      case "seasons-management":
        return "season";
      case "chapters":
        return "chapter";
      case "parts":
        return "part";
      default:
        return "class";
    }
  };

  // Render form fields based on modal type
  const renderFormFields = () => {
    const commonFields = {
      class: (
        <>
          <div className="form-group">
            <label>{t("form.name_english", "Name - English")}</label>
            <input
              type="text"
              value={formData.name?.en || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: {
                    ...formData.name,
                    en: e.target.value,
                  },
                })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>{t("form.name_arabic", "Name - Arabic")}</label>
            <input
              type="text"
              value={formData.name?.ar || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: {
                    ...formData.name,
                    ar: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label>{t("form.name_kurdish", "Name - Kurdish")}</label>
            <input
              type="text"
              value={formData.name?.ku || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: {
                    ...formData.name,
                    ku: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label>{t("form.sort", "Sort")}</label>
            <input
              type="number"
              value={formData.sort || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sort: parseInt(e.target.value) || 0,
                })
              }
              min="0"
            />
          </div>
          <div className="form-group">
            <label>{t("form.active_status", "Active Status")}</label>
            <select
              value={formData.isActive}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isActive: e.target.value === "true",
                })
              }
            >
              <option value={true}>{t("status.active", "Active")}</option>
              <option value={false}>{t("status.inactive", "Inactive")}</option>
            </select>
          </div>

          {/* Branches Management */}
          <div className="form-group">
            <label>{t("form.branches", "Branches")}</label>
            <div className="branches-section">
              {(formData.branches || []).map((branch, index) => (
                <div key={index} className="branch-item">
                  <div className="branch-fields">
                    <div className="form-group">
                      <label>
                        {t("form.branch_name_english", "Branch Name - English")}
                      </label>
                      <input
                        type="text"
                        value={branch.name?.en || ""}
                        onChange={(e) => {
                          const newBranches = [...(formData.branches || [])];
                          newBranches[index] = {
                            ...newBranches[index],
                            name: {
                              ...newBranches[index].name,
                              en: e.target.value,
                            },
                          };
                          setFormData({ ...formData, branches: newBranches });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        {t("form.branch_name_arabic", "Branch Name - Arabic")}
                      </label>
                      <input
                        type="text"
                        value={branch.name?.ar || ""}
                        onChange={(e) => {
                          const newBranches = [...(formData.branches || [])];
                          newBranches[index] = {
                            ...newBranches[index],
                            name: {
                              ...newBranches[index].name,
                              ar: e.target.value,
                            },
                          };
                          setFormData({ ...formData, branches: newBranches });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        {t("form.branch_name_kurdish", "Branch Name - Kurdish")}
                      </label>
                      <input
                        type="text"
                        value={branch.name?.ku || ""}
                        onChange={(e) => {
                          const newBranches = [...(formData.branches || [])];
                          newBranches[index] = {
                            ...newBranches[index],
                            name: {
                              ...newBranches[index].name,
                              ku: e.target.value,
                            },
                          };
                          setFormData({ ...formData, branches: newBranches });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t("form.description", "Description")}</label>
                      <input
                        type="text"
                        value={branch.description || ""}
                        onChange={(e) => {
                          const newBranches = [...(formData.branches || [])];
                          newBranches[index] = {
                            ...newBranches[index],
                            description: e.target.value,
                          };
                          setFormData({ ...formData, branches: newBranches });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      const newBranches = (formData.branches || []).filter(
                        (_, i) => i !== index
                      );
                      setFormData({ ...formData, branches: newBranches });
                    }}
                  >
                    {t("btn.remove_branch", "Remove Branch")}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const newBranch = {
                    name: { en: "", ar: "", ku: "" },
                    description: "",
                    isActive: true,
                  };
                  setFormData({
                    ...formData,
                    branches: [...(formData.branches || []), newBranch],
                  });
                }}
              >
                {t("btn.add_branch", "Add Branch")}
              </button>
            </div>
          </div>
        </>
      ),
      subject: (
        <>
          <div className="form-group">
            <label>{t("form.title_english", "Title - English")}</label>
            <input
              type="text"
              value={formData.title?.en || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: {
                    ...formData.title,
                    en: e.target.value,
                  },
                })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>{t("form.title_arabic", "Title - Arabic")}</label>
            <input
              type="text"
              value={formData.title?.ar || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: {
                    ...formData.title,
                    ar: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label>{t("form.title_kurdish", "Title - Kurdish")}</label>
            <input
              type="text"
              value={formData.title?.ku || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: {
                    ...formData.title,
                    ku: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t("form.order", "Order")}</label>
              <input
                type="number"
                value={formData.order || 1}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) })
                }
                required
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t("form.description", "Description")}</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>{t("form.content", "Content")}</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows="5"
            />
          </div>
          <div className="form-group">
            <label>{t("form.class", "Class")}</label>
            <select
              value={formData.class || ""}
              onChange={(e) =>
                setFormData({ ...formData, class: e.target.value })
              }
              required
            >
              <option value="">{t("form.select_class", "Select Class")}</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </>
      ),
      season: (
        <>
          <div className="form-group">
            <label>{t("form.name_english", "Name - English")}</label>
            <input
              type="text"
              value={formData.name?.en || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: {
                    ...formData.name,
                    en: e.target.value,
                  },
                })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>{t("form.name_arabic", "Name - Arabic")}</label>
            <input
              type="text"
              value={formData.name?.ar || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: {
                    ...formData.name,
                    ar: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label>{t("form.name_kurdish", "Name - Kurdish")}</label>
            <input
              type="text"
              value={formData.name?.ku || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: {
                    ...formData.name,
                    ku: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t("form.order", "Order")}</label>
              <input
                type="number"
                value={formData.order || 1}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) })
                }
                required
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t("form.description", "Description")}</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
            />
          </div>
        </>
      ),
      chapter: (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>{t("form.title", "Title")}</label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>{t("form.order", "Order")}</label>
              <input
                type="number"
                value={formData.order || 1}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) })
                }
                required
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t("form.description", "Description")}</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t("form.subject", "Subject")}</label>
              {selectedClass && (
                <small
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  {t("helper.showing_subjects_for", "Showing subjects for")}{" "}
                  {getClassName(selectedClass)}
                </small>
              )}
              <select
                value={formData.subject || ""}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              >
                <option value="">
                  {t("form.select_subject", "Select Subject")}
                </option>
                {subjects
                  .filter(
                    (subject) =>
                      selectedClass &&
                      subject.class &&
                      subject.class._id === selectedClass._id
                  )
                  .map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {getSubjectTitle(subject)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t("form.season", "Season")}</label>
              <select
                value={formData.season || ""}
                onChange={(e) =>
                  setFormData({ ...formData, season: e.target.value })
                }
                required
              >
                <option value="">
                  {t("form.select_season", "Select Season")}
                </option>
                {seasons.map((season) => (
                  <option key={season._id} value={season.name}>
                    {getSeasonName(season, season.name || "")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      ),
      part: (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>{t("form.title", "Title")}</label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>{t("form.order", "Order")}</label>
              <input
                type="number"
                value={formData.order || 1}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) })
                }
                required
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t("form.description", "Description")}</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>{t("form.content", "Content")} *</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows="5"
              placeholder={t(
                "form.content_placeholder",
                "Enter the main content of this part..."
              )}
            />
          </div>
          <div className="form-group">
            <label>{t("form.chapter", "Chapter")}</label>
            {selectedClass && selectedSubject && (
              <small
                style={{
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                {t("helper.showing_chapters_for", "Showing chapters for")}{" "}
                {getClassName(selectedClass)} -{" "}
                {getSubjectTitle(selectedSubject)}
              </small>
            )}
            <select
              value={formData.chapter || ""}
              onChange={(e) => {
                console.log("Chapter selection changed to:", e.target.value);
                setFormData({ ...formData, chapter: e.target.value });
              }}
              required
            >
              <option value="">
                {t("form.select_chapter", "Select Chapter")}
              </option>
              {chapters
                .filter((chapter) => {
                  // If we have selectedClass and selectedSubject, filter by them
                  if (selectedClass && selectedSubject) {
                    return (
                      chapter.subject &&
                      chapter.subject._id === selectedSubject._id
                    );
                  }
                  // If we have selectedChapter, show all chapters (for editing)
                  if (selectedChapter) {
                    return true;
                  }
                  // Otherwise, show all chapters
                  return true;
                })
                .map((chapter) => (
                  <option key={chapter._id} value={chapter._id}>
                    {getChapterTitle(chapter)}
                  </option>
                ))}
            </select>
          </div>
        </>
      ),
    };

    return commonFields[modalType] || null;
  };

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

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>
            <BookOpen
              size={32}
              style={{ marginRight: "12px", verticalAlign: "middle" }}
            />
            {t("programs.title", "Programs")}
          </h1>
          <p>
            {t(
              "programs.subtitle",
              "Explore our educational programs organized by classes and subjects"
            )}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-text">{getBreadcrumb()}</span>
          <div className="breadcrumb-actions">
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => openModal(getCurrentViewType())}
              >
                <Plus size={16} />
                {t(
                  `btn.add_${getCurrentViewType()}`,
                  `Add ${getCurrentViewType()}`
                )}
              </button>
            )}
            {currentView !== "classes" && (
              <button className="btn btn-secondary" onClick={handleBack}>
                <ChevronLeft size={16} />
                {t("btn.back", "Back")}
              </button>
            )}
          </div>
        </div>

        {/* Classes View */}
        {currentView === "classes" && !isTeacher && (
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {t("programs.available_classes", "Available Classes")}
              </h2>
              {canManageClasses && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentView("seasons-management")}
                    title={t("btn.manage_seasons", "Manage Seasons")}
                  >
                    <Calendar size={16} />
                    {t("btn.manage_seasons", "Manage Seasons")}
                  </button>
                </div>
              )}
            </div>

            <div className="classes-grid">
              {classes
                .sort((a, b) => (a.sort || 0) - (b.sort || 0))
                .map((classData) => {
                  const classSubjects = getSubjectsByClass(classData._id);
                  const uniqueSubjects = [
                    ...new Set(classSubjects.map((s) => s.title)),
                  ];

                  return (
                    <div
                      key={classData._id}
                      className={`class-card ${
                        !classData.isActive ? "inactive" : ""
                      }`}
                      onClick={() => handleClassClick(classData)}
                    >
                      <div className="class-header">
                        <GraduationCap size={32} color="#3b82f6" />
                        <h3>{getClassName(classData)}</h3>
                        {canManageClasses && (
                          <div className="admin-controls">
                            <button
                              className="control-btn status"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusToggle(classData, "class");
                              }}
                              title={
                                classData.isActive
                                  ? t("btn.deactivate", "Deactivate")
                                  : t("btn.activate", "Activate")
                              }
                            >
                              {classData.isActive ? (
                                <Eye size={16} />
                              ) : (
                                <EyeOff size={16} />
                              )}
                            </button>
                            <button
                              className="control-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal("class", classData);
                              }}
                              title={t(
                                `btn.edit_${getCurrentViewType()}`,
                                `Edit ${getCurrentViewType()}`
                              )}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="control-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(classData, "class");
                              }}
                              title={t(
                                `btn.delete_${getCurrentViewType()}`,
                                `Delete ${getCurrentViewType()}`
                              )}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="class-info">
                        <div className="info-item">
                          <BookOpen size={16} />
                          <span>
                            {uniqueSubjects.length}{" "}
                            {t("programs.subjects_count", "Subjects")}
                          </span>
                        </div>
                        <div className="info-item">
                          <FileText size={16} />
                          <span>
                            {classSubjects.length}{" "}
                            {t("programs.total_parts", "Total Parts")}
                          </span>
                        </div>
                        {classData.branches &&
                          classData.branches.length > 0 && (
                            <div className="info-item">
                              <Users size={16} />
                              <span>
                                {classData.branches.length}{" "}
                                {t("programs.branches_count", "Branches")}
                              </span>
                            </div>
                          )}
                      </div>

                      <div className="class-actions">
                        <span className="view-text">
                          {t("programs.view_subjects", "View Subjects")}
                        </span>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Subjects View */}
        {currentView === "subjects" && selectedClass && (
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                gap: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {t("programs.subjects_in", "Subjects in")}{" "}
                {getClassName(selectedClass)}
              </h2>
              {isTeacher && teacherClasses.length > 1 && (
                <div className="teacher-class-selector">
                  <label htmlFor="teacher-class-select">
                    {t("programs.teacher.chooseClass", "Choose Class")}:
                  </label>
                  <select
                    id="teacher-class-select"
                    value={normalizeId(selectedClass?._id) || ""}
                    onChange={(e) => {
                      const nextClass = teacherClasses.find(
                        (cls) => normalizeId(cls._id) === e.target.value
                      );
                      setSelectedClass(nextClass || null);
                      setSelectedSubject(null);
                      setSelectedSeason(null);
                      setSelectedChapter(null);
                    }}
                  >
                    {teacherClasses.map((cls) => (
                      <option key={cls._id} value={normalizeId(cls._id)}>
                        {getClassName(cls)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="subjects-grid">
              {getSubjectsByClass(selectedClass._id)
                .reduce((acc, subject) => {
                  const subjectKey = getSubjectTitle(subject);
                  const exists = acc.some(
                    (existing) => getSubjectTitle(existing) === subjectKey
                  );
                  if (!exists) {
                    acc.push(subject);
                  }
                  return acc;
                }, [])
                .map((subject) => {
                  const subjectKey = getSubjectTitle(subject);
                  const subjectParts = getSubjectsByClass(
                    selectedClass._id
                  ).filter((s) => getSubjectTitle(s) === subjectKey);

                  return (
                    <div
                      key={subject._id}
                      className="subject-card"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <div className="subject-header">
                        <BookOpen size={24} color="#10b981" />
                        <h3>{getSubjectTitle(subject)}</h3>
                        {canManageSubjects && (
                          <div className="card-controls">
                            <button
                              className="control-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal("subject", subject);
                              }}
                              title={t(
                                `btn.edit_${getCurrentViewType()}`,
                                `Edit ${getCurrentViewType}`
                              )}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="control-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(subject, "subject");
                              }}
                              title={t(
                                `btn.delete_${getCurrentViewType()}`,
                                `Delete ${getCurrentViewType()}`
                              )}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="subject-info">
                        <div className="info-item">
                          <FileText size={16} />
                          <span>
                            {subjectParts.length}{" "}
                            {t("programs.parts_count", "Parts")}
                          </span>
                        </div>
                        {/* Teacher-specific info can go here */}
                      </div>

                      <div className="subject-actions">
                        <span className="view-text">
                          {t("programs.view_chapters", "View Chapters")}
                        </span>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {!selectedClass && currentView === "subjects" && (
          <div className="placeholder">
            <BookOpen size={48} />
            <h3>{t("programs.select_class", "Select a class first")}</h3>
            <p>
              {t(
                "programs.select_class_desc",
                "Choose a class to view its subjects."
              )}
            </p>
            {!isTeacher && (
              <button
                onClick={() => setCurrentView("classes")}
                className="btn btn-primary"
              >
                <ChevronLeft size={16} />
                {t("programs.back_to_classes", "Back to Classes")}
              </button>
            )}
            {isTeacher && !teacherClasses.length && (
              <p style={{ marginTop: "12px", color: "#ef4444" }}>
                {t(
                  "programs.teacher.noAssignedClasses",
                  "No classes assigned. Please contact an administrator."
                )}
              </p>
            )}
          </div>
        )}

        {/* Chapters by Season View */}
        {currentView === "chapters-by-season" && selectedSubject && (
          <section>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "2rem",
                fontWeight: "600",
              }}
            >
              {t("programs.chapters_for", "Chapters for")}{" "}
              {getSubjectTitle(selectedSubject)}
            </h2>

            <div className="chapters-by-season-container">
              {getSeasonsForSubject(selectedSubject).map((season) => {
                const seasonChapters = getChaptersForSeason(
                  season,
                  selectedSubject
                );

                if (seasonChapters.length === 0) return null;

                return (
                  <div key={season._id || season.name} className="season-group">
                    <div className="season-group-header">
                      <Calendar size={24} color="#f59e0b" />
                      <h3>{getSeasonName(season, season.name || "")}</h3>
                      <span className="chapter-count">
                        {seasonChapters.length}{" "}
                        {seasonChapters.length !== 1
                          ? t("programs.chapters_count", "Chapters")
                          : t("programs.chapter_count", "Chapter")}
                      </span>
                    </div>

                    <div className="season-description">
                      <p>
                        {t("programs.chapters_in", "Chapters in")}{" "}
                        {getSeasonName(season, season.name || "")}
                      </p>
                    </div>

                    <div className="chapters-grid">
                      {seasonChapters.map((chapter) => {
                        const chapterParts = parts.filter(
                          (part) =>
                            part.chapter && part.chapter._id === chapter._id
                        );
                        const chapterTrainingQuizzes = getQuizzesByChapter(
                          chapter._id
                        );

                        return (
                          <div
                            key={chapter._id}
                            className={`chapter-card ${
                              !chapter.isActive ? "inactive" : ""
                            }`}
                            onClick={() => handleChapterClick(chapter)}
                          >
                            <div className="chapter-header">
                              <FileText size={24} color="#8b5cf6" />
                              <h4>{getChapterTitle(chapter)}</h4>
                              {canManageChapters && (
                                <div className="admin-controls">
                                  <button
                                    className="control-btn status"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusToggle(chapter, "chapter");
                                    }}
                                    title={
                                      chapter.isActive
                                        ? t("btn.deactivate", "Deactivate")
                                        : t("btn.activate", "Activate")
                                    }
                                  >
                                    {chapter.isActive ? (
                                      <Eye size={16} />
                                    ) : (
                                      <EyeOff size={16} />
                                    )}
                                  </button>
                                  <button
                                    className="control-btn edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openModal("chapter", chapter);
                                    }}
                                    title={t(
                                      `btn.edit_${getCurrentViewType()}`,
                                      `Edit ${getCurrentViewType()}`
                                    )}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    className="control-btn delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(chapter, "chapter");
                                    }}
                                    title={t(
                                      `btn.delete_${getCurrentViewType()}`,
                                      `Delete ${getCurrentViewType()}`
                                    )}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="chapter-info">
                              <p className="chapter-description">
                                {getDescription(chapter)}
                              </p>
                              <div className="info-item">
                                <BookOpen size={16} />
                                <span>
                                  {chapterParts.length}{" "}
                                  {t("programs.parts_count", "Parts")}
                                </span>
                              </div>
                              <div className="info-item">
                                <ClipboardList size={16} />
                                <span>
                                  {chapterTrainingQuizzes.length}{" "}
                                  {t(
                                    "programs.training_quizzes_label",
                                    "Training Quizzes"
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="chapter-actions">
                              {(isAdmin || isTeacher) && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/chapter/${chapter._id}/quizzes`,
                                      {
                                        state: {
                                          chapterId: chapter._id,
                                          chapterTitle:
                                            getChapterTitle(chapter),
                                          subjectTitle: selectedSubject
                                            ? getSubjectTitle(selectedSubject)
                                            : "",
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <ClipboardList size={16} />
                                  {t("programs.view_quizzes", "Quizzes")}
                                </button>
                              )}
                              <div className="view-link">
                                <span className="view-text">
                                  {t("programs.view_parts", "View Parts")}
                                </span>
                                <ChevronRight size={20} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Seasons View - Keep for backward compatibility */}
        {currentView === "seasons" && selectedSubject && (
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {t("programs.seasons_for", "Seasons for")}{" "}
                {getEntityName(
                  selectedSubject,
                  typeof selectedSubject?.title === "string"
                    ? selectedSubject.title
                    : ""
                )}
              </h2>
              {isAdmin && (
                <button
                  className="add-btn"
                  onClick={() => openModal("season")}
                  title={t("btn.add_season", "Add Season")}
                >
                  <Plus size={20} />
                  {t("btn.add_season", "Add Season")}
                </button>
              )}
            </div>

            <div className="seasons-grid">
              {seasons.map((season) => {
                const seasonChapters = getChaptersForSeason(
                  season,
                  selectedSubject
                );

                return (
                  <div
                    key={season._id}
                    className="season-card"
                    onClick={() => handleSeasonClick(season)}
                  >
                    <div className="season-header">
                      <Calendar size={24} color="#f59e0b" />
                      <h3>{getSeasonName(season, season.name || "")}</h3>
                      {isAdmin && (
                        <div className="card-controls">
                          <button
                            className="control-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("season", season);
                            }}
                            title={t(
                              `btn.edit_${getCurrentViewType()}`,
                              `Edit ${getCurrentViewType()}`
                            )}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="control-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(season, "season");
                            }}
                            title={t(
                              `btn.delete_${getCurrentViewType()}`,
                              `Delete ${getCurrentViewType()}`
                            )}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="season-info">
                      <p className="season-description">
                        {getDescription(season)}
                      </p>
                      <div className="info-item">
                        <FileText size={16} />
                        <span>
                          {seasonChapters.length}{" "}
                          {t("programs.chapters_count", "Chapters")}
                        </span>
                      </div>
                    </div>

                    <div className="season-actions">
                      <span className="view-text">
                        {t("programs.view_chapters", "View Chapters")}
                      </span>
                      <ChevronRight size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Seasons Management View - Direct access to all seasons */}
        {currentView === "seasons-management" && (
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {t("programs.manage_seasons", "Manage Seasons")}
              </h2>
              {isAdmin && (
                <button
                  className="add-btn"
                  onClick={() => openModal("season")}
                  title={t("btn.add_season", "Add Season")}
                >
                  <Plus size={20} />
                  {t("btn.add_season", "Add Season")}
                </button>
              )}
            </div>

            <div className="seasons-grid">
              {seasons.map((season) => (
                <div
                  key={season._id}
                  className="season-card"
                  style={{ cursor: "default" }}
                >
                  <div className="season-header">
                    <Calendar size={24} color="#f59e0b" />
                    <h3>{getSeasonName(season, season.name || "")}</h3>
                    {isAdmin && (
                      <div className="card-controls">
                        <button
                          className="control-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("season", season);
                          }}
                          title={t("btn.edit_season", "Edit Season")}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="control-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(season, "season");
                          }}
                          title={t("btn.delete_season", "Delete Season")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="season-info">
                    <p className="season-description">
                      {getDescription(season)}
                    </p>
                    <div className="info-item">
                      <span>
                        {t("form.order_label", "Order")}: {season.order}
                      </span>
                    </div>
                    <div className="info-item">
                      <span>
                        {t("form.status_label", "Status")}:{" "}
                        {season.isActive
                          ? t("status.active", "Active")
                          : t("status.inactive", "Inactive")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chapters View */}
        {currentView === "chapters" && selectedSeason && (
          <section>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "2rem",
                fontWeight: "600",
              }}
            >
              {t("programs.chapters_in", "Chapters in")}{" "}
              {getSeasonName(selectedSeason, selectedSeason.name || "")}
            </h2>

            <div className="chapters-grid">
              {getChaptersForSeason(selectedSeason, selectedSubject).map(
                (chapter) => {
                  const chapterSubjects = filteredSubjects.filter(
                    (subject) =>
                      subject.chapter && subject.chapter._id === chapter._id
                  );
                  const chapterTrainingQuizzes = getQuizzesByChapter(
                    chapter._id
                  );

                  return (
                    <div
                      key={chapter._id}
                      className={`chapter-card ${
                        !chapter.isActive ? "inactive" : ""
                      }`}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      <div className="chapter-header">
                        <FileText size={24} color="#8b5cf6" />
                        <h3>{chapter.title}</h3>
                        {canManageChapters && (
                          <div className="admin-controls">
                            <button
                              className="control-btn status"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusToggle(chapter, "chapter");
                              }}
                              title={
                                chapter.isActive
                                  ? t("btn.deactivate", "Deactivate")
                                  : t("btn.activate", "Activate")
                              }
                            >
                              {chapter.isActive ? (
                                <Eye size={16} />
                              ) : (
                                <EyeOff size={16} />
                              )}
                            </button>
                            <button
                              className="control-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal("chapter", chapter);
                              }}
                              title={t(
                                `btn.edit_${getCurrentViewType()}`,
                                `Edit ${getCurrentViewType()}`
                              )}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="control-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chapter, "chapter");
                              }}
                              title={t(
                                `btn.delete_${getCurrentViewType()}`,
                                `Delete ${getCurrentViewType()}`
                              )}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="chapter-info">
                        <p className="chapter-description">
                          {getDescription(chapter)}
                        </p>
                        <div className="info-item">
                          <BookOpen size={16} />
                          <span>
                            {chapterSubjects.length}{" "}
                            {t("programs.parts_count", "Parts")}
                          </span>
                        </div>
                        <div className="info-item">
                          <ClipboardList size={16} />
                          <span>
                            {chapterTrainingQuizzes.length}{" "}
                            {t(
                              "programs.training_quizzes_label",
                              "Training Quizzes"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="chapter-actions">
                        {(isAdmin || isTeacher) && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chapter/${chapter._id}/quizzes`, {
                                state: {
                                  chapterId: chapter._id,
                                  chapterTitle: getChapterTitle(chapter),
                                  subjectTitle: selectedSubject
                                    ? getSubjectTitle(selectedSubject)
                                    : "",
                                },
                              });
                            }}
                          >
                            <ClipboardList size={16} />
                            {t("programs.view_quizzes", "Quizzes")}
                          </button>
                        )}
                        <div className="view-link">
                          <span className="view-text">
                            {t("programs.view_parts", "View Parts")}
                          </span>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* Parts View */}
        {currentView === "parts" && selectedChapter && (
          <section>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "2rem",
                fontWeight: "600",
              }}
            >
              {t("programs.parts_in", "Parts in")}{" "}
              {getChapterTitle(selectedChapter)}
            </h2>

            <div className="parts-grid">
              {getPartsByChapter(selectedChapter._id).map((part) => (
                <Link
                  to={`/part/${part._id}`}
                  key={part._id}
                  className={`part-card ${!part.isActive ? "inactive" : ""}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div className="part-header">
                    <FileText size={24} color="#ef4444" />
                    <h3 style={{ color: "#1f2937" }}>{getPartTitle(part)}</h3>
                    {canManageParts && (
                      <div className="admin-controls">
                        <button
                          type="button"
                          className="control-btn status"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStatusToggle(part, "part");
                          }}
                          title={
                            part.isActive
                              ? t("btn.deactivate", "Deactivate")
                              : t("btn.activate", "Activate")
                          }
                        >
                          {part.isActive ? (
                            <Eye size={16} />
                          ) : (
                            <EyeOff size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="control-btn edit"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openModal("part", part);
                          }}
                          title={t("btn.edit_part", "Edit Part")}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="control-btn delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(part, "part");
                          }}
                          title={t("btn.delete_part", "Delete Part")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="part-info">
                    <p className="part-description">{getDescription(part)}</p>
                  </div>

                  {part.learningObjectives &&
                    part.learningObjectives.length > 0 && (
                      <div className="part-objectives">
                        <h4>
                          {t(
                            "form.learning_objectives",
                            "Learning Objectives:"
                          )}
                        </h4>
                        <ul>
                          {part.learningObjectives
                            .slice(0, 3)
                            .map((objective, index) => (
                              <li key={index}>{objective}</li>
                            ))}
                          {part.learningObjectives.length > 3 && (
                            <li>
                              ...{t("form.and_more", "and")}{" "}
                              {part.learningObjectives.length - 3}{" "}
                              {t("form.more", "more")}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {editingItem
                  ? t(`modal.edit_${modalType}`, `Edit ${modalType}`)
                  : t(`modal.add_${modalType}`, `Add ${modalType}`)}
              </h2>
              <button onClick={closeModal} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {renderFormFields()}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cancel-btn"
                >
                  {t("btn.cancel", "Cancel")}
                </button>
                <button type="submit" className="save-btn">
                  {editingItem
                    ? t("btn.update", "Update")
                    : t("btn.create", "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .breadcrumb {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .breadcrumb-text {
          font-weight: 500;
          color: #374151;
        }

        .breadcrumb-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .classes-grid,
        .subjects-grid,
        .seasons-grid,
        .chapters-grid,
        .parts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .chapters-by-season-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .season-group {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
        }

        .season-group-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }

        .season-group-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
        }

        .chapter-count {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .season-description {
          margin-bottom: 20px;
          padding: 12px 16px;
          background: #f1f5f9;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .season-description p {
          margin: 0;
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .chapters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .class-card,
        .subject-card,
        .season-card,
        .chapter-card,
        .part-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .class-card:hover,
        .subject-card:hover,
        .season-card:hover,
        .chapter-card:hover,
        .part-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .inactive {
          opacity: 0.6;
          background: #f9fafb;
        }

        .class-header,
        .subject-header,
        .season-header,
        .chapter-header,
        .part-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
        }

        .class-header h3,
        .subject-header h3,
        .season-header h3,
        .chapter-header h3,
        .part-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
        }

        .chapter-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
        }

        .admin-controls {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .control-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .control-btn.status {
          background: #e6fffa;
          color: #00b894;
        }

        .control-btn.edit {
          background: #fff5e6;
          color: #f6ad55;
        }

        .control-btn.delete {
          background: #fed7d7;
          color: #e53e3e;
        }

        .control-btn:hover {
          transform: scale(1.05);
        }

        .control-btn.status:hover {
          background: #00b894;
          color: white;
        }

        .control-btn.edit:hover {
          background: #f6ad55;
          color: white;
        }

        .control-btn.delete:hover {
          background: #e53e3e;
          color: white;
        }

        .class-info,
        .subject-info,
        .season-info,
        .chapter-info,
        .part-info {
          margin-bottom: 16px;
        }

        .part-description {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .part-objectives {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .part-objectives h4 {
          margin: 0 0 8px 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .part-objectives ul {
          margin: 0;
          padding-left: 16px;
        }

        .part-objectives li {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 4px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 8px;
        }

        .season-description,
        .chapter-description {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .class-actions,
        .subject-actions,
        .season-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .chapter-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .chapter-actions .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .view-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .view-text {
          color: #3b82f6;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .chapter-parts {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .chapter-parts h4 {
          margin: 0 0 12px 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .parts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .part-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .part-title {
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          color: #2d3748;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #a0aec0;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: #f7fafc;
          color: #4a5568;
        }

        .modal-form {
          padding: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          color: #2d3748;
          background: white;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-btn,
        .save-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .cancel-btn {
          background: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }

        .cancel-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .save-btn {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .save-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Programs;
