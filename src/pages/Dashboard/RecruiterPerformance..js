import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaCalendarAlt, FaChartPie, FaSearch, FaTimes, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./RecruiterPerformance.css";
import "./RecruiterPerformancePage.css";
import { getPerformanceDashboard } from "../../api/applicationApi";
import { getCandidateData } from "../../api/candidateApi";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const monthStart = `${today.slice(0, 8)}01`;
const COLORS = ["#5b35f5", "#4087f4", "#ff9f0a", "#ff4d5e", "#28b879", "#15b8a6", "#8d5cf6", "#f97352"];
const number = (value) => Number(value) || 0;
const dateLabel = (value) => value
  ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
  : "-";

const presetDates = (period) => {
  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end);
  if (period === "today") return { start_date: today, end_date: today };
  if (period === "this_week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else {
    start.setDate(1);
  }
  return { start_date: start.toISOString().slice(0, 10), end_date: today };
};

export default function RecruiterPerformance({ onClose }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState({ start_date: monthStart, end_date: today, search: "" });
  const [filters, setFilters] = useState(draft);
  const [data, setData] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [period, setPeriod] = useState("this_month");
  const [viewBy, setViewBy] = useState("users");
  const [metric, setMetric] = useState("submissions");

  useEffect(() => {
    let active = true;
    getCandidateData(1, 1000, "").then((response) => {
      if (active) setCandidateOptions(response.data || []);
    }).catch((requestError) => {
      console.error("Candidate filter options could not be loaded.", requestError);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getPerformanceDashboard({
      ...filters,
      employee_id: selectedEmployee || undefined,
      candidate_id: selectedCandidate || undefined,
    }).then((response) => {
      if (active && response.success) setData(response.data || {});
    }).catch((requestError) => {
      if (active) setError(requestError?.response?.data?.message || "Performance analytics could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filters, selectedEmployee, selectedCandidate]);

  const employees = Array.isArray(data.employees) ? data.employees : [];
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const applications = Array.isArray(data.applications) ? data.applications : [];
  const trend = Array.isArray(data.trend) ? data.trend : [];
  const summary = data.summary || {};

  const statusData = [
    { name: "Submitted", value: Math.max(0, number(summary.total_submissions) - number(summary.interviews) - number(summary.placements)), color: "#5b35f5" },
    { name: "Interview", value: number(summary.interviews), color: "#ff9f0a" },
    { name: "Placed", value: number(summary.placements), color: "#28b879" },
  ];

  const applyFilters = (event) => {
    event.preventDefault();
    if (draft.start_date && draft.end_date && draft.start_date > draft.end_date) {
      setError("Start date cannot be after end date.");
      return;
    }
    setFilters({ ...draft });
  };

  const chooseEmployee = (entry) => {
    const id = entry?.user_id ?? entry?.payload?.user_id;
    if (id) {
      setSelectedCandidate("");
      setSelectedEmployee(String(id));
    }
  };

  const chooseCandidate = (entry) => {
    const id = entry?.candidate_id ?? entry?.payload?.candidate_id;
    const name = entry?.candidate_name ?? entry?.payload?.candidate_name;
    if (id) {
      setSelectedEmployee("");
      setSelectedCandidate(String(id));
      setCandidateQuery(name || "");
    } else if (name) {
      setSelectedEmployee("");
      setSelectedCandidate("");
      setCandidateQuery(name);
      setDraft((current) => ({ ...current, search: name }));
      setFilters((current) => ({ ...current, search: name }));
    }
  };

  const handleCandidateSearch = (value) => {
    setCandidateQuery(value);
    const selected = candidateOptions.find(
      (candidate) => candidate.name?.toLowerCase() === value.trim().toLowerCase()
    );
    setSelectedEmployee("");
    setSelectedCandidate(selected ? String(selected.id) : "");
  };

  const closePage = onClose || (() => navigate("/dashboard/bench-sales"));
  const explorerData = (viewBy === "users" ? employees : candidates).map((item, index) => ({
    ...item,
    chartLabel: viewBy === "users" ? item.employee_name : item.candidate_name,
    chartValue: number(item[metric]),
    color: COLORS[index % COLORS.length],
  }));
  const explorerTotal = explorerData.reduce((total, item) => total + item.chartValue, 0);

  const selectPeriod = (value) => {
    setPeriod(value);
    if (value === "custom") return;
    const dates = presetDates(value);
    setDraft((current) => ({ ...current, ...dates }));
    setFilters((current) => ({ ...current, ...dates }));
  };

  const chooseExplorerItem = (entry) => {
    if (viewBy === "users") {
      chooseEmployee(entry);
    } else {
      chooseCandidate(entry);
    }
  };

  return (
    <div className="performance-dashboard">
      <header className="performance-header">
        <div><span>BENCH SALES ANALYTICS</span><h2>Performance Dashboard</h2><p>Employee and candidate submission outcomes from live application data.</p></div>
        <button type="button" onClick={closePage} aria-label="Back to Bench Sales"><FaTimes /></button>
      </header>

      <form className="performance-filters" onSubmit={applyFilters}>
        <label><span>Time period</span><div><FaCalendarAlt /><select value={period} onChange={(event) => selectPeriod(event.target.value)}><option value="today">Today</option><option value="this_week">This Week</option><option value="this_month">This Month</option><option value="custom">Custom Dates</option></select></div></label>
        <label><span>From</span><div><FaCalendarAlt /><input type="date" value={draft.start_date} max={draft.end_date || today} onChange={(event) => { setPeriod("custom"); setDraft({ ...draft, start_date: event.target.value }); }} /></div></label>
        <label><span>To</span><div><FaCalendarAlt /><input type="date" value={draft.end_date} min={draft.start_date || undefined} max={today} onChange={(event) => { setPeriod("custom"); setDraft({ ...draft, end_date: event.target.value }); }} /></div></label>
        <label className="performance-search"><span>Search everything</span><div><FaSearch /><input value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder="Candidate, employee, technology, client..." /></div></label>
        <label className="performance-candidate-filter"><span>Candidate dropdown</span><div><FaUser /><input list="performance-candidate-options" value={candidateQuery} onChange={(event) => handleCandidateSearch(event.target.value)} placeholder="Type or select candidate" /></div>
          <datalist id="performance-candidate-options">{candidateOptions.map((candidate) => <option key={candidate.id} value={candidate.name}>{candidate.email || candidate.skills || `Candidate #${candidate.id}`}</option>)}</datalist>
        </label>
        <button type="submit">Apply Filters</button>
        {(selectedEmployee || selectedCandidate) && <button type="button" className="clear-selection" onClick={() => { setSelectedEmployee(""); setSelectedCandidate(""); setCandidateQuery(""); }}>Clear drill-down</button>}
      </form>

      {error && <div className="performance-error">{error}</div>}
      {loading ? <div className="performance-loading"><span />Loading performance charts...</div> : <>
        <div className="performance-summary">
          <Summary label="Submissions" value={summary.total_submissions} />
          <Summary label="Candidates" value={summary.unique_candidates} />
          <Summary label="Interviews" value={summary.interviews} tone="amber" />
          <Summary label="Placements" value={summary.placements} tone="green" />
          <Summary label="Employees" value={summary.active_employees} tone="blue" />
        </div>

        <section className="performance-explorer">
          <div className="performance-explorer-heading">
            <div><span>INTERACTIVE EXPLORER</span><h3>{viewBy === "users" ? "User" : "Candidate"} {metric} performance</h3><p>Click any pie segment, legend entry or bar to update the related details below.</p></div>
            <div>
              <label><span>View by</span><select value={viewBy} onChange={(event) => { setViewBy(event.target.value); setSelectedEmployee(""); setSelectedCandidate(""); setCandidateQuery(""); }}><option value="users">Users</option><option value="candidates">Candidates</option></select></label>
              <label><span>Metric</span><select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="submissions">Submissions</option><option value="interviews">Interviews</option><option value="placements">Placements</option></select></label>
            </div>
          </div>
          <div className="performance-explorer-grid">
            <article>
              <div className="performance-pie explorer-pie">
                <ResponsiveContainer width="100%" height={310}>
                  <PieChart>
                    <Pie data={explorerData} dataKey="chartValue" nameKey="chartLabel" innerRadius={72} outerRadius={108} paddingAngle={2} cursor="pointer" onClick={chooseExplorerItem}>
                      {explorerData.map((item) => <Cell key={`${viewBy}-${item.user_id || item.candidate_id || item.chartLabel}`} fill={item.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [value, metric]} />
                  </PieChart>
                </ResponsiveContainer>
                <div><strong>{explorerTotal}</strong><span>{metric}</span></div>
              </div>
              <div className="explorer-legend">{explorerData.map((item) => <button key={`${viewBy}-legend-${item.user_id || item.candidate_id || item.chartLabel}`} onClick={() => chooseExplorerItem(item)}><i style={{ background: item.color }} /><span>{item.chartLabel || "Unnamed"}</span><strong>{item.chartValue}</strong></button>)}</div>
            </article>
            <article>
              <ResponsiveContainer width="100%" height={Math.max(330, explorerData.slice(0, 15).length * 34)}>
                <BarChart data={explorerData.slice(0, 15)} layout="vertical" margin={{ left: 35, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf0f6" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="chartLabel" width={135} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [value, metric]} />
                  <Bar dataKey="chartValue" name={metric} fill="#5b35f5" radius={[0, 6, 6, 0]} cursor="pointer" onClick={chooseExplorerItem}>
                    {explorerData.slice(0, 15).map((item) => <Cell key={`${viewBy}-bar-${item.user_id || item.candidate_id || item.chartLabel}`} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </article>
          </div>
        </section>

        <div className="performance-chart-grid">
          <ChartCard title="Submission Status" subtitle="Distribution for selected filters">
            <div className="performance-pie">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                    {statusData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div><strong>{number(summary.total_submissions)}</strong><span>Total</span></div>
            </div>
          </ChartCard>

          <ChartCard title="Employee Performance" subtitle="Click a bar to filter employee details" wide>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={employees} margin={{ top: 12, right: 10, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
                <XAxis dataKey="employee_name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" fill="#5b35f5" name="Submissions" radius={[5, 5, 0, 0]} cursor="pointer" onClick={chooseEmployee} />
                <Bar dataKey="interviews" fill="#ffb020" name="Interviews" radius={[5, 5, 0, 0]} cursor="pointer" onClick={chooseEmployee} />
                <Bar dataKey="placements" fill="#28b879" name="Placements" radius={[5, 5, 0, 0]} cursor="pointer" onClick={chooseEmployee} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Activity Trend" subtitle="Daily submissions by submitted date, interviews and placements by status update date">
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={trend} margin={{ top: 10, right: 18, left: -14, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
              <XAxis dataKey="submission_date" tickFormatter={dateLabel} tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={dateLabel} />
              <Legend />
              <Line type="monotone" dataKey="submissions" name="Submissions" stroke="#5b35f5" strokeWidth={3} />
              <Line type="monotone" dataKey="interviews" name="Interviews" stroke="#ff9f0a" strokeWidth={2} />
              <Line type="monotone" dataKey="placements" name="Placements" stroke="#28b879" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="performance-chart-grid lower">
          <ChartCard title="Candidate-wise Submissions" subtitle="Click a candidate bar for their submission history" wide>
            <ResponsiveContainer width="100%" height={Math.max(300, candidates.slice(0, 12).length * 34)}>
              <BarChart data={candidates.slice(0, 12)} layout="vertical" margin={{ left: 26, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf0f6" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="candidate_name" width={135} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" name="Submissions" fill="#4087f4" radius={[0, 5, 5, 0]} cursor="pointer" onClick={chooseCandidate} />
                <Bar dataKey="placements" name="Placements" fill="#28b879" radius={[0, 5, 5, 0]} cursor="pointer" onClick={chooseCandidate} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <article className="candidate-ranking">
            <div className="chart-card-heading"><div><h3><FaChartPie /> Candidate Details</h3><p>Top candidates in the filtered period</p></div></div>
            <div>
              {candidates.length ? candidates.slice(0, 12).map((candidate, index) => (
                <button key={`${candidate.candidate_id || "legacy"}-${candidate.candidate_name}`} onClick={() => candidate.candidate_id && chooseCandidate(candidate)}>
                  <b>{index + 1}</b><span><strong>{candidate.candidate_name || "Unnamed candidate"}</strong><small>{candidate.technology || "Technology not entered"} · {candidate.visa_status || "Visa N/A"}</small></span>
                  <em>{candidate.submissions}<small> submissions</small></em>
                </button>
              )) : <Empty />}
            </div>
          </article>
        </div>

        <article className="performance-details">
          <div className="chart-card-heading"><div><h3><FaUser /> Submission Details</h3><p>{applications.length} matching records · click View to open the application</p></div></div>
          <div className="performance-table-wrap">
            <table><thead><tr><th>Date</th><th>Candidate</th><th>Employee</th><th>Technology</th><th>Client / Vendor</th><th>Status</th><th>Rate</th><th /></tr></thead>
              <tbody>{applications.length ? applications.map((item) => <tr key={item.id}>
                <td>{dateLabel(item.activity_date || item.date_created)}</td><td><strong>{item.candidate_name || "-"}</strong></td><td>{item.employee_name || "-"}</td><td>{item.role || "-"}</td><td>{item.client || item.vendor || "-"}</td><td><span className={`performance-status process-${item.process_id}`}>{item.status}</span></td><td>{item.rate ? `$${item.rate}` : "-"}</td><td><a href={`/dashboard/bench-sales/${item.id}`}>View</a></td>
              </tr>) : <tr><td colSpan="8"><Empty /></td></tr>}</tbody>
            </table>
          </div>
        </article>
      </>}
    </div>
  );
}

const Summary = ({ label, value, tone = "" }) => <article className={tone}><span>{label}</span><strong>{number(value)}</strong></article>;
const ChartCard = ({ title, subtitle, wide = false, children }) => <article className={`performance-chart-card${wide ? " wide" : ""}`}><div className="chart-card-heading"><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</article>;
const Empty = () => <div className="performance-empty">No matching performance data.</div>;
