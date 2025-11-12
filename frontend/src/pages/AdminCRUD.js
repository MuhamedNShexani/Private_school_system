import React, { useState, useEffect } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { useToast } from "../contexts/ToastContext";
import {
  studentsAPI,
  teachersAPI,
  subjectsAPI,
  classesAPI,
  seasonsAPI,
} from "../services/api";
import {
  Users,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Upload,
  Image,
  Star,
} from "lucide-react";
import DeleteConfirmation from "../components/DeleteConfirmation";
import "./AdminCRUD.css";

const AdminCRUD = () => {
  const { t, currentLanguage } = useTranslation();
  const { success, error: showError } = useToast();

  // Helper function to get localized text
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
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    name: "",
    email: "",
    phone: "",
    role: "Student",
    password: "",
    username: "",
    parentsNumber: "",
    gender: "",
    subjects: [],
    classes: [],
    branches: [],
    experience: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [ratingFilters, setRatingFilters] = useState({
    studentName: "",
    classId: "",
    branchId: "",
    subjectId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [ratingCurrentPage, setRatingCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    itemId: null,
    itemType: null,
    itemName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique classes, branches, and subjects from ratings
  const getUniqueClasses = () => {
    const classMap = new Map();
    ratings.forEach((rating) => {
      if (rating.studentClass) {
        const classObj =
          typeof rating.studentClass === "object"
            ? rating.studentClass
            : { _id: rating.studentClass, name: rating.studentClass };
        if (classObj._id) {
          const localizedName =
            getLocalizedText(classObj.nameMultilingual || classObj.name) ||
            classObj.name;
          classMap.set(classObj._id.toString(), {
            ...classObj,
            displayName: localizedName,
          });
        }
      }
    });
    return Array.from(classMap.values());
  };

  const getUniqueBranches = (selectedClassId) => {
    const branchMap = new Map();
    ratings.forEach((rating) => {
      // Filter by class if selected
      if (selectedClassId) {
        const classId =
          typeof rating.studentClass === "object"
            ? rating.studentClass?._id?.toString()
            : rating.studentClass?.toString();
        if (classId !== selectedClassId) return;
      }

      if (rating.studentBranch) {
        const branchObj =
          typeof rating.studentBranch === "object"
            ? rating.studentBranch
            : { _id: rating.studentBranch, name: rating.studentBranch };
        if (branchObj._id) {
          // Branch name is stored as {en, ar, ku} object, not nameMultilingual
          let localizedName;

          // Check if name is an object with language keys
          if (typeof branchObj.name === "object" && branchObj.name !== null) {
            localizedName =
              getLocalizedText(branchObj.name) ||
              branchObj.name?.en ||
              branchObj.name?.ar ||
              branchObj.name?.ku ||
              branchObj._id;
          } else if (typeof branchObj.name === "string") {
            // If name is already a string, use it
            localizedName = branchObj.name;
          } else {
            localizedName = branchObj._id;
          }

          branchMap.set(branchObj._id.toString(), {
            ...branchObj,
            displayName: localizedName,
          });
        }
      }
    });
    return Array.from(branchMap.values());
  };

  const getUniqueSubjects = (selectedClassId, selectedBranchId) => {
    const subjectMap = new Map();
    ratings.forEach((rating) => {
      // Filter by class if selected
      if (selectedClassId) {
        const classId =
          typeof rating.studentClass === "object"
            ? rating.studentClass?._id?.toString()
            : rating.studentClass?.toString();
        if (classId !== selectedClassId) return;
      }

      // Filter by branch if selected
      if (selectedBranchId) {
        const branchId =
          typeof rating.studentBranch === "object"
            ? rating.studentBranch?._id?.toString()
            : rating.studentBranch?.toString();
        if (branchId !== selectedBranchId) return;
      }

      if (rating.subjectName) {
        subjectMap.set(rating.subjectName, rating.subjectName);
      }
    });
    return Array.from(subjectMap.values()).sort();
  };
  const [ratingFormData, setRatingFormData] = useState({
    date: "",
    season: "",
    subjectId: "",
    rating: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "ratings") {
      fetchRatings();
    }
  }, [activeTab]);

  // Helper function to extract data from different response formats
  const extractData = (response) => {
    if (response?.data?.data) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        studentsRes,
        teachersRes,
        subjectsRes,
        classesRes,
        ratingsRes,
        seasonsRes,
      ] = await Promise.all([
        studentsAPI.getAll(),
        teachersAPI.getAll(),
        subjectsAPI.getAll(),
        classesAPI.getAll(),
        studentsAPI.getAllRatings(),
        seasonsAPI.getAll(),
      ]);

      setStudents(extractData(studentsRes));
      setTeachers(extractData(teachersRes));
      setSubjects(extractData(subjectsRes));
      setClasses(extractData(classesRes));

      // Process ratings data
      try {
        const ratingsData = ratingsRes.data?.data?.ratings || [];
        const subjectsData = extractData(subjectsRes);
        const seasonsData = extractData(seasonsRes);

        // Store seasons for later use
        setSeasons(seasonsData);

        // Backend already provides studentName, just add subject and season localization
        const enrichedRatings = ratingsData.map((rating) => {
          const subject = subjectsData.find(
            (s) =>
              s._id === rating.subjectId ||
              s._id?.toString() === rating.subjectId?.toString()
          );
          const subjectName =
            getLocalizedText(subject?.titleMultilingual || subject?.title) ||
            subject?.title ||
            subject?.name ||
            rating.subjectId;

          // Find season name by ID or use the stored value
          const season = seasonsData.find(
            (s) =>
              s._id === rating.season ||
              s._id?.toString() === rating.season?.toString()
          );
          const seasonName =
            getLocalizedText(season?.nameMultilingual || season?.name) ||
            season?.name ||
            rating.season;

          // Extract class and branch from student info if available
          const studentClass =
            rating.studentClass ||
            (typeof rating.student === "object" ? rating.student?.class : null);
          const studentBranch =
            rating.studentBranch ||
            (typeof rating.student === "object"
              ? rating.student?.branchID
              : null);

          return {
            ...rating,
            subjectName: subjectName,
            seasonName: seasonName,
            studentClass: studentClass,
            studentBranch: studentBranch,
            // studentName already comes from backend
          };
        });

        setRatings(enrichedRatings);
      } catch (enrichError) {
        console.error("Error enriching ratings:", enrichError);
        setRatings([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(t("admin.msg.failedLoadData", "Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const [ratingsRes, studentsRes, subjectsRes, seasonsRes] =
        await Promise.all([
          studentsAPI.getAllRatings(),
          studentsAPI.getAll(),
          subjectsAPI.getAll(),
          seasonsAPI.getAll(),
        ]);

      try {
        const ratingsData = ratingsRes.data?.data?.ratings || [];
        const subjectsData = extractData(subjectsRes);
        const seasonsData = extractData(seasonsRes);

        // Store seasons for later use
        setSeasons(seasonsData);

        // Backend already provides studentName, just add subject and season localization
        const enrichedRatings = ratingsData.map((rating) => {
          const subject = subjectsData.find(
            (s) =>
              s._id === rating.subjectId ||
              s._id?.toString() === rating.subjectId?.toString()
          );
          const subjectName =
            getLocalizedText(subject?.titleMultilingual || subject?.title) ||
            subject?.title ||
            subject?.name ||
            rating.subjectId;

          // Find season name by ID or use the stored value
          const season = seasonsData.find(
            (s) =>
              s._id === rating.season ||
              s._id?.toString() === rating.season?.toString()
          );
          const seasonName =
            getLocalizedText(season?.nameMultilingual || season?.name) ||
            season?.name ||
            rating.season;

          // Extract class and branch from student info if available
          const studentClass =
            rating.studentClass ||
            (typeof rating.student === "object" ? rating.student?.class : null);
          const studentBranch =
            rating.studentBranch ||
            (typeof rating.student === "object"
              ? rating.student?.branchID
              : null);

          return {
            ...rating,
            subjectName: subjectName,
            seasonName: seasonName,
            studentClass: studentClass,
            studentBranch: studentBranch,
            // studentName already comes from backend
          };
        });

        setRatings(enrichedRatings);
        setError(null);
      } catch (enrichError) {
        console.error("Error enriching ratings:", enrichError);
        setError("Error processing ratings");
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
      setError("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  // Get paginated ratings with filters
  const getPaginatedRatings = () => {
    const filteredRatings = getFilteredRatings();
    const startIndex = (ratingCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      items: filteredRatings.slice(startIndex, endIndex),
      total: filteredRatings.length,
      totalPages: Math.ceil(filteredRatings.length / ITEMS_PER_PAGE),
      currentPage: ratingCurrentPage,
    };
  };

  // Filter ratings based on filter criteria
  const getFilteredRatings = () => {
    return ratings.filter((rating) => {
      // Filter by student name
      if (
        ratingFilters.studentName &&
        !rating.studentName
          ?.toLowerCase()
          .includes(ratingFilters.studentName.toLowerCase())
      ) {
        return false;
      }

      // Filter by class ID
      if (ratingFilters.classId) {
        const classId =
          typeof rating.studentClass === "object"
            ? rating.studentClass?._id?.toString()
            : rating.studentClass?.toString();
        if (classId !== ratingFilters.classId) {
          return false;
        }
      }

      // Filter by branch ID
      if (ratingFilters.branchId) {
        const branchId =
          typeof rating.studentBranch === "object"
            ? rating.studentBranch?._id?.toString()
            : rating.studentBranch?.toString();
        if (branchId !== ratingFilters.branchId) {
          return false;
        }
      }

      // Filter by subject name
      if (
        ratingFilters.subjectId &&
        !rating.subjectName
          ?.toLowerCase()
          .includes(ratingFilters.subjectId.toLowerCase())
      ) {
        return false;
      }

      // Filter by date range
      if (ratingFilters.dateFrom) {
        const ratingDate = new Date(rating.date).getTime();
        const filterDate = new Date(ratingFilters.dateFrom).getTime();
        if (ratingDate < filterDate) return false;
      }

      if (ratingFilters.dateTo) {
        const ratingDate = new Date(rating.date).getTime();
        const filterDate = new Date(ratingFilters.dateTo).getTime();
        if (ratingDate > filterDate) return false;
      }

      return true;
    });
  };

  const handleDeleteRating = async (ratingId) => {
    openDeleteConfirmation(ratingId, "rating", "Rating");
  };

  const handleEditRating = (rating) => {
    setEditingRating(rating);
    setRatingFormData({
      date: rating.date ? rating.date.split("T")[0] : "",
      season: rating.season,
      subjectId: rating.subjectId,
      rating: rating.rating,
    });
    setShowModal(true);
  };

  const handleSaveRating = async () => {
    if (
      !ratingFormData.date ||
      !ratingFormData.season ||
      !ratingFormData.subjectId ||
      !ratingFormData.rating
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      setRefreshing(true);
      await studentsAPI.updateRating(editingRating._id, {
        date: ratingFormData.date,
        season: ratingFormData.season,
        subjectId: ratingFormData.subjectId,
        rating: ratingFormData.rating,
      });

      // Update local state
      setRatings(
        ratings.map((r) =>
          r._id === editingRating._id ? { ...r, ...ratingFormData } : r
        )
      );

      alert("Rating updated successfully!");
      setShowModal(false);
      setEditingRating(null);
    } catch (error) {
      console.error("Error updating rating:", error);
      alert("Failed to update rating");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setImagePreview(null);
    setFormData({
      fullName: "",
      name: "",
      email: "",
      phone: "",
      role: activeTab === "students" ? "Student" : "Teacher",
      password: "",
      username: "",
      parentsNumber: "",
      gender: "",
      subjects: [],
      classes: [],
      branches: [],
      experience: "",
      image: null,
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    console.log("Editing item:", item);

    // Set image preview if it exists (backend returns 'photo' field)
    if (item.photo) {
      setImagePreview(item.photo);
    } else {
      setImagePreview(null);
    }

    if (activeTab === "students") {
      // Handle student data
      const formDataToSet = {
        fullName: item.fullName || item.name || "",
        name: item.fullName || item.name || "",
        email: item.email || "",
        phone: item.phone || "",
        role: "Student",
        password: "",
        username: item.username || "",
        parentsNumber: item.parentsNumber || "",
        gender: item.gender || "",
        subjects: [],
        classes: item.class ? [item.class._id || item.class] : [],
        branches: item.branchID ? [item.branchID] : [],
        experience: "",
        image: null,
      };

      console.log("Setting student form data:", formDataToSet);
      setFormData(formDataToSet);
    } else {
      // Handle teacher data
      // Handle subjects - they might be objects with _id or just IDs
      const subjects =
        item.subjects?.map((subject) => {
          if (typeof subject === "object" && subject._id) {
            return subject._id;
          }
          return subject;
        }) || [];

      // Handle classes - they might be objects with _id or just IDs
      const classes =
        item.classes?.map((cls) => (typeof cls === "object" ? cls._id : cls)) ||
        [];

      // Handle branches - they might be objects with _id or just IDs
      const branches =
        item.branches?.map((branch) =>
          typeof branch === "object" ? branch._id : branch
        ) || [];

      const formDataToSet = {
        firstName: "",
        lastName: "",
        name:
          item.name ||
          `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
          "",
        email: item.email || "",
        phone: item.phone || "",
        role: "Teacher",
        password: "",
        username: item.username || "",
        grade: "",
        gender: item.gender || "",
        subjects: subjects,
        classes: classes,
        branches: branches,
        experience: item.experience?.toString() || "",
        image: null,
      };

      console.log("Setting teacher form data:", formDataToSet);
      setFormData(formDataToSet);
    }

    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: file });
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const openDeleteConfirmation = (id, type, name) => {
    const itemTypeLabel = type === "student" ? "Student" : "Teacher";
    setDeleteConfirmation({
      isOpen: true,
      itemId: id,
      itemType: type,
      itemName: name,
    });
  };

  const handleConfirmDelete = async () => {
    const { itemId, itemType, itemName } = deleteConfirmation;
    setIsDeleting(true);

    try {
      if (itemType === "student") {
        await studentsAPI.delete(itemId);
        setStudents(students.filter((s) => s._id !== itemId));
        success(
          t(
            "admin.successMessages.studentDeleted",
            "Student deleted successfully!"
          )
        );
      } else if (itemType === "teacher") {
        await teachersAPI.delete(itemId);
        setTeachers(teachers.filter((t) => t._id !== itemId));
        success(
          t(
            "admin.successMessages.teacherDeleted",
            "Teacher deleted successfully!"
          )
        );
      } else if (itemType === "rating") {
        await studentsAPI.deleteRating(itemId);
        setRatings(ratings.filter((r) => r._id !== itemId));
        success(
          t(
            "admin.successMessages.ratingDeleted",
            "Rating deleted successfully!"
          )
        );
      }

      setDeleteConfirmation({
        isOpen: false,
        itemId: null,
        itemType: null,
        itemName: "",
      });

      // Refresh data to ensure consistency
      setRefreshing(true);
      await fetchData();
      setRefreshing(false);
    } catch (error) {
      console.error("Error deleting item:", error);
      showError(t("admin.msg.failedDelete", "Failed to delete item"));
      setDeleteConfirmation({
        isOpen: false,
        itemId: null,
        itemType: null,
        itemName: "",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      itemId: null,
      itemType: null,
      itemName: "",
    });
  };

  const handleDelete = async (id, type) => {
    const itemName =
      type === "student"
        ? students.find((s) => s._id === id)?.fullName || "Student"
        : teachers.find((t) => t._id === id)?.name || "Teacher";
    openDeleteConfirmation(id, type, itemName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        if (activeTab === "students") {
          // Prepare student data for API update
          let studentFormData;

          if (formData.image instanceof File) {
            // Has new image - use FormData
            studentFormData = new FormData();
            studentFormData.append("fullName", formData.fullName);
            studentFormData.append("email", formData.email);
            if (formData.phone) studentFormData.append("phone", formData.phone);
            studentFormData.append("username", formData.username);
            if (formData.parentsNumber)
              studentFormData.append("parentsNumber", formData.parentsNumber);
            if (formData.classes[0])
              studentFormData.append("class", formData.classes[0]);
            if (formData.branches[0])
              studentFormData.append("branchID", formData.branches[0]);
            studentFormData.append(
              "gender",
              formData.gender || editingItem.gender || "Other"
            );
            studentFormData.append("studentNumber", editingItem.studentNumber);
            if (formData.password)
              studentFormData.append("password", formData.password);
            studentFormData.append("image", formData.image);
          } else {
            // No new image - use regular object
            studentFormData = {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone || undefined,
              username: formData.username,
              parentsNumber: formData.parentsNumber || undefined,
              class: formData.classes[0] || undefined,
              branchID: formData.branches[0] || undefined,
              gender: formData.gender || editingItem.gender || "Other",
              studentNumber: editingItem.studentNumber,
            };
            if (formData.password) studentFormData.password = formData.password;
          }

          console.log("Updating student with data:", studentFormData);
          const response = await studentsAPI.update(
            editingItem._id,
            studentFormData
          );
          setStudents(
            students.map((s) =>
              s._id === editingItem._id ? { ...s, ...response.data } : s
            )
          );
          success(
            t(
              "admin.successMessages.studentUpdated",
              "Student updated successfully!"
            )
          );
        } else {
          // Prepare teacher data for API (all fields that Teacher model now supports)
          let teacherFormData;

          if (formData.image instanceof File) {
            // Has new image - use FormData
            teacherFormData = new FormData();
            teacherFormData.append("name", formData.name);
            teacherFormData.append("email", formData.email);
            if (formData.phone) teacherFormData.append("phone", formData.phone);
            if (formData.gender)
              teacherFormData.append("gender", formData.gender);
            if (formData.subjects?.length) {
              formData.subjects.forEach((s) =>
                teacherFormData.append("subjects", s)
              );
            }
            if (formData.classes?.length) {
              formData.classes.forEach((c) =>
                teacherFormData.append("classes", c)
              );
            }
            if (formData.branches?.length) {
              formData.branches.forEach((b) =>
                teacherFormData.append("branches", b)
              );
            }
            if (formData.username)
              teacherFormData.append("username", formData.username);
            teacherFormData.append(
              "experience",
              parseInt(formData.experience) || 0
            );
            if (formData.password && formData.password.trim() !== "") {
              teacherFormData.append("password", formData.password);
            }
            teacherFormData.append("image", formData.image);
          } else {
            // No new image - use regular object
            teacherFormData = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || undefined,
              gender: formData.gender || undefined,
              subjects: formData.subjects || [],
              classes: formData.classes || [],
              branches: formData.branches || [],
              username: formData.username || undefined,
              experience: parseInt(formData.experience) || 0,
            };

            // Only include password if it's provided (not empty)
            if (formData.password && formData.password.trim() !== "") {
              teacherFormData.password = formData.password;
            }
          }

          console.log("Updating teacher with data:", teacherFormData);
          console.log("Form data being used:", formData);
          const response = await teachersAPI.update(
            editingItem._id,
            teacherFormData
          );
          console.log("Teacher update response:", response);

          // Update local state with response data from backend
          setTeachers(
            teachers.map((t) =>
              t._id === editingItem._id
                ? {
                    ...t,
                    ...response.data, // Use the response data from backend
                  }
                : t
            )
          );
          success(
            t(
              "admin.successMessages.teacherUpdated",
              "Teacher updated successfully!"
            )
          );
        }
      } else {
        // Create new item
        if (activeTab === "students") {
          // Validate required fields for student creation
          if (
            !formData.fullName ||
            !formData.email ||
            !formData.username ||
            !formData.password
          ) {
            setError(
              "Full name, email, username, and password are required for student creation"
            );
            return;
          }

          // Prepare student data for API
          let studentFormData;

          if (formData.image instanceof File) {
            // Has image - use FormData
            studentFormData = new FormData();
            studentFormData.append("fullName", formData.fullName);
            studentFormData.append("email", formData.email);
            if (formData.phone) studentFormData.append("phone", formData.phone);
            studentFormData.append("username", formData.username);
            if (formData.parentsNumber)
              studentFormData.append("parentsNumber", formData.parentsNumber);
            if (formData.classes[0])
              studentFormData.append("class", formData.classes[0]);
            if (formData.branches[0])
              studentFormData.append("branchID", formData.branches[0]);
            studentFormData.append("gender", formData.gender || "Other");
            studentFormData.append("studentNumber", `STU${Date.now()}`);
            studentFormData.append("password", formData.password);
            studentFormData.append("image", formData.image);
          } else {
            // No image - use regular object
            studentFormData = {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone || undefined,
              username: formData.username,
              parentsNumber: formData.parentsNumber || undefined,
              class: formData.classes[0] || undefined,
              branchID: formData.branches[0] || undefined,
              gender: formData.gender || "Other",
              studentNumber: `STU${Date.now()}`,
              password: formData.password,
            };
          }

          console.log("Creating student with data:", studentFormData);
          const response = await studentsAPI.create(studentFormData);
          setStudents([...students, response.data]);
        } else {
          // Validate required fields for teacher creation
          if (
            !formData.name ||
            !formData.email ||
            !formData.username ||
            !formData.password
          ) {
            setError(
              "Name, email, username, and password are required for teacher creation"
            );
            return;
          }

          // Prepare teacher data for API (all fields that Teacher model now supports)
          let teacherFormData;

          if (formData.image instanceof File) {
            // Has image - use FormData
            teacherFormData = new FormData();
            teacherFormData.append("name", formData.name);
            teacherFormData.append("email", formData.email);
            if (formData.phone) teacherFormData.append("phone", formData.phone);
            if (formData.gender)
              teacherFormData.append("gender", formData.gender);
            if (formData.subjects?.length) {
              formData.subjects.forEach((s) =>
                teacherFormData.append("subjects", s)
              );
            }
            if (formData.classes?.length) {
              formData.classes.forEach((c) =>
                teacherFormData.append("classes", c)
              );
            }
            if (formData.branches?.length) {
              formData.branches.forEach((b) =>
                teacherFormData.append("branches", b)
              );
            }
            teacherFormData.append("username", formData.username);
            teacherFormData.append("password", formData.password);
            teacherFormData.append(
              "experience",
              parseInt(formData.experience) || 0
            );
            teacherFormData.append("image", formData.image);
          } else {
            // No image - use regular object
            teacherFormData = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || undefined,
              gender: formData.gender || undefined,
              subjects: formData.subjects || [],
              classes: formData.classes || [],
              branches: formData.branches || [],
              username: formData.username,
              password: formData.password,
              experience: parseInt(formData.experience) || 0,
            };
          }

          console.log("Creating teacher with data:", teacherFormData);
          const response = await teachersAPI.create(teacherFormData);
          console.log("Teacher create response:", response);

          // Add the new teacher to the list
          setTeachers([...teachers, response.data]);
        }
      }
      setShowModal(false);
      setImagePreview(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: activeTab === "students" ? "Student" : "Teacher",
        password: "",
        username: "",
        grade: "",
        gender: "",
        subjects: [],
        classes: [],
        branches: [],
        experience: "",
        image: null,
      });

      // Refresh data to ensure consistency
      setRefreshing(true);
      await fetchData();
      setRefreshing(false);
    } catch (error) {
      console.error("Error saving item:", error);
      setError("Failed to save item");
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper functions for multi-select
  const handleSubjectChange = (subjectId) => {
    const isSelected = formData.subjects.includes(subjectId);
    if (isSelected) {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter((id) => id !== subjectId),
      });
    } else {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subjectId],
      });
    }
  };

  const handleClassChange = (classId) => {
    const isSelected = formData.classes.includes(classId);
    if (isSelected) {
      setFormData({
        ...formData,
        classes: formData.classes.filter((id) => id !== classId),
        branches: formData.branches.filter(
          (branch) =>
            !classes
              .find((c) => c._id === classId)
              ?.branches?.some((b) => b._id === branch)
        ),
        // Clear subjects when classes change since available subjects will change
        subjects: [],
      });
    } else {
      setFormData({
        ...formData,
        classes: [...formData.classes, classId],
        // Clear subjects when adding new classes since available subjects will change
        subjects: [],
      });
    }
  };

  const handleBranchChange = (branchId) => {
    const isSelected = formData.branches.includes(branchId);
    if (isSelected) {
      setFormData({
        ...formData,
        branches: formData.branches.filter((id) => id !== branchId),
      });
    } else {
      setFormData({
        ...formData,
        branches: [...formData.branches, branchId],
      });
    }
  };

  // Get available branches based on selected classes
  const getAvailableBranches = () => {
    return classes
      .filter((c) => formData.classes.includes(c._id))
      .flatMap((c) => c.branches || []);
  };

  // Get available subjects based on selected classes
  const getAvailableSubjects = () => {
    if (formData.classes.length === 0) {
      return [];
    }

    const selectedClassIds = formData.classes;
    return subjects.filter((subject) => {
      // Check if subject belongs to any of the selected classes
      const subjectClassId = subject.class?._id || subject.class;
      return selectedClassIds.includes(subjectClassId);
    });
  };

  if (loading) {
    return (
      <div className="admin-crud-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t("admin.crud.loading", "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-crud-container">
      <div className="admin-crud-header">
        <h1>{t("admin.crud.title", "Admin Management")}</h1>
        <p>{t("admin.crud.subtitle", "Manage students and teachers")}</p>
      </div>

      <div className="admin-crud-tabs">
        <button
          className={`tab-button ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          <Users size={20} />
          <span>
            {t("admin.crud.tabStudents", "Students")} ({students.length})
          </span>
        </button>
        <button
          className={`tab-button ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          <GraduationCap size={20} />
          <span>
            {t("admin.crud.tabTeachers", "Teachers")} ({teachers.length})
          </span>
        </button>
        <button
          className={`tab-button ${activeTab === "ratings" ? "active" : ""}`}
          onClick={() => setActiveTab("ratings")}
        >
          <Star size={20} />
          <span>
            {t("admin.crud.tabRatings", "Ratings")} ({ratings.length})
          </span>
        </button>
      </div>

      <div className="admin-crud-toolbar">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("admin.crud.searchPlaceholder", "Search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="toolbar-actions">
          {refreshing && (
            <div className="refreshing-indicator">
              <div className="spinner-small"></div>
              <span>{t("admin.msg.savingData", "Saving data...")}</span>
            </div>
          )}
          {activeTab !== "ratings" && (
            <button className="create-button" onClick={handleCreate}>
              <Plus size={20} />
              <span>{t("admin.crud.addNew", "Add New")}</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={`admin-crud-content ${
          activeTab === "ratings" ? "ratings-container" : ""
        }`}
      >
        {activeTab === "ratings" ? (
          <>
            {/* Ratings Filters - Name, Class, Branch, Subject, Date */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr 0.8fr",
                gap: "12px",
                marginBottom: "0",
              }}
            >
              {/* Student Name Filter */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("form.studentName", "Student Name")}
                </label>
                <input
                  type="text"
                  placeholder={t("form.search", "Search...")}
                  value={ratingFilters.studentName}
                  onChange={(e) =>
                    setRatingFilters({
                      ...ratingFilters,
                      studentName: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Class Filter Dropdown */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("admin.form.class", "Class")}
                </label>
                <select
                  value={ratingFilters.classId}
                  onChange={(e) => {
                    setRatingFilters({
                      ...ratingFilters,
                      classId: e.target.value,
                      branchId: "", // Reset branch when class changes
                      subjectId: "", // Reset subject when class changes
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">-- All --</option>
                  {getUniqueClasses().map((classItem) => (
                    <option
                      key={classItem._id}
                      value={classItem._id?.toString()}
                    >
                      {classItem.displayName || classItem.name || classItem._id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Filter Dropdown - Linked to Class */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("admin.form.branch", "Branch")}
                </label>
                <select
                  value={ratingFilters.branchId}
                  onChange={(e) => {
                    setRatingFilters({
                      ...ratingFilters,
                      branchId: e.target.value,
                      subjectId: "", // Reset subject when branch changes
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">-- All --</option>
                  {getUniqueBranches(ratingFilters.classId).map(
                    (branchItem) => (
                      <option
                        key={branchItem._id}
                        value={branchItem._id?.toString()}
                      >
                        {branchItem.displayName ||
                          branchItem.name ||
                          branchItem._id}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Subject Filter Dropdown - Linked to Class and Branch */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("form.subject", "Subject")}
                </label>
                <select
                  value={ratingFilters.subjectId}
                  onChange={(e) =>
                    setRatingFilters({
                      ...ratingFilters,
                      subjectId: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">-- All --</option>
                  {getUniqueSubjects(
                    ratingFilters.classId,
                    ratingFilters.branchId
                  ).map((subjectName) => (
                    <option key={subjectName} value={subjectName}>
                      {subjectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date Filter */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("form.dateFrom", "From Date")}
                </label>
                <input
                  type="date"
                  value={ratingFilters.dateFrom}
                  onChange={(e) =>
                    setRatingFilters({
                      ...ratingFilters,
                      dateFrom: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* To Date Filter */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("form.dateTo", "To Date")}
                </label>
                <input
                  type="date"
                  value={ratingFilters.dateTo}
                  onChange={(e) =>
                    setRatingFilters({
                      ...ratingFilters,
                      dateTo: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Clear All Button */}
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={() => {
                    setRatingFilters({
                      studentName: "",
                      classId: "",
                      branchId: "",
                      subjectId: "",
                      dateFrom: "",
                      dateTo: "",
                    });
                    setRatingCurrentPage(1);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {t("admin.btn.clear", "Clear")}
                </button>
              </div>
            </div>

            <div className="data-table ratings-table">
              <div className="table-header">
                <div className="table-cell">
                  {t("form.studentName", "Student Name")}
                </div>
                <div className="table-cell">{t("form.subject", "Subject")}</div>
                <div className="table-cell">{t("form.season", "Season")}</div>
                <div className="table-cell">{t("form.date", "Date")}</div>
                <div className="table-cell">
                  {t("students.bulkRate", "Rating")}
                </div>
                <div className="table-cell">
                  {t("admin.table.actions", "Actions")}
                </div>
              </div>
              {(() => {
                const paginatedData = getPaginatedRatings();
                return paginatedData.total === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      gridColumn: "1/-1",
                    }}
                  >
                    <p>{t("admin.msg.noData", "No ratings found")}</p>
                  </div>
                ) : (
                  paginatedData.items.map((rating) => (
                    <div key={rating._id} className="table-row">
                      <div className="table-cell">
                        {rating.studentName || "Unknown"}
                      </div>
                      <div className="table-cell">
                        {rating.subjectName || rating.subjectId || "N/A"}
                      </div>
                      <div className="table-cell">
                        {rating.seasonName || rating.season || "N/A"}
                      </div>
                      <div className="table-cell">
                        {rating.date
                          ? new Date(rating.date).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="table-cell">
                        <span
                          style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            backgroundColor:
                              rating.rating === "Excellent" ||
                              rating.rating === 5
                                ? "#10b981"
                                : rating.rating === "Good" ||
                                  rating.rating === 4
                                ? "#3b82f6"
                                : rating.rating === "Fair" ||
                                  rating.rating === 3
                                ? "#f59e0b"
                                : rating.rating === "Poor" ||
                                  rating.rating === 2
                                ? "#ef4444"
                                : "#6b7280",
                            color: "white",
                            fontWeight: "600",
                            fontSize: "13px",
                            display: "inline-block",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                          }}
                        >
                          {rating.rating === "Excellent" || rating.rating === 5
                            ? t("form.rating.excellent", "Excellent")
                            : rating.rating === "Good" || rating.rating === 4
                            ? t("form.rating.good", "Good")
                            : rating.rating === "Fair" || rating.rating === 3
                            ? t("form.rating.fair", "Fair")
                            : rating.rating === "Poor" || rating.rating === 2
                            ? t("form.rating.poor", "Poor")
                            : t("form.rating.na", "N/A")}
                        </span>
                      </div>
                      <div className="table-cell">
                        <button
                          className="action-button edit"
                          onClick={() => handleEditRating(rating)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-button delete"
                          onClick={() => handleDeleteRating(rating._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>

            {/* Pagination Controls */}
            {(() => {
              const paginatedData = getPaginatedRatings();
              if (paginatedData.total === 0) return null;
              const isRTL = document.dir === "rtl";

              return (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() =>
                        setRatingCurrentPage(Math.max(1, ratingCurrentPage - 1))
                      }
                      disabled={paginatedData.currentPage === 1}
                      style={{
                        padding: "8px 12px",
                        backgroundColor:
                          paginatedData.currentPage === 1
                            ? "#e5e7eb"
                            : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor:
                          paginatedData.currentPage === 1
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexDirection: isRTL ? "row-reverse" : "row",
                      }}
                    >
                      {t("admin.pagination.previous", "Previous")}
                    </button>

                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {t("admin.pagination.page", "Page")}{" "}
                      {paginatedData.currentPage} / {paginatedData.totalPages}
                    </div>

                    <button
                      onClick={() =>
                        setRatingCurrentPage(
                          Math.min(
                            paginatedData.totalPages,
                            ratingCurrentPage + 1
                          )
                        )
                      }
                      disabled={
                        paginatedData.currentPage === paginatedData.totalPages
                      }
                      style={{
                        padding: "8px 12px",
                        backgroundColor:
                          paginatedData.currentPage === paginatedData.totalPages
                            ? "#e5e7eb"
                            : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor:
                          paginatedData.currentPage === paginatedData.totalPages
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexDirection: isRTL ? "row-reverse" : "row",
                      }}
                    >
                      {t("admin.pagination.next", "Next")}
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    {t("admin.pagination.showing", "Showing")}{" "}
                    {(paginatedData.currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(
                      paginatedData.currentPage * ITEMS_PER_PAGE,
                      paginatedData.total
                    )}{" "}
                    {t("admin.pagination.of", "of")} {paginatedData.total}
                  </div>
                </div>
              );
            })()}
          </>
        ) : activeTab === "students" ? (
          <div className="data-table student-table">
            <div className="table-header">
              <div className="table-cell">{t("admin.form.name", "Name")}</div>
              <div className="table-cell">
                {t("admin.form.gender", "Gender")}
              </div>
              <div className="table-cell">
                {t("admin.form.username", "Username")}
              </div>
              <div className="table-cell">{t("admin.form.email", "Email")}</div>
              <div className="table-cell">{t("admin.form.phone", "Phone")}</div>
              <div className="table-cell">
                {t("admin.form.parentsNumber", "Parents Number")}
              </div>
              <div className="table-cell">{t("admin.crud.edit", "Edit")}</div>
            </div>
            {filteredStudents.map((student) => (
              <div key={student._id} className="table-row">
                <div className="table-cell">
                  {student.fullName || t("common.na", "N/A")}
                </div>
                <div className="table-cell">
                  {student.gender || t("common.na", "N/A")}
                </div>
                <div className="table-cell">
                  {student.username || t("common.na", "N/A")}
                </div>
                <div className="table-cell">{student.email}</div>
                <div className="table-cell">
                  {student.phone || t("common.na", "N/A")}
                </div>
                <div className="table-cell">
                  {student.parentsNumber || t("common.na", "N/A")}
                </div>
                <div className="table-cell">
                  <button
                    className="action-button edit"
                    onClick={() => handleEdit(student)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleDelete(student._id, "student")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="data-table teacher-table">
            <div className="table-header">
              <div className="table-cell">{t("admin.table.name", "Name")}</div>
              <div className="table-cell">
                {t("admin.table.gender", "Gender")}
              </div>
              <div className="table-cell">
                {t("admin.table.username", "Username")}
              </div>
              <div className="table-cell">
                {t("admin.table.email", "Email")}
              </div>
              <div className="table-cell">
                {t("admin.table.phone", "Phone")}
              </div>
              <div className="table-cell">
                {t("admin.table.subjects", "Subjects")}
              </div>
              <div className="table-cell">
                {t("admin.table.classes", "Classes")}
              </div>
              <div className="table-cell">
                {t("admin.table.experience", "Experience")}
              </div>
              <div className="table-cell">
                {t("admin.table.actions", "Actions")}
              </div>
            </div>
            {filteredTeachers.map((teacher) => (
              <div key={teacher._id} className="table-row">
                <div className="table-cell">
                  {teacher.name ||
                    `${teacher.firstName || ""} ${
                      teacher.lastName || ""
                    }`.trim() ||
                    "N/A"}
                </div>
                <div className="table-cell">{teacher.gender || "N/A"}</div>
                <div className="table-cell">{teacher.username || "N/A"}</div>
                <div className="table-cell">{teacher.email}</div>
                <div className="table-cell">{teacher.phone || "N/A"}</div>
                <div className="table-cell">
                  {teacher.subjects?.length > 0
                    ? teacher.subjects
                        .map((subject) => {
                          const subjectTitle =
                            subject.title?.en || subject.title || subject;
                          return subjectTitle;
                        })
                        .join(", ")
                    : "N/A"}
                </div>
                <div className="table-cell">
                  {teacher.classes?.length > 0
                    ? teacher.classes.map((cls) => cls.name || cls).join(", ")
                    : "N/A"}
                </div>
                <div className="table-cell">
                  {teacher.experience ? `${teacher.experience} years` : "N/A"}
                </div>
                <div className="table-cell">
                  <button
                    className="action-button edit"
                    onClick={() => handleEdit(teacher)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleDelete(teacher._id, "teacher")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {editingItem
                  ? t("admin.msg.edit", "Edit")
                  : t("admin.msg.add", "Add")}
              </h2>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {activeTab === "students" ? (
                <div className="form-group">
                  <label>
                    {t("admin.form.fullName", "Full Name")}{" "}
                    {t("admin.form.required", "*")}
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>{t("admin.form.name", "Name")}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>{t("admin.form.email", "Email")}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("admin.form.phone", "Phone")}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t("admin.form.gender", "Gender")}</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  required
                >
                  <option value="">
                    {t("form.selectGender", "Select Gender")}
                  </option>
                  <option value="Male">{t("form.gender.male", "Male")}</option>
                  <option value="Female">
                    {t("form.gender.female", "Female")}
                  </option>
                  <option value="Other">
                    {t("form.gender.other", "Other")}
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>{t("admin.form.profileImage", "Profile Image")}</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    id="image-input"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-input"
                  />
                  <label htmlFor="image-input" className="image-upload-label">
                    <Upload size={20} />
                    <span>{t("admin.msg.uploadImage", "Upload Image")}</span>
                  </label>
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, image: null });
                        }}
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {activeTab === "teachers" && (
                <>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Password {!editingItem ? "*" : ""}
                      {editingItem && (
                        <span className="form-hint">
                          (Leave blank to keep current password)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!editingItem}
                      minLength={editingItem ? 0 : 6}
                    />
                  </div>
                </>
              )}

              {activeTab === "students" ? (
                <>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      {t("admin.form.parentsNumber", "Parents Number")}
                    </label>
                    <input
                      type="tel"
                      value={formData.parentsNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentsNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      {t("admin.form.password", "Password")}{" "}
                      {!editingItem && t("admin.form.required", "*")}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={
                        editingItem
                          ? t(
                              "admin.form.passwordHint",
                              "Leave blank to keep current password"
                            )
                          : ""
                      }
                      required={!editingItem}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("admin.form.classLabel", "Class")}</label>
                    <select
                      value={formData.classes[0] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, classes: [e.target.value] })
                      }
                      required
                    >
                      <option value="">
                        {t("form.selectClass", "Select a class")}
                      </option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {getLocalizedText(cls.nameMultilingual || cls.name) ||
                            cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t("admin.form.branchLabel", "Branch")}</label>
                    <select
                      value={formData.branches[0] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, branches: [e.target.value] })
                      }
                      required
                    >
                      <option value="">
                        {t("form.selectBranch", "Select a branch")}
                      </option>
                      {getAvailableBranches().map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {getLocalizedText(
                            branch.nameMultilingual || branch.name
                          ) || branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>{t("admin.form.classesLabel", "Classes")}</label>
                    <div className="multi-select-container">
                      {classes.map((cls) => (
                        <label key={cls._id} className="multi-select-item">
                          <input
                            type="checkbox"
                            checked={formData.classes.includes(cls._id)}
                            onChange={() => handleClassChange(cls._id)}
                          />
                          <span>
                            {getLocalizedText(
                              cls.nameMultilingual || cls.name
                            ) || cls.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.classes.length > 0 && (
                    <div className="form-group">
                      <label>{t("admin.form.branchesLabel", "Branches")}</label>
                      <div className="multi-select-container">
                        {getAvailableBranches().map((branch) => (
                          <label key={branch._id} className="multi-select-item">
                            <input
                              type="checkbox"
                              checked={formData.branches.includes(branch._id)}
                              onChange={() => handleBranchChange(branch._id)}
                            />
                            <span>
                              {getLocalizedText(
                                branch.nameMultilingual || branch.name
                              ) || branch.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>
                      {t("admin.form.subjectsLabel", "Subjects")}
                      {formData.classes.length > 0 && (
                        <span className="form-label-count">
                          ({getAvailableSubjects().length}{" "}
                          {t("admin.form.available", "available")})
                        </span>
                      )}
                    </label>
                    <div className="multi-select-container">
                      {getAvailableSubjects().map((subject) => (
                        <label key={subject._id} className="multi-select-item">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject._id)}
                            onChange={() => handleSubjectChange(subject._id)}
                          />
                          <span>
                            {getLocalizedText(
                              subject.titleMultilingual || subject.title
                            ) ||
                              subject.title ||
                              subject.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {formData.classes.length === 0 && (
                      <p className="form-hint">
                        {t(
                          "admin.form.selectClassesFirst",
                          "Please select classes first to see available subjects"
                        )}
                      </p>
                    )}
                    {formData.classes.length > 0 &&
                      getAvailableSubjects().length === 0 && (
                        <p className="form-hint">
                          {t(
                            "admin.form.noSubjectsAvailable",
                            "No subjects available for the selected classes"
                          )}
                        </p>
                      )}
                  </div>

                  <div className="form-group">
                    <label>
                      {t("admin.form.experience", "Experience (years)")}
                    </label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({ ...formData, experience: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {!editingItem && activeTab === "students" && (
                <div className="form-group">
                  <label>{t("admin.form.passwordLabel", "Password")}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  <Save size={16} />
                  <span>{editingItem ? "Update" : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRating && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <div>
                <h2>📝 Edit Rating</h2>
                <p
                  style={{
                    margin: "5px 0 0 0",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Student: <strong>{editingRating.studentName}</strong>
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setEditingRating(null);
                  setShowModal(false);
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "24px" }}>
              {/* Date Field */}
              <div className="form-group">
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  📅 {t("form.date", "Date")} {t("admin.form.required", "*")}
                </label>
                <input
                  type="date"
                  value={ratingFormData.date}
                  onChange={(e) =>
                    setRatingFormData({
                      ...ratingFormData,
                      date: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              {/* Season Dropdown */}
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  🎓 {t("form.season", "Season")}{" "}
                  {t("admin.form.required", "*")}
                </label>
                <select
                  value={ratingFormData.season}
                  onChange={(e) =>
                    setRatingFormData({
                      ...ratingFormData,
                      season: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                >
                  <option value="">
                    -- {t("admin.form.selectSeason", "Select Season")} --
                  </option>
                  {seasons.map((season) => (
                    <option key={season._id} value={season._id}>
                      {getLocalizedText(
                        season.nameMultilingual || season.name
                      ) ||
                        season.name ||
                        season._id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Dropdown */}
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  📚 {t("form.subject", "Subject")}{" "}
                  {t("admin.form.required", "*")}
                </label>
                <select
                  value={ratingFormData.subjectId}
                  onChange={(e) =>
                    setRatingFormData({
                      ...ratingFormData,
                      subjectId: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                >
                  <option value="">
                    -- {t("admin.form.selectSubject", "Select Subject")} --
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {getLocalizedText(
                        subject.titleMultilingual || subject.title
                      ) ||
                        subject.title ||
                        subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Dropdown */}
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  ⭐ {t("students.bulkRate", "Rating")}{" "}
                  {t("admin.form.required", "*")}
                </label>
                <select
                  value={ratingFormData.rating}
                  onChange={(e) =>
                    setRatingFormData({
                      ...ratingFormData,
                      rating: parseInt(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                >
                  <option value="">
                    -- {t("admin.form.selectRating", "Select Rating")} --
                  </option>
                  <option value="5">
                    ⭐⭐⭐⭐⭐ {t("form.rating.excellent", "Excellent")} (5)
                  </option>
                  <option value="4">
                    ⭐⭐⭐⭐ {t("form.rating.good", "Good")} (4)
                  </option>
                  <option value="3">
                    ⭐⭐⭐ {t("form.rating.fair", "Fair")} (3)
                  </option>
                  <option value="2">
                    ⭐⭐ {t("form.rating.poor", "Poor")} (2)
                  </option>
                  <option value="1">⭐ {t("form.rating.na", "N/A")} (1)</option>
                </select>
              </div>
            </div>
            <div
              className="modal-actions"
              style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}
            >
              <button
                className="cancel-button"
                onClick={() => {
                  setEditingRating(null);
                  setShowModal(false);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "2px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                className="save-button"
                onClick={handleSaveRating}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Save size={16} />
                <span>Update Rating</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>
            {t("admin.modal.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        title={`Delete ${
          deleteConfirmation.itemType === "student"
            ? "Student"
            : deleteConfirmation.itemType === "teacher"
            ? "Teacher"
            : "Rating"
        }`}
        message={
          deleteConfirmation.itemType === "rating"
            ? t(
                "admin.crud.deleteRatingConfirm",
                "Are you sure you want to delete this rating? This action cannot be undone."
              )
            : t(
                "admin.crud.deleteConfirm",
                `Are you sure you want to delete ${deleteConfirmation.itemName}? This action cannot be undone.`
              )
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminCRUD;
