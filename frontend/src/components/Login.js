import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../contexts/TranslationContext";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const { currentLanguage, changeLanguage, languages } = useTranslation();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-language-selector">
          <select 
            value={currentLanguage} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-select"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="login-logo-section">
          <img src="/logo.jpg" alt="School Logo" className="login-logo" />
          <h2>{t("login.schoolName", "CLEVER PRIVATE HIGH SCHOOL")}</h2>
        </div>
        <h3>{t("login.title", "Login")}</h3>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t("login.emailLabel", "Email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t("login.emailPlaceholder", "Enter your email")}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("login.passwordLabel", "Password")}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t("login.passwordPlaceholder", "Enter your password")}
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? t("login.loggingIn", "Logging in...") : t("login.submitButton", "Login")}
          </button>
        </form>

        <div className="demo-credentials">
          <h4>{t("login.demoCredentials", "Demo Credentials:")}</h4>
          <p>
            <strong>{t("login.demoAdmin", "Admin")}:</strong> admin@platform.com / admin123
          </p>
          <p>
            <strong>{t("login.demoTeacher", "Teacher")}:</strong> teacher@platform.com / teacher123
          </p>
          <p>
            <strong>{t("login.demoStudent", "Student")}:</strong> student@platform.com / student123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
