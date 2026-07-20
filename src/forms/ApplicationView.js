import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { getBenchSalesById, getRecruiterApplicationById, updateApplicationProcess, updateRecruiterApplicationProcess } from "../api/applicationApi";
import "./ApplicationView.css";

const ApplicationView = ({ applicationId, module = "bench" }) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextProcess, setNextProcess] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = module === "recruiter"
        ? await getRecruiterApplicationById(applicationId)
        : await getBenchSalesById(applicationId);
      if (response.success) {
        setApplication(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch application:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!application) {
    return <div>No Data Found</div>;
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

  return (
    <div className="application-view">
      {/* Header */}
      <div className="candidate-header">
        <div className="candidate-avatar">
          <FaUser />
        </div>
        <div className="candidate-info">
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
          <a
            href={application.resume}
            target="_blank"
            rel="noreferrer"
            className="document-card"
          >
            {getFileIcon(application.resume)}
            <span>Resume</span>
          </a>
          <a
            href={application.r2r}
            target="_blank"
            rel="noreferrer"
            className="document-card"
          >
            {getFileIcon(application.r2r)}
            <span>R2R</span>
          </a>
          <a
            href={application.driving_license}
            target="_blank"
            rel="noreferrer"
            className="document-card"
          >
            <FaIdCard />
            <span>Driving License</span>
          </a>
          <a
            href={application.visa_copy}
            target="_blank"
            rel="noreferrer"
            className="document-card"
          >
            <FaPassport />
            <span>Visa Copy</span>
          </a>
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
