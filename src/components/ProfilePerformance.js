import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { FaChartBar, FaRedo, FaUserCheck } from "react-icons/fa";
import { getProfilePerformance } from "../api/applicationApi";
import "../styles/Dashboard/profilePerformance.css";

const COLORS = ["#5b35f5", "#4087f4", "#ff9f0a", "#28b879", "#f05b78", "#15b8a6", "#8d5cf6"];
const number = (value) => Number(value) || 0;
const shortDate = (value) => value ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "-";

export default function ProfilePerformance({ candidateId, userId, title }) {
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState("submissions");
  const [selectedRelated, setSelectedRelated] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [period, setPeriod] = useState('this_week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [workingEmployee, setWorkingEmployee] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProfilePerformance({
      candidateId,
      userId,
      page,
      limit: pageSize,
      relatedId: workingEmployee || selectedRelated,
      period,
      startDate: period === 'custom' ? customStart : '',
      endDate: period === 'custom' ? customEnd : '',
    }).then((result) => {
      if (active) {
        setData(result || {});
      }
    }).catch((requestError) => {
      if (active) setError(requestError?.response?.data?.message || "Performance data could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [candidateId, userId, page, pageSize, refresh, selectedRelated, workingEmployee, period, customStart, customEnd]);

  const summary = data.summary || {};
  const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
  const trend = Array.isArray(data.trend) ? data.trend : [];
  const applications = useMemo(
    () => Array.isArray(data.applications) ? data.applications : [],
    [data.applications]
  );
  const profileType = data.profile_type || (candidateId ? "candidate" : "user");
  const statusData = [
    { name: "Submitted", value: Math.max(0, number(summary.submissions) - number(summary.interviews) - number(summary.placements)), color: "#5b35f5" },
    { name: "Interview", value: number(summary.interviews), color: "#ff9f0a" },
    { name: "Placed", value: number(summary.placements), color: "#28b879" },
  ];
  const chartData = breakdown.map((item, index) => ({ ...item, value: number(item[metric]), color: COLORS[index % COLORS.length] }));
  const employeeOptions = candidateId ? breakdown : [];
  const visibleApplications = applications;
  const pagination = data.pagination || {};
  const currentPage = number(pagination.page) || page;
  const totalPages = Math.max(1, number(pagination.total_pages) || 1);
  const totalRecords = number(pagination.total_records);

  const triggerRelated = (entry) => {
    const id = entry?.related_id ?? entry?.payload?.related_id;
    if (id !== undefined && id !== null) {
      setSelectedRelated(number(id));
      setPage(1);
    }
  };

  if (loading) return <section className="profile-performance-state"><span /> Loading performance history...</section>;
  if (error) return <section className="profile-performance-state error"><strong>{error}</strong><button onClick={() => setRefresh((value) => value + 1)}><FaRedo /> Retry</button></section>;

  return (
    <section className="profile-performance">
      <header>
        <div><span>PERFORMANCE & SUBMISSIONS</span><h2>{title || (profileType === "candidate" ? "Candidate Submission Performance" : "User Performance")}</h2><p>{profileType === "candidate" ? "Users who submitted this candidate and the resulting outcomes." : "Candidates this user worked on and every submission outcome."}</p></div>
        <label>Metric<select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="submissions">Submissions</option><option value="interviews">Interviews</option><option value="placements">Placements</option></select></label>
      </header>
      <div className='profile-performance-filters' aria-label='Report filters'>
        <label>Period<select value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }}><option value='today'>Today</option><option value='this_week'>This Week</option><option value='this_month'>This Month</option><option value='custom'>Custom Date</option></select></label>
        {period === 'custom' && <><label>From<input type='date' value={customStart} max={customEnd || undefined} onChange={(event) => { setCustomStart(event.target.value); setPage(1); }} /></label><label>To<input type='date' value={customEnd} min={customStart || undefined} onChange={(event) => { setCustomEnd(event.target.value); setPage(1); }} /></label></>}
        {candidateId && <label>Working Employee<select value={workingEmployee} onChange={(event) => { setWorkingEmployee(event.target.value); setSelectedRelated(null); setPage(1); }}><option value=''>All Employees</option>{employeeOptions.map((employee) => <option key={employee.related_id} value={employee.related_id}>{employee.related_name}</option>)}</select></label>}
        <button type='button' onClick={() => { setPeriod('this_week'); setCustomStart(''); setCustomEnd(''); setWorkingEmployee(''); setSelectedRelated(null); setPage(1); }}>Reset Filters</button>
      </div>
      <div className="profile-performance-summary">
        <Summary label="Submissions" value={summary.submissions} />
        <Summary label="Interviews" value={summary.interviews} amber />
        <Summary label="Placements" value={summary.placements} green />
        <Summary label={profileType === "candidate" ? "Users involved" : "Candidates worked"} value={profileType === "candidate" ? summary.users : summary.candidates} blue />
      </div>
      <div className="profile-performance-charts">
        <article><h3><FaChartBar /> Outcome Distribution</h3><ResponsiveContainer width="100%" height={245}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3}>{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></article>
        <article><h3>{profileType === "candidate" ? "Performance by User" : "Performance by Candidate"}</h3><p>Click a bar to filter the submission details below.</p><ResponsiveContainer width="100%" height={Math.max(260, chartData.slice(0, 12).length * 31)}><BarChart data={chartData.slice(0, 12)} layout="vertical" margin={{ left: 35, right: 18 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="related_name" width={130} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" name={metric} radius={[0, 6, 6, 0]} cursor="pointer" onClick={triggerRelated}>{chartData.slice(0, 12).map((item) => <Cell key={`${item.related_id}-${item.related_name}`} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></article>
      </div>
      <article className="profile-performance-trend"><h3>Submission Activity</h3><ResponsiveContainer width="100%" height={240}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="activity_date" tickFormatter={shortDate} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={shortDate} /><Legend /><Line dataKey="submissions" stroke="#5b35f5" strokeWidth={3} /><Line dataKey="interviews" stroke="#ff9f0a" strokeWidth={2} /><Line dataKey="placements" stroke="#28b879" strokeWidth={2} /></LineChart></ResponsiveContainer></article>
      <article className="profile-performance-details">
        <div><h3><FaUserCheck /> Related Submission Details</h3>{selectedRelated !== null && <button onClick={() => { setSelectedRelated(null); setPage(1); }}>Show all</button>}</div>
        <div className="profile-performance-table"><table><thead><tr><th>Date</th><th>Candidate</th><th>User</th><th>Role</th><th>Client / Vendor</th><th>Status</th><th>Rate</th><th /></tr></thead><tbody>
          {visibleApplications.length ? visibleApplications.map((item) => <tr key={item.id}><td>{shortDate(item.date_created)}</td><td><strong>{item.candidate_name || "-"}</strong></td><td>{item.employee_name || "-"}</td><td>{item.role || "-"}</td><td>{item.client || item.vendor || "-"}</td><td><span className={`profile-process process-${item.process_id}`}>{item.status}</span></td><td>{item.rate ? `$${item.rate}` : "-"}</td><td><button onClick={() => navigate(`/dashboard/records/submissions/${item.id}`)}>View</button></td></tr>)
            : <tr><td colSpan="8">No submission activity is available.</td></tr>}
        </tbody></table></div>
        <footer className="profile-performance-pagination">
          <label>Rows<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value="5">5</option><option value="10">10</option><option value="50">50</option><option value="100">100</option></select></label>
          <span>{totalRecords ? `${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalRecords)} of ${totalRecords}` : "0 records"}</span>
          <nav aria-label="Related submission pages"><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><strong>Page {currentPage} of {totalPages}</strong><button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>
        </footer>
      </article>
    </section>
  );
}

const Summary = ({ label, value, amber, green, blue }) => <article className={`${amber ? "amber" : ""}${green ? " green" : ""}${blue ? " blue" : ""}`}><span>{label}</span><strong>{number(value)}</strong></article>;
