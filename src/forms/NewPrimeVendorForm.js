import { useEffect, useState } from "react";
import { FiUploadCloud, FiX } from "react-icons/fi";
import {
  createPrimeVendor,
  getPrimeVendorById,
  updatePrimeVendor,
} from "../api/primeVendorApi";
import "../styles/primevendorform.css";

const EMPTY_VENDOR = {
  vcompany: "",
  rname: "",
  phone: "",
  documents: "",
  email: "",
  fax: "",
  caddress: "",
  blocation: "",
  feedback: "",
};

function PrimeVendorForm({ closePopup, vendorId = null, mode = "create", refreshData }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState(EMPTY_VENDOR);
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(isView || isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vendorId || (!isView && !isEdit)) return;
    let active = true;

    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getPrimeVendorById(vendorId);

        if (active && response.success) {
          const vendor = response.data || {};
          setFormData(
            Object.keys(EMPTY_VENDOR).reduce(
              (values, key) => ({ ...values, [key]: vendor[key] || "" }),
              {}
            )
          );
        } else if (active) {
          setError(response.message || "Prime vendor could not be loaded.");
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message || "Prime vendor could not be loaded."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchVendor();
    return () => { active = false; };
  }, [vendorId, isEdit, isView]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || isView) return;

    if (!formData.vcompany.trim()) {
      setError("Vendor company is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      let payload = { ...formData };

      if (documentFile) {
        payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== "documents") payload.append(key, value);
        });
        payload.append("documents", documentFile);
      }

      const response = isEdit
        ? await updatePrimeVendor(vendorId, payload)
        : await createPrimeVendor(payload);

      if (!response.success) {
        setError(response.message || "The operation failed.");
        return;
      }

      refreshData?.();
      closePopup?.();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} prime vendor.`
      );
    } finally {
      setSaving(false);
    }
  };

  const title = isView ? "Prime Vendor Details" : isEdit ? "Edit Prime Vendor" : "Add Prime Vendor";

  return (
    <div className="primevendor_form_overlay" onMouseDown={closePopup}>
      <div
        className="primevendor_form_modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="primevendor-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="primevendor_form_header">
          <div>
            <h2 id="primevendor-form-title">{title}</h2>
            <p>{isView ? "Vendor profile information" : "Enter vendor and recruiter details"}</p>
          </div>
          <button type="button" className="primevendor_close_btn" onClick={closePopup} aria-label="Close">
            <FiX />
          </button>
        </div>

        {loading ? (
          <div className="primevendor_form_state">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="primevendor_form_error">{error}</div>}
            <div className="primevendor_form_grid">
              <Field label="Vendor Company *" id="prime-vcompany">
                <input id="prime-vcompany" name="vcompany" value={formData.vcompany} onChange={handleChange} placeholder="Enter vendor company" required disabled={isView} />
              </Field>
              <Field label="Recruiter Name" id="prime-rname">
                <input id="prime-rname" name="rname" value={formData.rname} onChange={handleChange} placeholder="Enter recruiter name" disabled={isView} />
              </Field>
              <Field label="Phone Number" id="prime-phone">
                <input id="prime-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" disabled={isView} />
              </Field>
              <Field label="Email" id="prime-email">
                <input id="prime-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" disabled={isView} />
              </Field>
              <Field label="Fax" id="prime-fax">
                <input id="prime-fax" name="fax" value={formData.fax} onChange={handleChange} placeholder="Enter fax number" disabled={isView} />
              </Field>
              <Field label="Business Location" id="prime-location">
                <input id="prime-location" name="blocation" value={formData.blocation} onChange={handleChange} placeholder="Enter business location" disabled={isView} />
              </Field>
              <Field label="Company Address" id="prime-address" fullWidth>
                <textarea id="prime-address" name="caddress" rows="3" value={formData.caddress} onChange={handleChange} placeholder="Enter company address" disabled={isView} />
              </Field>
              <Field label="Feedback" id="prime-feedback" fullWidth>
                <textarea id="prime-feedback" name="feedback" rows="3" value={formData.feedback} onChange={handleChange} placeholder="Enter feedback" disabled={isView} />
              </Field>
            </div>

            <div className="primevendor_document_section">
              <label>Documents</label>
              {formData.documents && <p className="primevendor_existing_document">Current: {formData.documents}</p>}
              {!isView && (
                <label className="primevendor_upload" htmlFor="prime-documents">
                  <FiUploadCloud size={24} />
                  <span>{documentFile?.name || "Choose a document"}</span>
                  <input id="prime-documents" name="documents" type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} hidden />
                </label>
              )}
              {isView && !formData.documents && <p>No document available</p>}
            </div>

            <div className="primevendor_form_actions">
              <button type="button" className="primevendor_cancel_btn" onClick={closePopup}>{isView ? "Close" : "Cancel"}</button>
              {!isView && (
                <button type="submit" className="primevendor_save_btn" disabled={saving}>
                  {saving ? "Saving..." : isEdit ? "Update Vendor" : "Save Vendor"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, id, fullWidth = false, children }) {
  return (
    <div className={`primevendor_form_group${fullWidth ? " primevendor_full_width" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export default PrimeVendorForm;
