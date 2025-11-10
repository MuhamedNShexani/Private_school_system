import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  GraduationCap,
  LogOut,
  User,
  BarChart3,
  Globe,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import "./Header.css";

const Header = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, languages, changeLanguage } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);

  const isRTL = currentLanguage === "ku" || currentLanguage === "ar";
  const userRole = user?.role;
  const isTeacher = userRole === "Teacher";
  const isStudent = userRole === "Student";
  const isAdmin = userRole === "Admin";

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  // Force re-render when language changes
  useEffect(() => {
    console.log("Language changed to:", currentLanguage);
    console.log("RTL status:", isRTL);

    // Set document direction for proper RTL/LTR text flow
    if (isRTL) {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = currentLanguage;
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = currentLanguage;
    }

    // Force apply styles manually - always keep sidebar on left
    if (sidebarRef.current) {
      console.log("Applying LTR layout (sidebar always on left)...");
      sidebarRef.current.style.left = "0";
      sidebarRef.current.style.right = "auto";
      sidebarRef.current.style.borderRight = "1px solid #e2e8f0";
      sidebarRef.current.style.borderLeft = "none";

      const mainContent = document.querySelector(".main-content");
      if (mainContent) {
        mainContent.style.marginLeft = "280px";
        mainContent.style.marginRight = "0";
        console.log("Applied LTR layout to main content");
      }
    }
  }, [currentLanguage, isRTL]);

  // Debug language detection
  console.log("Current language:", currentLanguage);
  console.log("Is RTL:", currentLanguage === "ku" || currentLanguage === "ar");
  console.log("RTL class will be:", isRTL ? "rtl" : "ltr");

  // RTL styles with !important
  // const rtlSidebarStyle = isRTL
  //   ? {
  //       left: "auto !important",
  //       right: "0 !important",
  //       borderRight: "none !important",
  //       borderLeft: "1px solid #e2e8f0 !important",
  //       position: "fixed !important",
  //       top: "0 !important",
  //       height: "100vh !important",
  //       zIndex: "100 !important",
  //     }
  //   : {};

  if (isStudent) {
    return (
      <div
        className={`student-layout ${isRTL ? "rtl" : "ltr"}`}
        style={
          isRTL
            ? {
                backgroundColor: "#fef3c7",
                direction: "rtl",
              }
            : {}
        }
      >
        <header className="student-top-bar">
          <Link to="/student/profile" className="student-logo">
            <img src="/logo.jpg" alt="School Logo" className="student-logo-img" />
            <span>CLEVER PRIVATE HIGH SCHOOL</span>
          </Link>
          <div className="student-top-actions">
            <div className="student-language-switcher">
              <Globe size={16} />
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="student-language-select"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="account-settings" ref={profileRef}>
              <button className="account-trigger" onClick={toggleProfile}>
                <div className="account-avatar">
                  <User size={20} />
                </div>
                <ChevronDown
                  size={16}
                  className={`chevron ${isProfileOpen ? "open" : ""}`}
                />
              </button>

              {isProfileOpen && (
                <div className="account-dropdown">
                  <div className="dropdown-header">
                    <div className="user-details">
                      <div className="user-avatar">
                        <User size={24} />
                      </div>
                      <div className="user-info">
                        <div className="user-name">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="user-role">{user?.role}</div>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-section">
                    <div className="section-title">
                      {t("nav.settings", "Settings")}
                    </div>

                    <div className="dropdown-item">
                      <Globe size={16} />
                      <span>{t("nav.language", "Language")}</span>
                      <select
                        value={currentLanguage}
                        onChange={(e) => changeLanguage(e.target.value)}
                        className="language-select-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>{t("nav.logout", "Logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="student-main-content">
          <div className="student-main-inner">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`sidebar-layout ${isRTL ? "rtl" : "ltr"}`}
      style={
        isRTL
          ? {
              backgroundColor: "#fef3c7",
              direction: "rtl",
            }
          : {}
      }
    >
      {/* Vertical Sidebar */}
      <aside ref={sidebarRef} className="sidebar">
        {/* School Logo - Top */}
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <img src="/logo.jpg" alt="School Logo" className="sidebar-logo-img" />
            <span>CLEVER PRIVATE HIGH SCHOOL</span>
          </Link>
        </div>

        {/* Vertical Navigation */}
        <nav className="sidebar-nav">
          {isStudent ? (
            <Link
              to="/student/profile"
              className="nav-link"
              style={
                isRTL
                  ? {
                      direction: "rtl",
                      textAlign: "right",
                      flexDirection: "row-reverse",
                    }
                  : {}
              }
            >
              <User size={20} />
              <span>{t("nav.profile", "My Profile")}</span>
            </Link>
          ) : (
            <Link
              to="/"
              className="nav-link"
              style={
                isRTL
                  ? {
                      direction: "rtl",
                      textAlign: "right",
                      flexDirection: "row-reverse",
                    }
                  : {}
              }
            >
              <BarChart3 size={20} />
              <span>
                {isTeacher
                  ? t("nav.programs", "Programs")
                  : t("nav.dashboard", "Dashboard")}
              </span>
            </Link>
          )}
          {!isTeacher && !isStudent && (
            <Link
              to="/programs"
              className="nav-link"
              style={
                isRTL
                  ? {
                      direction: "rtl",
                      textAlign: "right",
                      flexDirection: "row-reverse",
                    }
                  : {}
              }
            >
              <BookOpen size={20} />
              <span>{t("nav.programs", "Programs")}</span>
            </Link>
          )}
          {!isStudent && (
            <Link
              to="/students"
              className="nav-link"
              style={
                isRTL
                  ? {
                      direction: "rtl",
                      textAlign: "right",
                      flexDirection: "row-reverse",
                    }
                  : {}
              }
            >
              <Users size={20} />
              <span>{t("nav.students", "Students")}</span>
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className="nav-link"
                style={
                  isRTL
                    ? {
                        direction: "rtl",
                        textAlign: "right",
                        flexDirection: "row-reverse",
                      }
                    : {}
                }
              >
                <Settings size={20} />
                <span>{t("nav.admin", "Admin")}</span>
              </Link>
              <Link
                to="/admin/translations"
                className="nav-link"
                style={
                  isRTL
                    ? {
                        direction: "rtl",
                        textAlign: "right",
                        flexDirection: "row-reverse",
                      }
                    : {}
                }
              >
                <Globe size={20} />
                <span>{t("nav.translations", "Translations")}</span>
              </Link>
            </>
          )}
          {isTeacher && (
            <Link
              to="/teacher/profile"
              className="nav-link"
              style={
                isRTL
                  ? {
                      direction: "rtl",
                      textAlign: "right",
                      flexDirection: "row-reverse",
                    }
                  : {}
              }
            >
              <User size={20} />
              <span>{t("nav.profile", "My Profile")}</span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-content">
            {/* Account Settings - Top Right */}
            <div className="top-bar-actions">
              <div className="account-settings" ref={profileRef}>
                <button className="account-trigger" onClick={toggleProfile}>
                  <div className="account-avatar">
                    <User size={20} />
                  </div>
                  <ChevronDown
                    size={16}
                    className={`chevron ${isProfileOpen ? "open" : ""}`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="account-dropdown">
                    <div className="dropdown-header">
                      <div className="user-details">
                        <div className="user-avatar">
                          <User size={24} />
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user?.firstName} {user?.lastName}
                          </div>
                          <div className="user-role">{user?.role}</div>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-section">
                      <div className="section-title">
                        {t("nav.settings", "Settings")}
                      </div>

                      {/* Language Selector */}
                      <div className="dropdown-item">
                        <Globe size={16} />
                        <span>{t("nav.language", "Language")}</span>
                        <select
                          value={currentLanguage}
                          onChange={(e) => changeLanguage(e.target.value)}
                          className="language-select-dropdown"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-section">
                      <button
                        onClick={handleLogout}
                        className="dropdown-item logout-item"
                      >
                        <LogOut size={16} />
                        <span>{t("btn.logout", "Logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Header;
