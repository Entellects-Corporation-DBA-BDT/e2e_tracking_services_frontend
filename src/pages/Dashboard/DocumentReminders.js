import { useCallback, useEffect, useState } from "react";
import { FaBell, FaEdit, FaEye, FaFileAlt, FaPaperPlane, FaTimes } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { baseUrlImg } from "../../Config/env";
import {
  disableDocumentReminder,
  getDocumentReminders,
  sendDocumentReminderNow,
  updateDocumentReminder,
} from "../../api/documentReminderApi";
import Pagination from "./Pagination";
import "../../styles/Dashboard/documentReminders.css";

const emptyFilters = { candidate: "", document_type: "", expiry_from: "", expiry_to: "", status: "", days_left: "" };
const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const displayDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { timeZone: "America/New_York" }) : "-";
const documentUrl = (value) => {
  const path = String(value || "").trim();
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${String(baseUrlImg).replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

function DocumentReminders() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...emptyFilters, days_left: searchParams.get("days_left") || "" }));
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [jsonRow, setJsonRow] = useState(null);
  const [previewRow, setPreviewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDocumentReminders({ ...appliedFilters, page, limit: 10 });
      setRows(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error, "Document reminders could not be loaded.") });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action, successText) => {
    try {
      await action();
      setMessage({ type: "success", text: successText });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error, "Action failed.") });
    }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateDocumentReminder(editRow.id, {
        expiry_date: editRow.expiry_date,
        next_reminder_date: editRow.next_reminder_date || null,
        status: editRow.status,
      });
      setEditRow(null);
      setMessage({ type: "success", text: "Reminder updated." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error, "Reminder could not be updated.") });
    } finally { setSaving(false); }
  };

  return (
    <div className="document-reminders-page">
      <div className="document-reminders-heading">
        <div><h1><FaBell /> Document Reminders</h1><p>Monitor H1B expirations, PERM filing windows, and I-140 case follow-ups.</p></div>
      </div>

      {message && <div className={`document-reminders-alert ${message.type}`}>{message.text}<button onClick={() => setMessage(null)}><FaTimes /></button></div>}

      <form className="document-reminders-filters" onSubmit={applyFilters}>
        <label>Candidate<input value={filters.candidate} onChange={(e) => setFilters({ ...filters, candidate: e.target.value })} placeholder="Name or email" /></label>
        <label>Document Type<select value={filters.document_type} onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}><option value="">All</option>{["H1B","PERM Labor","I-140"].map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Target From<input type="date" value={filters.expiry_from} onChange={(e) => setFilters({ ...filters, expiry_from: e.target.value })} /></label>
        <label>Target To<input type="date" value={filters.expiry_to} onChange={(e) => setFilters({ ...filters, expiry_to: e.target.value })} /></label>
        <label>Status<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All</option>{["Pending","Completed","Expired","Disabled"].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Days Left<select value={filters.days_left} onChange={(e) => setFilters({ ...filters, days_left: e.target.value })}><option value="">Any</option>{[30,60,90,180].map((days) => <option key={days} value={days}>Within {days} days</option>)}</select></label>
        <div className="document-reminders-filter-actions"><button type="submit">Apply Filters</button><button type="button" className="secondary" onClick={clearFilters}>Clear</button></div>
      </form>

      <div className="document-reminders-table-wrap">
        <table><thead><tr><th>Candidate</th><th>Document Type</th><th>Target Date</th><th>Days Left</th><th>Next Reminder</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="document-reminders-empty">Loading reminders...</td></tr> : rows.length === 0 ? <tr><td colSpan="7" className="document-reminders-empty">No reminders found.</td></tr> : rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.candidate_name}</strong><small>{row.candidate_email}</small></td>
                <td>{row.document_type}</td><td>{displayDate(row.expiry_date)}</td>
                <td><span className={Number(row.days_left) <= 30 ? "days-critical" : ""}>{row.days_left}</span></td>
                <td>{displayDate(row.next_reminder_date)}</td><td><span className={`reminder-status ${row.status.toLowerCase()}`}>{row.status}</span></td>
                <td><div className="document-reminders-actions">
                  <button type="button" title="View document" onClick={() => setPreviewRow(row)}><FaFileAlt /></button>
                  <button title="View extracted JSON" onClick={() => setJsonRow(row)}><FaEye /></button>
                  <button title="Send reminder now" disabled={row.status === "Disabled"} onClick={() => runAction(() => sendDocumentReminderNow(row.id), "Reminder email sent. Future schedule was unchanged.")}><FaPaperPlane /></button>
                  <button title="Edit reminder" onClick={() => setEditRow({ ...row })}><FaEdit /></button>
                  <button className="danger" title="Disable reminder" disabled={row.status === "Disabled"} onClick={() => window.confirm("Disable this reminder?") && runAction(() => disableDocumentReminder(row.id), "Reminder disabled.")}><FaTimes /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {previewRow && <DocumentPreviewModal row={previewRow} onClose={() => setPreviewRow(null)} />}
      {jsonRow && <JsonModal row={jsonRow} onClose={() => setJsonRow(null)} />}
      {editRow && <EditModal row={editRow} setRow={setEditRow} onClose={() => setEditRow(null)} onSave={saveEdit} saving={saving} />}
    </div>
  );
}

