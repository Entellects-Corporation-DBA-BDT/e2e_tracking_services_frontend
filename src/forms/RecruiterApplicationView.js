import { useEffect, useState } from "react";
import { FaCalendarAlt, FaFileAlt, FaUser } from "react-icons/fa";
import { baseUrlImg } from "../Config/env";
import { getRecruiterApplicationById } from "../api/applicationApi";
import "./ApplicationView.css";

const fileUrl = (path) => !path ? null : /^https?:\/\//i.test(path) ? path : `${baseUrlImg}/${String(path).replace(/^\//, "")}`;

function RecruiterApplicationView({ applicationId }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getRecruiterApplicationById(applicationId).then((response) => response.success && setApplication(response.data)).finally(() => setLoading(false)); }, [applicationId]);
  if (loading) return <div>Loading...</div>;
  if (!application) return <div>No recruiter application found.</div>;
  const documents = [['Resume',application.resume_path],['R2R',application.r2r_path],['Driving License',application.driving_path],['Visa Copy',application.visa_path],['MSA Copy',application.msc_path]];
  return <div className="application-view">
    <div className="candidate-header"><div className="candidate-avatar"><FaUser/></div><div className="candidate-info"><h2>{application.candidate_name}</h2><p>Recruiter Candidate Application</p></div></div>
    <div className="view-card"><h3>Submission Information</h3><div className="info-grid"><div className="info-item"><FaCalendarAlt/><div><label>Submission Date</label><span>{application.date_created || '-'}</span></div></div><div className="info-item"><FaUser/><div><label>Recruiter</label><span>{application.employee_name || '-'}</span></div></div><div className="info-item"><FaUser/><div><label>POC Name</label><span>{application.poc || '-'}</span></div></div></div></div>
    <div className="view-card"><h3>Feedback</h3><div className="remarks-box">{application.feedback || "No feedback available."}</div></div>
    <div className="view-card"><h3>Remarks</h3><div className="remarks-box">{application.remarks || "No remarks available."}</div></div>
    <div className="view-card"><h3>Documents</h3><div className="document-grid">{documents.map(([label,path]) => path ? <a key={label} href={fileUrl(path)} target="_blank" rel="noreferrer" className="document-card"><FaFileAlt/><span>{label}</span></a> : <div key={label} className="document-card" style={{opacity:.45}}><FaFileAlt/><span>{label} not uploaded</span></div>)}</div></div>
  </div>;
}

export default RecruiterApplicationView;
