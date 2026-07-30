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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProfilePerformance({ candidateId, userId }).then((result) => {
      if (active) {
        setData(result || {});
        setSelectedRelated(null);
      }
    }).catch((requestError) => {
      if (active) setError(requestError?.response?.data?.message || "Performance data could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [candidateId, userId, refresh]);

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
  const visibleApplications = useMemo(() => selectedRelated === null
    ? applications
    : applications.filter((item) => number(profileType === "candidate" ? item.employee_id : item.candidate_id) === number(selectedRelated)),
  [applications, profileType, selectedRelated]);

  const triggerRelated = (entry) => {
    const id = entry?.related_id ?? entry?.payload?.related_id;
    if (id !== undefined && id !== null) setSelectedRelated(number(id));
  };

  if (loading) return <section className="profile-performance-state"><span /> Loading performance history...</section>;
  if (error) return <section className="profile-performance-state error"><strong>{error}</strong><button onClick={() => setRefresh((value) => value + 1)}><FaRedo /> Retry</button></section>;

  return (
    <section className="profile-performance">
      <header>
        <div><span>PERFORMANCE & SUBMISSIONS</span><h2>{title || (profileType === "candidate" ? "Candidate Submission Performance" : "User Performance")}</h2><p>{profileType === "candidate" ? "Users who submitted this candidate and the resulting outcomes." : "Candidates this user worked on and every submission outcome."}</p></div>
        <label>Metric<select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="submissions">Submissions</option><option value="interviews">Interviews</option><option value="placements">Placements</option></select></label>
      </header>
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
        <div><h3><FaUserCheck /> Related Submission Details</h3>{selectedRelated !== null && <button onClick={() => setSelectedRelated(null)}>Show all</button>}</div>
        <div className="profile-performance-table"><table><thead><tr><th>Date</th><th>Candidate</th><th>User</th><th>Role</th><th>Client / Vendor</th><th>Status</th><th>Rate</th><th /></tr></thead><tbody>
          {visibleApplications.length ? visibleApplications.map((item) => <tr key={item.id}><td>{shortDate(item.date_created)}</td><td><strong>{item.candidate_name || "-"}</strong></td><td>{item.employee_name || "-"}</td><td>{item.role || "-"}</td><td>{item.client || item.vendor || "-"}</td><td><span className={`profile-process process-${item.process_id}`}>{item.status}</span></td><td>{item.rate ? `$${item.rate}` : "-"}</td><td><button onClick={() => navigate(`/dashboard/records/submissions/${item.id}`)}>View</button></td></tr>)
            : <tr><td colSpan="8">No submission activity is available.</td></tr>}
        </tbody></table></div>
      </article>
    </section>
  );
}

const Summary = ({ label, value, amber, green, blue }) => <article className={`${amber ? "amber" : ""}${green ? " green" : ""}${blue ? " blue" : ""}`}><span>{label}</span><strong>{number(value)}</strong></article>;
