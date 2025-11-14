import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import { useToast } from "../contexts/ToastContext";
import { studentsAPI, classesAPI } from "../services/api";
import {
  DollarSign,
  Calendar,
  User,
  GraduationCap,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PaymentsManagement.css";

const UpdatePayment = () => {
  const { isAdmin } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

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

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    classId: "",
    branchId: "",
    studentId: "",
    paymentType: "first",
    date: new Date().toISOString().split("T")[0],
    paid: true,
  });

  // Available branches based on selected class
  const availableBranches = useMemo(() => {
    if (!formData.classId) return [];
    const selectedClass = classes.find((cls) => cls._id === formData.classId);
    return selectedClass?.branches || [];
  }, [formData.classId, classes]);

  // Available students based on selected class and branch
  const availableStudents = useMemo(() => {
    let filtered = students;

    if (formData.classId) {
      filtered = filtered.filter((student) => {
        const studentClassId =
          typeof student.class === "object"
            ? student.class?._id?.toString()
            : student.class?.toString();
        return studentClassId === formData.classId;
      });
    }

    if (formData.branchId) {
      filtered = filtered.filter((student) => {
        const studentBranchId =
          typeof student.branchID === "object"
            ? student.branchID?._id?.toString()
            : student.branchID?.toString();
        return studentBranchId === formData.branchId;
      });
    }

    return filtered;
  }, [formData.classId, formData.branchId, students]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll({ lang: currentLanguage }),
        studentsAPI.getAll(),
      ]);

      // Ensure we always set arrays
      let classesData = [];
      let studentsData = [];

      // Handle classes - check various possible response formats
      if (Array.isArray(classesRes?.data)) {
        classesData = classesRes.data;
      } else if (
        classesRes?.data?.data &&
        Array.isArray(classesRes.data.data)
      ) {
        classesData = classesRes.data.data;
      } else if (Array.isArray(classesRes)) {
        classesData = classesRes;
      }

      // Handle students - check various possible response formats
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

      setClasses(classesData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
      showError("Failed to load payment data");
      setClasses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Reset dependent fields when parent changes
      if (name === "classId") {
        newData.branchId = "";
        newData.studentId = "";
      } else if (name === "branchId") {
        newData.studentId = "";
      }

      return newData;
    });
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

  // Get selected student
  const selectedStudent = students.find((s) => s._id === formData.studentId);

  // Check if student already paid for selected payment type
  const alreadyPaid =
    formData.studentId && selectedStudent && formData.paymentType === "first"
      ? selectedStudent.firstPayment
      : formData.studentId &&
        selectedStudent &&
        formData.paymentType === "second"
      ? selectedStudent.secondPayment
      : false;

  const alreadyPaidDate =
    formData.paymentType === "first"
      ? selectedStudent?.firstPaymentDate
      : selectedStudent?.secondPaymentDate;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.classId || !formData.branchId || !formData.studentId) {
      showError("Please select class, branch, and student");
      return;
    }

    try {
      const response = await studentsAPI.updatePayment(
        formData.studentId,
        formData.paymentType,
        formData.paid,
        formData.date
      );

      success("Payment status updated successfully");

      // Reset form
      setFormData({
        classId: "",
        branchId: "",
        studentId: "",
        paymentType: "first",
        date: new Date().toISOString().split("T")[0],
        paid: true,
      });

      // Navigate back after success
      setTimeout(() => {
        navigate("/admin/payments");
      }, 1500);
    } catch (error) {
      console.error("Error updating payment:", error);
      console.error("Request URL:", error.config?.url);
      console.error("Request method:", error.config?.method);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      showError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          `Failed to update payment status: ${error.message}`
      );
    }
  };

  if (!isAdmin) {
    return (
      <div className="payments-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payments-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={() => navigate("/admin/payments")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "transparent",
            color: "#6366f1",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ArrowLeft size={20} />
          Back to Payments
        </button>
      </div>

      <div className="payment-form-section">
        <h1
          style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <DollarSign size={32} />
          Update Payment Status
        </h1>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="classId">
                <GraduationCap size={18} />
                {t("admin.class", "Class")}
              </label>
              <select
                id="classId"
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                required
              >
                <option value="">
                  {t("admin.selectClass", "Select Class")}
                </option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {getLocalizedText(cls.nameMultilingual || cls.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="branchId">
                <Building2 size={18} />
                {t("admin.branch", "Branch")}
              </label>
              <select
                id="branchId"
                name="branchId"
                value={formData.branchId}
                onChange={handleInputChange}
                required
                disabled={!formData.classId}
              >
                <option value="">
                  {t("admin.selectBranch", "Select Branch")}
                </option>
                {availableBranches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {getLocalizedText(branch.nameMultilingual || branch.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">
                <User size={18} />
                {t("admin.student", "Student")}
              </label>
              <select
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                required
                disabled={!formData.branchId}
              >
                <option value="">
                  {t("admin.selectStudent", "Select Student")}
                </option>
                {Array.isArray(availableStudents) &&
                  availableStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.fullName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentType">
                <DollarSign size={18} />
                {t("admin.paymentType", "Payment Type")}
              </label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                required
              >
                <option value="first">
                  {t("admin.firstPayment", "First Payment")}
                </option>
                <option value="second">
                  {t("admin.secondPayment", "Second Payment")}
                </option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">
                <Calendar size={18} />
                {t("admin.date", "Date")}
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paid">
                <DollarSign size={18} />
                {t("admin.paymentStatus", "Payment Status")}
              </label>
              <select
                id="paid"
                name="paid"
                value={formData.paid ? "true" : "false"}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    paid: e.target.value === "true",
                  }));
                }}
                required
              >
                <option value="true">{t("admin.paid", "Paid")}</option>
                <option value="false">{t("admin.unpaid", "Unpaid")}</option>
              </select>
            </div>
          </div>

          {alreadyPaid && alreadyPaidDate && (
            <div
              style={{
                padding: "16px",
                background: "#dbeafe",
                border: "1px solid #93c5fd",
                borderRadius: "8px",
                color: "#1e40af",
                fontSize: "0.95rem",
                fontWeight: "500",
                marginBottom: "20px",
              }}
            >
              ✓ This student already paid{" "}
              {formData.paymentType === "first"
                ? "first payment"
                : "second payment"}{" "}
              on {formatDate(alreadyPaidDate)}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {t("admin.updatePayment", "Update Payment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePayment;
