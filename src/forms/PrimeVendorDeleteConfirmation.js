import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { deletePrimeVendor } from "../api/primeVendorApi";
import "./DeleteConfirmation.css";

function PrimeVendorDeleteConfirmation({ vendorId, vendorName, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await deletePrimeVendor(vendorId);
      if (!response.success) {
        setError(response.message || "Failed to delete prime vendor.");
        return;
      }
      onDeleted?.();
      onClose?.();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to delete prime vendor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="primevendor_form_overlay" onMouseDown={onClose}>
      <div className="delete-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="delete-icon"><FiTrash2 /></div>
        <h2>Delete Prime Vendor</h2>
        <p>
          Are you sure you want to delete {vendorName ? `“${vendorName}”` : "this vendor"}?
          This action cannot be undone.
        </p>
        {error && <div className="primevendor_form_error">{error}</div>}
        <div className="delete-actions">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="delete-btn" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

export default PrimeVendorDeleteConfirmation;
