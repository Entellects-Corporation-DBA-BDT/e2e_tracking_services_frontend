import React, { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  FaCheckCircle,
  FaClock,
  FaCommentDots,
} from "react-icons/fa";
import { getBenchSalesById, getRecruiterApplicationById, updateApplicationProcess, updateRecruiterApplicationProcess } from "../api/applicationApi";
import { baseUrlImg } from "../Config/env";
import "./ApplicationView.css";
import "./InterviewSchedule.css";
import EmbeddedDiscussion from "../components/Discussion/EmbeddedDiscussion";
import { formatEasternDate, formatEasternDateTime, formatEasternInterviewSlot } from "../utils/easternTime";

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
  const [processError, setProcessError] = useState("");
  const [interviewForm, setInterviewForm] = useState({
    interview_date: "",
    interview_start_time: "",
    interview_end_time: "",
    feedback: "",
  });
  const [placementFeedback, setPlacementFeedback] = useState("");

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
      setProcessError("");
      const updateProcess = module === "recruiter" ? updateRecruiterApplicationProcess : updateApplicationProcess;
      const details = nextProcess === 2 ? interviewForm : nextProcess === 3 ? { feedback: placementFeedback } : {};
      const res = await updateProcess(
        application.id,
        nextProcess,
        details
      );

      if (res.success) {
        await fetchApplication();
        setShowConfirm(false);
        setInterviewForm({ interview_date: "", interview_start_time: "", interview_end_time: "", feedback: "" });
        setPlacementFeedback("");
      }

    } catch (err) {
      console.error(err);
      setProcessError(err?.response?.data?.message || "The application process could not be updated.");
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

  const processHistory = Array.isArray(application.process_history) ? application.process_history : [];
  const interviewRounds = processHistory.filter((event) => event.event_type === "interview");
  const nextRound = interviewRounds.reduce((highest, event) => Math.max(highest, Number(event.round_number) || 0), 0) + 1;
  const timelineEvents = [
    { id: "submitted", event_type: "submitted", title: "Application Submitted", created_at: application.date_created, feedback: "Candidate profile submitted for this opportunity." },
    ...processHistory.map((event) => ({
      ...event,
      title: event.event_type === "interview"
        ? `Interview Round ${event.round_number || 1} Scheduled`
        : event.event_type === "placed" ? "Candidate Placed" : "Status Returned to Submission",
    })),
  ];
  const formatTimelineDate = (value) => formatEasternDateTime(value);

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
            {application.process_id === 2 && `Interview Round ${Math.max(interviewRounds.length, 1)} Scheduled`}
            {application.process_id === 3 && "Placed"}
          </div>
          <div className="application-process-actions">
            {application.process_id !== 1 && (
              <button className="process-btn" disabled={updating} onClick={() => {
                setNextProcess(1); setProcessError(""); setShowConfirm(true);
              }}>Move to Submitted</button>
            )}
            <button className="process-btn interview-action" disabled={updating} onClick={() => {
              setNextProcess(2); setProcessError("");
              setInterviewForm({ interview_date: "", interview_start_time: "", interview_end_time: "", feedback: "" });
              setShowConfirm(true);
            }}>Schedule Interview Round {nextRound}</button>
            {application.process_id !== 3 && (
              <button className="process-btn placement-action" disabled={updating} onClick={() => {
                setNextProcess(3); setPlacementFeedback(""); setProcessError(""); setShowConfirm(true);
              }}>Mark as Placed</button>
            )}
          </div>
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
              <span>{formatEasternDate(application.date_created)} <small>ET</small></span>
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

      <div className="view-card application-process-card">
        <div className="application-process-heading">
          <div><small>PROCESS JOURNEY</small><h3>Submission Timeline</h3><p>Every interview round and its feedback stays available here.</p></div>
          <span>{interviewRounds.length} interview {interviewRounds.length === 1 ? "round" : "rounds"}</span>
        </div>
        <div className="application-process-timeline">
          {timelineEvents.map((event) => (
            <div className={`application-timeline-event ${event.event_type}`} key={`${event.event_type}-${event.id}`}>
              <div className="application-timeline-marker">{event.event_type === "interview" ? <FaCalendarAlt /> : <FaCheckCircle />}</div>
              <div className="application-timeline-content">
                <div className="application-timeline-title"><h4>{event.title}</h4><time><FaClock /> {formatTimelineDate(event.created_at)}</time></div>
                {event.interview_slot && <div className="application-timeline-slot"><FaCalendarAlt /> {formatEasternInterviewSlot(event.interview_slot)}</div>}
                {event.feedback && <div className="application-timeline-feedback"><FaCommentDots /><div><small>Feedback / Notes</small><p>{event.feedback}</p></div></div>}
                {event.created_by_name && <div className="application-timeline-author">Updated by {event.created_by_name}</div>}
              </div>
            </div>
          ))}
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
      <EmbeddedDiscussion type="submission" recordId={application.id} title={`${application.candidate_name} Submission Discussion`} url={`/dashboard/bench-sales/${application.id}`} />

      {showConfirm && createPortal(
        <div className="confirm-overlay" onMouseDown={() => !updating && setShowConfirm(false)}>
          
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="process-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="confirm-icon"><FaCalendarAlt /></div>
            <h2 id="process-confirm-title">
              {nextProcess === 2
                ? `Schedule Interview Round ${nextRound}?`
                : nextProcess === 3 ? "Mark Candidate as Placed?" : "Move Candidate to Submitted?"}
            </h2>
            <p>
              {nextProcess === 2
                ? `Add round ${nextRound} to ${application.candidate_name}'s interview journey. Earlier rounds and feedback will remain visible.`
                : nextProcess === 3
                  ? `Are you sure you want to mark "${application.candidate_name}" as Placed?`
                  : `Move "${application.candidate_name}" back to Submitted? Existing interview and placement history will remain unchanged.`}
            </p>
            {nextProcess === 2 && (
              <div className="interview-schedule-form">
                <label>
                  <span>Interview Date</span>
                  <input required type="date" value={interviewForm.interview_date} onChange={(event) => setInterviewForm({ ...interviewForm, interview_date: event.target.value })} />
                </label>
                <div>
                  <label>
                    <span>Start Time (ET)</span>
                    <input required type="time" value={interviewForm.interview_start_time} onChange={(event) => setInterviewForm({ ...interviewForm, interview_start_time: event.target.value })} />
                  </label>
                  <label>
                    <span>End Time (ET)</span>
                    <input required type="time" value={interviewForm.interview_end_time} onChange={(event) => setInterviewForm({ ...interviewForm, interview_end_time: event.target.value })} />
                  </label>
                </div>
                <label>
                  <span>Round Feedback / Notes</span>
                  <textarea required rows="4" placeholder="Add interview outcome, panel notes, next steps, or preparation details..." value={interviewForm.feedback} onChange={(event) => setInterviewForm({ ...interviewForm, feedback: event.target.value })} />
                </label>
              </div>
            )}
            {nextProcess === 3 && (
              <div className="interview-schedule-form placement-feedback-form">
                <label>
                  <span>Placement Feedback / Notes</span>
                  <textarea required rows="4" placeholder="Add the final placement outcome, joining details, or closing notes..." value={placementFeedback} onChange={(event) => setPlacementFeedback(event.target.value)} />
                </label>
              </div>
            )}
            {processError && <div className="interview-schedule-error">{processError}</div>}

            <div className="confirm-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                disabled={updating || (nextProcess === 2 && (
                  !interviewForm.interview_date
                  || !interviewForm.interview_start_time
                  || !interviewForm.interview_end_time
                  || interviewForm.interview_end_time <= interviewForm.interview_start_time
                  || !interviewForm.feedback.trim()
                )) || (nextProcess === 3 && !placementFeedback.trim())}
                onClick={handleProcessUpdate}
              >
                {updating
                  ? "Updating..."
                  : nextProcess === 2
                    ? `Schedule Round ${nextRound}`
                    : nextProcess === 3 ? "Mark as Placed" : "Move to Submitted"}
              </button>
            </div>
          </div>
        </div>
      , document.body)
      }
    </div>
  );
};

export default ApplicationView;
