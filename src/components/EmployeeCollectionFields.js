import { useId, useState } from "react";
import { downloadEmployeeDocument } from "../api/employeeApi";
import { educationDegrees, newEducation, newEmployment, newCertification, newReference } from "../utils/employeeCollection";
import "../styles/employeeCollection.css";
export default function EmployeeCollectionFields({
  value,
  onChange,
  files = {},
  onFilesChange,
  employeeId,
  admin = false,
  readOnly = false,
  limits = {}
}) {
  const id = useId(),
    [error, setError] = useState(""),
    [downloading, setDownloading] = useState("");
  const set = (key, next) => onChange?.({
    ...value,
    [key]: next
  });
  const updateRow = (key, rowId, field, next) => set(key, value[key].map(row => row.id === rowId ? {
    ...row,
    [field]: next
  } : row));
  const activeKeys = [...value.education.flatMap(r => ["education_" + r.id + "_certificate", "education_" + r.id + "_marksheets"]), ...(value.has_experience ? value.employment.map(r => "experience_" + r.id) : []), ...value.certifications.map(r => "certification_" + r.id)];
  const archived = value.documents.filter(doc => !activeKeys.includes(doc.category));
  const discardFiles = (prefixes, exact = false) => onFilesChange?.(Object.fromEntries(Object.entries(files).filter(([key]) => !prefixes.some(prefix => exact ? key === prefix : key.startsWith(prefix)))));
  const removeRow = (key, row) => {
    const remaining = value[key].filter(r => r.id !== row.id);
    if (key === "employment") onChange?.({
      ...value,
      employment: remaining,
      has_experience: remaining.length > 0
    });else set(key, remaining);
    discardFiles(key === "education" ? ["education_" + row.id + "_certificate", "education_" + row.id + "_marksheets"] : [key === "employment" ? "experience_" + row.id : "certification_" + row.id], true);
  };
  const input = (label, key, type = "text") => <label key={key}>{label}<input type={type} value={value[key] || ""} maxLength={500} disabled={readOnly} onChange={e => set(key, e.target.value)} /></label>;
  const rowInput = (group, row, key, label, type = "text", required = false) => <label key={key}>{label}{required && !readOnly && " *"}<input aria-label={label + " " + row.id} type={type} value={row[key] || ""} maxLength={type === "text" || type === "tel" ? 500 : undefined} min={type === "number" ? 1900 : undefined} max={type === "number" ? new Date().getFullYear() + 1 : undefined} step={type === "number" ? 1 : undefined} required={required && !readOnly} disabled={readOnly} onChange={e => updateRow(group, row.id, key, e.target.value)} /></label>;
  const download = async doc => {
    setError("");
    setDownloading(doc.id);
    try {
      await downloadEmployeeDocument(employeeId, doc.id, doc.name);
    } catch (e) {
      setError("Document download failed. Please try again.");
    } finally {
      setDownloading("");
    }
  };
  const savedFile = doc => <div className="collection-file" key={doc.id}><span>{doc.name}</span>{employeeId && <button type="button" disabled={!!downloading} onClick={() => download(doc)}>{downloading === doc.id ? "Downloading…" : "Download"}</button>}</div>;
  const upload = (key, label) => <div className="collection-upload" key={key}><strong>{label}</strong>{!readOnly && <label className="collection-file-picker">Choose documents<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple aria-label={"Upload " + label + " " + key} onChange={e => {
        onFilesChange?.({
          ...files,
          [key]: [...(files[key] || []), ...Array.from(e.target.files || [])].filter((file, index, all) => all.findIndex(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified) === index)
        });
        e.target.value = "";
      }} /></label>}
 {files[key]?.map((file, index) => <div className="collection-file" key={file.name + index}><span>{file.name} <small>({(file.size / 1048576).toFixed(2)} MB)</small></span><button type="button" aria-label={"Remove " + file.name} onClick={() => onFilesChange?.({
        ...files,
        [key]: files[key].filter((_, i) => i !== index)
      })}>Remove</button></div>)}
 {value.documents.filter(doc => doc.category === key).map(savedFile)}</div>;
  const section = (n, title, children, note = "") => <section className="collection-section" id={id + "-" + n}><div className="collection-section-heading"><span>{n}</span><div><h3>{title}</h3>{note && <p>{note}</p>}</div></div>{children}</section>;
  const removeButton = (group, row, label) => !readOnly && !(group === "education" && !admin && value.education.length === 1) && <button className="collection-remove" type="button" aria-label={"Remove " + label} onClick={() => removeRow(group, row)}>Remove</button>;
  const empty = <p className="collection-note">Not provided.</p>;
  return <div className="employee-collection"><nav className="collection-navigation" aria-label="Form sections">{["Family", "Experience", "Education", "Certifications", "References", "Declaration"].map((label, i) => <a key={label} href={"#" + id + "-" + (i + 1)} onClick={e => {
        e.preventDefault();
        document.getElementById(id + "-" + (i + 1))?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start"
        });
      }}>{i + 1}. {label}</a>)}</nav>
 {error && <p className="collection-error" role="alert">{error}</p>}
 {section(1, "Family Details", <><div className="collection-grid">{input("Father's Name", "father_name")}{input("Father's Cell Phone", "father_phone", "tel")}{input("Mother's Name", "mother_name")}{input("Mother's Cell Phone", "mother_phone", "tel")}</div><h4>Siblings <small>Optional</small></h4>{value.siblings.map((s, i) => <div className="collection-row" key={i}>{[["name", "Sibling Name"], ["relationship", "Relationship"], ["phone", "Cell Phone Number"]].map(([k, l]) => <label key={k}>{l}<input value={s[k] || ""} disabled={readOnly} maxLength={250} onChange={e => set("siblings", value.siblings.map((r, j) => j === i ? {
            ...r,
            [k]: e.target.value
          } : r))} /></label>)}{!readOnly && <button type="button" aria-label={"Remove sibling " + (i + 1)} onClick={() => set("siblings", value.siblings.filter((_, j) => i !== j))}>Remove</button>}</div>)}{!readOnly && value.siblings.length < 10 && <button className="collection-add" type="button" onClick={() => set("siblings", [...value.siblings, {
        name: "",
        relationship: "",
        phone: ""
      }])}>+ Add sibling</button>}</>)}
 {section(2, "Previous Work Experience", <><label className="collection-consent"><input type="checkbox" checked={value.has_experience} disabled={readOnly} onChange={e => {
          const checked = e.target.checked;
          onChange?.({
            ...value,
            has_experience: checked,
            employment: checked && !value.employment.length ? [newEmployment()] : value.employment
          });
          if (!checked) discardFiles(["experience_"]);
        }} />I have previous work experience</label>{value.has_experience ? <>{value.employment.map((row, i) => <div className="collection-dynamic-card" key={row.id}><div className="collection-card-heading"><h4>Company {i + 1}</h4>{removeButton("employment", row, "company " + (i + 1))}</div><div className="collection-grid">{rowInput("employment", row, "company", "Company Name", "text", true)}{rowInput("employment", row, "designation", "Position / Designation", "text", true)}{rowInput("employment", row, "period", "Employment Period", "text", true)}</div>{upload("experience_" + row.id, "Experience / Relieving Letter")}</div>)}{!readOnly && value.employment.length < 20 && <button type="button" className="collection-add" onClick={() => set("employment", [...value.employment, newEmployment()])}>+ Add another company</button>}</> : <p className="collection-note">No previous experience? Leave this unchecked and continue to education.</p>}</>, "Add each previous employer, starting with your most recent company.")}
 {section(3, "Education", <>{!readOnly && <p className="collection-upload-guidance">PDF, JPG, PNG or WebP · {((limits.max_file_bytes || 2097152) / 1048576).toFixed(1)} MB per file, {((limits.max_total_bytes || 7340032) / 1048576).toFixed(1)} MB total. Attach degree / passing certificates and all relevant marksheets.</p>}{value.education.map((row, i) => <div className="collection-dynamic-card" key={row.id}><div className="collection-card-heading"><h4>{i === 0 ? "Highest Qualification" : "Education " + (i + 1)}</h4>{removeButton("education", row, "education " + (i + 1))}</div><div className="collection-grid"><label>Degree / Qualification{!readOnly && " *"}<select aria-label={"Degree / Qualification " + row.id} required={!readOnly} value={row.degree} disabled={readOnly} onChange={e => updateRow("education", row.id, "degree", e.target.value)}><option value="">Select qualification</option>{educationDegrees.map(degree => <option key={degree}>{degree}</option>)}</select></label>{rowInput("education", row, "college", "College / School Name", "text", true)}{rowInput("education", row, "branch", "Branch / Specialization")}{rowInput("education", row, "passing_year", "Year of Passing", "number", true)}</div><div className="collection-uploads">{upload("education_" + row.id + "_certificate", "Degree / Passing Certificate")}{upload("education_" + row.id + "_marksheets", "Marksheets / Transcripts")}</div></div>)}{readOnly && !value.education.length && empty}{!readOnly && value.education.length < 20 && <button type="button" className="collection-add" onClick={() => set("education", [...value.education, newEducation()])}>+ Add education</button>}</>, "Start with your highest degree, then add earlier qualifications one by one.")}
 {section(4, "Certifications & Achievements", <>{value.certifications.map((row, i) => <div className="collection-dynamic-card" key={row.id}><div className="collection-card-heading"><h4>Certification {i + 1}</h4>{removeButton("certifications", row, "certification " + (i + 1))}</div><div className="collection-grid">{rowInput("certifications", row, "name", "Certification Name", "text", true)}{rowInput("certifications", row, "issuer", "Issued By")}{rowInput("certifications", row, "year", "Year Awarded", "number")}</div>{upload("certification_" + row.id, "Certification Document")}</div>)}{!readOnly && value.certifications.length < 20 && <button type="button" className="collection-add" onClick={() => set("certifications", [...value.certifications, newCertification()])}>+ Add certification</button>}<div className="collection-grid"><label className="collection-wide">Awards / Achievements / Special Recognitions<textarea value={value.achievements || ""} disabled={readOnly} maxLength={5000} rows={3} onChange={e => set("achievements", e.target.value)} /></label></div></>, "Add computer, IT or professional certifications if applicable.")}
 {section(5, "References", <>{value.references.map((row, i) => <div className="collection-dynamic-card" key={row.id}><div className="collection-card-heading"><h4>Reference {i + 1}</h4>{!readOnly && <button type="button" aria-label={"Remove reference " + (i + 1)} onClick={() => set("references", value.references.filter(r => r.id !== row.id))}>Remove</button>}</div><div className="collection-grid">{rowInput("references", row, "name", "Reference Name", "text", true)}{rowInput("references", row, "relationship", "Relationship / Role")}{rowInput("references", row, "organization", "Company / Organization")}{rowInput("references", row, "phone", "Reference Phone", "tel")}{rowInput("references", row, "email", "Reference Email", "email")}</div></div>)}{readOnly && !value.references.length && empty}{!readOnly && value.references.length < 10 && <button type="button" className="collection-add" onClick={() => set("references", [...value.references, newReference()])}>+ Add reference</button>}</>, "Optional: add a professional or personal reference, with their permission.")}
 {archived.length > 0 && <section className="collection-section"><h3>Previously Submitted Documents</h3><p className="collection-note">Your earlier documents remain available when a row is removed or changed.</p>{archived.map(savedFile)}</section>}
 {section(6, "Declaration", <><p className="collection-declaration">I confirm that the information and documents provided are accurate and complete to the best of my knowledge. I understand that BeeData Technologies may review them for verification purposes.</p><label className="collection-consent"><input type="checkbox" checked={Boolean(value.declaration.accepted)} disabled={readOnly || admin} required={!readOnly && !admin} onChange={e => set("declaration", {
          ...value.declaration,
          accepted: e.target.checked
        })} />I confirm the declaration above.</label></>)}
 </div>;
}
