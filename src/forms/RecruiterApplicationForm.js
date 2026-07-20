import { useEffect, useState } from "react";
import { FiCalendar, FiUploadCloud, FiUser } from "react-icons/fi";
import { getCandidateData } from "../api/candidateApi";
import {
  createRecruiterApplication,
  getRecruiterApplicationById,
  updateRecruiterApplication,
} from "../api/applicationApi";
import "./BenchSales.css";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const emptyFiles = { resume_file: null, r2r_file: null, driving_file: null, visa_file: null, msc_file: null };

function RecruiterApplicationForm({ onClose, applicationId, isEdit = false, refreshData }) {
  const [formData, setFormData] = useState({ date_created: today, candidate_id: "", candidate_name: "", poc: "", feedback: "", remarks: "" });
  const [files, setFiles] = useState(emptyFiles);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      getCandidateData(1, 100, ""),
      isEdit && applicationId ? getRecruiterApplicationById(applicationId) : Promise.resolve(null),
    ]).then(([candidateResponse, applicationResponse]) => {
      if (!active) return;
      setCandidates(candidateResponse.data || []);
      if (applicationResponse?.success) {
        const item = applicationResponse.data;
        setFormData({
          date_created: item.date_created || today,
          candidate_id: item.candidate_id || "",
          candidate_name: item.candidate_name || "",
          poc: item.poc || "",
          feedback: item.feedback || "",
          remarks: item.remarks || "",
        });
      }
    }).catch((error) => alert(error?.response?.data?.message || "Form details could not be loaded."))
      .finally(() => active && setLoadingForm(false));
    return () => { active = false; };
  }, [applicationId, isEdit]);

  const handleCandidate = (event) => {
    const id = event.target.value;
    const selected = candidates.find((candidate) => String(candidate.id) === id);
    setFormData((current) => ({ ...current, candidate_id: id, candidate_name: selected?.name || "" }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      Object.entries(files).forEach(([key, file]) => file && payload.append(key, file));
      const response = isEdit
        ? await updateRecruiterApplication(applicationId, payload)
        : await createRecruiterApplication(payload);
      if (!response.success) throw new Error(response.message || "Operation failed.");
      await refreshData?.();
      onClose?.();
    } catch (error) {
      alert(error?.response?.data?.message || error.message || "Application could not be saved.");
    } finally { setLoading(false); }
  };

  if (loadingForm) return <div style={{ padding: 32 }}>Loading recruiter application...</div>;

  return <form className="benchModal" onSubmit={submit}>
    <div className="benchHeader"><div><h2>{isEdit ? "Edit Recruiter Application" : "New Recruiter Application"}</h2><p>Recruiting Candidate Submission</p></div></div>
    <div className="formGrid">
      <div className="inputGroup"><label>Submission Date</label><div className="inputWrapper"><FiCalendar /><input required type="date" value={formData.date_created} onChange={(e) => setFormData({ ...formData, date_created: e.target.value })} /></div></div>
      <div className="inputGroup"><label>Candidate Details</label><div className="inputWrapper"><FiUser /><select required value={formData.candidate_id} onChange={handleCandidate}><option value="">Select Candidate</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></div></div>
      <div className="inputGroup"><label>POC Name</label><input type="text" value={formData.poc} onChange={(e) => setFormData({ ...formData, poc: e.target.value })} placeholder="Enter POC name" /></div>
      <div className="inputGroup"><label>Feedback</label><input type="text" value={formData.feedback} onChange={(e) => setFormData({ ...formData, feedback: e.target.value })} placeholder="Enter feedback" /></div>
      <div className="inputGroup fullWidth"><label>Remarks</label><textarea rows="4" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Additional remarks..." /></div>
    </div>
    <div className="uploadGrid">
      {[['resume_file','Resume','PDF, DOC, DOCX','.pdf,.doc,.docx'],['r2r_file','R2R','PDF, DOC, DOCX','.pdf,.doc,.docx'],['driving_file','Driving License','PDF, PNG, JPG','.pdf,.png,.jpg,.jpeg'],['visa_file','Visa Copy','PDF, PNG, JPG','.pdf,.png,.jpg,.jpeg'],['msc_file','MSA Copy','PDF, DOC, DOCX','.pdf,.doc,.docx']].map(([key,label,hint,accept]) => <div className="uploadBox" key={key}><label htmlFor={`recruiter-${key}`} className="uploadLabel"><FiUploadCloud size={28}/><h4>Upload {label}</h4><p>{files[key]?.name || hint}</p></label><input hidden id={`recruiter-${key}`} type="file" accept={accept} onChange={(e) => setFiles({ ...files, [key]: e.target.files?.[0] || null })}/></div>)}
    </div>
    <div className="modalFooter"><button type="button" className="cancelBtn" onClick={onClose} disabled={loading}>Cancel</button><button type="submit" className="saveBtn" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update Application" : "Save Application"}</button></div>
  </form>;
}

export default RecruiterApplicationForm;
