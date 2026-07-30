import { useEffect, useState } from "react";
import { FiAlertCircle, FiBriefcase, FiCheckCircle, FiX } from "react-icons/fi";
import { createJob, getJobById, updateJob } from "../api/jobApi";
import "./JobForm.css";

const EMPTY_JOB = {
  position: "",
  location: "",
  duration: "",
  domain: "",
  interview_process: "",
  rate: "",
  visa: "",
  job_description: "",
  status: "Open",
};

const JobForm = ({ jobId, isEdit = false, onClose, refreshData }) => {
  const [formData, setFormData] = useState(EMPTY_JOB);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isEdit || !jobId) return;
    let active = true;

    const loadJob = async () => {
      try {
        setLoading(true);
        const response = await getJobById(jobId);
        if (active && response.success) {
          const job = response.data || {};
          setFormData(Object.keys(EMPTY_JOB).reduce(
            (values, key) => ({ ...values, [key]: job[key] ?? EMPTY_JOB[key] }),
            {}
          ));
        }
      } catch (error) {
        if (active) setSubmitError(error?.response?.data?.message || "Job could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadJob();
    return () => { active = false; };
  }, [isEdit, jobId]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.position.trim()) nextErrors.position = "Position is required.";
    if (!formData.job_description.trim()) nextErrors.job_description = "Job description is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !validate()) return;

    try {
      setSaving(true);
      setSubmitError("");
      const response = isEdit
        ? await updateJob(jobId, formData)
        : await createJob(formData);

      if (!response.success) {
        setSubmitError(response.message || "Job could not be saved.");
        return;
      }

      await refreshData?.();
      if (response.warning) alert(response.warning);
      onClose?.();
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
        error?.message ||
        `Failed to ${isEdit ? "update" : "create"} job.`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="job-form">
      <div className="job-form-heading">
        <div><FiBriefcase /><h2>{isEdit ? "Edit Job" : "Add New Job"}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close"><FiX /></button>
      </div>

      {loading ? <div className="job-form-state">Loading job...</div> : (
        <form onSubmit={handleSubmit}>
          {submitError && <div role="alert" className="job-form-error"><FiAlertCircle />{submitError}</div>}
          <div className="job-form-grid">
            <Field label="Position *" error={errors.position}>
              <input name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Senior React Developer" />
            </Field>
            <Field label="Location">
              <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Dallas, TX / Remote" />
            </Field>
            <Field label="Duration">
              <input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 12 months" />
            </Field>
            <Field label="Domain">
              <input name="domain" value={formData.domain} onChange={handleChange} placeholder="e.g. Healthcare" />
            </Field>
            <Field label="Interview Process">
              <input name="interview_process" value={formData.interview_process} onChange={handleChange} placeholder="e.g. Screening, Technical, Client" />
            </Field>
            <Field label="Rate">
              <input name="rate" value={formData.rate} onChange={handleChange} placeholder="e.g. $70/hr" />
            </Field>
            <Field label="Visa">
              <input name="visa" value={formData.visa} onChange={handleChange} placeholder="e.g. USC, GC, H1B" />
            </Field>
            <Field label="Status">
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="Active">Active</option>
                <option value="Hold">Hold</option>
                <option value="Closed">Closed</option>
              </select>
            </Field>
            <Field label="Job Description *" error={errors.job_description} fullWidth>
              <textarea name="job_description" value={formData.job_description} onChange={handleChange} rows="9" placeholder="Enter the complete job description used for AI candidate matching" />
            </Field>
          </div>
          <div className="job-form-actions">
            <button type="button" className="job-form-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="job-form-save" disabled={saving}>
              <FiCheckCircle /> {saving ? (isEdit ? "Updating job..." : "Saving job...") : (isEdit ? "Update Job" : "Create Job")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const Field = ({ label, error, fullWidth = false, children }) => (
  <label className={`job-form-field${fullWidth ? " full-width" : ""}`}>
    <span>{label}</span>{children}{error && <small>{error}</small>}
  </label>
);

export default JobForm;
