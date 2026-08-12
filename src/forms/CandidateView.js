import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaFileAlt,
  FaMapMarkerAlt,
  FaMedal,
  FaPhone,
  FaRobot,
  FaSpinner,
  FaUserTie,
  FaCalendarAlt,
  FaEye,
  FaPaperPlane,
  FaUpload,
  FaTimes,
} from "react-icons/fa";
import {
  getCandidateById,
  getMatchedJobs,
  matchSuitableJobs,
} from "../api/candidateApi";
import {
  createManualReminder,
  disableDocumentReminder,
  sendDocumentReminderNow,
  updateDocumentReminder,
  uploadCandidateDocument,
} from "../api/documentReminderApi";
import { baseUrlImg } from "../Config/env";
import "./CandidateView.css";
import ProfilePerformance from "../components/ProfilePerformance";

const MATCHING_STEPS = [
  "Initializing AI matching engine...",
  "Reading the candidate resume...",
  "Fetching open job requirements...",
  "Comparing technical skills...",
  "Matching experience levels...",
  "Checking locations and visa eligibility...",
  "Evaluating education and certifications...",
  "Calculating match scores...",
  "Ranking suitable jobs...",
  "Finalizing recommendations...",
];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const emptyDocumentDetails = (documentType = "H1B") => ({
  document_type: documentType,
  visa_type: documentType === "H1B" ? "H1B" : "",
  visa_number: "", candidate_name: "", issue_date: "", expiry_date: "",
  passport_number: "", receipt_number: "", case_number: "",
  applied_date: "", approved_date: "", notice_date: "", received_date: "", priority_date: "",
  privileges: ""
});

