import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import {
  studentsAPI,
  teachersAPI,
  gradesAPI,
  classesAPI,
  analyticsAPI,
  seasonsAPI,
  quizzesAPI,
  homeworksAPI,
  exercisesAPI,
} from "../services/api";
import {
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  Activity,
  Award,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalGrades: 0,
    totalClasses: 0,
    totalBranches: 0,
  });
  const [analytics, setAnalytics] = useState({
    genderBreakdown: { male: 0, female: 0, total: 0 },
    teacherGenderBreakdown: { male: 0, female: 0, total: 0 },
    progressByMonth: [],
    graduationByGrade: [],
    topCourses: [],
    teacherPerformance: [],
    performanceByClass: [],
    bestPerformingClass: null,
    worstPerformingClass: null,
    paymentBreakdown: {
      bothPaymentsPaid: 0,
      firstPaymentPaid: 0,
      secondPaymentPaid: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [rateChangesData, setRateChangesData] = useState(null);
  const [rateChangesLoading, setRateChangesLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [homeworksCount, setHomeworksCount] = useState(0);
  const [exercisesCount, setExercisesCount] = useState(0);
  const [topStudentsLoading, setTopStudentsLoading] = useState(false);
  const [worstStudents, setWorstStudents] = useState([]);
  const [worstStudentsLoading, setWorstStudentsLoading] = useState(false);
  const [passRateData, setPassRateData] = useState([]);
  const [passRateLoading, setPassRateLoading] = useState(false);
  const [selectedPassRateClass, setSelectedPassRateClass] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [passRateByGradeData, setPassRateByGradeData] = useState([]);
  const [passRateByGradeLoading, setPassRateByGradeLoading] = useState(false);
  const [selectedGradeSeason, setSelectedGradeSeason] = useState("");
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      fetchTopStudents();
      fetchWorstStudents();
      fetchSeasons();
      fetchCounts();
    }
  }, [isAdmin]);

  const fetchCounts = async () => {
    try {
      const [quizzesRes, homeworksRes, exercisesRes] = await Promise.all([
        quizzesAPI.getAll(),
        homeworksAPI.getAll(),
        exercisesAPI.getAll(),
      ]);

      setQuizzesCount(
        quizzesRes.data?.data?.length ||
          quizzesRes.data?.length ||
          (Array.isArray(quizzesRes.data) ? quizzesRes.data.length : 0)
      );

      // Handle homeworks response structure: { success: true, data: { homeworks: [...] } }
      let homeworksCount = 0;
      if (
        homeworksRes.data?.data?.homeworks &&
        Array.isArray(homeworksRes.data.data.homeworks)
      ) {
        homeworksCount = homeworksRes.data.data.homeworks.length;
      } else if (Array.isArray(homeworksRes.data)) {
        homeworksCount = homeworksRes.data.length;
      } else if (
        homeworksRes.data?.data &&
        Array.isArray(homeworksRes.data.data)
      ) {
        homeworksCount = homeworksRes.data.data.length;
      } else if (
        homeworksRes.data?.homeworks &&
        Array.isArray(homeworksRes.data.homeworks)
      ) {
        homeworksCount = homeworksRes.data.homeworks.length;
      }
      setHomeworksCount(homeworksCount);

      setExercisesCount(
        exercisesRes.data?.data?.length ||
          exercisesRes.data?.length ||
          (Array.isArray(exercisesRes.data) ? exercisesRes.data.length : 0)
      );
    } catch (error) {
      console.error("Error fetching counts:", error);
      setQuizzesCount(0);
      setHomeworksCount(0);
      setExercisesCount(0);
    }
  };

  // Auto-select first class for Pass Rate report
  useEffect(() => {
    if (classes.length > 0 && !selectedPassRateClass) {
      setSelectedPassRateClass(classes[0]._id);
    }
  }, [classes, selectedPassRateClass]);

  // Auto-select first class for Class Evaluation Rate report
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]._id);
    }
  }, [classes, selectedClass]);

  // Auto-select Season 1 for Pass Rate report
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      // Find Season 1 by order
      const season1 = seasons.find((s) => s.order === 1);
      if (season1) {
        setSelectedSeason(season1.order);
      } else if (seasons.length > 0) {
        // Fallback to first season if Season 1 not found
        setSelectedSeason(seasons[0].order);
      }
    }
  }, [seasons, selectedSeason]);

  // Auto-select Season 1 for Pass Rate by Grade report
  useEffect(() => {
    if (seasons.length > 0 && !selectedGradeSeason) {
      // Find Season 1 by order
      const season1 = seasons.find((s) => s.order === 1);
      if (season1) {
        setSelectedGradeSeason(season1.order);
      } else if (seasons.length > 0) {
        // Fallback to first season if Season 1 not found
        setSelectedGradeSeason(seasons[0].order);
      }
    }
  }, [seasons, selectedGradeSeason]);

  const fetchPassRateByGrade = async () => {
    if (!selectedGradeSeason) {
      setPassRateByGradeData([]);
      return;
    }

    try {
      setPassRateByGradeLoading(true);
      const response = await analyticsAPI.getPassRateByGrade(
        selectedGradeSeason
      );
      if (response.data.success) {
        setPassRateByGradeData(response.data.data.passRateByGrade || []);
      }
    } catch (error) {
      console.error("Error fetching pass rate by grade:", error);
      setPassRateByGradeData([]);
    } finally {
      setPassRateByGradeLoading(false);
    }
  };

  useEffect(() => {
    fetchPassRateByGrade();
  }, [selectedGradeSeason]);

  const fetchSeasons = async () => {
    try {
      const response = await seasonsAPI.getAll();
      // Seasons API returns array directly, not wrapped in success object
      const seasonsData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      // Keep the original structure - API returns name as string and nameMultilingual as object
      setSeasons(seasonsData.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error("Error fetching seasons:", error);
      setSeasons([]);
    }
  };

  const fetchTopStudents = async () => {
    try {
      setTopStudentsLoading(true);
      const response = await analyticsAPI.getTopStudents();
      if (response.data.success) {
        setTopStudents(response.data.data.topStudents || []);
      }
    } catch (error) {
      console.error("Error fetching top students:", error);
      setTopStudents([]);
    } finally {
      setTopStudentsLoading(false);
    }
  };

  const fetchWorstStudents = async () => {
    try {
      setWorstStudentsLoading(true);
      const response = await analyticsAPI.getWorstStudents();
      if (response.data.success) {
        setWorstStudents(response.data.data.worstStudents || []);
      }
    } catch (error) {
      console.error("Error fetching worst students:", error);
      setWorstStudents([]);
    } finally {
      setWorstStudentsLoading(false);
    }
  };

  const fetchPassRate = async () => {
    if (!selectedPassRateClass || !selectedSeason) {
      setPassRateData([]);
      return;
    }

    try {
      setPassRateLoading(true);
      const response = await analyticsAPI.getPassRate(
        selectedPassRateClass,
        selectedSeason
      );
      if (response.data.success) {
        setPassRateData(response.data.data.passRateData || []);
      }
    } catch (error) {
      console.error("Error fetching pass rate:", error);
      setPassRateData([]);
    } finally {
      setPassRateLoading(false);
    }
  };

  useEffect(() => {
    fetchPassRate();
  }, [selectedPassRateClass, selectedSeason]);

  const fetchAvailableDates = async () => {
    if (!selectedClass) {
      setAvailableDates([]);
      setSelectedDate("");
      return;
    }

    try {
      const response = await analyticsAPI.getRateChangesDates(selectedClass);
      if (response.data.success) {
        const dates = response.data.data.dates || [];
        setAvailableDates(dates);
        // Set the first (newest) date as selected by default if no date is selected
        // or if the currently selected date is not in the new list
        if (dates.length > 0) {
          const currentDateExists = dates.some((d) => d.date === selectedDate);
          if (!currentDateExists) {
            setSelectedDate(dates[0].date);
          }
        } else {
          setSelectedDate("");
        }
      }
    } catch (error) {
      console.error("Error fetching available dates:", error);
      setAvailableDates([]);
    }
  };

  const fetchRateChanges = async () => {
    if (!selectedClass || !selectedDate) {
      setRateChangesData(null);
      return;
    }

    try {
      setRateChangesLoading(true);
      const response = await analyticsAPI.getRateChanges(
        selectedClass,
        selectedDate
      );

      if (response.data.success) {
        setRateChangesData(response.data.data);
      } else {
        console.error(
          "Rate changes API returned success=false:",
          response.data
        );
      }
    } catch (error) {
      console.error("Error fetching rate changes:", error);
      setRateChangesData(null);
    } finally {
      setRateChangesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchAvailableDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchRateChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [studentsRes, teachersRes, gradesRes, classesRes, analyticsRes] =
        await Promise.all([
          studentsAPI.getAll(),
          teachersAPI.getAll(),
          gradesAPI.getAll(),
          classesAPI.getAll(),
          analyticsAPI.getDashboard(),
        ]);

      // Set classes for filter
      setClasses(classesRes.data || []);

      setStats({
        totalStudents:
          studentsRes.data?.data?.length || studentsRes.data?.length || 0,
        totalTeachers:
          teachersRes.data?.data?.length || teachersRes.data?.length || 0,
        totalGrades:
          gradesRes.data?.data?.length || gradesRes.data?.length || 0,
        totalClasses: classesRes.data?.length || 0,
        totalBranches: 0, // Will be set from analytics
      });

      // Get branch count from analytics summary
      if (analyticsRes.data?.success && analyticsRes.data.data?.summary) {
        setStats((prev) => ({
          ...prev,
          totalBranches: analyticsRes.data.data.summary.totalBranches || 0,
        }));
      }

      if (analyticsRes.data?.success) {
        setAnalytics({
          genderBreakdown: analyticsRes.data.data?.genderBreakdown || {
            male: 0,
            female: 0,
            total: 0,
          },
          teacherGenderBreakdown: analyticsRes.data.data
            ?.teacherGenderBreakdown || {
            male: 0,
            female: 0,
            total: 0,
          },
          progressByMonth: analyticsRes.data.data?.progressByMonth || [],
          graduationByGrade: analyticsRes.data.data?.graduationByGrade || [],
          topCourses: analyticsRes.data.data?.topCourses || [],
          teacherPerformance: analyticsRes.data.data?.teacherPerformance || [],
          performanceByClass: analyticsRes.data.data?.performanceByClass || [],
          bestPerformingClass:
            analyticsRes.data.data?.bestPerformingClass || null,
          worstPerformingClass:
            analyticsRes.data.data?.worstPerformingClass || null,
          paymentBreakdown: analyticsRes.data.data?.paymentBreakdown || {
            bothPaymentsPaid: 0,
            firstPaymentPaid: 0,
            secondPaymentPaid: 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h2>{t("admin.dashboard.accessDenied", "Access Denied")}</h2>
          <p>
            {t(
              "common.accessDeniedMsg",
              "You don't have permission to access the admin dashboard."
            )}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t("general.loading", "Loading ... ")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h2>{t("admin.dashboard.error", "Error")}</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            {t("btn.tryAgain", "Try Again")}
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t("admin.dashboard.totalStudent", "Total Students"),
      value: stats.totalStudents,
      icon: <Users size={24} />,
      color: "blue",
      description: ` (${analytics.genderBreakdown.male} ${t(
        "students.gender.male",
        "Male"
      )}, ${analytics.genderBreakdown.female}  ${t(
        "students.gender.female",
        "Female"
      )})`,
    },
    {
      title: t("admin.dashboard.totalteachers", "Total Teachers"),
      value: stats.totalTeachers,
      icon: <GraduationCap size={24} />,
      color: "green",
      description: ` (${analytics.teacherGenderBreakdown.male} ${t(
        "students.gender.male",
        "Male"
      )}, ${analytics.teacherGenderBreakdown.female}  ${t(
        "students.gender.female",
        "Female"
      )})`,
    },
    {
      title: t("admin.dashboard.BothPaymentsPaid", "Both Payments Paid"),
      value: analytics.paymentBreakdown.bothPaymentsPaid,
      icon: <DollarSign size={24} />,
      color: "purple",
      description: ` ( ${t("admin.dashboard.first", "First")}: ${
        analytics.paymentBreakdown.firstPaymentPaid
      }, ${t("admin.dashboard.second", "Second")}: ${
        analytics.paymentBreakdown.secondPaymentPaid
      })`,
    },
    {
      title: t("admin.dashboard.classes", "Classes"),
      value: stats.totalClasses,
      icon: <BarChart3 size={24} />,
      color: "orange",
      description: ` (${stats.totalBranches} ${t(
        "admin.dashboard.branches",
        "Branches"
      )})`,
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t("admin.dashboard.title", "Admin Dashboard")}</h1>
        <p>
          {t(
            "admin.dashboard.welcome",
            "Welcome back , Here's an overview of your platform."
          )}
        </p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card ${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <h3 className="stat-value">{card.value}</h3>
              <h4 className="stat-title">{card.title}</h4>
              <p className="stat-description">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-section">
        <h2>{t("admin.dashboard.analyticsraports", "Analytics & Reports")}</h2>

        <div className="analytics-grid">
          {/* Gender Breakdown */}
          <div className="chart-card">
            <h3>
              {t(
                "admin.dashboard.genderDistribution",
                "Student Gender Distribution"
              )}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: t("students.gender.male", "Male"),
                      value: analytics.genderBreakdown.male,
                    },
                    {
                      name: t("students.gender.female", "Female"),
                      value: analytics.genderBreakdown.female,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    analytics.genderBreakdown.male,
                    analytics.genderBreakdown.female,
                  ].map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Class Evaluation Rate */}
          <div className="chart-card">
            <h3>
              {t("admin.dashboard.classevalutionrate", "Class Evaluation Rate")}
            </h3>
            <div
              className="filter-controls"
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  {t("admin.form.class", "Class")}:
                </label>
                {classes.length > 0 ? (
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedDate("");
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="">
                      {t("admin.form.selectClass", "Select Class")}
                    </option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {getEntityName(
                          cls,
                          t("students.unnamedClass", "Unnamed Class")
                        )}{" "}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "#f5f5f5",
                      color: "#999",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    {t("admin.msg.noData", "No classes available")}
                  </div>
                )}
              </div>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  {t("admin.date", "Date")}:
                </label>
                {availableDates.length > 0 ? (
                  <div
                    className="date-navigation"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      backgroundColor: "white",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = availableDates.findIndex(
                          (d) => d.date === selectedDate
                        );
                        if (currentIndex < availableDates.length - 1) {
                          setSelectedDate(
                            availableDates[currentIndex + 1].date
                          );
                        }
                      }}
                      disabled={
                        availableDates.findIndex(
                          (d) => d.date === selectedDate
                        ) >=
                        availableDates.length - 1
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) >=
                          availableDates.length - 1
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                        color:
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) >=
                          availableDates.length - 1
                            ? "#ccc"
                            : "#4f46e5",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) <
                          availableDates.length - 1
                        ) {
                          e.currentTarget.style.color = "#312e81";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) <
                          availableDates.length - 1
                        ) {
                          e.currentTarget.style.color = "#4f46e5";
                        }
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#333",
                      }}
                    >
                      {availableDates.find((d) => d.date === selectedDate)
                        ?.display || "Select a date"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = availableDates.findIndex(
                          (d) => d.date === selectedDate
                        );
                        if (currentIndex > 0) {
                          setSelectedDate(
                            availableDates[currentIndex - 1].date
                          );
                        }
                      }}
                      disabled={
                        availableDates.findIndex(
                          (d) => d.date === selectedDate
                        ) === 0
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) === 0
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                        color:
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) === 0
                            ? "#ccc"
                            : "#4f46e5",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) > 0
                        ) {
                          e.currentTarget.style.color = "#312e81";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          availableDates.findIndex(
                            (d) => d.date === selectedDate
                          ) > 0
                        ) {
                          e.currentTarget.style.color = "#4f46e5";
                        }
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "#f5f5f5",
                      color: "#999",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    {selectedClass
                      ? "No dates available"
                      : "Select a class first"}
                  </div>
                )}
              </div>
            </div>
            {rateChangesLoading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Loading evaluation rate changes...
              </div>
            ) : rateChangesData &&
              rateChangesData.rateChanges &&
              rateChangesData.rateChanges.length > 0 ? (
              <div
                style={{
                  overflowX: "auto",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    tableLayout: "fixed",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#4f46e5",
                        color: "white",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                          width: "30%",
                        }}
                      >
                        {t("admin.form.subjects", "Subject")}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                          width: "23.33%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <ArrowUp size={16} />
                          {t("admin.dashboard.improved", "Improved")}
                        </div>
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                          width: "23.33%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <Minus size={16} />
                          {t("admin.dashboard.nochange", "No Change")}
                        </div>
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                          width: "23.33%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <ArrowDown size={16} />
                          {t("admin.dashboard.declined", "Declined")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateChangesData.rateChanges.map((item, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          {item.subjectName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#10b981",
                          }}
                        >
                          {item.increased}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#64748b",
                          }}
                        >
                          {item.same}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#ef4444",
                          }}
                        >
                          {item.decreased}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedClass && selectedDate ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No evaluation rate changes data available for the selected
                filters.
              </div>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Please select a class and date to view evaluation rate changes.
              </div>
            )}
          </div>

          {/* Pass Rate by Grade */}
          <div className="chart-card pass-rate-grade-report">
            <h3>
              {" "}
              {t("admin.dashboard.passratebygrade", "Pass Rate by Grade")}
            </h3>
            <div
              className="filter-controls"
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {t("form.season", "Season")}
                </label>
                <select
                  value={selectedGradeSeason}
                  onChange={(e) => setSelectedGradeSeason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">
                    {t("general.selectseason", "Select Season")}
                  </option>
                  {seasons.map((season) => {
                    // API returns name as string (language-specific) and nameMultilingual as object
                    const seasonName =
                      (typeof season.name === "string" && season.name) ||
                      (typeof season.name === "object" && season.name?.en) ||
                      season.nameMultilingual?.en ||
                      `Season ${season.order || ""}`;
                    return (
                      <option
                        key={season._id || season.order}
                        value={season.order}
                      >
                        {seasonName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            {passRateByGradeLoading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Loading pass rate by grade data...
              </div>
            ) : passRateByGradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={passRateByGradeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Pass Rate"]}
                    labelFormatter={(label) => `Class: ${label}`}
                  />
                  <Bar dataKey="passRate" name="Pass Rate %" barSize={60}>
                    {passRateByGradeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : selectedGradeSeason ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No pass rate data available for the selected season.
              </div>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Please select a season to view pass rate by grade data.
              </div>
            )}
          </div>

          {/* Pass Rate by Subject */}
          <div className="chart-card pass-rate-subject-report">
            <h3>
              {t("admin.dashboard.passratebysubject", "Pass Rate by Subject")}
            </h3>
            <div
              className="filter-controls"
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {t("admin.form.class", "Class")}
                </label>
                {classes.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "4px",
                      backgroundColor: "white",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = classes.findIndex(
                          (c) => c._id === selectedPassRateClass
                        );
                        if (currentIndex > 0) {
                          setSelectedPassRateClass(
                            classes[currentIndex - 1]._id
                          );
                        }
                      }}
                      disabled={
                        classes.findIndex(
                          (c) => c._id === selectedPassRateClass
                        ) === 0
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) === 0
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                        color:
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) === 0
                            ? "#ccc"
                            : "#4f46e5",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) > 0
                        ) {
                          e.currentTarget.style.color = "#312e81";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) > 0
                        ) {
                          e.currentTarget.style.color = "#4f46e5";
                        }
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#333",
                        padding: "4px 8px",
                      }}
                    >
                      {classes.find((c) => c._id === selectedPassRateClass)
                        ?.name?.en ||
                        classes.find((c) => c._id === selectedPassRateClass)
                          ?.name ||
                        t("admin.form.selectClass", "Select Class")}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = classes.findIndex(
                          (c) => c._id === selectedPassRateClass
                        );
                        if (currentIndex < classes.length - 1) {
                          setSelectedPassRateClass(
                            classes[currentIndex + 1]._id
                          );
                        }
                      }}
                      disabled={
                        classes.findIndex(
                          (c) => c._id === selectedPassRateClass
                        ) ===
                        classes.length - 1
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) ===
                          classes.length - 1
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                        color:
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) ===
                          classes.length - 1
                            ? "#ccc"
                            : "#4f46e5",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) <
                          classes.length - 1
                        ) {
                          e.currentTarget.style.color = "#312e81";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          classes.findIndex(
                            (c) => c._id === selectedPassRateClass
                          ) <
                          classes.length - 1
                        ) {
                          e.currentTarget.style.color = "#4f46e5";
                        }
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "#f5f5f5",
                      color: "#999",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    No classes available
                  </div>
                )}
              </div>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {t("form.season", "Season")}
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">
                    {t("general.selectseason", "Select Season")}
                  </option>
                  {seasons.map((season) => {
                    // API returns name as string (language-specific) and nameMultilingual as object
                    const seasonName =
                      (typeof season.name === "string" && season.name) ||
                      (typeof season.name === "object" && season.name?.en) ||
                      season.nameMultilingual?.en ||
                      `Season ${season.order || ""}`;
                    return (
                      <option
                        key={season._id || season.order}
                        value={season.order}
                      >
                        {seasonName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            {passRateLoading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Loading pass rate data...
              </div>
            ) : passRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={passRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subjectName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Pass Rate"]}
                    labelFormatter={(label) => `Subject: ${label}`}
                  />
                  <Bar dataKey="passRate" name="Pass Rate %" barSize={60}>
                    {passRateData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : selectedPassRateClass && selectedSeason ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No pass rate data available for the selected filters.
              </div>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Please select a class and season to view pass rate data.
              </div>
            )}
          </div>

          {/* Student Performance by Class */}
          {/* <div className="chart-card student-performance-report">
            <h3>
              {t(
                "admin.dashboard.performanceByClass",
                "Student Performance by Class"
              )}
            </h3>
            {analytics.performanceByClass.length > 0 ? (
              <>
                <div
                  className="performance-cards"
                  style={{
                    display: "flex",
                    gap: "20px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  {analytics.bestPerformingClass && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: "200px",
                        padding: "15px",
                        backgroundColor: "#d4edda",
                        borderRadius: "8px",
                        border: "1px solid #c3e6cb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <TrendingUp size={20} color="#28a745" />
                        <strong style={{ color: "#155724" }}>
                          Best Performing
                        </strong>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {analytics.bestPerformingClass.className}
                        {analytics.bestPerformingClass.branchName && (
                          <span
                            style={{ fontSize: "14px", fontWeight: "normal" }}
                          >
                            {" "}
                            - {analytics.bestPerformingClass.branchName}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Avg Score: {analytics.bestPerformingClass.avgScore}%
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Students: {analytics.bestPerformingClass.studentCount}
                      </div>
                    </div>
                  )}
                  {analytics.worstPerformingClass && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: "200px",
                        padding: "15px",
                        backgroundColor: "#f8d7da",
                        borderRadius: "8px",
                        border: "1px solid #f5c6cb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <TrendingDown size={20} color="#dc3545" />
                        <strong style={{ color: "#721c24" }}>
                          Needs Improvement
                        </strong>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {analytics.worstPerformingClass.className}
                        {analytics.worstPerformingClass.branchName && (
                          <span
                            style={{ fontSize: "14px", fontWeight: "normal" }}
                          >
                            {" "}
                            - {analytics.worstPerformingClass.branchName}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Avg Score: {analytics.worstPerformingClass.avgScore}%
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Students: {analytics.worstPerformingClass.studentCount}
                      </div>
                    </div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analytics.performanceByClass.map((item) => ({
                      ...item,
                      displayLabel: item.branchName
                        ? `${item.className} - ${item.branchName}`
                        : item.className,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="displayLabel"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "avgScore") return `${value}%`;
                        return value;
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return data.branchName
                            ? `${data.className} - ${data.branchName}`
                            : data.className;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="avgScore"
                      fill="#8884d8"
                      name="Average Score %"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div
                  style={{
                    marginTop: "15px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "10px",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Class
                        </th>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Branch
                        </th>
                        <th style={{ padding: "8px", textAlign: "center" }}>
                          Avg Score
                        </th>
                        <th style={{ padding: "8px", textAlign: "center" }}>
                          Students
                        </th>
                        <th style={{ padding: "8px", textAlign: "center" }}>
                          Evaluations
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.performanceByClass.map((classData, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #eee",
                            backgroundColor:
                              index % 2 === 0 ? "#f9f9f9" : "white",
                          }}
                        >
                          <td style={{ padding: "8px", fontWeight: "500" }}>
                            {classData.className}
                          </td>
                          <td style={{ padding: "8px", fontWeight: "500" }}>
                            {classData.branchName || "N/A"}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {classData.avgScore}%
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {classData.studentCount}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {classData.totalEvaluations}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No performance data available for classes yet.
              </div>
            )}
          </div> */}
        </div>
      </div>

      {/* Top Performing Students and Worst Performing Students Reports */}
      <div className="analytics-section">
        <div className="analytics-grid">
          {/* Top Performing Students Report */}
          <div className="chart-card">
            <h2 style={{ marginBottom: "20px" }}>
              {t(
                "admin.dashboard.topperformingstudent",
                "Top Performing Students"
              )}
            </h2>
            {topStudentsLoading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Loading top students...
              </div>
            ) : topStudents.length > 0 ? (
              <div
                style={{
                  overflowX: "auto",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    margin: "0 auto",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#4f46e5",
                        color: "white",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.dash.rank", "Rank")}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.student", "Student Name")}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.form.class", "Class")}({""}
                        {t("admin.form.branch", "Branch")})
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.dash.averagescore", "Average Score")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStudents.map((student, index) => (
                      <tr
                        key={student.studentId}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            fontSize: "16px",
                            color: index < 3 ? "#f59e0b" : "#64748b",
                          }}
                        >
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          {student.studentName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {student.className || "Unknown"}
                          {student.branchName &&
                            student.branchName !== "Unknown" && (
                              <span> ({student.branchName})</span>
                            )}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "600",
                            color:
                              student.averageScore >= 90
                                ? "#10b981"
                                : student.averageScore >= 80
                                ? "#3b82f6"
                                : "#64748b",
                          }}
                        >
                          {student.averageScore.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No student performance data available yet.
              </div>
            )}
          </div>

          {/* Worst Performing Students Report */}
          <div className="chart-card">
            <h2 style={{ marginBottom: "20px" }}>
              {t(
                "admin.dashboard.worstperformingstudents",
                "Worst Performing Students"
              )}
            </h2>
            {worstStudentsLoading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Loading worst students...
              </div>
            ) : worstStudents.length > 0 ? (
              <div
                style={{
                  overflowX: "auto",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    margin: "0 auto",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#4f46e5",
                        color: "white",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.dash.rank", "Rank")}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.student", "Student Name")}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.form.class", "Class")}({""}
                        {t("admin.form.branch", "Branch")})
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        {t("admin.dash.averagescore", "Average Score")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {worstStudents.map((student, index) => (
                      <tr
                        key={student.studentId}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            fontSize: "16px",
                            color: index < 3 ? "#ef4444" : "#64748b",
                          }}
                        >
                          {index === 0
                            ? "⚠️"
                            : index === 1
                            ? "⚠️"
                            : index === 2
                            ? "⚠️"
                            : `#${index + 1}`}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          {student.studentName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {student.className || "Unknown"}
                          {student.branchName &&
                            student.branchName !== "Unknown" && (
                              <span> ({student.branchName})</span>
                            )}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "600",
                            color:
                              student.averageScore < 50
                                ? "#ef4444"
                                : student.averageScore < 60
                                ? "#f59e0b"
                                : "#64748b",
                          }}
                        >
                          {student.averageScore.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No student performance data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>{t("admin.dashboard.recentActivity", "Recent")}</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <Activity size={16} />
            </div>
            <div className="activity-content">
              <p>
                {quizzesCount}{" "}
                {t("admin.dashboard.trainings", "Training (Quizzes)")}
              </p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Users size={16} />
            </div>
            <div className="activity-content">
              <p>
                {homeworksCount} {t("admin.dashboard.homeworks", "HomeWorks")}
              </p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Award size={16} />
            </div>
            <div className="activity-content">
              <p>
                {exercisesCount} {t("admin.dashboard.exercises", "Exercises")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
