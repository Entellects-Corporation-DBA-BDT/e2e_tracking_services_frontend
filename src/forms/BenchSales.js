import React, { useEffect, useState } from "react";
import {
  createBenchSalesApplication,
  getBenchSalesById,
  updateBenchSalesApplication
} from "../api/applicationApi.js";
import { getCandidateData } from "../api/candidateApi.js";
import {
  FiCalendar,
  FiUser,
  FiMapPin,
  FiUploadCloud,
} from "react-icons/fi";

import "./BenchSales.css";
import "./RecruiterApplicationForm.css";

const BenchSales = ({ onClose, applicationId, isEdit = false, refreshData }) => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [formData, setFormData] = useState({
    date_created: today,
    candidate_id: "",
    candidate_name: "",
    vendor: "",
    poc: "",
    feedback: "",
    client: "",
    emp_loc: "",
    rate: "",
    role: "",
    candidate_loc: "",
    remarks: "",
  });

  const [files, setFiles] = useState({
    resume_file: null,
    r2r_file: null,
    driving_file: null,
    visa_file: null,
  });

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidateError, setCandidateError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0],
    });
  };

  useEffect(() => {
    let active = true;

    const loadForm = async () => {
      try {
        setLoadingCandidates(true);
        setCandidateError("");
        const [candidateResponse, applicationResponse] = await Promise.all([
          getCandidateData(1, 1000, ""),
          isEdit && applicationId
            ? getBenchSalesById(applicationId)
            : Promise.resolve(null),
        ]);

        if (!active) return;
        setCandidates(candidateResponse.data || []);

        if (!applicationResponse?.data) return;
        const item = applicationResponse.data;

        setFormData({
          date_created: item.date_created || today,
          candidate_id: item.candidate_id || "",
          candidate_name: item.candidate_name || "",
          vendor: item.vendor || "",
          poc: item.poc || "",
          feedback: item.feedback || "",
          client: item.client || "",
          emp_loc: item.emp_loc || "",
          rate: item.rate || "",
          role: item.role || "",
          candidate_loc: item.candidate_loc || "",
          remarks: item.remarks || "",
        });
      } catch (err) {
        if (active) {
          console.error(err);
          setCandidateError(
            err?.response?.data?.message || "Candidates could not be loaded."
          );
        }
      } finally {
        if (active) setLoadingCandidates(false);
      }
    };

    loadForm();
    return () => {
      active = false;
    };
  }, [applicationId, isEdit, today]);

  const handleSubmit = async () => {

    if (loading) return; // Prevent multiple clicks
    if (!formData.candidate_id) {
      alert("Please select a candidate.");
      return;
    }

    setLoading(true);

    try {

      const payload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key !== "candidate_name") {
          payload.append(key, formData[key]);
        }
      });

      Object.keys(files).forEach((key) => {
        if (files[key]) {
          payload.append(key, files[key]);
        }
      });

      let response;

      if (isEdit) {
        response = await updateBenchSalesApplication(
          applicationId,
          payload
        );
      } else {
        response = await createBenchSalesApplication(payload);
      }

      if (response.success) {
        alert(
          isEdit
            ? "Application Updated Successfully"
            : "Application Created Successfully"
        );

        refreshData?.();
        onClose?.();
      } else {
        alert(response.message);
      }

    } catch (error) {

      console.error(error);

      alert(
        error?.response?.data?.message ||
        "Operation failed"
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    // <div className="benchModalOverlay">
    <div className="benchModal recruiter-application-form">

      {/* Header */}
      <div className="application-form-heading">
        <div>
          <h2>New Application</h2>
          <p>Bench Sales Application</p>
        </div>
      </div>

      {/* Form */}
      <div className="application-fields">
        <div className="application-field">
          <label>Submission Date</label>
          <div className="application-input-shell">
            <FiCalendar />
            <input type="date" name="date_created" value={formData.date_created}
              onChange={handleChange} />
          </div>
        </div>

        <div className="application-field">
          <label>Candidate Name</label>
          <div className="application-input-shell">
            <FiUser />
            <select
              name="candidate_id"
              value={formData.candidate_id}
              onChange={handleChange}
              disabled={loadingCandidates}
              required
            >
              <option value="">
                {loadingCandidates
                  ? "Loading candidates..."
                  : isEdit && formData.candidate_name && !formData.candidate_id
                    ? `Legacy record: ${formData.candidate_name} — select a candidate`
                    : "Select Candidate"}
              </option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>
          {candidateError && <small className="fieldError">{candidateError}</small>}
        </div>

        <div className="application-field">
          <label>Vendor</label>
          <input type="text" placeholder="Vendor name" name="vendor" value={formData.vendor}
            onChange={handleChange} />
        </div>

        <div className="application-field">
          <label>POC Name</label>
          <input type="text" placeholder="POC name" name="poc" value={formData.poc}
            onChange={handleChange} />
        </div>

        <div className="application-field">
          <label>Feedback</label>
          <input type="text" placeholder="Feedback" name="feedback" value={formData.feedback}
            onChange={handleChange} />
        </div>

        <div className="application-field">
          <label>Client Name</label>
          <input type="text" placeholder="Client name" name="client" value={formData.client}
            onChange={handleChange} />
        </div>

        <div className="application-field">
          <label>Location Type</label>

          <select name="emp_loc" value={formData.emp_loc}
            onChange={handleChange}>
            <option>HYD</option>
            <option>Vizag</option>
          </select>
        </div>

        <div className="application-field">
          <label>Rate / Hour ($)</label>
          <input type="number" name="rate" placeholder="$ 50" value={formData.rate}
            onChange={handleChange} />
        </div>

        <div className="application-field">
          <label>Role</label>
          <input type="text" name="role" placeholder="React Developer" value={formData.role}
            onChange={handleChange} />
        </div>

        <div className="application-field application-full-width">
          <label>Location</label>
          <div className="application-input-shell">
            <FiMapPin />
            <input
              type="text"
              name="candidate_loc"
              placeholder="Hyderabad, Telangana"
              value={formData.candidate_loc}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="application-field application-full-width">
          <label>Remarks</label>
          <textarea
            rows="4"
            placeholder="Additional remarks..."
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>

      </div>

      {/* Upload Section */}
      <div className="application-uploads">

        <div className="application-upload-card">
          <label htmlFor="resume_file" className="application-upload-label">
            <FiUploadCloud size={28} />
            <h4>Upload Resume</h4>
            <p>
              {files.resume_file
                ? files.resume_file.name
                : "PDF, DOC, DOCX"}
            </p>
          </label>

          <input
            id="resume_file"
            type="file"
            name="resume_file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <div className="application-upload-card">
          <label htmlFor="r2r_file" className="application-upload-label">
            <FiUploadCloud size={28} />
            <h4>Upload R2R</h4>
            <p>
              {files.r2r_file
                ? files.r2r_file.name
                : "PDF, DOC, DOCX"}
            </p>
          </label>

          <input
            id="r2r_file"
            type="file"
            name="r2r_file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <div className="application-upload-card">
          <label htmlFor="driving_file" className="application-upload-label">
            <FiUploadCloud size={28} />
            <h4>Driving License</h4>
            <p>
              {files.driving_file
                ? files.driving_file.name
                : "PDF, PNG, JPG"}
            </p>
          </label>

          <input
            id="driving_file"
            type="file"
            name="driving_file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <div className="application-upload-card">
          <label htmlFor="visa_file" className="application-upload-label">
            <FiUploadCloud size={28} />
            <h4>Visa Copy</h4>
            <p>
              {files.visa_file
                ? files.visa_file.name
                : "PDF, PNG, JPG"}
            </p>
          </label>

          <input
            id="visa_file"
            type="file"
            name="visa_file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            hidden
          />
        </div>

      </div>

      {/* Footer */}
      <div className="application-form-footer">
        <button
          className="application-cancel-button"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          className="application-save-button"
          onClick={handleSubmit}
          disabled={loading || loadingCandidates || Boolean(candidateError)}
        >
          {loading && <span className="btnLoader"></span>}

          {loading
            ? (isEdit ? "Updating..." : "Saving...")
            : (isEdit ? "Update Application" : "Save Application")}
        </button>
      </div>
    </div>
    // </div>
  );
};

export default BenchSales;
