import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import "./DeleteConfirmation.css";

const RecordDeleteConfirmation = ({ entityName, recordName, onDelete, onClose, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await onDelete();
      if (!response.success) {
        setError(response.message || `Failed to delete ${entityName}.`);
        return;
      }
      await refreshData?.();
      onClose?.();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || `Failed to delete ${entityName}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-modal">
      <div className="delete-icon"><FiTrash2 /></div>
      <h2>Delete {entityName}</h2>
      <p>Are you sure you want to delete <strong>{recordName || `this ${entityName.toLowerCase()}`}</strong>? This action cannot be undone.</p>
      {error && <div role="alert" className="delete-error">{error}</div>}
      <div className="delete-actions">
        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
        <button type="button" className="delete-btn" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</button>
      </div>
    </div>
  );
};

export default RecordDeleteConfirmation;
