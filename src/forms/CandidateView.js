import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
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
} from "react-icons/fa";
import {
  getCandidateById,
  getMatchedJobs,
  matchSuitableJobs,
} from "../api/candidateApi";
import "./CandidateView.css";

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

const CandidateView = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [matchMessage, setMatchMessage] = useState("");

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
      <button
        type="button"
        className="candidate-view-back"
        onClick={() => navigate("/dashboard/candidates")}
      >
        <FaArrowLeft /> Back to Candidates
      </button>

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

      <section className="candidate-view-card">
        <div className="candidate-view-title">
          <FaMedal /> <h2>Skills and Resume</h2>
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
            <FaBriefcase /> <h2>AI Job Matching</h2>
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
    </div>
  );
};

const Info = ({ icon, label, value }) => (
  <div className="candidate-view-info">
    <div className="candidate-view-info-icon">{icon}</div>
    <div><span>{label}</span><strong>{value || "-"}</strong></div>
  </div>
);

export default CandidateView;
