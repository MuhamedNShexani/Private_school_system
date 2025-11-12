import React, { useEffect, useState } from "react";
import { X, Check, AlertCircle, Info } from "lucide-react";
import "./Toast.css";

const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      case "info":
        return <Info size={20} />;
      default:
        return <Check size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "info":
        return "#3b82f6";
      default:
        return "#10b981";
    }
  };

  return (
    <div
      className={`toast ${type} ${isVisible ? "toast-enter" : "toast-exit"}`}
      style={{
        backgroundColor: getBackgroundColor(),
      }}
    >
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close"
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;

