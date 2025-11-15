import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
  DollarSign,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import "./Header.css";

const Header = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, languages, changeLanguage } = useTranslation();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  const isRTL = currentLanguage === "ku" || currentLanguage === "ar";
  const userRole = user?.role;
  const isTeacher = userRole === "Teacher";
  const isStudent = userRole === "Student";
  const isAdmin = userRole === "Admin";
  const isStudentProfilePage = location.pathname === "/student/profile";

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
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target)
      ) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isProfileOpen || isLanguageDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen, isLanguageDropdownOpen]);

  // Force re-render when language changes
  useEffect(() => {
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
      sidebarRef.current.style.left = "0";
      sidebarRef.current.style.right = "auto";
      sidebarRef.current.style.borderRight = "1px solid #e2e8f0";
      sidebarRef.current.style.borderLeft = "none";

      const mainContent = document.querySelector(".main-content");
      if (mainContent) {
        mainContent.style.marginLeft = "280px";
        mainContent.style.marginRight = "0";
      }
    }
  }, [currentLanguage, isRTL]);

  // Debug language detection

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
        {!isStudentProfilePage && (
          <header className="student-top-bar">
            <Link to="/student/profile" className="student-logo">
              <img
                src="/logo.jpg"
                alt="School Logo"
                className="student-logo-img"
              />
              <span>{t("app.schoolName", "CLEVER PRIVATE HIGH SCHOOL")}</span>
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
        )}

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
      {/* Mobile Top Navbar */}
      <header className="mobile-top-navbar">
        <Link to="/" className="mobile-logo">
          <img src="/logo.jpg" alt="School Logo" className="mobile-logo-img" />
          <span className="mobile-school-name">
            {t("app.schoolName", "CLEVER PRIVATE HIGH SCHOOL")}
          </span>
        </Link>
        <div className="mobile-nav-actions">
          {/* Language Switcher */}
          <div className="mobile-language-switcher" ref={languageDropdownRef}>
            <button
              className="mobile-language-badge"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              title="Change Language"
            >
              {languages.find((l) => l.code === currentLanguage)?.flag}
            </button>
            {isLanguageDropdownOpen && (
              <div className="mobile-language-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`mobile-language-item ${
                      lang.code === currentLanguage ? "active" : ""
                    }`}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsLanguageDropdownOpen(false);
                    }}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Logout Button */}
          <button onClick={handleLogout} className="mobile-logout-btn">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Vertical Sidebar */}
      <aside ref={sidebarRef} className="sidebar">
        {/* School Logo - Top */}
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <img
              src="/logo.jpg"
              alt="School Logo"
              className="sidebar-logo-img"
            />
            <span>{t("app.schoolName", "CLEVER PRIVATE HIGH SCHOOL")}</span>
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
            <Link
              to="/admin/payments"
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
              <DollarSign size={20} />
              <span>{t("nav.payments", "Payments")}</span>
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

        {/* User Profile Section - Bottom of Sidebar */}
        <div className="sidebar-user-section">
          <div className="user-profile-card">
            {/* Top Section: User Info + Language */}
            <div className="profile-top">
              <div className="user-header">
                <div className="user-avatar">
                  <User size={24} />
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="user-role">{user?.role}</div>
                </div>
              </div>

              {/* Language Selector in Profile */}
              <div className="profile-language" ref={languageDropdownRef}>
                <button
                  className="language-badge"
                  onClick={() =>
                    setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                  }
                  title="Change Language"
                >
                  {languages.find((l) => l.code === currentLanguage)?.flag}
                </button>
                {isLanguageDropdownOpen && (
                  <div className="language-dropdown-menu">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`language-dropdown-item ${
                          lang.code === currentLanguage ? "active" : ""
                        }`}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setIsLanguageDropdownOpen(false);
                        }}
                      >
                        <span className="lang-flag">{lang.flag}</span>
                        <span className="lang-name">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Logout */}
            <button onClick={handleLogout} className="profile-logout">
              <LogOut size={16} />
              <span>{t("btn.logout", "Logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-content">
            {/* Top bar is now minimal - user settings moved to sidebar */}
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Header;
