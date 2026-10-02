import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEmployeeOnboardingInvite, submitEmployeeOnboarding } from "../api/employeeApi";
import EmployeeCollectionFields from "../components/EmployeeCollectionFields";
import { collectionRequest, emptyCollection, validateCollectionFiles } from "../utils/employeeCollection";
import beeDataLogo from "../assets/beedata-logo.png";
import "../styles/employeeOnboarding.css";
const initial = {
  firstname: "",
  lastname: "",
  birthdate: "",
  gender: "",
  address: "",
  contact_info: "",
  date_of_joining: "",
  department: "",
  monthly_salary: "",
  pan_number: "",
  uan_number: "",
  pf_account_number: "",
  esi_number: "",
  bank_name: "",
  bank_account_number: "",
  ifsc_code: "",
  pay_mode: "Bank Transfer"
};
export default function PublicEmployeeOnboarding() {
  const {
      token
    } = useParams(),
    [form, setForm] = useState(initial),
    [collection, setCollection] = useState(emptyCollection),
    [files, setFiles] = useState({}),
    [email, setEmail] = useState(""),
    [roleName, setRoleName] = useState(""),
    [limits, setLimits] = useState({}),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setEmail("");
    setError("");
    setMessage("");
    setForm(initial);
    setCollection(emptyCollection());
    setFiles({});
    getEmployeeOnboardingInvite(token).then(r => {
      if (!r.success || !r.personal_email) throw new Error(r.message || "This onboarding link is unavailable.");
      if (active) {
        setEmail(r.personal_email);
        setRoleName(r.role_name || "");
        setLimits(r.upload_limits || {});
        setCollection(c => ({
          ...c,
          email: r.personal_email
        }));
      }
    }).catch(e => {
      if (active) setError(e?.response?.data?.message || e.message || "This onboarding link is unavailable.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);
  const set = (key, value) => setForm(current => ({
    ...current,
    [key]: value
  }));
  const submit = async event => {
    event.preventDefault();
    if (busy || loading || !email) return;
    const fileError = validateCollectionFiles(files, limits);
    if (fileError) {
      setError(fileError);
      return;
    }
    setError("");
    setBusy(true);
    setProgress(0);
    try {
      const result = await submitEmployeeOnboarding(token, collectionRequest({
        ...form,
        collection
      }, files), e => setProgress(e.total ? Math.round(e.loaded / e.total * 100) : 0));
      if (!result.success) throw new Error(result.message || "Submission failed.");
      setMessage(result.message + " Employee ID: " + result.employee_id);
      setFiles({});
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Details could not be submitted.");
    } finally {
      setBusy(false);
    }
  };
  const field = (key, label, type = "text", required = false) => <label key={key}>{label}{required && " *"}<input required={required} type={type} maxLength={type === "text" || type === "tel" ? 250 : undefined} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} value={form[key]} onChange={e => set(key, e.target.value)} /></label>;
  if (loading || (!email && error)) return <main className="employee-onboarding"><section className="onboarding-state"><img src={beeDataLogo} alt="BeeData" /><h1>Candidate Information & Document Collection</h1><p role={error ? "alert" : "status"} className={error ? "error" : ""}>{error || "Checking your secure invitation…"}</p></section></main>;
  return <main className="employee-onboarding"><form onSubmit={submit}><header><img src={beeDataLogo} alt="BeeData" /><div><span className="onboarding-eyebrow">BEEDATA · EMPLOYEE ONBOARDING</span><h1>Candidate / Employee Information Form</h1><p>Visakhapatnam · {email}</p></div></header>
 {message ? <div className="onboarding-success" role="status"><span>✓</span><h2>Thank you for completing your form</h2><p>{message}</p><p>HR will review your information and documents.</p></div> : <>
 {roleName && <div className="onboarding-role-banner">Congratulations! You have been selected for<strong>{roleName}</strong></div>}<div className="onboarding-intro"><h2>Your next chapter starts here</h2><p>Review your basic details below, then add family, experience, education, certifications and references. Fields marked * are required. You can leave optional documents pending.</p></div>
 <fieldset className="onboarding-form-body" disabled={busy}><fieldset><legend>Basic Details</legend><div className="onboarding-grid">
 {field("firstname", "First Name", "text", true)}{field("lastname", "Last Name", "text", true)}{field("contact_info", "Phone Number", "tel", true)}{field("birthdate", "Date of Birth", "date", true)}
 <label>Gender *<select required value={form.gender} onChange={e => set("gender", e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label>
 {field("date_of_joining", "Expected Joining Date (if known)", "date")}{field("department", "Department")}{field("monthly_salary", "Monthly Salary (₹)", "number")}
 <label>Work Location<input readOnly value="Visakhapatnam" /></label><label className="wide">Permanent Address *<textarea required maxLength={5000} rows={3} value={form.address} onChange={e => set("address", e.target.value)} /></label></div></fieldset>
 <EmployeeCollectionFields value={collection} onChange={setCollection} files={files} onFilesChange={setFiles} limits={limits} candidateName={[form.firstname, form.lastname].filter(Boolean).join(" ")} candidatePhone={form.contact_info} />
 <fieldset><legend>Statutory & Bank Details <small>Optional</small></legend><div className="onboarding-grid">{[["pan_number", "PAN"], ["uan_number", "UAN"], ["pf_account_number", "PF Account Number"], ["esi_number", "ESI Account Number"], ["bank_name", "Bank Name"], ["bank_account_number", "Bank Account Number"], ["ifsc_code", "IFSC Code"], ["pay_mode", "Pay Mode"]].map(([key, label]) => field(key, label))}</div></fieldset></fieldset>
 {error && <p className="error" role="alert">{error}</p>}<div className="onboarding-submit"><p>{Object.values(files).flat().length} documents selected · Your information is sent securely.</p><button type="submit" disabled={busy}>{busy ? progress > 0 && progress < 100 ? "Uploading… " + progress + "%" : "Saving your details…" : "Submit Information & Documents"}</button></div>{busy && <div className="onboarding-upload-progress" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{
            width: progress + "%"
          }} /></div>}</>}
 </form></main>;
}
