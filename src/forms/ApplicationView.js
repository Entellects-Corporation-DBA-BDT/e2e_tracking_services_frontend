import React, { useCallback, useState, useEffect } from "react";
import {
  FaUser,
  FaBuilding,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaFilePdf,
  FaFileWord,
  FaIdCard,
  FaPassport,
  FaCalendarAlt,
  FaArrowLeft,
  FaRedo,
} from "react-icons/fa";
import { getBenchSalesById, getRecruiterApplicationById, updateApplicationProcess, updateRecruiterApplicationProcess } from "../api/applicationApi";
import { baseUrlImg } from "../Config/env";
import "./ApplicationView.css";

const ApplicationView = ({
  applicationId,
  module = "bench",
  standalone = false,
  title = "Application",
  onBack,
}) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextProcess, setNextProcess] = useState(null);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = module === "recruiter"
        ? await getRecruiterApplicationById(applicationId)
        : await getBenchSalesById(applicationId);
      if (response.success) {
        setApplication(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch application:", error);
      setError(error?.response?.data?.message || "This application could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, module]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  if (loading) {
    return <div className="application-page-state"><span className="application-page-spinner" /><h2>Loading application...</h2><p>Getting the latest information.</p></div>;
  }

  if (!application) {
    return <div className="application-page-state application-page-error"><div>!</div><h2>Unable to open application</h2><p>{error || "No application data was found."}</p><span>{onBack && <button type="button" onClick={onBack}><FaArrowLeft /> Back</button>}<button type="button" onClick={fetchApplication}><FaRedo /> Try Again</button></span></div>;
  }

  const getFileIcon = (file) => {
    if (!file) return <FaFilePdf />;
    const ext = file.split(".").pop().toLowerCase();
    if (["doc", "docx"].includes(ext)) {
      return <FaFileWord />;
    }
    return <FaFilePdf />;
  };

  const handleProcessUpdate = async () => {
    try {
      setUpdating(true);
      const updateProcess = module === "recruiter" ? updateRecruiterApplicationProcess : updateApplicationProcess;
      const res = await updateProcess(
        application.id,
        nextProcess
      );

      if (res.success) {
        fetchApplication();
        setShowConfirm(false);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const fileUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${baseUrlImg}/${String(path).replace(/^\//, "")}`;
  };

  const documents = [
    ["Resume", application.resume_path, <FaFilePdf />],
    ["Right to Represent", application.r2r_path, <FaFileWord />],
    ["Driving License", application.driving_path, <FaIdCard />],
    ["Visa Copy", application.visa_path, <FaPassport />],
    ["MSC Copy", application.msc_path, <FaFilePdf />],
  ];

  return (
    <div className={`application-view${standalone ? " application-view-standalone" : ""}`}>
      {standalone && (
        <button type="button" className="application-page-back" onClick={onBack}>
          <FaArrowLeft /> Back to {module === "recruiter" ? "Recruiter Applications" : "Bench Sales"}
        </button>
      )}
      {/* Header */}
      <div className="candidate-header">
        <div className="candidate-avatar">
          <FaUser />
        </div>
        <div className="candidate-info">
          {standalone && <small className="application-page-type">{title} #{application.id}</small>}
          <h2>{application.candidate_name}</h2>
          <p>{application.role}</p>
        </div>

        <div className="candidate-status">
          <div className={`status-badge process-${application.process_id}`}>
            {application.process_id === 1 && "Submitted"}
            {application.process_id === 2 && "Interview Scheduled"}
            {application.process_id === 3 && "Placed"}
          </div>
          {application.process_id !== 3 && (
            <button
              className="process-btn"
              disabled={updating}
              onClick={() => {
                if (application.process_id === 1) {
                  setNextProcess(2);
                } else {
                  setNextProcess(3);
                }
                setShowConfirm(true);
              }}
            >
              {updating
                ? "Updating..."
                : application.process_id === 1
                  ? "Schedule Interview"
                  : "Mark as Placed"}
            </button>
          )}

          {application.process_id === 3 && (
            <button
              className="process-btn completed"
              disabled
            >
              ✓ Candidate Placed
            </button>
          )}

        </div>
      </div>

      {/* Submission Info */}
      <div className="view-card">
        <h3>Submission Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <FaCalendarAlt />
            <div>
              <label>Submission Date</label>
              <span>{application.date_created}</span>
            </div>
          </div>
          <div className="info-item">
            <FaBuilding />
            <div>
              <label>Vendor</label>
              <span>{application.vendor}</span>
            </div>
          </div>

          <div className="info-item">
            <FaUser />
            <div>
              <label>POC Name</label>
              <span>{application.poc}</span>
            </div>
          </div>

          <div className="info-item">
            <FaBuilding />
            <div>
              <label>Client Name</label>
              <span>{application.client}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="view-card">
        <h3>Job Details</h3>

        <div className="info-grid">
          <div className="info-item">
            <FaUser />
            <div>
              <label>Role</label>
              <span>{application.role}</span>
            </div>
          </div>

          <div className="info-item">
            <FaMoneyBillWave />
            <div>
              <label>Rate / Hour</label>
              <span>${application.rate}</span>
            </div>
          </div>

          {/* <div className="info-item">
            <FaMapMarkerAlt />
            <div>
              <label>Location Type</label>
              <span>{application.location_type}</span>
            </div>
          </div> */}

          <div className="info-item">
            <FaMapMarkerAlt />
            <div>
              <label>Location</label>
              <span>{application.candidate_loc}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="view-card">
        <h3>Feedback</h3>

        <div className="remarks-box">
          {application.feedback || "No Feedback Available"}
        </div>
      </div>

      {/* Remarks */}
      <div className="view-card">
        <h3>Remarks</h3>

        <div className="remarks-box">
          {application.remarks || "No Remarks Available"}
        </div>
      </div>

      {/* Documents */}
      <div className="view-card">
        <h3>Documents</h3>
        <div className="document-grid">
          {documents.map(([label, path, icon]) => path ? (
            <a href={fileUrl(path)} target="_blank" rel="noreferrer" className="document-card" key={label}>
              {getFileIcon(path) || icon}
              <span>{label}</span>
              <small>Open document</small>
            </a>
          ) : (
            <div className="document-card document-card-missing" key={label}>
              {icon}<span>{label}</span><small>Not uploaded</small>
            </div>
          ))}
        </div>
      </div>
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">⚠️</div>
            <h2>
              {nextProcess === 2
                ? "Schedule Interview?"
                : "Mark Candidate as Placed?"}
            </h2>
            <p>
              {nextProcess === 2
                ? `Are you sure you want to move "${application.candidate_name}" to Interview Scheduled?`
                : `Are you sure you want to mark "${application.candidate_name}" as Placed?`}
            </p>

            <div className="confirm-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                disabled={updating}
                onClick={handleProcessUpdate}
              >
                {updating
                  ? "Updating..."
                  : nextProcess === 2
                    ? "Schedule Interview"
                    : "Mark as Placed"}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div>
  );
};

export default ApplicationView;
