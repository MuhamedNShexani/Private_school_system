import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import { useToast } from "../contexts/ToastContext";
import { studentsAPI } from "../services/api";
import { DollarSign, CheckCircle, XCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import "./PaymentsManagement.css";

const PaymentsManagement = () => {
  const { isAdmin } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { error: showError } = useToast();

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

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ensure students is always an array (defensive check)
  const safeStudents = Array.isArray(students) ? students : [];

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentsRes = await studentsAPI.getAll();

      // Handle students - check various possible response formats
      let studentsData = [];
      if (Array.isArray(studentsRes?.data)) {
        studentsData = studentsRes.data;
      } else if (
        studentsRes?.data?.data &&
        Array.isArray(studentsRes.data.data)
      ) {
        studentsData = studentsRes.data.data;
      } else if (Array.isArray(studentsRes)) {
        studentsData = studentsRes;
      }

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
      showError("Failed to load payment data");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "-";
    }
  };

  const getPaymentStatus = (student) => {
    const first = student.firstPayment ? (
      <CheckCircle size={16} className="status-icon paid" />
    ) : (
      <XCircle size={16} className="status-icon unpaid" />
    );
    const second = student.secondPayment ? (
      <CheckCircle size={16} className="status-icon paid" />
    ) : (
      <XCircle size={16} className="status-icon unpaid" />
    );
    return { first, second };
  };

  if (!isAdmin) {
    return (
      <div className="payments-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access payment management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payments-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t("general.loading", "Loading ... ")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <div className="payments-header">
        <div className="header-content">
          <h1>
            <DollarSign size={32} />
            {t("nav.payments", "Payment Management")}
          </h1>
          <Link
            to="/admin/payments/update"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #10b981, #047857)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 25px rgba(16, 185, 129, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={20} />
            {t("admin.updatePayment", "Update Payment")}
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="payment-summary-section">
        <h2>{t("payment.paymentsummary", "Payment Summary")}</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-label">
              {t("payment.totalstudent", "Total Students")}
            </div>
            <div className="stat-value">{safeStudents.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {t("payment.firstpaymentpaid", "First Payment Paid")}
            </div>
            <div className="stat-value">
              {Array.isArray(safeStudents)
                ? safeStudents.filter((s) => s.firstPayment).length
                : 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {t("payment.secondpaymentpaid", "Second Payment Paid")}
            </div>
            <div className="stat-value">
              {Array.isArray(safeStudents)
                ? safeStudents.filter((s) => s.secondPayment).length
                : 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {t("payment.bothpaymentspaid", "Both Payments Paid")}
            </div>
            <div className="stat-value">
              {Array.isArray(safeStudents)
                ? safeStudents.filter((s) => s.firstPayment && s.secondPayment)
                    .length
                : 0}
            </div>
          </div>
        </div>
      </div>

      <div className="students-payment-table">
        <h2>{t("payment.studentpaymentstatus", "Students Payment Status")}</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("admin.studentName", "Student Name")}</th>
                <th>{t("admin.class", "Class")}</th>
                <th>{t("admin.branch", "Branch")}</th>
                <th>{t("admin.firstPayment", "First Payment")}</th>
                <th>{t("admin.secondPayment", "Second Payment")}</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(safeStudents) || safeStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No students found
                  </td>
                </tr>
              ) : (
                safeStudents.map((student) => {
                  const status = getPaymentStatus(student);
                  return (
                    <tr key={student._id}>
                      <td>{student.fullName}</td>
                      <td>
                        {getLocalizedText(
                          student.class?.nameMultilingual || student.class?.name
                        )}
                      </td>
                      <td>
                        {(() => {
                          // Find branch in class.branches array
                          if (student.class?.branches && student.branchID) {
                            const branchIdStr =
                              typeof student.branchID === "object"
                                ? student.branchID?._id?.toString()
                                : student.branchID?.toString();
                            const branch = student.class.branches.find(
                              (b) =>
                                (b._id?.toString() || b._id) === branchIdStr
                            );
                            if (branch) {
                              return getLocalizedText(
                                branch.nameMultilingual || branch.name
                              );
                            }
                          }
                          return "-";
                        })()}
                      </td>
                      <td className="status-cell">
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {status.first}
                          {student.firstPayment && (
                            <span
                              style={{ fontSize: "0.75rem", color: "#64748b" }}
                            >
                              {formatDate(student.firstPaymentDate)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="status-cell">
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {status.second}
                          {student.secondPayment && (
                            <span
                              style={{ fontSize: "0.75rem", color: "#64748b" }}
                            >
                              {formatDate(student.secondPaymentDate)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsManagement;
