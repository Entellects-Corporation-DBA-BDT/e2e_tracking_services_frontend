import { useEffect, useState } from "react";
import { FiCalendar, FiUploadCloud, FiUser } from "react-icons/fi";
import { getCandidateData } from "../api/candidateApi";
import {
  createRecruiterApplication,
  getRecruiterApplicationById,
  updateRecruiterApplication,
} from "../api/applicationApi";
import "./BenchSales.css";
import "./RecruiterApplicationForm.css";
import { easternDateInputValue, easternToday } from "../utils/easternTime";

const today = easternToday();

const emptyFiles = { resume_file: null, r2r_file: null, driving_file: null, visa_file: null, msc_file: null };

function RecruiterApplicationForm({ onClose, applicationId, isEdit = false, refreshData }) {
  const [formData, setFormData] = useState({
    date_created: today, candidate_id: "", candidate_name: "", client: "", role: "",
    poc: "", feedback: "", candidate_feedback: "", remarks: "",
  });
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
          date_created: easternDateInputValue(item.date_created, today),
          candidate_id: item.candidate_id || "",
          candidate_name: item.candidate_name || "",
          client: item.client || "",
          role: item.role || "",
          poc: item.poc || "",
          feedback: item.feedback || "",
          candidate_feedback: item.candidate_feedback || "",
          remarks: item.remarks || "",
        });
      }
    }).catch((error) => alert(error?.response?.data?.message || "Form details could not be loaded."))
      .finally(() => active && setLoadingForm(false));
    return () => { active = false; };
  }, [applicationId, isEdit]);

  const handleCandidateName = (event) => {
    const name = event.target.value;
    const selected = candidates.find(
      (candidate) => (candidate.name || "").trim().toLowerCase() === name.trim().toLowerCase()
    );
    setFormData((current) => ({
      ...current,
      candidate_id: selected ? String(selected.id) : "",
      candidate_name: name,
    }));
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

  return <form className="benchModal recruiter-application-form" onSubmit={submit}>
    <div className="application-form-heading"><div><h2>{isEdit ? "Edit Recruiter Application" : "New Recruiter Application"}</h2><p>Recruiting Candidate Submission</p></div></div>
    <div className="recruiter-section-heading"><h3>Application details</h3><p>Enter the candidate, client and submission information.</p></div>
    <div className="application-fields">
      <div className="application-field"><label htmlFor="recruiter-field-1">Submission Date <small>(Eastern Time)</small></label><div className="application-input-shell"><FiCalendar /><input id="recruiter-field-1" required type="date" value={formData.date_created} onChange={(e) => setFormData({ ...formData, date_created: e.target.value })} /></div></div>
      <div className="application-field"><label htmlFor="recruiter-field-2">Candidate Details</label><div className="application-input-shell"><FiUser /><input id="recruiter-field-2" required list="recruiter-candidate-options" value={formData.candidate_name} onChange={handleCandidateName} placeholder="Select or enter candidate name" /><datalist id="recruiter-candidate-options">{candidates.map((candidate) => <option key={candidate.id} value={candidate.name}>{candidate.email || candidate.skills || `Candidate #${candidate.id}`}</option>)}</datalist></div><small>Select an existing candidate or type a new candidate name.</small></div>
      <div className="application-field"><label htmlFor="recruiter-field-3">Client Name</label><input id="recruiter-field-3" type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="Enter client name" /></div>
      <div className="application-field"><label htmlFor="recruiter-field-4">Role / Position</label><input id="recruiter-field-4" type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="Enter role or position" /></div>
      <div className="application-field"><label htmlFor="recruiter-field-5">POC Name</label><input id="recruiter-field-5" type="text" value={formData.poc} onChange={(e) => setFormData({ ...formData, poc: e.target.value })} placeholder="Enter POC name" /></div>
      <div className="application-field"><label htmlFor="recruiter-field-6">Feedback</label><input id="recruiter-field-6" type="text" value={formData.feedback} onChange={(e) => setFormData({ ...formData, feedback: e.target.value })} placeholder="Enter feedback" /></div>
      <div className="application-field"><label htmlFor="recruiter-candidate-feedback">Candidate Feedback</label><input id="recruiter-candidate-feedback" name="candidate_feedback" type="text" value={formData.candidate_feedback} onChange={(e) => setFormData({ ...formData, candidate_feedback: e.target.value })} placeholder="Enter candidate feedback" /></div>
      <div className="application-field application-full-width"><label htmlFor="recruiter-field-7">Remarks</label><textarea id="recruiter-field-7" rows="3" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Additional remarks..." /></div>
    </div>
    <div className="recruiter-section-heading"><h3>Supporting documents</h3><p>Attach relevant files for this submission. Existing files are kept when no replacement is selected.</p></div>
    <div className="application-uploads">
      {[['resume_file','Resume','PDF, DOC, DOCX','.pdf,.doc,.docx'],['r2r_file','R2R','PDF, DOC, DOCX','.pdf,.doc,.docx'],['driving_file','Driving License','PDF, PNG, JPG','.pdf,.png,.jpg,.jpeg'],['visa_file','Visa Copy','PDF, PNG, JPG','.pdf,.png,.jpg,.jpeg'],['msc_file','MSA Copy','PDF, DOC, DOCX','.pdf,.doc,.docx']].map(([key,label,hint,accept]) => <div className="application-upload-card" key={key}><label htmlFor={`recruiter-${key}`} className="application-upload-label"><FiUploadCloud size={28}/><h4>Upload {label}</h4><p>{files[key]?.name || hint}</p></label><input hidden id={`recruiter-${key}`} type="file" accept={accept} onChange={(e) => setFiles({ ...files, [key]: e.target.files?.[0] || null })}/></div>)}
    </div>
    <div className="application-form-footer"><button type="button" className="application-cancel-button" onClick={onClose} disabled={loading}>Cancel</button><button type="submit" className="application-save-button" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update Application" : "Save Application"}</button></div>
  </form>;
}

export default RecruiterApplicationForm;
