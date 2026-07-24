import { useMemo, useState } from "react";
import { FaCalendarAlt, FaCheck, FaChevronLeft, FaChevronRight, FaUndo } from "react-icons/fa";
import { setEmployeeAttendanceDate } from "../api/employeeApi";

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function AttendanceCalendar({ employeeId, records, onChanged }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [savingDate, setSavingDate] = useState("");
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const today = dateKey(new Date());
  const recordMap = useMemo(() => new Map((records || []).map(record => [record.date, record])), [records]);
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
      <div><span><FaCalendarAlt /></span><div><h3>Give Attendance</h3><p>Select a date to add an 8-hour attendance record. Device-recorded dates are protected.</p></div></div>
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
      const record = recordMap.get(key), adminCreated = Number(record?.admin_created) === 1, future = key > today;
      return <button type="button" key={key} className={`${record ? "present" : ""} ${adminCreated ? "admin-created" : ""}`}
        disabled={future || savingDate === key || (record && !adminCreated)} onClick={() => updateDate(key, record)}
        title={future ? "Future dates cannot be marked" : record && !adminCreated ? "Recorded through clock-in" : adminCreated ? "Remove admin attendance" : "Mark present"}>
        <span>{day}</span>{savingDate === key ? <i className="calendar-saving" /> : record ? adminCreated ? <FaUndo /> : <FaCheck /> : null}
      </button>;
    })}</div>
    {feedback.message && <p className={`calendar-feedback ${feedback.error ? "error" : ""}`}>{feedback.message}</p>}
  </section>;
}
export default AttendanceCalendar;
