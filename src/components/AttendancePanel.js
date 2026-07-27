import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaCalendarCheck, FaClock, FaHistory, FaUserClock } from "react-icons/fa";
import { editAttendance, getEmployeeAttendance } from "../api/employeeApi";
import AttendanceCalendar from "./AttendanceCalendar";
import AttendanceActions from "./AttendanceActions";
import ConfirmDialog from "./ConfirmDialog";

const dateValue = (date) => date.toISOString().slice(0, 10);

function AttendancePanel({ employeeId, employeeCode, isOwn = false, canManage = false }) {
  const now = new Date();
  const [startDate, setStartDate] = useState(dateValue(new Date(now.getFullYear(), now.getMonth() - 5, 1)));
  const [endDate, setEndDate] = useState(dateValue(now));
  const [payload, setPayload] = useState({ summary: {}, trend: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [correction, setCorrection] = useState(null);

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
    ["Half Days", payload.summary.half_days || 0, <FaClock />],
  ];
  const correctRecord = async (row) => {
    const timeIn = window.prompt("Time in (HH:MM, Eastern Time)", row.time_in?.slice(0,5));
    if (timeIn === null) return;
    const timeOut = window.prompt("Time out (HH:MM, Eastern Time)", row.time_out?.slice(0,5));
    if (timeOut === null) return;
    const notes = window.prompt("Reason for admin correction", row.notes || "") ?? "";
    setCorrection({ row, time_in: timeIn, time_out: timeOut, notes });
  };
  const applyCorrection = async () => {
    const pending = correction; setCorrection(null);
    try { await editAttendance(pending.row.id, { time_in: pending.time_in, time_out: pending.time_out, notes: pending.notes }); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Attendance could not be corrected."); }
  };

  return <section className="attendance-panel">
    <div className="attendance-heading"><div><h2>Attendance Insights</h2><p>Working hours, punctuality, and daily attendance history.</p></div><div><label>From<input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></label><label>To<input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></label></div></div>
    {error ? <div className="e2e_empstatus_error">{error}<button onClick={load}>Try again</button></div> : loading ? <div className="attendance-loading"><span /> Loading attendance...</div> : <>
      <AttendanceActions employeeCode={employeeCode} isOwn={isOwn} canManage={canManage} onChanged={load} />
      <div className="attendance-cards">{cards.map(([label,value,icon])=><div key={label}><span>{icon}</span><p>{label}</p><strong>{value}</strong></div>)}</div>
      <div className="attendance-chart"><h3>Daily Working Hours</h3>{payload.trend.length ? <ResponsiveContainer width="100%" height={270}><LineChart data={payload.trend} margin={{top:12,right:12,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tick={{fontSize:11}} minTickGap={28}/><YAxis tick={{fontSize:11}} domain={[0, "auto"]} unit="h"/><Tooltip formatter={(value)=>[`${value} hours`,"Working Hours"]}/><Line connectNulls type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={3} dot={{r:3,fill:"#fff",strokeWidth:2}} activeDot={{r:6}}/></LineChart></ResponsiveContainer> : <div className="attendance-empty">No attendance records in this date range.</div>}</div>
      <AttendanceCalendar employeeId={employeeId} records={payload.calendar || payload.data}
        holidays={payload.holidays || []} leaves={payload.leaves || []} canManage={canManage} onChanged={load} />
      <div className="attendance-history"><h3>Recent Attendance</h3><div><table><thead><tr><th>Date (ET)</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Day Status</th><th>Punctuality</th>{canManage&&<th>Action</th>}</tr></thead><tbody>{payload.data.map(row=><tr key={row.id}><td>{row.date}</td><td>{row.time_in}</td><td>{row.time_out==="00:00:00"?"Working":row.time_out}</td><td>{`${row.hours ?? 0} h`}</td><td><span className={`day-status ${row.work_status}`}>{(row.work_status||"completed").replace("_"," ")}</span></td><td><span className={row.status===1?"on-time":"late"}>{row.status===1?"On Time":"Late"}</span></td>{canManage&&<td><button className="attendance-edit" onClick={()=>correctRecord(row)}>Edit</button></td>}</tr>)}</tbody></table></div></div>
      <ConfirmDialog open={Boolean(correction)} title="Update Attendance Record?"
        message={`Change ${correction?.row?.date} attendance to ${correction?.time_in}–${correction?.time_out} ET? Hours and half-day status will be recalculated.`}
        confirmLabel="Update Attendance" danger={false} onCancel={()=>setCorrection(null)} onConfirm={applyCorrection} />
    </>}
  </section>;
}
export default AttendancePanel;
