import { memo, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaArrowDown,
  FaArrowUp,
  FaBriefcase,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaMinus,
  FaUser,
} from "react-icons/fa";
import "../../styles/Dashboard/workforceSubmissionAnalytics.css";
import "../../styles/Dashboard/workforceSubmissionControls.css";
import "../../styles/Dashboard/latestSubmissionCarousel.css";
import "../../styles/Dashboard/submissionStatusOverrides.css";

const COLORS = ["#5b35f5", "#4087f4", "#ff9f0a", "#ff4d5e", "#28b879", "#15b8a6", "#8d5cf6", "#f97352"];

const number = (value) => Number(value) || 0;
const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
  : "Not entered";
const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", timeZoneName: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(value))
  : "Not entered";

function WorkforceSubmissionAnalytics({
  data = {},
  loading = false,
  error = "",
  selectedEmployeeId,
  period,
  onPeriodChange,
  onEmployeeSelect,
  onRetry,
  onSubmissionOpen,
}) {
  const [metric, setMetric] = useState("submissions");
  const [latestIndex, setLatestIndex] = useState(0);
  const employees = useMemo(
    () => Array.isArray(data.employees) ? data.employees : [],
    [data.employees]
  );
  const latest = Array.isArray(data.latest_submissions) ? data.latest_submissions : [];
  const submissions = Array.isArray(data.selected_submissions) ? data.selected_submissions : [];
  const totals = data.totals || {};

  const chartData = useMemo(() => employees.map((employee, index) => ({
    ...employee,
    name: employee.employee_name,
    currentValue: number(employee[`this_week_${metric}`]),
    previousValue: number(employee[`last_week_${metric}`]),
    color: COLORS[index % COLORS.length],
  })), [employees, metric]);
  const periodLabel = data.period_label || "This Week";
  const previousPeriodLabel = data.previous_period_label || "Last Week";
  const currentTotal = number(data.totals?.[`this_week_${metric}`]);
  const previousTotal = number(data.totals?.[`last_week_${metric}`]);

  useEffect(() => {
    setLatestIndex((current) => latest.length ? Math.min(current, latest.length - 1) : 0);
  }, [latest.length]);

  const selectedEmployee = employees.find(
    (employee) => number(employee.employee_id) === number(selectedEmployeeId)
  ) || employees[0];

  if (loading && !employees.length) {
    return <section className="workforce-analytics-state"><span /><strong>Loading weekly submission intelligence...</strong></section>;
  }

  if (error && !employees.length) {
    return <section className="workforce-analytics-state error"><strong>{error}</strong><button onClick={onRetry}>Try again</button></section>;
  }

  const selectChartEmployee = (entry) => {
    const employeeId = entry?.employee_id ?? entry?.payload?.employee_id;
    if (employeeId) onEmployeeSelect(employeeId);
  };

  return (
    <section className="workforce-analytics">
      <header className="workforce-analytics-header">
        <div>
          <span>WORKFORCE PERFORMANCE</span>
          <h2>Weekly Submission Intelligence</h2>
          <p>Only employees with activity in the selected comparison are shown. Click an employee to inspect their candidates.</p>
        </div>
        <div className="workforce-chart-controls">
          <label><span>Compare</span><select value={period} onChange={(event) => onPeriodChange(event.target.value)}><option value="today">Today vs Yesterday</option><option value="this_week">This Week vs Last Week</option><option value="this_month">This Month vs Last Month</option></select></label>
          <label><span>Metric</span><select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="submissions">Submissions</option><option value="interviews">Interviews</option><option value="placements">Placements</option></select></label>
        </div>
        <div className="workforce-total-chips">
          <Metric label={periodLabel} value={currentTotal} />
          <Metric label={previousPeriodLabel} value={previousTotal} muted />
          <Metric label="Placements" value={totals.this_week_placements} success />
        </div>
      </header>

      {error && <div className="workforce-inline-error">{error}<button onClick={onRetry}>Refresh</button></div>}

      <div className="workforce-chart-grid">
        <article className="workforce-panel">
          <div className="workforce-panel-heading">
            <div><h3>{metric[0].toUpperCase() + metric.slice(1)} by Employee</h3><p>{periodLabel} share</p></div>
            <strong>{currentTotal} total</strong>
          </div>
          <div className="workforce-pie-layout">
            <div className="workforce-pie">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="currentValue"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    onClick={selectChartEmployee}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.employee_id}
                        fill={entry.color}
                        stroke={number(entry.employee_id) === number(selectedEmployeeId) ? "#111827" : "#fff"}
                        strokeWidth={number(entry.employee_id) === number(selectedEmployeeId) ? 3 : 1}
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ${metric}`, periodLabel]} />
                </PieChart>
              </ResponsiveContainer>
              <div><strong>{currentTotal}</strong><span>Total</span></div>
            </div>
            <div className="workforce-legend">
              {chartData.map((employee) => (
                <button
                  key={employee.employee_id}
                  className={number(employee.employee_id) === number(selectedEmployeeId) ? "active" : ""}
                  onClick={() => onEmployeeSelect(employee.employee_id)}
                >
                  <i style={{ background: employee.color }} />
                  <span><strong>{employee.name}</strong><small>{employee.employee_role || "Employee"}</small></span>
                  <b>{employee.currentValue} / {employee.previousValue}</b>
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="workforce-panel workforce-comparison-panel">
          <div className="workforce-panel-heading">
            <div><h3>{periodLabel} vs {previousPeriodLabel}</h3><p>Employee {metric} comparison</p></div>
            <small>{period === "this_week" ? "Week starts Monday" : "Live comparison"}</small>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 18, right: 10, left: -18, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#344054" }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#f7f5ff" }} />
              <Legend />
              <Bar dataKey="currentValue" name={periodLabel} fill="#5b35f5" radius={[5, 5, 0, 0]} cursor="pointer" onClick={selectChartEmployee} />
              <Bar dataKey="previousValue" name={previousPeriodLabel} fill="#c9bdf8" radius={[5, 5, 0, 0]} cursor="pointer" onClick={selectChartEmployee} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </div>

      <div className="employee-drilldown">
        <header>
          <div className="employee-avatar"><FaUser /></div>
          <div>
            <span>SELECTED EMPLOYEE</span>
            <h3>{selectedEmployee?.employee_name || "No employee submissions this week"}</h3>
            <p>{selectedEmployee?.employee_role || "Candidate submission details"}</p>
          </div>
          {selectedEmployee && <Trend value={
            number(selectedEmployee[`this_week_${metric}`])
            - number(selectedEmployee[`last_week_${metric}`])
          } />}
          <div className="employee-result-summary">
            <span><strong>{number(selectedEmployee?.[`this_week_${metric}`])}</strong>{periodLabel}</span>
            <span><strong>{number(selectedEmployee?.[`last_week_${metric}`])}</strong>{previousPeriodLabel}</span>
            <span><strong>{number(selectedEmployee?.this_week_placements)}</strong>Placements</span>
          </div>
        </header>
        <div className="submitted-candidate-grid">
          {loading ? <div className="candidate-detail-empty">Refreshing employee details...</div>
            : submissions.length ? submissions.map((submission) => (
              <button key={submission.id} className="submitted-candidate" onClick={() => onSubmissionOpen(submission.id)}>
                <div className="submitted-candidate-top">
                  <span className={`submission-status process-${submission.process_id}`}>{submission.status}</span>
                  <small>{formatDate(submission.submission_date)}</small>
                </div>
                <h4>{submission.candidate_name || "Unnamed candidate"}</h4>
                <p>{submission.technology || submission.role || "Technology not entered"}</p>
                <div><span><FaBriefcase />{submission.client || submission.vendor || "Client not entered"}</span><span><FaMapMarkerAlt />{submission.candidate_loc || submission.current_location || "Location not entered"}</span></div>
                <footer><span>{submission.visa_status || "Visa N/A"}</span><strong>{submission.rate ? `$${submission.rate}` : "Rate N/A"}</strong></footer>
              </button>
            )) : <div className="candidate-detail-empty">No candidates were submitted by this employee during the current week.</div>}
        </div>
      </div>

      <article className="latest-submissions">
        <div className="workforce-panel-heading">
          <div><h3><FaCalendarAlt /> Latest Submission Details</h3><p>Most recent activity across the dashboard scope</p></div>
          {latest.length > 1 && <div className="latest-carousel-controls">
            <button type="button" aria-label="Previous submission" onClick={() => setLatestIndex((current) => (current - 1 + latest.length) % latest.length)}><FaChevronLeft /></button>
            <span>{latestIndex + 1} / {latest.length}</span>
            <button type="button" aria-label="Next submission" onClick={() => setLatestIndex((current) => (current + 1) % latest.length)}><FaChevronRight /></button>
          </div>}
        </div>
        {latest.length ? <LatestSubmissionCard submission={latest[latestIndex]} onOpen={onSubmissionOpen} />
          : <div className="candidate-detail-empty">No recent submissions are available.</div>}
      </article>
    </section>
  );
}

const Metric = ({ label, value, muted, success }) => (
  <span className={`${muted ? "muted" : ""}${success ? " success" : ""}`}><strong>{number(value)}</strong>{label}</span>
);

const Trend = ({ value }) => {
  const change = number(value);
  return <span className={`employee-trend ${change > 0 ? "up" : change < 0 ? "down" : "flat"}`}>
    {change > 0 ? <FaArrowUp /> : change < 0 ? <FaArrowDown /> : <FaMinus />}
    {Math.abs(change)} vs last week
  </span>;
};

const LatestSubmissionCard = ({ submission, onOpen }) => (
  <div className="latest-carousel-card" role="button" tabIndex="0" onClick={() => onOpen(submission.id)} onKeyDown={(event) => { if (event.key === "Enter") onOpen(submission.id); }}>
    <section>
      <Detail label="B.S Recruiter" value={submission.employee_name} />
      <Detail label="Candidate Name" value={submission.candidate_name} strong />
      <Detail label="Technology" value={submission.technology || submission.role} />
      <Detail label="Sub Bill Rate" value={submission.rate ? `$${submission.rate}/Hr` : null} />
      <Detail label="Vendor" value={submission.vendor} />
    </section>
    <section>
      <Detail label="Vendor Email" value={submission.vendor_email} />
      <Detail label="Vendor Contact" value={submission.contact || submission.vendor_contact} />
      <Detail label="Recruiter Name" value={submission.vendor_contact} />
      <Detail label="Client Name" value={submission.client} />
      <Detail label="Location" value={submission.candidate_loc || submission.current_location} />
    </section>
    <section>
      <Detail label="Position" value={submission.role || submission.technology} />
      <Detail label="Interview Mode" value={submission.interview_mode} />
      <Detail label="Interview Slot" value={submission.interview_slot ? formatDateTime(submission.interview_slot) : null} />
      <Detail label="Status" value={submission.status} status={submission.process_id} />
      <Detail label="Feedback" value={submission.feedback} feedback />
    </section>
  </div>
);

const Detail = ({ label, value, strong, status, feedback }) => (
  <div className={`latest-detail${feedback ? " feedback" : ""}`}>
    <span>{label}</span><i>:</i>
    {status ? <em className={`submission-status process-${status}`}>{value || "Not entered"}</em>
      : <strong className={strong ? "primary" : ""}>{value || "Not entered"}</strong>}
  </div>
);

export default memo(WorkforceSubmissionAnalytics);
