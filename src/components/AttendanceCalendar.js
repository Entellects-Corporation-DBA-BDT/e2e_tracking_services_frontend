import { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaCheck, FaChevronLeft, FaChevronRight, FaUndo } from "react-icons/fa";
import { setEmployeeAttendanceDate } from "../api/employeeApi";
import ConfirmDialog from "./ConfirmDialog";
import "../styles/Dashboard/attendanceCalendarEvents.css";

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function AttendanceCalendar({ employeeId, records, holidays = [], leaves = [], canManage = false, onChanged, compact=false, initialMonth, onMonthChange, loading=false }) {
  const [month, setMonth] = useState(() => {const date=initialMonth?new Date(initialMonth+"T00:00:00"):new Date();return new Date(date.getFullYear(),date.getMonth(),1)});
  const [selectedDate,setSelectedDate]=useState("");
  useEffect(()=>{if(!initialMonth)return;const date=new Date(initialMonth+"T00:00:00");setMonth(current=>current.getFullYear()===date.getFullYear()&&current.getMonth()===date.getMonth()?current:new Date(date.getFullYear(),date.getMonth(),1));},[initialMonth]);
  useEffect(()=>{onMonthChange?.(month);},[month,onMonthChange]);
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
      await onChanged?.();
      return true;
    } catch (requestError) {
      setFeedback({ message: requestError?.response?.data?.message || "Attendance could not be updated.", error: true });
      return false;
    } finally { setSavingDate(""); }
  };

  return <section className={`attendance-admin-calendar ${compact?"attendance-calendar-compact":""}`}>
    <header>
      <div><span><FaCalendarAlt /></span><div><h3>{compact||canManage ? "Attendance Calendar" : "My Attendance Calendar"}</h3><p>{canManage ? "Select a date to add a 9:30 AM to 6:30 PM ET record. Clocked dates are protected." : "Present days, approved leave, and company holidays."}</p></div></div>
      <div className="attendance-month-controls">
        <button type="button" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month"><FaChevronLeft /></button>
        <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button type="button" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month"><FaChevronRight /></button>
      </div>
    </header>
    {loading&&<p className="calendar-feedback" role="status">Loading calendar...</p>}
    <div className="attendance-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => <span key={day}>{day}</span>)}</div>
    <div className="attendance-calendar-grid">{cells.map((day, index) => {
      if (!day) return <span className="blank" key={`blank-${index}`}>{compact?new Date(year,monthIndex,0).getDate()-leading+index+1:""}</span>;
      const key = dateKey(new Date(year, monthIndex, day));
      const record = recordMap.get(key), holiday = holidayMap.get(key), leave = leaveMap.get(key);
      const adminCreated = Number(record?.admin_created) === 1, future = key > today, protectedDay = holiday || leave;
      const title = holiday ? `Holiday: ${holiday.name}` : leave ? `Approved ${leave.leave_type} leave (${leave.duration.replaceAll("_"," ")})`
        : future ? "Future dates cannot be marked" : record && !adminCreated ? "Recorded through clock-in" : adminCreated ? canManage?"Remove admin attendance":"Present (admin recorded)" : canManage?"Mark present":"No attendance record";
      return <button type="button" key={key} className={`${record ? "present" : ""} ${adminCreated ? "admin-created" : ""} ${holiday ? "holiday" : ""} ${leave ? "leave" : ""} ${Number(record?.half_day)===1||record?.work_status==="half_day"?"half-day":""} ${selectedDate===key?"selected":""}`}
        aria-label={`${key}: ${title}`} disabled={loading || (compact?savingDate===key:!canManage || future || savingDate === key || (record && !adminCreated) || protectedDay)} onClick={() => {setSelectedDate(key);if(canManage&&!future&&!(record&&!adminCreated)&&!protectedDay){setFeedback({message:"",error:false});setPending({key,record});}}} title={title}>
        <span>{day}<small>{holiday ? holiday.name : leave ? `${leave.duration==="full_day"?"Leave":"Half leave"}` : ""}</small></span>{savingDate === key ? <i className="calendar-saving" /> : record ? adminCreated ? <FaUndo /> : <FaCheck /> : null}
      </button>;
    })}</div>
    <div className="attendance-calendar-legend"><span className="present">Present</span><span className="leave">Approved leave</span><span className="holiday">Holiday</span>{compact&&<><span className="half-day">Half Day</span><span className="selected">Selected</span></>}</div>
    {feedback.message && <p className={`calendar-feedback ${feedback.error ? "error" : ""}`}>{feedback.message}</p>}
    <ConfirmDialog open={Boolean(pending)} title={pending?.record ? "Remove Attendance?" : "Mark Employee Present?"}
      message={pending?.record ? `Remove the admin-created attendance record for ${pending?.key}?` : `Add a 9:30 AM to 6:30 PM ET attendance record for ${pending?.key}?`}
      confirmLabel={pending?.record ? "Remove Attendance" : "Mark Present"} danger={Boolean(pending?.record)}
      busy={Boolean(savingDate)} onCancel={()=>setPending(null)} onConfirm={async()=>{if(savingDate||!pending)return;const action=pending;if(await updateDate(action.key,action.record))setPending(null);}}>
      <div className="attendance-confirm-summary"><span>Attendance date<strong>{pending?.key}</strong></span><span>Shift (Eastern Time)<strong>9:30 AM to 6:30 PM</strong></span></div>
      {feedback.error&&<p className="calendar-feedback error" role="alert">{feedback.message}</p>}
    </ConfirmDialog>
  </section>;
}
export default AttendanceCalendar;
