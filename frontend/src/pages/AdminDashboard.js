import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import {
  studentsAPI,
  teachersAPI,
  gradesAPI,
  classesAPI,
  analyticsAPI,
} from "../services/api";
import {
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  Activity,
  Award,
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
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalGrades: 0,
    totalClasses: 0,
  });
  const [analytics, setAnalytics] = useState({
    genderBreakdown: { male: 0, female: 0, total: 0 },
    progressByMonth: [],
    graduationByGrade: [],
    topCourses: [],
    teacherPerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

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

      setStats({
        totalStudents: studentsRes.data?.length || 0,
        totalTeachers:
          teachersRes.data?.data?.length || teachersRes.data?.length || 0,
        totalGrades:
          gradesRes.data?.data?.length || gradesRes.data?.length || 0,
        totalClasses: classesRes.data?.length || 0,
      });

      if (analyticsRes.data?.success) {
        setAnalytics({
          genderBreakdown: analyticsRes.data.data?.genderBreakdown || {
            male: 0,
            female: 0,
            total: 0,
          },
          progressByMonth: analyticsRes.data.data?.progressByMonth || [],
          graduationByGrade: analyticsRes.data.data?.graduationByGrade || [],
          topCourses: analyticsRes.data.data?.topCourses || [],
          teacherPerformance: analyticsRes.data.data?.teacherPerformance || [],
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
          <p>Loading dashboard...</p>
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
      title: "Total Students",
      value: stats.totalStudents,
      icon: <Users size={24} />,
      color: "blue",
      description: "Registered students",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      icon: <GraduationCap size={24} />,
      color: "green",
      description: "Active teachers",
    },
    {
      title: "Grades",
      value: stats.totalGrades,
      icon: <BookOpen size={24} />,
      color: "purple",
      description: "Available grades",
    },
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: <BarChart3 size={24} />,
      color: "orange",
      description: "Active classes",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t("admin.dashboard.title", "Admin Dashboard")}</h1>
        <p>
          Welcome back, {user?.firstName}! Here's an overview of your platform.
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
        <h2>Analytics & Reports</h2>

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
                    { name: "Male", value: analytics.genderBreakdown.male },
                    { name: "Female", value: analytics.genderBreakdown.female },
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

          {/* Student Progress Over Time */}
          <div className="chart-card">
            <h3>
              {t(
                "admin.dashboard.studentProgress",
                "Student Progress (Last 6 Months)"
              )}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.progressByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id.month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Average Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Graduation Rate by Grade */}
          <div className="chart-card">
            <h3>{t("admin.dashboard.passRate", "Pass Rate by Grade")}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.graduationByGrade}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="passRate" fill="#00C49F" name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performing Courses */}
          <div className="chart-card">
            <h3>{t("admin.dashboard.topCourses", "Top Performing Courses")}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCourses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#FFBB28" name="Average Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>{t("admin.dashboard.recentActivity", "Recent Activity")}</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <Activity size={16} />
            </div>
            <div className="activity-content">
              <p>
                {t(
                  "admin.dashboard.activityUpdated",
                  "Analytics dashboard updated"
                )}
              </p>
              <span className="activity-time">
                {t("admin.dashboard.activityTime.now", "Just now")}
              </span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Users size={16} />
            </div>
            <div className="activity-content">
              <p>
                {stats.totalStudents}{" "}
                {t("admin.dashboard.studentsRegistered", "students registered")}
              </p>
              <span className="activity-time">
                {t("admin.dashboard.activityTime.today", "Today")}
              </span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Award size={16} />
            </div>
            <div className="activity-content">
              <p>{analytics.topCourses?.length || 0} courses analyzed</p>
              <span className="activity-time">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
