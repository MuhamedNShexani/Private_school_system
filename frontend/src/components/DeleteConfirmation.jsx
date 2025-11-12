import React from "react";
import { Trash2, X } from "lucide-react";
import "./DeleteConfirmation.css";

const DeleteConfirmation = ({
  isOpen,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <button
          className="delete-modal-close"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <Trash2 size={32} />
          </div>
          <h2>{title}</h2>
        </div>

        <p className="delete-modal-message">{message}</p>

        <div className="delete-modal-footer">
          <button
            className="delete-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="delete-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;

