import React, { useState } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import { deleteBenchSalesApplication } from "../api/applicationApi";
import "./DeleteConfirmation.css";

const DeleteConfirmation = ({
  title = "Delete Application",
  message = "Are you sure you want to delete this application? This action cannot be undone.",
  onClose, applicationId, refreshData, deleteAction = deleteBenchSalesApplication
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    try {
        setLoading(true);

        const response = await deleteAction(applicationId);

        if (response.success) {
            refreshData?.();
            onClose();
        } else {
            alert(response.message);
        }
    } catch (error) {
        console.error(error);
        alert(
            error?.response?.data?.message ||
            "Failed to delete application."
        );
    } finally {
        setLoading(false);
    }
};

  return (
      <div className="delete-modal">
        <div className="delete-icon">
          <FiTrash2 />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="delete-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
  );
};

export default DeleteConfirmation;
