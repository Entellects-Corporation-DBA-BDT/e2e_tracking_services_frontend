import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaCalendarCheck, FaClock, FaHistory, FaUserClock } from "react-icons/fa";
import { getEmployeeAttendance } from "../api/employeeApi";
import AttendanceCalendar from "./AttendanceCalendar";

const dateValue = (date) => date.toISOString().slice(0, 10);

function AttendancePanel({ employeeId, canManage = false }) {
  const now = new Date();
  const [startDate, setStartDate] = useState(dateValue(new Date(now.getFullYear(), now.getMonth() - 5, 1)));
  const [endDate, setEndDate] = useState(dateValue(now));
  const [payload, setPayload] = useState({ summary: {}, trend: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setPayload(await getEmployeeAttendance(employeeId, { start_date: startDate, end_date: endDate, limit: 31 })); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Attendance could not be loaded."); }
    finally { setLoading(false); }
  }, [employeeId, endDate, startDate]);
  useEffect(() => { load(); }, [load]);

  const cards = [
    ["Present Days", payload.summary.present_days || 0, <FaCalendarCheck />],
    ["On-time Records", payload.summary.on_time_days || 0, <FaUserClock />],
    ["Late Records", payload.summary.late_days || 0, <FaHistory />],
    ["Average Hours", payload.summary.average_hours || 0, <FaClock />],
  ];

  return <section className="attendance-panel">
    <div className="attendance-heading"><div><h2>Attendance Insights</h2><p>Working hours, punctuality, and daily attendance history.</p></div><div><label>From<input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></label><label>To<input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></label></div></div>
    {error ? <div className="e2e_empstatus_error">{error}<button onClick={load}>Try again</button></div> : loading ? <div className="attendance-loading"><span /> Loading attendance...</div> : <>
      <div className="attendance-cards">{cards.map(([label,value,icon])=><div key={label}><span>{icon}</span><p>{label}</p><strong>{value}</strong></div>)}</div>
      <div className="attendance-chart"><h3>Daily Working Hours</h3>{payload.trend.length ? <ResponsiveContainer width="100%" height={270}><LineChart data={payload.trend} margin={{top:12,right:12,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tick={{fontSize:11}} minTickGap={28}/><YAxis tick={{fontSize:11}} domain={[0, "auto"]} unit="h"/><Tooltip formatter={(value)=>[`${value} hours`,"Working Hours"]}/><Line connectNulls type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={3} dot={{r:3,fill:"#fff",strokeWidth:2}} activeDot={{r:6}}/></LineChart></ResponsiveContainer> : <div className="attendance-empty">No attendance records in this date range.</div>}</div>
      {canManage && <AttendanceCalendar employeeId={employeeId} records={payload.calendar || payload.data} onChanged={load} />}
      <div className="attendance-history"><h3>Recent Attendance</h3><div><table><thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Punctuality</th></tr></thead><tbody>{payload.data.map(row=><tr key={row.id}><td>{row.date}</td><td>{row.time_in}</td><td>{row.time_out==="00:00:00"?"Not clocked out":row.time_out}</td><td>{`${row.hours ?? 8} h`}</td><td><span className={row.status===1?"on-time":"late"}>{row.status===1?"On Time":"Late"}</span></td></tr>)}</tbody></table></div></div>
    </>}
  </section>;
}
export default AttendancePanel;
