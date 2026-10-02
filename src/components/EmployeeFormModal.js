import "../styles/attendanceConfigurations.css";
import { useEffect, useState } from "react";
import { FaTimes, FaUserPlus } from "react-icons/fa";
import { createEmployee, getEmployeeById, getEmployeeUploadLimits, getPositions, updateEmployee } from "../api/employeeApi";
import EmployeeCollectionFields from "./EmployeeCollectionFields";
import { collectionRequest, emptyCollection, normalizeCollection, validateCollectionFiles } from "../utils/employeeCollection";
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
  onSaved
}) {
  const [form, setForm] = useState({
      ...empty
    }),
    [collection, setCollection] = useState(emptyCollection),
    [files, setFiles] = useState({}),
    [limits, setLimits] = useState({}),
    [positions, setPositions] = useState([]),
    [saving, setSaving] = useState(false),
    [loading, setLoading] = useState(Boolean(employee)),
    [error, setError] = useState(""),
    [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    getPositions().then(r => {
      if (active) setPositions(r.data || []);
    }).catch(() => {
      if (active) setError("Positions could not be loaded. Please reopen this form to retry.");
    });
    if (!employee) getEmployeeUploadLimits().then(r => {
      if (active) setLimits(r.upload_limits || {});
    }).catch(() => {});
    if (employee) {
      setLoading(true);
      getEmployeeById(employee.id).then(r => {
        if (!active) return;
        const data = r.data;
        setForm({
          ...empty,
          ...data,
          birthdate: data.birthdate === "0000-00-00" ? "" : data.birthdate || "",
          date_of_joining: data.date_of_joining || "",
          position_id: data.position_id ?? "",
          schedule_id: data.schedule_id ?? ""
        });
        const saved = normalizeCollection(data.collection);
        if (!saved.email) saved.email = data.payroll_email || "";
        setCollection(saved);
        setLimits(data.upload_limits || {});
        setLoadFailed(false);
      }).catch(e => {
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
  }, [employee]);
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
          collection
        }, files),
        result = employee ? await updateEmployee(employee.id, data) : await createEmployee(data);
      if (!result.success) throw new Error(result.message);
      onSaved(result.message);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Employee could not be saved.");
    } finally {
      setSaving(false);
    }
  };
  const field = (name, label, type = "text", required = false) => <label key={name}>{label}{required && " *"}<input required={required} name={name} type={type} min={type === "number" ? "0" : undefined} value={form[name] ?? ""} onChange={change} /></label>;
  return <div className="e2e_alias_overlay" onMouseDown={() => !saving && onClose()}><section className="employee-form-modal collection-modal" role="dialog" aria-modal="true" aria-labelledby="employee-form-title" onMouseDown={e => e.stopPropagation()}>
 <header><div><FaUserPlus /><span><h2 id="employee-form-title">{employee ? "Edit Employee" : "Add Employee"}</h2><p>Employee identity, candidate information and documents.</p></span></div><button type="button" aria-label="Close employee form" disabled={saving} onClick={onClose}><FaTimes /></button></header>
 {loading && <p role="status" style={{
        padding: 20
      }}>Loading complete employee record…</p>}
 <form onSubmit={submit}><fieldset className="collection-form-body" disabled={loading || saving || loadFailed}><div className="employee-form-grid">
 {employee ? <label>Employee ID<input readOnly value={form.employee_id} /></label> : <div className="employee-auto-id"><strong>Automatic Employee ID</strong><span>An EMP-I number is generated securely when you save.</span></div>}{field("firstname", "First Name", "text", true)}{field("lastname", "Last Name", "text", true)}{field("birthdate", "Birth Date", "date", true)}{field("contact_info", "Phone Number", "tel", true)}{field("date_of_joining", "Date of Joining", "date")}
 <label>Gender *<select required name="gender" value={form.gender} onChange={change}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
 <label>Position{!employee && " *"}<select required={!employee} name="position_id" value={form.position_id ?? ""} onChange={change}><option value="">Not assigned</option>{positions.map(p => <option key={p.id} value={p.id}>{p.position_name}</option>)}</select></label>
 <label>Personal Email<input type="email" value={collection.email || ""} onChange={e => setCollection(c => ({
                ...c,
                email: e.target.value
              }))} /></label>{field("schedule_id", "Schedule ID", "number")}<label className="wide">Permanent Address *<textarea required name="address" maxLength={5000} value={form.address} onChange={change} /></label></div>
 <EmployeeCollectionFields value={collection} onChange={setCollection} files={files} onFilesChange={setFiles} employeeId={employee?.id} admin limits={limits} candidateName={[form.firstname, form.lastname].filter(Boolean).join(" ")} candidatePhone={form.contact_info} /></fieldset>
 {error && <p className="e2e_alias_error" role="alert">{error}</p>}<footer><button type="button" className="secondary" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={saving || loading || loadFailed}>{saving ? "Saving…" : employee ? "Save Changes" : "Add Employee"}</button></footer></form></section></div>;
}
