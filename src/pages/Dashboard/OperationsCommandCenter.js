import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaAddressCard, FaArrowRight, FaBriefcase, FaBuilding, FaCalendarCheck,
  FaClipboardCheck, FaClock, FaHandshake, FaPlus, FaUserCheck, FaUsers,
} from "react-icons/fa";
import { getCandidateData } from "../../api/candidateApi";
import { getJobsData } from "../../api/jobApi";
import { getEmployees, getTodayAttendance } from "../../api/employeeApi";
import { getUsers } from "../../api/userApi";
import { getPrimeVendors } from "../../api/primeVendorApi";
import {
  getDashboardActivities,
  getDashboardTable,
  getExecutiveDashboardSummary,
} from "../../api/applicationApi";
import { usePermissions } from "../../auth/PermissionContext";
import "../../styles/Dashboard/operationsCommandCenter.css";

const extractTotal = (payload) => {
  const candidates = [
    payload?.total, payload?.count, payload?.pagination?.total,
    payload?.meta?.total, payload?.data?.total, payload?.data?.count,
  ];
  const total = candidates.find((value) => Number.isFinite(Number(value)));
  if (total !== undefined) return Number(total);
  const rows = payload?.data?.data || payload?.data || payload?.rows || payload?.employees || payload?.users;
  return Array.isArray(rows) ? rows.length : null;
};

const formatActivityDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en", { timeZone: "America/New_York", timeZoneName: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};

const activityDate = (row) => row.submission_date || row.interview_date || row.placement_date || row.created_at;