const CandidateView = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [matchMessage, setMatchMessage] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(emptyDocumentDetails());
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentMessage, setDocumentMessage] = useState(null);
  const [jsonDocument, setJsonDocument] = useState(null);
  const [editDocument, setEditDocument] = useState(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All');
  const [documentStatusFilter, setDocumentStatusFilter] = useState('All');

  const filteredDocuments = useMemo(() => (candidate?.documents || []).filter((document) => {
    const typeMatches = documentTypeFilter === 'All' || document.document_type === documentTypeFilter;
    const status = document.reminder_status || document.status || 'No Reminder';
    return typeMatches && (documentStatusFilter === 'All' || status === documentStatusFilter);
  }), [candidate?.documents, documentTypeFilter, documentStatusFilter]);

  const loadCandidate = async () => {
    const response = await getCandidateById(candidateId);
    if (response?.success) setCandidate(response.data);
    return response;
  };

  useEffect(() => {
    if (!matching) {
      setCurrentStep(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrentStep((step) => Math.min(step + 1, MATCHING_STEPS.length - 1));
    }, 1200);

    return () => window.clearInterval(interval);
  }, [matching]);

  useEffect(() => {
    let active = true;

    const loadCandidatePage = async () => {
      setLoading(true);
      setError("");

      const [candidateResult, matchesResult] = await Promise.allSettled([
        getCandidateById(candidateId),
        getMatchedJobs(candidateId),
      ]);

      if (!active) return;

      if (
        candidateResult.status === "fulfilled" &&
        candidateResult.value?.success
      ) {
        setCandidate(candidateResult.value.data);
      } else {
        const reason =
          candidateResult.status === "rejected" ? candidateResult.reason : null;
        setError(getErrorMessage(reason, "Candidate could not be loaded."));
      }

      if (matchesResult.status === "fulfilled" && matchesResult.value?.success) {
        setMatchedJobs(matchesResult.value.data || []);
      }

      setLoading(false);
    };

    loadCandidatePage();
    return () => {
      active = false;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!candidate || !window.location.hash) return;
    const section = document.querySelector(window.location.hash);
    if (!section) return;
    window.requestAnimationFrame(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [candidate]);

  const handleMatchJobs = async () => {
    try {
      setMatching(true);
      setError("");
      setMatchMessage("");

      const response = await matchSuitableJobs(candidateId);
      if (!response.success) {
        setError(response.message || "Suitable jobs could not be matched.");
        return;
      }

      setMatchedJobs(response.results || []);
      setMatchMessage(
        response.matched_jobs > 0
          ? `${response.matched_jobs} suitable job${response.matched_jobs === 1 ? "" : "s"} ranked from ${response.jobs_evaluated} evaluated.`
          : "Matching completed, but no suitable open jobs were found."
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Suitable jobs could not be matched.")
      );
    } finally {
      setMatching(false);
    }
  };

  const documentUrl = (path) => {
    if (!path) return "#";
    if (/^https?:\/\//i.test(path)) return path;
    return `${baseUrlImg}/${String(path).replace(/^\//, "")}`;
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!documentFile) return;
    setDocumentUploading(true);
    setDocumentMessage(null);
    try {
      const formData = new FormData();
      formData.append("candidate_id", candidateId);
      formData.append("document_type", documentDetails.document_type);
      formData.append("document_file", documentFile);
      Object.entries({ ...documentDetails, candidate_name: documentDetails.candidate_name || candidate.name }).forEach(([key, value]) => formData.append(key, value));
      const response = await uploadCandidateDocument(formData);
      setDocumentMessage({ type: "success", text: response.message || "Document processed." });
      setDocumentFile(null);
      setDocumentDetails(emptyDocumentDetails());
      form.reset();
      await loadCandidate();
    } catch (requestError) {
      setDocumentMessage({ type: "error", text: getErrorMessage(requestError, "Document could not be processed.") });
    } finally { setDocumentUploading(false); }
  };

  const documentAction = async (action, successText) => {
    try {
      await action();
      setDocumentMessage({ type: "success", text: successText });
      await loadCandidate();
    } catch (requestError) {
      setDocumentMessage({ type: "error", text: getErrorMessage(requestError, "Document reminder action failed.") });
    }
  };

  const saveDocumentReminder = async (event) => {
    event.preventDefault();
    const expiryDate = editDocument.expiry_date;
    const privileges = editDocument.privileges || null;
    if (editDocument.reminder_id) {
      await documentAction(
        () => updateDocumentReminder(editDocument.reminder_id, { expiry_date: expiryDate, next_reminder_date: editDocument.next_reminder_date || null, status: editDocument.reminder_status || "Pending", privileges }),
        "Reminder updated."
      );
    } else {
      await documentAction(() => createManualReminder(editDocument.id, { expiry_date: expiryDate, privileges }), "Reminder created.");
    }
    setEditDocument(null);
  };

  if (loading) {
    return <div className="candidate-view-state">Loading candidate...</div>;
  }

  if (!candidate) {
    return (
      <div className="candidate-view-state candidate-view-error">
        {error || "Candidate not found."}
      </div>
    );
  }

  return (
    <div className="candidate-view-page">
      <span id='overview' className='candidate-section-anchor' aria-hidden='true' />

      <section className="candidate-view-header">
        <div className="candidate-view-identity">
          <div className="candidate-view-avatar"><FaUserTie /></div>
          <div>
            <h1>{candidate.name}</h1>
            <p><FaMapMarkerAlt /> {candidate.current_location || "Location not provided"}</p>
          </div>
        </div>
        <span className={`candidate-view-status ${String(candidate.status || "").toLowerCase()}`}>
          {candidate.status || "Status unavailable"}
        </span>
      </section>

      <section className="candidate-view-card">
        <div className="candidate-view-title">
          <FaUserTie /> <h2>Candidate Information</h2>
        </div>
        <div className="candidate-view-grid">
          <Info icon={<FaEnvelope />} label="Email" value={candidate.email} />
          <Info icon={<FaPhone />} label="Phone" value={candidate.phone} />
          <Info icon={<FaMapMarkerAlt />} label="Current Location" value={candidate.current_location} />
          <Info icon={<FaCheckCircle />} label="Visa Status" value={candidate.visa_status} />
        </div>
      </section>

      <span id='reports' className='candidate-section-anchor' aria-hidden='true' />
      <section className='candidate-section-group' aria-labelledby='candidate-reports-heading'>
        <header className='candidate-section-heading'>
          <span>REPORTS & ACTIVITY</span>
          <h2 id='candidate-reports-heading'>Submission and performance reports</h2>
          <p>Applications, interviews, placements, and related candidate activity.</p>
        </header>
      <ProfilePerformance
        candidateId={candidateId}
        title={`${candidate.name} · Submission Performance`}
      />
      </section>

      <section className="candidate-view-card candidate-documents-card">
        <div className="candidate-view-title candidate-documents-title">
          <FaFileAlt />
          <div><h2 id='documents'>Immigration Documents</h2><p>Upload H1B, PERM Labor, or I-140 documents and schedule the appropriate follow-up reminders.</p></div>
        </div>
        <div className='candidate-case-shell'>
          <div className='candidate-case-name'><span>CANDIDATE NAME</span><strong>{candidate.name}</strong></div>
          <div className='candidate-document-filters'>
            <label>Document Type<select value={documentTypeFilter} onChange={(event) => setDocumentTypeFilter(event.target.value)}>{['All', 'H1B', 'PERM Labor', 'I-140'].map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Status<select value={documentStatusFilter} onChange={(event) => setDocumentStatusFilter(event.target.value)}>{['All', 'Pending', 'Completed', 'Expired', 'Disabled', 'No Reminder'].map((status) => <option key={status}>{status}</option>)}</select></label>
            <button type='button' onClick={() => { setDocumentTypeFilter('All'); setDocumentStatusFilter('All'); }}>Reset Filters</button>
          </div>
          <div className='candidate-case-sections'>
            {['H1B', 'PERM Labor', 'I-140'].filter((type) => documentTypeFilter === 'All' || documentTypeFilter === type).map((type) => <ImmigrationCaseSection key={type} type={type} document={filteredDocuments.find((item) => item.document_type === type)} />)}
          </div>
        </div>

        <form className='candidate-document-upload' onSubmit={handleDocumentUpload}>
          <div className="candidate-document-form-grid">
            <label>Document Type<select value={documentDetails.document_type} onChange={(e) => setDocumentDetails(emptyDocumentDetails(e.target.value))}>{["H1B","PERM Labor","I-140"].map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Candidate Name<input required value={documentDetails.candidate_name || candidate.name} onChange={(e) => setDocumentDetails({ ...documentDetails, candidate_name: e.target.value })} /></label>
            {documentDetails.document_type === "H1B" ? <>
              <label>Visa Number<input value={documentDetails.visa_number} onChange={(e) => setDocumentDetails({ ...documentDetails, visa_number: e.target.value })} /></label>
              <label>Passport Number<input value={documentDetails.passport_number} onChange={(e) => setDocumentDetails({ ...documentDetails, passport_number: e.target.value })} /></label>
              <label>Receipt Number<input value={documentDetails.receipt_number} onChange={(e) => setDocumentDetails({ ...documentDetails, receipt_number: e.target.value })} /></label>
              <label>Issue Date<input type="date" value={documentDetails.issue_date} onChange={(e) => setDocumentDetails({ ...documentDetails, issue_date: e.target.value })} /></label>
              <label>Expiry Date<input required type="date" min={documentDetails.issue_date || undefined} value={documentDetails.expiry_date} onChange={(e) => setDocumentDetails({ ...documentDetails, expiry_date: e.target.value })} /></label>
            </> : documentDetails.document_type === "I-140" ? <>
              <label>Case / Receipt Number<input value={documentDetails.case_number} onChange={(e) => setDocumentDetails({ ...documentDetails, case_number: e.target.value })} /></label>
              <label>Notice Date<input required type="date" value={documentDetails.notice_date} onChange={(e) => setDocumentDetails({ ...documentDetails, notice_date: e.target.value })} /></label>
              <label>Received Date<input required type="date" value={documentDetails.received_date} onChange={(e) => setDocumentDetails({ ...documentDetails, received_date: e.target.value })} /></label>
              <label>Priority Date<input required type="date" value={documentDetails.priority_date} onChange={(e) => setDocumentDetails({ ...documentDetails, priority_date: e.target.value })} /></label>
              <label>Approved Date (if approved)<input type="date" min={documentDetails.received_date || undefined} value={documentDetails.approved_date} onChange={(e) => setDocumentDetails({ ...documentDetails, approved_date: e.target.value })} /></label>
            </> : <>
              <label>Case / Receipt Number<input value={documentDetails.case_number} onChange={(e) => setDocumentDetails({ ...documentDetails, case_number: e.target.value })} /></label>
              <label>Applied Date<input required type="date" value={documentDetails.applied_date} onChange={(e) => setDocumentDetails({ ...documentDetails, applied_date: e.target.value })} /></label>
              <label>Approved Date (if approved)<input type="date" min={documentDetails.applied_date || undefined} value={documentDetails.approved_date} onChange={(e) => setDocumentDetails({ ...documentDetails, approved_date: e.target.value })} /></label>
            </>}
            <label>Prevailing Wages ($)<input type="number" step="0.01" min="0" value={documentDetails.privileges} onChange={(e) => setDocumentDetails({ ...documentDetails, privileges: e.target.value })} placeholder="e.g., 50000.00" /></label>
          </div>
          <div className="candidate-document-upload-row">
            <label className="candidate-document-file"><FaUpload /><span>{documentFile?.name || `Choose ${documentDetails.document_type} PDF or image`}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} /></label>
            <button disabled={!documentFile || !(documentDetails.document_type === "H1B" ? documentDetails.expiry_date : documentDetails.document_type === "I-140" ? documentDetails.notice_date && documentDetails.received_date && documentDetails.priority_date : documentDetails.applied_date) || documentUploading}>{documentUploading ? <><FaSpinner className="candidate-spin" /> Saving...</> : "Save Document & Reminder"}</button>
          </div>
        </form>
        {documentMessage && <div className={`candidate-match-alert ${documentMessage.type}`}>{documentMessage.text}</div>}

        {filteredDocuments.length ? <div className='candidate-documents-list'>{filteredDocuments.map((document) => {
          const details = document.document_details || {};
          return <article className="candidate-document-item" key={document.id}>
            <div className="candidate-document-item-top"><div><FaFileAlt /><span><strong>{document.document_type}</strong><small>{details.candidate_name || candidate.name}</small></span></div><span className={`reminder-status ${String(document.reminder_status || "disabled").toLowerCase()}`}>{document.reminder_status || "No Reminder"}</span></div>
            <div className="candidate-document-meta">
              <div><span>{document.document_type === "H1B" ? "Expiry Date" : document.document_type === "I-140" ? "Priority Date" : "Reminder Target"}</span><strong>{document.expiry_date || details.priority_date || details.reminder_date || details.expiry_date || "-"}</strong></div>
              <div><span>Next Reminder</span><strong>{document.next_reminder_date || "-"}</strong></div>
              <div><span>Confidence</span><strong>{details.confidence !== undefined ? `${details.confidence}%` : "-"}</strong></div>
              <div><span>Prevailing Wages</span><strong>{document.privileges ? `$${parseFloat(document.privileges).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : details.privileges ? `$${parseFloat(details.privileges).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</strong></div>
            </div>
            <div className="candidate-document-actions">
              <a href={documentUrl(document.document)} target="_blank" rel="noreferrer"><FaFileAlt /> View Document</a>
              <button onClick={() => setJsonDocument(document)}><FaEye /> View Details</button>
              {document.reminder_id && document.reminder_status !== "Disabled" && <button onClick={() => documentAction(() => sendDocumentReminderNow(document.reminder_id), "Reminder sent without changing the schedule.")}><FaPaperPlane /> Send Now</button>}
              <button onClick={() => setEditDocument({ ...document, expiry_date: document.expiry_date || details.priority_date || details.reminder_date || details.expiry_date || "" })}><FaCalendarAlt /> {document.reminder_id ? "Edit" : "Set Target"}</button>
              {document.reminder_id && document.reminder_status !== "Disabled" && <button className="danger" onClick={() => window.confirm("Disable this reminder?") && documentAction(() => disableDocumentReminder(document.reminder_id), "Reminder disabled.")}><FaTimes /> Disable</button>}
            </div>
          </article>;
        })}</div> : <div className='candidate-match-empty'><FaFileAlt /><h3>No matching documents</h3><p>Adjust the filters or upload an immigration document above.</p></div>}
      </section>

      <section className="candidate-view-card">
        <div className="candidate-view-title">
          <FaMedal /> <h2 id='resume'>Skills and Resume</h2>
        </div>
        <div className="candidate-view-content">
          <h3>Skills</h3>
          <p>{candidate.skills || "No skills provided."}</p>
          <h3>Resume</h3>
          {candidate.resume_path ? (
            <a href={candidate.resume_path} target="_blank" rel="noreferrer" className="candidate-resume-link">
              <FaFileAlt /> View Candidate Resume
            </a>
          ) : (
            <p>No resume uploaded.</p>
          )}
        </div>
      </section>

      <section className="candidate-view-card candidate-match-card">
        <div>
          <div className="candidate-view-title">
            <FaBriefcase /> <h2 id='job-matches'>AI Job Matching</h2>
          </div>
          <p>Compare this candidate's parsed resume against all available open jobs.</p>
        </div>
        <button type="button" className="candidate-match-button" onClick={handleMatchJobs} disabled={matching}>
          {matching ? <><FaSpinner className="candidate-spin" /> Matching Jobs...</> : <><FaRobot /> Match Suitable Jobs</>}
        </button>
      </section>

      {error && <div role="alert" className="candidate-match-alert error">{error}</div>}
      {matchMessage && <div role="status" className="candidate-match-alert success">{matchMessage}</div>}

      <section className="candidate-view-card">
        <div className="candidate-view-title candidate-results-title">
          <FaMedal />
          <div>
            <h2>AI Recommended Jobs</h2>
            <p>{matchedJobs.length} ranked result{matchedJobs.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {matchedJobs.length > 0 ? (
          <div className="candidate-match-table-wrap">
            <table className="candidate-match-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Job</th>
                  <th>Location</th>
                  <th>Match</th>
                  <th>Recommendation</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {matchedJobs.map((job, index) => (
                  <tr key={job.id || job.job_id}>
                    <td><span className={`candidate-rank rank-${index + 1}`}>{index + 1}</span></td>
                    <td>
                      <strong>{job.position || "Untitled job"}</strong>
                      <small>{job.domain || job.job_status || ""}</small>
                    </td>
                    <td>{job.location || "-"}</td>
                    <td><span className="candidate-score">{Number(job.overall_score || 0).toFixed(1)}%</span></td>
                    <td>{job.recommendation || "-"}</td>
                    <td className="candidate-match-reason" title={job.ai_reason || ""}>{job.ai_reason || "No reason provided."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="candidate-match-empty">
            <FaRobot />
            <h3>No matched jobs yet</h3>
            <p>Run AI matching to rank suitable open jobs for this candidate.</p>
          </div>
        )}
      </section>

      {matching && (
        <div className="candidate-matching-overlay" role="dialog" aria-modal="true" aria-label="AI job matching in progress">
          <div className="candidate-matching-box">
            <div className="candidate-matching-robot"><FaRobot /></div>
            <h2>AI Matching in Progress</h2>
            <p>Analyzing the candidate resume against open jobs.</p>
            <div className="candidate-matching-steps">
              {MATCHING_STEPS.map((step, index) => (
                <div key={step} className={`candidate-matching-step ${index <= currentStep ? "active" : ""}`}>
                  <span>{index < currentStep ? "✓" : "•"}</span>{step}
                </div>
              ))}
            </div>
            <div className="candidate-matching-progress">
              <div style={{ width: `${((currentStep + 1) / MATCHING_STEPS.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {jsonDocument && <div className="reminder-modal-backdrop" onMouseDown={() => setJsonDocument(null)}><div className="reminder-modal" onMouseDown={(e) => e.stopPropagation()}><div className="reminder-modal-header"><h2>Entered Document Details</h2><button onClick={() => setJsonDocument(null)}><FaTimes /></button></div><div className="reminder-json-fields">{[["Candidate Name","candidate_name"],["Visa Type","visa_type"],["Visa Number","visa_number"],["Case Number","case_number"],["Notice Date","notice_date"],["Received Date","received_date"],["Priority Date","priority_date"],["Applied Date","applied_date"],["Approved Date","approved_date"],["Issue Date","issue_date"],["Expiry Date","expiry_date"],["Reminder Target","reminder_date"],["Reminder Purpose","reminder_reason"],["Entry Method","entry_method"]].map(([label,key]) => <div key={key}><span>{label}</span><strong>{jsonDocument.document_details?.[key] || "Not entered"}</strong></div>)}</div><h3>Stored JSON</h3><pre>{JSON.stringify(jsonDocument.document_details || {}, null, 2)}</pre></div></div>}
      {editDocument && <div className="reminder-modal-backdrop"><form className="reminder-modal reminder-edit-modal" onSubmit={saveDocumentReminder}><div className="reminder-modal-header"><h2>{editDocument.reminder_id ? "Edit Reminder" : "Enter Target Date"}</h2><button type="button" onClick={() => setEditDocument(null)}><FaTimes /></button></div><label>Target Date<input required type="date" value={editDocument.expiry_date || ""} onChange={(e) => setEditDocument({ ...editDocument, expiry_date: e.target.value })} /></label><label>Prevailing Wages ($)<input type="number" step="0.01" min="0" value={editDocument.privileges || ""} onChange={(e) => setEditDocument({ ...editDocument, privileges: e.target.value || null })} placeholder="e.g., 50000.00" /></label>{editDocument.reminder_id && <><label>Next Reminder<input type="date" value={editDocument.next_reminder_date || ""} onChange={(e) => setEditDocument({ ...editDocument, next_reminder_date: e.target.value })} /></label><label>Status<select value={editDocument.reminder_status} onChange={(e) => setEditDocument({ ...editDocument, reminder_status: e.target.value })}>{["Pending","Completed","Expired","Disabled"].map((status) => <option key={status}>{status}</option>)}</select></label></>}<div className="reminder-modal-actions"><button type="button" className="secondary" onClick={() => setEditDocument(null)}>Cancel</button><button>Save Reminder</button></div></form></div>}
    </div>
  );
};

const ImmigrationCaseSection = ({ type, document }) => {
  const details = document?.document_details || {};
  const status = document?.reminder_status || document?.status || (details.approved_date ? 'Approved' : 'Not configured');
  const fields = type === 'H1B'
    ? [['Prevailing Wage', details.prevailing_wage], ['Applied Date', details.applied_date], ['Receipt Number', details.receipt_number], ['Valid From', details.issue_date], ['Valid Through', document?.expiry_date || details.expiry_date], ['Notification', document?.next_reminder_date || status]]
    : type === 'PERM Labor'
      ? [['Applied Date', details.applied_date], ['PERM Number', details.perm_number || details.case_number], ['Priority Date', details.priority_date], ['Status', status]]
      : [['Applied Date', details.applied_date], ['Receipt Number', details.receipt_number || details.case_number], ['Status', status]];
  const title = type === 'PERM Labor' ? 'PERM Details' : `${type} Details`;
  return <section className='candidate-case-section'>
    <h3><FaFileAlt /> {title}</h3>
    <div className='candidate-case-fields'>{fields.map(([label, value]) => <div key={label}><span>{label}</span>{label === 'Status' || label === 'Notification' ? <strong className={`candidate-case-status ${String(value || '').toLowerCase().replaceAll(' ', '-')}`}>{value || 'Not configured'}</strong> : <strong>{value || '—'}</strong>}</div>)}</div>
  </section>;
};

const Info = ({ icon, label, value }) => (
  <div className="candidate-view-info">
    <div className="candidate-view-info-icon">{icon}</div>
    <div><span>{label}</span><strong>{value || "-"}</strong></div>
  </div>
);

export default CandidateView;
