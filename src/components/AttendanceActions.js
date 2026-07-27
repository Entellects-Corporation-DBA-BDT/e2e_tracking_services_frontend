import { useCallback, useEffect, useState } from "react";
import { FaCalendarPlus, FaCheck, FaClock, FaPlaneDeparture, FaTimes, FaTrash } from "react-icons/fa";
import {
  clockAttendance, deleteHoliday, getHolidays, getLeaves, getTodayAttendance,
  reviewLeave, saveHoliday, submitLeave,
} from "../api/employeeApi";
import ConfirmDialog from "./ConfirmDialog";

const emptyLeave = { leave_type: "paid", start_date: "", end_date: "", duration: "full_day", reason: "" };
const emptyHoliday = { holiday_date: "", name: "", description: "", is_optional: false };

function AttendanceActions({ employeeCode, isOwn, canManage, onChanged }) {
  const [today, setToday] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [confirming, setConfirming] = useState("");
  const [confirmationId, setConfirmationId] = useState("");
  const [leave, setLeave] = useState(emptyLeave);
  const [holiday, setHoliday] = useState(emptyHoliday);
  const [message, setMessage] = useState({ text: "", error: false });
  const [busy, setBusy] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState(null);

  const load = useCallback(async () => {
    try {
      const requests = [getHolidays(new Date().getFullYear()), getLeaves()];
      if (isOwn) requests.unshift(getTodayAttendance());
      const results = await Promise.all(requests);
      let offset = 0;
      if (isOwn) { setToday(results[0]); offset = 1; }
      setHolidays(results[offset]?.data || []);
      setLeaves(results[offset + 1]?.data || []);
    } catch (error) {
      setMessage({ text: error?.response?.data?.message || "Attendance controls could not be loaded.", error: true });
    }
  }, [isOwn]);
  useEffect(() => { load(); }, [load]);

  const clock = async () => {
    setBusy(true);
    try {
      const result = await clockAttendance(confirming, confirmationId.trim());
      setToday(result); setMessage({ text: result.message, error: false });
      setConfirming(""); setConfirmationId(""); onChanged();
    } catch (error) {
      setMessage({ text: error?.response?.data?.message || "Clock action failed.", error: true });
    } finally { setBusy(false); }
  };
  const requestLeave = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const result = await submitLeave(leave); setMessage({ text: result.message, error: false }); setLeave(emptyLeave); await load(); }
    catch (error) { setMessage({ text: error?.response?.data?.message || "Leave request failed.", error: true }); }
    finally { setBusy(false); }
  };
  const decideLeave = async (id, status) => {
    try { const result = await reviewLeave(id, { status }); setMessage({ text: result.message, error: false }); await load(); }
    catch (error) { setMessage({ text: error?.response?.data?.message || "Leave could not be updated.", error: true }); }
  };
  const addHoliday = async (event) => {
    event.preventDefault();
    try { const result = await saveHoliday(holiday); setMessage({ text: result.message, error: false }); setHoliday(emptyHoliday); await load(); }
    catch (error) { setMessage({ text: error?.response?.data?.message || "Holiday could not be saved.", error: true }); }
  };

  const record = today?.record;
  const nextAction = !record ? "in" : record.time_out === "00:00:00" ? "out" : "";
  return <div className="attendance-workflows">
    {isOwn && <section className="attendance-clock-card">
      <div><span><FaClock /></span><div><h3>Today in Eastern Time</h3><p>{today?.work_date || "Loading..."} · 9:30 AM–6:30 PM America/New_York</p></div></div>
      <div className="clock-status"><strong>{record ? record.work_status.replace("_", " ") : "Not timed in"}</strong>
        <small>{record ? `${record.time_in} — ${record.time_out === "00:00:00" ? "Working" : record.time_out}` : today?.network?.allowed ? "Confirm your employee ID to begin" : `Company network required · Current IP: ${today?.network?.ip || "unknown"}`}</small></div>
      {nextAction && <button title={!today?.network?.allowed ? "Connect to the company network to record attendance" : ""}
        className={`clock-button ${nextAction}`} onClick={() => setConfirming(nextAction)}>Time {nextAction === "in" ? "In" : "Out"}</button>}
      {!nextAction && record && <span className="shift-complete"><FaCheck /> Shift completed</span>}
    </section>}

    {confirming && <div className="attendance-confirm-overlay"><section role="dialog" aria-modal="true"><FaClock /><h3>Confirm Time {confirming === "in" ? "In" : "Out"}</h3>
      <p>Enter your employee ID exactly as shown on your profile.</p><label>Employee ID<input autoFocus value={confirmationId} onChange={e=>setConfirmationId(e.target.value.toUpperCase())} placeholder="BDT-I-007" /></label>
      <footer><button onClick={()=>setConfirming("")}>Cancel</button><button disabled={busy || !confirmationId.trim()} onClick={clock}>Confirm {employeeCode}</button></footer></section></div>}

    <section className="attendance-leave-card">
      <header><div><FaPlaneDeparture /><h3>{canManage ? "Leave Management" : "My Leave"}</h3></div><p>Request, approve, reject, and track time away.</p></header>
      {isOwn && <form onSubmit={requestLeave} className="leave-form">
        <select value={leave.leave_type} onChange={e=>setLeave({...leave,leave_type:e.target.value})}>{["paid","sick","casual","unpaid","bereavement","other"].map(x=><option key={x}>{x}</option>)}</select>
        <input required type="date" value={leave.start_date} onChange={e=>setLeave({...leave,start_date:e.target.value,end_date:leave.end_date||e.target.value})}/>
        <input required type="date" min={leave.start_date} value={leave.end_date} onChange={e=>setLeave({...leave,end_date:e.target.value})}/>
        <select value={leave.duration} onChange={e=>setLeave({...leave,duration:e.target.value})}><option value="full_day">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></select>
        <input required className="leave-reason" placeholder="Reason" value={leave.reason} onChange={e=>setLeave({...leave,reason:e.target.value})}/>
        <button disabled={busy}><FaCalendarPlus /> Request Leave</button>
      </form>}
      <div className="leave-list">{leaves.length ? leaves.map(item=><article key={item.id}><div><strong>{item.employee_name || "My leave"} · {item.leave_type}</strong><span>{item.start_date} to {item.end_date} · {item.duration.replace("_"," ")}</span><small>{item.reason}</small></div><mark className={item.status}>{item.status}</mark>
        {canManage && item.status==="pending" && <footer><button onClick={()=>decideLeave(item.id,"approved")}><FaCheck /></button><button onClick={()=>decideLeave(item.id,"rejected")}><FaTimes /></button></footer>}</article>) : <p>No leave requests found.</p>}</div>
    </section>

    {canManage && <section className="attendance-holiday-card"><header><div><FaCalendarPlus /><h3>Company Holidays</h3></div><p>Eastern Time office calendar.</p></header>
      <form onSubmit={addHoliday}><input required type="date" value={holiday.holiday_date} onChange={e=>setHoliday({...holiday,holiday_date:e.target.value})}/><input required placeholder="Holiday name" value={holiday.name} onChange={e=>setHoliday({...holiday,name:e.target.value})}/><button>Save Holiday</button></form>
      <div>{holidays.map(item=><span key={item.id}><b>{item.holiday_date}</b> {item.name}<button aria-label="Delete holiday" onClick={()=>setDeletingHoliday(item)}><FaTrash /></button></span>)}</div>
    </section>}
    {message.text && <p className={`attendance-workflow-message ${message.error?"error":""}`}>{message.text}</p>}
    <ConfirmDialog open={Boolean(deletingHoliday)} title="Delete Holiday?"
      message={`Delete ${deletingHoliday?.name} on ${deletingHoliday?.holiday_date}?`}
      confirmLabel="Delete Holiday" onCancel={()=>setDeletingHoliday(null)}
      onConfirm={async()=>{const item=deletingHoliday;setDeletingHoliday(null);await deleteHoliday(item.id);load();}} />
  </div>;
}
export default AttendanceActions;