function DocumentPreviewModal({ row, onClose }) {
  const url = documentUrl(row.document);
  return <div className="reminder-modal-backdrop document-preview-backdrop" onMouseDown={onClose}>
    <section className="document-preview-modal" role="dialog" aria-modal="true" aria-labelledby="document-preview-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><FaFileAlt /><span><h2 id="document-preview-title">{row.document_type}</h2><p>{row.candidate_name}</p></span></div><aside><a href={url} target="_blank" rel="noreferrer">Open in new tab</a><button type="button" onClick={onClose} aria-label="Close document preview"><FaTimes /></button></aside></header>
      {url ? <iframe src={url} title={`${row.document_type} document for ${row.candidate_name}`} /> : <div className="document-preview-empty">No document file is attached to this reminder.</div>}
    </section>
  </div>;
}
function JsonModal({ row, onClose }) {
  const details = row.document_details || {};
  const fields = [["Candidate Name",details.candidate_name],["Visa Type",details.visa_type],["Visa Number",details.visa_number],["Case Number",details.case_number],["Applied Date",details.applied_date],["Approved Date",details.approved_date],["Issue Date",details.issue_date],["Expiry Date",details.expiry_date],["Reminder Target",details.reminder_date],["Reminder Purpose",details.reminder_reason],["Entry Method",details.entry_method]];
  return <div className="reminder-modal-backdrop" onMouseDown={onClose}><div className="reminder-modal" onMouseDown={(e) => e.stopPropagation()}><div className="reminder-modal-header"><h2>Entered Document Details</h2><button onClick={onClose}><FaTimes /></button></div><div className="reminder-json-fields">{fields.map(([label,value]) => <div key={label}><span>{label}</span><strong>{value || "Not entered"}</strong></div>)}</div><h3>Stored JSON</h3><pre>{JSON.stringify(details,null,2)}</pre></div></div>;
}

function EditModal({ row, setRow, onClose, onSave, saving }) {
  return <div className="reminder-modal-backdrop"><form className="reminder-modal reminder-edit-modal" onSubmit={onSave}><div className="reminder-modal-header"><h2>Edit Reminder</h2><button type="button" onClick={onClose}><FaTimes /></button></div><label>Target Date<input required type="date" value={row.expiry_date || ""} onChange={(e) => setRow({ ...row, expiry_date: e.target.value })} /></label><label>Next Reminder<input type="date" value={row.next_reminder_date || ""} onChange={(e) => setRow({ ...row, next_reminder_date: e.target.value })} /></label><label>Status<select value={row.status} onChange={(e) => setRow({ ...row, status: e.target.value })}>{["Pending","Completed","Expired","Disabled"].map((status) => <option key={status}>{status}</option>)}</select></label><div className="reminder-modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={saving}>{saving ? "Saving..." : "Save Reminder"}</button></div></form></div>;
}

export default DocumentReminders;
