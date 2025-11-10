import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { translationsAPI } from "../services/api";
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";

const TranslationManagement = () => {
  const { t, languages } = useTranslation();
  const [translations, setTranslations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [formData, setFormData] = useState({
    key: "",
    translations: {
      en: "",
      ar: "",
      ku: "",
    },
    category: "general",
    description: "",
    isActive: true,
  });

  const fetchTranslations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== "all") params.category = selectedCategory;

      const response = await translationsAPI.getAllAdmin(params);

      if (response.data.success) {
        setTranslations(response.data.data);
        setTotalPages(response.data.pagination.pages);
      } else {
        throw new Error("Failed to load translations");
      }
    } catch (err) {
      setError("Failed to load translations");
      console.error("Error fetching translations:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await translationsAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const openModal = (translation = null) => {
    if (translation) {
      setEditingTranslation(translation);
      setFormData({
        key: translation.key,
        translations: translation.translations,
        category: translation.category,
        description: translation.description || "",
        isActive: translation.isActive,
      });
    } else {
      setEditingTranslation(null);
      setFormData({
        key: "",
        translations: { en: "", ar: "", ku: "" },
        category: "general",
        description: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTranslation(null);
    setFormData({
      key: "",
      translations: { en: "", ar: "", ku: "" },
      category: "general",
      description: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTranslation) {
        await translationsAPI.update(editingTranslation._id, formData);
      } else {
        await translationsAPI.create(formData);
      }
      closeModal();
      fetchTranslations();
    } catch (err) {
      console.error("Error saving translation:", err);
      setError("Failed to save translation");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this translation?")) {
      try {
        await translationsAPI.delete(id);
        fetchTranslations();
      } catch (err) {
        console.error("Error deleting translation:", err);
        setError("Failed to delete translation");
      }
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await translationsAPI.updateStatus(id, !currentStatus);
      fetchTranslations();
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith("translations.")) {
      const lang = field.split(".")[1];
      setFormData({
        ...formData,
        translations: {
          ...formData.translations,
          [lang]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  if (loading && translations.length === 0) {
    return (
      <div className="loading">
        <div>{t("msg.loading", "Loading...")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>
            <Globe
              size={32}
              style={{ marginRight: "12px", verticalAlign: "middle" }}
            />
            {t("admin.translations.title", "Translation Management")}
          </h1>
          <p>
            {t(
              "admin.translations.subtitle",
              "Manage system translations for multiple languages"
            )}
          </p>
        </div>
      </div>

      <div className="container">
        {error && <div className="error">{error}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder={t(
                "admin.translations.search",
                "Search translations..."
              )}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={16} />
            {t("admin.translations.add_new", "Add New Translation")}
          </button>
        </div>

        {/* Translations Table */}
        <div className="translations-table-container">
          <table className="translations-table">
            <thead>
              <tr>
                <th>{t("admin.translations.key", "Key")}</th>
                <th>{t("admin.translations.english", "English")}</th>
                <th>{t("admin.translations.arabic", "Arabic")}</th>
                <th>{t("admin.translations.kurdish", "Kurdish")}</th>
                <th>{t("admin.translations.category", "Category")}</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {translations.map((translation) => (
                <tr key={translation._id}>
                  <td>
                    <div className="translation-key">
                      <strong>{translation.key}</strong>
                      {translation.description && (
                        <small>{translation.description}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="translation-text en">
                      {translation.translations.en}
                    </div>
                  </td>
                  <td>
                    <div className="translation-text ar" dir="rtl">
                      {translation.translations.ar}
                    </div>
                  </td>
                  <td>
                    <div className="translation-text ku" dir="rtl">
                      {translation.translations.ku}
                    </div>
                  </td>
                  <td>
                    <span className={`category-badge ${translation.category}`}>
                      {translation.category}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`status-btn ${
                        translation.isActive ? "active" : "inactive"
                      }`}
                      onClick={() =>
                        handleStatusToggle(
                          translation._id,
                          translation.isActive
                        )
                      }
                      title={translation.isActive ? "Deactivate" : "Activate"}
                    >
                      {translation.isActive ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon edit"
                        onClick={() => openModal(translation)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(translation._id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal translation-modal">
            <div className="modal-header">
              <h2>
                {editingTranslation
                  ? "Edit Translation"
                  : "Add New Translation"}
              </h2>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Translation Key</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => handleInputChange("key", e.target.value)}
                    required
                    placeholder="e.g., nav.home"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Optional description"
                />
              </div>

              <div className="translations-inputs">
                {languages.map((lang) => (
                  <div key={lang.code} className="form-group">
                    <label>
                      {lang.flag} {lang.name}
                    </label>
                    <textarea
                      value={formData.translations[lang.code]}
                      onChange={(e) =>
                        handleInputChange(
                          `translations.${lang.code}`,
                          e.target.value
                        )
                      }
                      required
                      rows="2"
                      dir={lang.dir}
                    />
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editingTranslation ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .filters-section {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 250px;
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-box svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group select {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .translations-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          margin-bottom: 24px;
        }

        .translations-table {
          width: 100%;
          border-collapse: collapse;
        }

        .translations-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e2e8f0;
        }

        .translations-table td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }

        .translation-key strong {
          display: block;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .translation-key small {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .translation-text {
          max-width: 200px;
          word-wrap: break-word;
        }

        .translation-text.ar,
        .translation-text.ku {
          text-align: right;
        }

        .category-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .category-badge.general {
          background: #e5e7eb;
          color: #374151;
        }
        .category-badge.navigation {
          background: #dbeafe;
          color: #1e40af;
        }
        .category-badge.forms {
          background: #d1fae5;
          color: #065f46;
        }
        .category-badge.buttons {
          background: #fef3c7;
          color: #92400e;
        }
        .category-badge.messages {
          background: #fce7f3;
          color: #be185d;
        }
        .category-badge.labels {
          background: #e0e7ff;
          color: #3730a3;
        }
        .category-badge.programs {
          background: #ecfdf5;
          color: #047857;
        }
        .category-badge.admin {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .status-btn {
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .status-btn.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-btn.inactive {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-btn:hover {
          transform: scale(1.05);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-icon.edit {
          background: #fef3c7;
          color: #92400e;
        }

        .btn-icon.delete {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-icon:hover {
          transform: scale(1.05);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }

        .pagination button {
          padding: 8px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination button:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .translation-modal {
          max-width: 800px;
        }

        .translations-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin: 16px 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default TranslationManagement;
