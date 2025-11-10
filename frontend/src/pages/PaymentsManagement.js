import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { studentsAPI } from "../services/api";
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import "./PaymentsManagement.css";

const PaymentsManagement = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const hasPermission = isAdmin || isTeacher;

  useEffect(() => {
    if (hasPermission) {
      fetchStudents();
    }
  }, [hasPermission]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async (studentId, newStatus) => {
    try {
      const student = students.find((s) => s._id === studentId);
      if (!student) return;

      const updatedStudent = {
        ...student,
        paymentStatus: newStatus,
      };

      await studentsAPI.update(studentId, updatedStudent);

      // Update local state
      setStudents(
        students.map((s) =>
          s._id === studentId ? { ...s, paymentStatus: newStatus } : s
        )
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
      setError("Failed to update payment status");
    }
  };

  const handleBulkUpdate = async (status) => {
    if (
      !window.confirm(
        `Are you sure you want to mark all filtered students as ${status}?`
      )
    ) {
      return;
    }

    try {
      const filteredStudents = getFilteredStudents();
      const updatePromises = filteredStudents
        .filter((student) => student.paymentStatus !== status)
        .map((student) =>
          studentsAPI.update(student._id, { ...student, paymentStatus: status })
        );

      await Promise.all(updatePromises);
      fetchStudents();
    } catch (error) {
      console.error("Error updating payment statuses:", error);
      setError("Failed to update payment statuses");
    }
  };

  const getFilteredStudents = () => {
    return students.filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.studentNumber &&
          student.studentNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      const matchesFilter =
        paymentFilter === "all" || student.paymentStatus === paymentFilter;
      return matchesSearch && matchesFilter;
    });
  };

  const getPaymentStats = () => {
    const total = students.length;
    const paid = students.filter((s) => s.paymentStatus === "Paid").length;
    const unpaid = students.filter((s) => s.paymentStatus === "Unpaid").length;
    const partial = students.filter(
      (s) => s.paymentStatus === "Partial"
    ).length;

    return { total, paid, unpaid, partial };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Paid":
        return <CheckCircle size={16} className="status-icon paid" />;
      case "Unpaid":
        return <XCircle size={16} className="status-icon unpaid" />;
      case "Partial":
        return <AlertCircle size={16} className="status-icon partial" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "paid";
      case "Unpaid":
        return "unpaid";
      case "Partial":
        return "partial";
      default:
        return "";
    }
  };

  const stats = getPaymentStats();
  const filteredStudents = getFilteredStudents();

  if (!hasPermission) {
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
          <p>Loading payment data...</p>
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
            Payment Management
          </h1>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="payment-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card paid">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.paid}</h3>
            <p>Paid</p>
          </div>
        </div>
        <div className="stat-card partial">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.partial}</h3>
            <p>Partial</p>
          </div>
        </div>
        <div className="stat-card unpaid">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.unpaid}</h3>
            <p>Unpaid</p>
          </div>
        </div>
      </div>

      <div className="payments-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <Filter size={20} />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <div className="bulk-actions">
          <button
            onClick={() => handleBulkUpdate("Paid")}
            className="bulk-btn paid"
            disabled={filteredStudents.length === 0}
          >
            Mark All as Paid
          </button>
          <button
            onClick={() => handleBulkUpdate("Unpaid")}
            className="bulk-btn unpaid"
            disabled={filteredStudents.length === 0}
          >
            Mark All as Unpaid
          </button>
        </div>
      </div>

      <div className="students-table">
        <div className="table-header">
          <div className="col-name">Student Name</div>
          <div className="col-id">Student ID</div>
          <div className="col-class">Class</div>
          <div className="col-status">Payment Status</div>
          <div className="col-actions">Actions</div>
        </div>
        <div className="table-body">
          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <DollarSign size={48} />
              <h3>No students found</h3>
              <p>
                {searchTerm || paymentFilter !== "all"
                  ? "No students match your current filters."
                  : "No students have been registered yet."}
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student._id} className="table-row">
                <div className="col-name">
                  <div className="student-info">
                    <div className="student-avatar">
                      {student.photo ? (
                        <img src={student.photo} alt={student.fullName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="student-name">{student.fullName}</span>
                  </div>
                </div>
                <div className="col-id">{student.studentNumber || "No ID"}</div>
                <div className="col-class">
                  {student.class?.name?.en || student.class?.name || "No Class"}
                </div>
                <div className="col-status">
                  <div
                    className={`payment-status ${getStatusColor(
                      student.paymentStatus
                    )}`}
                  >
                    {getStatusIcon(student.paymentStatus)}
                    <span>{student.paymentStatus}</span>
                  </div>
                </div>
                <div className="col-actions">
                  <select
                    value={student.paymentStatus}
                    onChange={(e) =>
                      handlePaymentStatusUpdate(student._id, e.target.value)
                    }
                    className="status-select"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsManagement;
