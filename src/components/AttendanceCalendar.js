import { useMemo, useState } from "react";
import { FaCalendarAlt, FaCheck, FaChevronLeft, FaChevronRight, FaUndo } from "react-icons/fa";
import { setEmployeeAttendanceDate } from "../api/employeeApi";
import ConfirmDialog from "./ConfirmDialog";
import "../styles/Dashboard/attendanceCalendarEvents.css";

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function AttendanceCalendar({ employeeId, records, holidays = [], leaves = [], canManage = false, onChanged }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [savingDate, setSavingDate] = useState("");
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const [pending, setPending] = useState(null);
  const today = dateKey(new Date());
  const recordMap = useMemo(() => new Map((records || []).map(record => [record.date, record])), [records]);
  const holidayMap = useMemo(() => new Map(holidays.map(item => [item.date, item])), [holidays]);
  const leaveMap = useMemo(() => {
    const result = new Map();
    leaves.forEach(item => {
      const cursor = new Date(`${item.start_date}T00:00:00`), end = new Date(`${item.end_date}T00:00:00`);
      while (cursor <= end) { result.set(dateKey(cursor), item); cursor.setDate(cursor.getDate() + 1); }
    });
    return result;
  }, [leaves]);
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const leading = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  const updateDate = async (key, record) => {
    const adminCreated = Number(record?.admin_created) === 1;
    if (record && !adminCreated) return;
    setSavingDate(key); setFeedback({ message: "", error: false });
    try {
      const result = await setEmployeeAttendanceDate(employeeId, key, !record);
      setFeedback({ message: result.message || "Attendance updated.", error: false });
      await onChanged();
    } catch (requestError) {
      setFeedback({ message: requestError?.response?.data?.message || "Attendance could not be updated.", error: true });
    } finally { setSavingDate(""); }
  };

  return <section className="attendance-admin-calendar">
    <header>
      <div><span><FaCalendarAlt /></span><div><h3>{canManage ? "Attendance Calendar" : "My Attendance Calendar"}</h3><p>{canManage ? "Select a date to add a 9:30 AM–6:30 PM ET record. Clocked dates are protected." : "Present days, approved leave, and company holidays."}</p></div></div>
      <div className="attendance-month-controls">
        <button type="button" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month"><FaChevronLeft /></button>
        <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button type="button" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month"><FaChevronRight /></button>
      </div>
    </header>
    <div className="attendance-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => <span key={day}>{day}</span>)}</div>
    <div className="attendance-calendar-grid">{cells.map((day, index) => {
      if (!day) return <span className="blank" key={`blank-${index}`} />;
      const key = dateKey(new Date(year, monthIndex, day));
      const record = recordMap.get(key), holiday = holidayMap.get(key), leave = leaveMap.get(key);
      const adminCreated = Number(record?.admin_created) === 1, future = key > today, protectedDay = holiday || leave;
      const title = holiday ? `Holiday: ${holiday.name}` : leave ? `Approved ${leave.leave_type} leave (${leave.duration.replaceAll("_"," ")})`
        : future ? "Future dates cannot be marked" : record && !adminCreated ? "Recorded through clock-in" : adminCreated ? "Remove admin attendance" : "Mark present";
      return <button type="button" key={key} className={`${record ? "present" : ""} ${adminCreated ? "admin-created" : ""} ${holiday ? "holiday" : ""} ${leave ? "leave" : ""}`}
        disabled={!canManage || future || savingDate === key || (record && !adminCreated) || protectedDay} onClick={() => setPending({key,record})} title={title}>
        <span>{day}<small>{holiday ? holiday.name : leave ? `${leave.duration==="full_day"?"Leave":"Half leave"}` : ""}</small></span>{savingDate === key ? <i className="calendar-saving" /> : record ? adminCreated ? <FaUndo /> : <FaCheck /> : null}
      </button>;
    })}</div>
    <div className="attendance-calendar-legend"><span className="present">Present</span><span className="leave">Approved leave</span><span className="holiday">Holiday</span></div>
    {feedback.message && <p className={`calendar-feedback ${feedback.error ? "error" : ""}`}>{feedback.message}</p>}
    <ConfirmDialog open={Boolean(pending)} title={pending?.record ? "Remove Attendance?" : "Mark Employee Present?"}
      message={pending?.record ? `Remove the admin-created attendance record for ${pending?.key}?` : `Add a 9:30 AM–6:30 PM ET attendance record for ${pending?.key}?`}
      confirmLabel={pending?.record ? "Remove Attendance" : "Mark Present"} danger={Boolean(pending?.record)}
      busy={Boolean(savingDate)} onCancel={()=>setPending(null)} onConfirm={async()=>{const action=pending;setPending(null);await updateDate(action.key,action.record);}} />
  </section>;
}
export default AttendanceCalendar;