function OperationsCommandCenter({ summary = {}, refreshToken = 0 }) {
  const navigate = useNavigate();
  const { can, isAdmin } = usePermissions();
  const [counts, setCounts] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const countRequests = [
      ["candidates", can("candidates", "view"), () => getCandidateData(1, 1, "")],
      ["open_jobs", can("jobs", "view"), () => getJobsData(1, 1, "")],
      ["employees", can("employees", "view") || can("emp_status_report", "view"), () => getEmployees({ page: 1, limit: 1 })],
      ["users", can("users", "view"), () => getUsers({ page: 1, limit: 1 })],
      ["vendors", isAdmin && can("prime_vendors", "view"), () => getPrimeVendors(1, 1, "")],
      ["attendance", can("attendance", "view"), getTodayAttendance],
    ].filter(([, allowed]) => allowed);

    const load = async () => {
      setLoading(true);
      const [executiveResult, countResults, auditResult, activityResults] = await Promise.all([
        getExecutiveDashboardSummary().catch(() => null),
        Promise.allSettled(countRequests.map(([, , request]) => request())),
        getDashboardActivities(30).catch(() => []),
        Promise.allSettled([
          getDashboardTable("submissions", { page: 1, limit: 5, sort: "submission_date", order: "desc" }),
          getDashboardTable("interviews", { page: 1, limit: 5, sort: "interview_date", order: "desc" }),
          getDashboardTable("placements", { page: 1, limit: 5, sort: "placement_date", order: "desc" }),
        ]),
      ]);
      if (!active) return;
      const nextCounts = { ...(executiveResult || {}) };
      countResults.forEach((result, index) => {
        if (result.status === "fulfilled") nextCounts[countRequests[index][0]] = extractTotal(result.value);
      });
      setCounts(nextCounts);
      const types = ["Submission", "Interview", "Placement"];
      const merged = activityResults.flatMap((result, index) => (
        result.status === "fulfilled"
          ? (result.value?.data || []).map((row) => ({ ...row, activityType: types[index] }))
          : []
      )).sort((a, b) => new Date(activityDate(b) || 0) - new Date(activityDate(a) || 0)).slice(0, 8);
      const auditActivities = Array.isArray(auditResult) ? auditResult.map((row) => ({
        ...row,
        activityType: row.status === "Denied" ? "Alert" : "Audit",
        audit: true,
        candidate: row.message,
        recruiter: row.status,
      })) : [];
      setActivities(auditActivities.length ? auditActivities.slice(0, 12) : merged);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [can, isAdmin, refreshToken]);

  const modules = useMemo(() => [
    { key: "open_jobs", label: "Open Jobs", value: summary.open_jobs ?? counts.open_jobs, icon: <FaBriefcase />, route: "/dashboard/jobs", tone: "orange" },
    { key: "candidates", label: "Candidates", value: summary.candidates ?? counts.candidates ?? summary.active_candidates, icon: <FaAddressCard />, route: "/dashboard/candidates", tone: "violet" },
    { key: "employees", label: "Employees", value: summary.employees ?? counts.employees, icon: <FaUserCheck />, route: "/dashboard/employee-status", tone: "green" },
    { key: "users", label: "System Users", value: summary.users ?? counts.users, icon: <FaUsers />, route: "/dashboard/users", tone: "blue" },
    { key: "attendance", label: "Attendance Today", value: summary.attendance_today ?? counts.attendance_today ?? counts.attendance, icon: <FaCalendarCheck />, route: "/dashboard/attendance", tone: "cyan" },
    { key: "absent_today", label: "Absent Today", value: summary.absent_today ?? counts.absent_today, icon: <FaCalendarCheck />, route: "/dashboard/attendance", tone: "orange" },
    { key: "documents_expiring", label: "Documents Expiring", value: summary.documents_expiring ?? counts.documents_expiring, icon: <FaClipboardCheck />, route: "/dashboard/document-reminders", tone: "pink" },
    { key: "pending_leave_requests", label: "Pending Leaves", value: summary.pending_leave_requests ?? counts.pending_leave_requests, icon: <FaClock />, route: "/dashboard/attendance", tone: "violet" },
    { key: "vendors", label: "Prime Vendors", value: summary.vendors ?? counts.vendors, icon: <FaHandshake />, route: "/dashboard/vendors", tone: "pink", admin: true },
  ].filter((item) => (!item.admin || isAdmin) && item.value !== undefined && item.value !== null), [summary, counts, isAdmin]);

  const actions = [
    ["Add Candidate", "/dashboard/candidates", <FaAddressCard />],
    ["Create Job", "/dashboard/jobs", <FaBriefcase />],
    ["New Submission", "/dashboard/bench-sales", <FaClipboardCheck />],
    ["Add Employee", "/dashboard/employee-status", <FaUserCheck />],
    ["Manage Attendance", "/dashboard/attendance", <FaCalendarCheck />],
    ["Add Client", "/dashboard/clients", <FaBuilding />, true],
    ["Add Vendor", "/dashboard/vendors", <FaHandshake />, true],
  ].filter(([, , , admin]) => !admin || isAdmin);

  return (
    <section className="e2e_ops">
      <div className="e2e_ops_heading">
        <div><span>Live operations</span><h2>Organization command center</h2><p>Monitor every accessible business area and move directly into action.</p></div>
        <span className="e2e_ops_live"><i /> Live data</span>
      </div>

      {modules.length > 0 && (
        <div className="e2e_ops_module_grid">
          {modules.map((item) => (
            <button key={item.key} className={`e2e_ops_module ${item.tone}`} onClick={() => navigate(item.route)}>
              <span className="e2e_ops_module_icon">{item.icon}</span>
              <span><small>{item.label}</small><strong>{loading ? "…" : Number(item.value).toLocaleString()}</strong></span>
              <FaArrowRight className="e2e_ops_arrow" />
            </button>
          ))}
        </div>
      )}

      <div className="e2e_ops_body">
        <div className="e2e_quick_actions">
          <div className="e2e_section_title"><div><span>Super-user controls</span><h3>Quick actions</h3></div><FaPlus /></div>
          <div className="e2e_action_grid">
            {actions.map(([label, route, icon]) => (
              <button key={label} onClick={() => navigate(route, { state: { dashboardAction: "create" } })}>
                <span>{icon}</span><strong>{label}</strong><small>Open module <FaArrowRight /></small>
              </button>
            ))}
          </div>
        </div>

        <div className="e2e_activity_panel">
          <div className="e2e_section_title"><div><span>Audit snapshot</span><h3>Recent activity</h3></div><FaClock /></div>
          <div className="e2e_activity_list">
            {loading ? <p className="e2e_activity_empty">Loading recent operations…</p> : activities.length ? activities.map((item, index) => (
              <button key={`${item.activityType}-${item.id}-${index}`} onClick={() => {
                if (item.audit) return;
                const type = item.activityType.toLowerCase();
                navigate(`/dashboard/records/${type === "submission" ? "submissions" : `${type}s`}/${item.id}`);
              }}>
                <i className={`type-${item.activityType.toLowerCase()}`}>{item.activityType.charAt(0)}</i>
                <span><strong>{item.activityType}: {item.candidate || item.client || "Record updated"}</strong>
                  <small>{item.recruiter ? `By ${item.recruiter} · ` : ""}{formatActivityDate(activityDate(item))}</small></span>
                <FaArrowRight />
              </button>
            )) : <p className="e2e_activity_empty">No recent submission, interview or placement activity is available.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OperationsCommandCenter;
