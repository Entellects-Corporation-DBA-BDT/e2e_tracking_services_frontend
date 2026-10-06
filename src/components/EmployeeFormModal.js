import "../styles/attendanceConfigurations.css";
import { useEffect, useState } from "react";
import { FaTimes, FaUserPlus } from "react-icons/fa";
import { createEmployee, getEmployeeById, getEmployeeUploadLimits, getPositions, updateEmployee, updateMyEmployeeProfile } from "../api/employeeApi";
import EmployeeCollectionFields from "./EmployeeCollectionFields";
import { collectionRequest, emptyCollection, normalizeCollection, newEducation, newEmployment, newCertification, newReference, validateCollectionFiles } from "../utils/employeeCollection";
const empty = {
  employee_id: "",
  firstname: "",
  lastname: "",
  address: "",
  birthdate: "",
  contact_info: "",
  gender: "",
  position_id: "",
  schedule_id: "0",
  photo: "",
  date_of_joining: ""
};
export default function EmployeeFormModal({
  employee,
  onClose,
  onSaved,
  selfService=false,
  inline=false,
  editSection="all",
  addEntry=false
}) {
  const useLoadedRecord=Boolean(inline && employee && Object.prototype.hasOwnProperty.call(employee,"collection") && employee.firstname!==undefined);
  const [form, setForm] = useState({
      ...empty
    }),
    [collection, setCollection] = useState(emptyCollection),
    [files, setFiles] = useState({}),
    [limits, setLimits] = useState({}),
    [positions, setPositions] = useState([]),
    [saving, setSaving] = useState(false),
    [loading, setLoading] = useState(Boolean(employee) && !useLoadedRecord),
    [error, setError] = useState(""),
    [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    if(!selfService && ["all","personal"].includes(editSection)) getPositions().then(r => {
      if (active) setPositions(r.data || []);
    }).catch(() => {
      if (active) setError("Positions could not be loaded. Please reopen this form to retry.");
    });
    if (!employee) getEmployeeUploadLimits().then(r => {
      if (active) setLimits(r.upload_limits || {});
    }).catch(() => {});
    if (employee) {
      setLoading(true);
      const hydrate = data => {
        if (!active) return;
        setForm({
          ...empty,
          ...data,
          ...Object.fromEntries(["pan_number","uan_number","pf_account_number","esi_number","bank_name","bank_account_number","ifsc_code","pay_mode"].map(key=>[key,data.payroll_profile?.[key]||""])),
          birthdate: data.birthdate === "0000-00-00" ? "" : data.birthdate || "",
          date_of_joining: data.date_of_joining || "",
          position_id: data.position_id ?? "",
          schedule_id: data.schedule_id ?? ""
        });
        const saved = normalizeCollection(data.collection);
        if (!saved.email) saved.email = data.payroll_email || "";
        if(addEntry){const groups={education:["education",newEducation],experience:["employment",newEmployment],certifications:["certifications",newCertification],references:["references",newReference]};const item=groups[editSection];if(item&&saved[item[0]].length<(editSection==="references"?10:20))saved[item[0]]=[...saved[item[0]],item[1]()];if(editSection==="experience")saved.has_experience=true;}
        setCollection(saved);
        setLimits(data.upload_limits || {});
        setLoadFailed(false);
      };
      if(useLoadedRecord){hydrate(employee);setLoading(false);}else getEmployeeById(employee.id).then(r=>hydrate(r.data)).catch(e => {
        if (active) {
          setLoadFailed(true);
          setError(e?.response?.data?.message || "Employee details could not be loaded. Reopen this form to retry.");
        }
      }).finally(() => {
        if (active) setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [employee,selfService,editSection,addEntry,useLoadedRecord]);
  const change = e => setForm(c => ({
    ...c,
    [e.target.name]: e.target.value
  }));
  const submit = async e => {
    e.preventDefault();
    if (saving || loading || loadFailed) return;
    const fileError = validateCollectionFiles(files, limits);
    if (fileError) {
      setError(fileError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = collectionRequest({
          ...form,
          ...(employee ? {} : {employee_id: undefined}),
          collection,
          ...(editSection!=="all"?{edit_section:editSection}:{})
        }, files),
        result = selfService ? await updateMyEmployeeProfile(data) : employee ? await updateEmployee(employee.id, data) : await createEmployee(data);
      if (!result.success) throw new Error(result.message);
      onSaved(result.message);
    } catch (err) {
      setError(err.code==="ECONNABORTED"?"Saving took too long. Check your connection and try again.":err?.response?.data?.message || err.message || "Employee could not be saved.");
    } finally {
      setSaving(false);
    }
  };
  const field = (name, label, type = "text", required = false) => <label key={name}>{label}{required && " *"}<input readOnly={selfService && name==="date_of_joining"} required={required} name={name} type={type} min={type === "number" ? "0" : undefined} value={form[name] ?? ""} onChange={change} /></label>;
  return <div className={inline?"employee-profile-inline-edit":"e2e_alias_overlay"} onMouseDown={() => !inline && !saving && onClose()}><section className="employee-form-modal collection-modal" role={inline?"region":"dialog"} aria-modal={inline?undefined:true} aria-labelledby="employee-form-title" onMouseDown={e => e.stopPropagation()}>
 <header><div><FaUserPlus /><span><h2 id="employee-form-title">{editSection!=="all"?`Update ${editSection.charAt(0).toUpperCase()+editSection.slice(1)}`:selfService ? "Edit My Profile" : employee ? "Edit Employee" : "Add Employee"}</h2><p>Employee identity, candidate information and documents.</p></span></div><button type="button" aria-label="Close employee form" disabled={saving} onClick={onClose}><FaTimes /></button></header>
 {loading && <p role="status" style={{
        padding: 20
      }}>Loading complete employee record…</p>}
 <form onSubmit={submit}><fieldset className="collection-form-body" disabled={loading || saving || loadFailed}>{["all","personal"].includes(editSection) && <div className="employee-form-grid">
 {employee ? <label>Employee ID<input readOnly value={form.employee_id} /></label> : <div className="employee-auto-id"><strong>Automatic Employee ID</strong><span>A BDT-I number is generated securely when you save.</span></div>}{field("firstname", "First Name", "text", true)}{field("lastname", "Last Name", "text", true)}{field("birthdate", "Birth Date", "date", true)}{field("contact_info", "Phone Number", "tel", true)}{field("date_of_joining", "Date of Joining", "date")}
 <label>Gender *<select required name="gender" value={form.gender} onChange={change}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
 {!selfService && <label>Position{!employee && " *"}<select required={!employee} name="position_id" value={form.position_id ?? ""} onChange={change}><option value="">Not assigned</option>{positions.map(p => <option key={p.id} value={p.id}>{p.position_name}</option>)}</select></label>}
 <label>Personal Email<input required={editSection==="personal"} type="email" value={collection.email || ""} onChange={e => setCollection(c => ({
                ...c,
                email: e.target.value
              }))} /></label>{!selfService && field("schedule_id", "Schedule ID", "number")}<label className="wide">Permanent Address *<textarea required name="address" maxLength={5000} value={form.address} onChange={change} /></label></div>}
 {["all","bank"].includes(editSection) && <fieldset><legend>Statutory & Bank Details</legend><div className="employee-form-grid">{[["pan_number","PAN"],["uan_number","UAN"],["pf_account_number","PF Account Number"],["esi_number","ESI Account Number"],["bank_name","Bank Name"],["bank_account_number","Bank Account Number"],["ifsc_code","IFSC Code"],["pay_mode","Pay Mode"]].map(([key,label])=>field(key,label,"text",editSection==="bank" && ["pan_number","bank_name","bank_account_number","ifsc_code"].includes(key)))}</div></fieldset>}
 {!["personal","bank"].includes(editSection) && <EmployeeCollectionFields visibleSection={editSection} value={collection} onChange={setCollection} files={files} onFilesChange={setFiles} employeeId={employee?.id} lockUploadedDocuments={selfService} admin limits={limits} candidateName={[form.firstname, form.lastname].filter(Boolean).join(" ")} candidatePhone={form.contact_info} />}</fieldset>
 {error && <p className="e2e_alias_error" role="alert">{error}</p>}<footer><button type="button" className="secondary" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={saving || loading || loadFailed}>{saving ? "Saving…" : employee ? "Save Changes" : "Add Employee"}</button></footer></form></section></div>;
}
