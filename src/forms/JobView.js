import React, { useEffect, useState } from "react";
import {
    FaBriefcase,
    FaMapMarkerAlt,
    FaUserTie,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaGlobeAmericas,
    FaClock,
    FaClipboardList,
    FaCheckCircle,
    FaFileAlt,
    FaCopy,
    FaCheck,
    FaRobot,
    FaUsers,
    FaMedal,
    FaSpinner
} from "react-icons/fa";
import { matchCandidates, getMatchedCandidates } from "../api/jobApi";
import { getJobById } from "../api/jobApi";
import { useParams } from "react-router-dom";
import "./JobView.css";

const JobView = () => {
    const loadingSteps = [
        "🤖 Initializing AI Matching Engine...",
        "📄 Reading Job Description...",
        "👥 Fetching Candidate Profiles...",
        "🧠 Understanding Required Skills...",
        "⚡ Comparing Technical Skills...",
        "📍 Checking Candidate Locations...",
        "🛂 Verifying Visa Eligibility...",
        "💼 Matching Experience Level...",
        "🎓 Validating Education...",
        "🏅 Checking Certifications...",
        "📊 Calculating Match Scores...",
        "✨ Ranking Best Candidates...",
        "🚀 Finalizing AI Recommendations..."
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [matching, setMatching] = useState(false);
    const [matchedCandidates, setMatchedCandidates] = useState([]);

    useEffect(() => {
        if (!matching) {
            setCurrentStep(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev >= loadingSteps.length - 1) return prev;
                return prev + 1;
            });
        }, 1200);
        return () => clearInterval(interval);
    }, [matching]);

    const copyDescription = () => {
        navigator.clipboard.writeText(job.job_description || "");
        setCopied(true);
        setTimeout(() => { setCopied(false); }, 2000);
    };

    const handleMatchProfiles = async () => {
        try {
            setMatching(true);
            const res = await matchCandidates(job.id);
            if (res.success) {
                setMatchedCandidates(res.results || []);
            }
        }
        catch (err) {
            console.log(err);
        }
        finally {
            setMatching(false);
        }

    };

    const handleRefreshMatching = async () => {
        try {
            setMatching(true);
            await matchCandidates(jobId);
            await fetchMatchedCandidates();
        } catch (err) {
            console.error(err);
        } finally {
            setMatching(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchJob();
            fetchMatchedCandidates();
        }
    }, [jobId]);

    const fetchJob = async () => {
        try {
            setLoading(true);
            const response = await getJobById(jobId);
            if (response.success) {
                setJob(response.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMatchedCandidates = async () => {
        try {
            setLoading(true);
            const res = await getMatchedCandidates(jobId);
            if (res.success) {
                setMatchedCandidates(res.data || []);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString(
            "en-GB",
            {
                timeZone: "America/New_York",
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    if (loading) {
        return (
            <div className="job-view-loading">Loading Job...</div>
        );
    }

    if (!job) {
        return (
            <div className="job-view-loading">Job Not Found</div>
        );
    }

    return (
        <div className="job-view">
            {/* HEADER */}
            <div className="job-header">
                <div className="job-header-left">
                    <div className="job-avatar"><FaBriefcase /></div>
                    <div>
                        <h1>{job.position}</h1>
                        <p>
                            <FaMapMarkerAlt />
                            {job.location}
                        </p>
                    </div>
                </div>
                <div className="job-header-right">
                    <span className={`job-status ${job.status}`}>{job.status}</span>
                    <div className="job-created">
                        <FaUserTie />
                        <span>{job.created_by_name || job.created_by}</span>
                    </div>
                    <div className="job-created">
                        <FaCalendarAlt />
                        <span>{formatDate(job.created_at)}</span>
                    </div>
                </div>
            </div>


{/* ============================================================
    JOB INFORMATION
============================================================ */}

            <div className="job-card">
                <div className="job-card-title">
                    <FaBriefcase />
                    <h2>Job Information</h2>
                </div>
                <div className="job-grid">
                    <div className="job-info-box">
                        <div className="job-icon blue"><FaMapMarkerAlt /></div>
                        <div>
                            <label>Location</label>
                            <h4>{job.location || "-"}</h4>
                        </div>
                    </div>
                    <div className="job-info-box">
                        <div className="job-icon purple"><FaGlobeAmericas /></div>
                        <div>
                            <label>Domain</label>
                            <h4>{job.domain || "-"}</h4>
                        </div>
                    </div>
                    <div className="job-info-box">
                        <div className="job-icon orange"><FaClock /></div>
                        <div>
                            <label>Duration</label>
                            <h4>{job.duration || "-"}</h4>
                        </div>
                    </div>
                    <div className="job-info-box">
                        <div className="job-icon green"><FaMoneyBillWave /></div>
                        <div>
                            <label>Rate</label>
                            <h4>{job.rate || "-"}</h4>
                        </div>
                    </div>

                    <div className="job-info-box">
                        <div className="job-icon red"><FaCheckCircle /></div>
                        <div>
                            <label>Visa</label>
                            <h4>{job.visa || "-"}</h4>
                        </div>
                    </div>
                    <div className="job-info-box">
                        <div className="job-icon cyan"><FaBriefcase /></div>
                        <div>
                            <label>Status</label>
                            <h4>{job.status || "-"}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
    INTERVIEW PROCESS
============================================================ */}

            <div className="job-card">
                <div className="job-card-title">
                    <FaClipboardList />
                    <h2>Interview Process</h2>
                </div>
                <div className="interview-process-box">
                    {job.interview_process ? (
                        job.interview_process
                            .split(",")
                            .map((step, index) => (
                                <div
                                    className="process-item"
                                    key={index}
                                >
                                    <div className="process-number">{index + 1}</div>
                                    <div className="process-content">
                                        <h4>{step.trim()}</h4>
                                        <span>Interview Stage</span>
                                    </div>
                                </div>
                            ))
                    ) : (
                        <div className="no-process">No Interview Process Available</div>
                    )}
                </div>
            </div>

{/* =====================================================
        JOB DESCRIPTION
====================================================== */}

            <div className="job-card">
                <div className="job-description-header">
                    <div className="job-card-title">
                        <FaFileAlt />
                        <h2>Job Description</h2>
                    </div>
                    <button
                        className="copy-btn"
                        onClick={copyDescription}
                    >
                        {copied ? <><FaCheck />Copied</> : <><FaCopy />Copy</>}
                    </button>
                </div>
                <div className={expanded ? "job-description expanded" : "job-description"}>
                    {job.job_description || "No Job Description Available."}
                </div>
                <div className="job-description-footer">
                    <span>Characters : {job.job_description ? job.job_description.length : 0} </span>
                    {job.job_description &&
                        job.job_description.length > 500 && (
                            <button
                                className="expand-btn"
                                onClick={() =>
                                    setExpanded(!expanded)
                                }
                            >
                                {expanded ? "Show Less" : "Read More"}
                            </button>
                        )
                    }
                </div>
            </div>
            <div className="job-card">
                <div className="job-card-title">
                    <FaUsers />
                    <h2>AI Candidate Matching</h2>
                </div>
                <button
                    className="match-btn"
                    onClick={handleMatchProfiles}
                    disabled={matching}
                >
                    {matching ? <>
                        <FaSpinner className="spin" />
                        Matching Candidates...
                    </>
                        :
                        <>
                            <FaRobot />
                            Match Candidate Profiles
                        </>}
                </button>
            </div>
            {
                matching && (
                    <div className="matching-overlay">
                        <div className="matching-box">
                            <div className="ai-brain">
                                <div className="brain-circle">🤖</div>
                            </div>
                            <h2>AI Matching In Progress</h2>
                            <p className="matching-subtitle">Please wait while AI analyzes every profile.</p>
                            <div className="matching-steps">
                                {loadingSteps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={index <= currentStep ? "matching-step active" : "matching-step"}
                                    >
                                        <span className="tick">{index < currentStep ? "✓" : "•"}</span>
                                        {step}
                                    </div>
                                ))}
                            </div>
                            <div className="matching-progress">
                                <div
                                    className="matching-progress-bar"
                                    style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
            {matchedCandidates.length > 0 &&
                <div className="job-card">
                    <h2>🏆 AI Shortlisted Candidates</h2>
                    <table className="match-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Candidate</th>
                                <th>Match</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matchedCandidates.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1} </td>
                                    <td>{item.name}</td>
                                    <td> <span className="score">{item.overall_score}%</span> </td>
                                    <td>{item.ai_reason.length > 120 ? item.ai_reason.substring(0, 120) + "..." : item.ai_reason}</td>
                                </tr>
                            ))
                            }
                        </tbody>
                    </table>
                </div>
            }
        </div>
    );
};

export default JobView;