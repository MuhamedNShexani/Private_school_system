import React, { useState, useEffect } from "react";
import {
  studentsAPI,
  teachersAPI,
  subjectsAPI,
  classesAPI,
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
} from "lucide-react";
import "./AdminCRUD.css";

const AdminCRUD = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
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
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, teachersRes, subjectsRes, classesRes] =
        await Promise.all([
          studentsAPI.getAll(),
          teachersAPI.getAll(),
          subjectsAPI.getAll(),
          classesAPI.getAll(),
        ]);

      console.log("Fetched teachers data:", teachersRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data.data || []);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
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
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    console.log("Editing item:", item);

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
      };

      console.log("Setting teacher form data:", formDataToSet);
      setFormData(formDataToSet);
    }

    setShowModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        if (type === "student") {
          await studentsAPI.delete(id);
          setStudents(students.filter((s) => s._id !== id));
        } else {
          await teachersAPI.delete(id);
          setTeachers(teachers.filter((t) => t._id !== id));
        }

        // Refresh data to ensure consistency
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
      } catch (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        if (activeTab === "students") {
          // Prepare student data for API update
          const studentData = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || undefined,
            username: formData.username,
            parentsNumber: formData.parentsNumber || undefined,
            class: formData.classes[0] || undefined,
            branchID: formData.branches[0] || undefined,
            gender: formData.gender || editingItem.gender || "Other",
            studentNumber: editingItem.studentNumber, // Keep existing student number
          };

          console.log("Updating student with data:", studentData);
          const response = await studentsAPI.update(
            editingItem._id,
            studentData
          );
          setStudents(
            students.map((s) =>
              s._id === editingItem._id ? { ...s, ...response.data } : s
            )
          );
        } else {
          // Prepare teacher data for API (all fields that Teacher model now supports)
          const teacherData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined, // Don't send empty string
            gender: formData.gender || undefined,
            subjects: formData.subjects || [],
            classes: formData.classes || [],
            branches: formData.branches || [],
            username: formData.username || undefined, // Don't send empty string
            experience: parseInt(formData.experience) || 0,
          };

          // Only include password if it's provided (not empty)
          if (formData.password && formData.password.trim() !== "") {
            teacherData.password = formData.password;
          }

          console.log("Updating teacher with data:", teacherData);
          console.log("Form data being used:", formData);
          const response = await teachersAPI.update(
            editingItem._id,
            teacherData
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
          const studentData = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || undefined,
            username: formData.username,
            parentsNumber: formData.parentsNumber || undefined,
            class: formData.classes[0] || undefined, // Use first selected class
            branchID: formData.branches[0] || undefined, // Use first selected branch
            gender: formData.gender || "Other",
            studentNumber: `STU${Date.now()}`, // Generate student number
            password: formData.password,
          };

          console.log("Creating student with data:", studentData);
          const response = await studentsAPI.create(studentData);
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
          const teacherData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined, // Don't send empty string
            gender: formData.gender || undefined,
            subjects: formData.subjects || [],
            classes: formData.classes || [],
            branches: formData.branches || [],
            username: formData.username,
            password: formData.password,
            experience: parseInt(formData.experience) || 0,
          };

          console.log("Creating teacher with data:", teacherData);
          console.log("Data types:", {
            name: typeof teacherData.name,
            email: typeof teacherData.email,
            phone: typeof teacherData.phone,
            subjects: Array.isArray(teacherData.subjects),
            classes: Array.isArray(teacherData.classes),
            branches: Array.isArray(teacherData.branches),
            username: typeof teacherData.username,
            experience: typeof teacherData.experience,
          });
          const response = await teachersAPI.create(teacherData);
          console.log("Teacher create response:", response);

          // Add the new teacher to the list
          setTeachers([...teachers, response.data]);
        }
      }
      setShowModal(false);
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-crud-container">
      <div className="admin-crud-header">
        <h1>Admin Management</h1>
        <p>Manage students and teachers</p>
      </div>

      <div className="admin-crud-tabs">
        <button
          className={`tab-button ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          <Users size={20} />
          <span>Students ({students.length})</span>
        </button>
        <button
          className={`tab-button ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          <GraduationCap size={20} />
          <span>Teachers ({teachers.length})</span>
        </button>
      </div>

      <div className="admin-crud-toolbar">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="toolbar-actions">
          {refreshing && (
            <div className="refreshing-indicator">
              <div className="spinner-small"></div>
              <span>Refreshing...</span>
            </div>
          )}
          <button className="create-button" onClick={handleCreate}>
            <Plus size={20} />
            <span>Add {activeTab === "students" ? "Student" : "Teacher"}</span>
          </button>
        </div>
      </div>

      <div className="admin-crud-content">
        {activeTab === "students" ? (
          <div className="data-table student-table">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Gender</div>
              <div className="table-cell">Username</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Phone</div>
              <div className="table-cell">Parents Number</div>
              <div className="table-cell">Actions</div>
            </div>
            {filteredStudents.map((student) => (
              <div key={student._id} className="table-row">
                <div className="table-cell">{student.fullName || "N/A"}</div>
                <div className="table-cell">{student.gender || "N/A"}</div>
                <div className="table-cell">{student.username || "N/A"}</div>
                <div className="table-cell">{student.email}</div>
                <div className="table-cell">{student.phone || "N/A"}</div>
                <div className="table-cell">
                  {student.parentsNumber || "N/A"}
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
              <div className="table-cell">Name</div>
              <div className="table-cell">Gender</div>
              <div className="table-cell">Username</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Phone</div>
              <div className="table-cell">Subjects</div>
              <div className="table-cell">Classes</div>
              <div className="table-cell">Experience</div>
              <div className="table-cell">Actions</div>
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
                  ? `Edit ${activeTab === "students" ? "Student" : "Teacher"}`
                  : `Add ${activeTab === "students" ? "Student" : "Teacher"}`}
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
                  <label>Full Name *</label>
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
                  <label>Full Name</label>
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
                  <label>Email</label>
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
                  <label>Phone</label>
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
                <label>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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
                    <label>Parents Number</label>
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
                  {!editingItem && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                        minLength={6}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Class</label>
                    <select
                      value={formData.classes[0] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, classes: [e.target.value] })
                      }
                      required
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Branch</label>
                    <select
                      value={formData.branches[0] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, branches: [e.target.value] })
                      }
                      required
                    >
                      <option value="">Select a branch</option>
                      {getAvailableBranches().map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Classes</label>
                    <div className="multi-select-container">
                      {classes.map((cls) => (
                        <label key={cls._id} className="multi-select-item">
                          <input
                            type="checkbox"
                            checked={formData.classes.includes(cls._id)}
                            onChange={() => handleClassChange(cls._id)}
                          />
                          <span>{cls.name?.en || cls.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.classes.length > 0 && (
                    <div className="form-group">
                      <label>Branches</label>
                      <div className="multi-select-container">
                        {getAvailableBranches().map((branch) => (
                          <label key={branch._id} className="multi-select-item">
                            <input
                              type="checkbox"
                              checked={formData.branches.includes(branch._id)}
                              onChange={() => handleBranchChange(branch._id)}
                            />
                            <span>{branch.name?.en || branch.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>
                      Subjects
                      {formData.classes.length > 0 && (
                        <span className="form-label-count">
                          ({getAvailableSubjects().length} available)
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
                            {subject.title?.en || subject.title || subject.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {formData.classes.length === 0 && (
                      <p className="form-hint">
                        Please select classes first to see available subjects
                      </p>
                    )}
                    {formData.classes.length > 0 &&
                      getAvailableSubjects().length === 0 && (
                        <p className="form-hint">
                          No subjects available for the selected classes
                        </p>
                      )}
                  </div>

                  <div className="form-group">
                    <label>Experience (years)</label>
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
                  <label>Password</label>
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

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default AdminCRUD;
