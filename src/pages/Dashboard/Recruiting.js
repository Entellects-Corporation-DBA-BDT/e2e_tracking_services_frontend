import { useCallback, useEffect, useState } from "react";
import "../../styles/Dashboard/recruiting.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";
import { getRecruiterApplications, getRecruiterPerformanceDashboard } from "../../api/applicationApi";
import { useNavigate } from "react-router-dom";
import ApplicationListControls from "./ApplicationListControls";
import { downloadApplicationExcel } from "../../utils/applicationListTools";

const user = getUserDataFromCookies();
const loginUserId = user?.user_id;
const PROCESS_STATUS = {
  1: { label: "Submitted", className: "submitted" },
  2: { label: "Interview Scheduled", className: "interview" },
  3: { label: "Placed", className: "placed" },
};
const processStatus = (processId) => PROCESS_STATUS[Number(processId)] || { label: "Not Set", className: "unknown" };

function Recruiting() {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entries, setEntries] = useState(5);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ submissions: 0, interviews: 0, placements: 0 });
  const [datePeriod, setDatePeriod] = useState("all");
  const [dateFilters, setDateFilters] = useState({ start_date: "", end_date: "" });
  const [exporting, setExporting] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setError("");
      initialLoading ? setInitialLoading(true) : setTableLoading(true);
      const [response, summaryData] = await Promise.all([
        getRecruiterApplications(currentPage, entries, debouncedSearch, dateFilters),
        getRecruiterPerformanceDashboard({ application_page: 1, application_limit: 5, ...dateFilters }).catch(() => null),
      ]);
      setTableData(response.data || []);
      setTotalPages(response.total_pages || 1);
      setSummary(summaryData?.data?.summary || { submissions: 0, interviews: 0, placements: 0 });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Recruiter applications could not be loaded.");
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  }, [currentPage, entries, debouncedSearch, initialLoading, dateFilters]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await getRecruiterApplications(1, 50000, debouncedSearch, dateFilters);
      downloadApplicationExcel(response.data || [], "Recruiting", dateFilters);
    } catch (requestError) {
      alert(requestError?.response?.data?.message || "Recruiting Excel report could not be generated.");
    } finally {
      setExporting(false);
    }
  };

  const open = (form, id = null) => { setSelectedApplicationId(id); setOpenForm(form); };
  const displayDate = (date) => date ? new Date(`${date}`).toLocaleDateString("en-US", { timeZone: "America/New_York" }) : "-";

  if (initialLoading) return <Loader fullPage />;

  return <div className="e2e_recruiting_page">
    <div className="e2e_recruiting_top">
      <div className="e2e_recruiting_left"><h2>Recruiter Application List <button className="performence-button" onClick={() => navigate("/dashboard/recruiting/performance")}>Performance</button></h2><div className="e2e_recruiting_heading_line" /></div>
      <div className="e2e_recruiting_right"><button className="e2e_recruiting_add_btn" onClick={() => open("recruiter")}>+ Add New</button></div>
    </div>

    {error && <p role="alert" style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>}
    <div className="e2e_recruiting_summary">
      <article><span>Submissions</span><strong>{Number(summary.total_submissions) || 0}</strong></article>
      <article><span>Interviews</span><strong>{Number(summary.interviews) || 0}</strong></article>
      <article><span>Placements</span><strong>{Number(summary.placements) || 0}</strong></article>
    </div>
    <ApplicationListControls
      period={datePeriod}
      dates={dateFilters}
      onPeriodChange={(value) => { setDatePeriod(value); setCurrentPage(1); }}
      onDatesChange={(value) => { setDateFilters(value); setCurrentPage(1); }}
      search={searchTerm}
      onSearchChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
      onExport={exportReport}
      exporting={exporting}
    />

    <div className="e2e_recruiting_table_wrapper"><table><thead><tr><th>#</th><th>Submission Date</th><th>Recruiter Name</th><th>Candidate Name</th><th>Client</th><th>Status</th><th>POC</th><th>Feedback</th><th>Action</th></tr></thead>
      <tbody>{tableLoading ? <tr><td colSpan="9" style={{ textAlign:"center",padding:30 }}>Loading...</td></tr> : tableData.length ? tableData.map((item,index) => <tr key={item.id}>
        <td>{(currentPage-1)*entries+index+1}</td>
        <td>{displayDate(item.date_created)}</td>
        <td style={{ color:Number(loginUserId)===Number(item.employee_id)?"#16a34a":"inherit",fontWeight:Number(loginUserId)===Number(item.employee_id)?700:400 }}>{item.employee_name || "-"}</td>
        <td><strong>{item.candidate_name || "-"}</strong></td>
        <td>{item.client || "-"}</td>
        <td className="e2e_recruiting_td_process">
          <div className="e2e_recruiting_process_content">
            <span className={["e2e_recruiting_process_badge", "e2e_recruiting_process_" + processStatus(item.process_id).className].join(" ")}>
              {processStatus(item.process_id).className === "placed" && <span aria-hidden="true">✓</span>}
              {processStatus(item.process_id).label}
            </span>
            <small className={["e2e_recruiting_process_note", processStatus(item.process_id).className === "placed" ? "visible" : ""].join(" ")}>
              {processStatus(item.process_id).className === "placed" ? "Submission placed" : "Status"}
            </small>
          </div>
        </td>
        <td>{item.poc || "-"}</td><td>{item.feedback || "-"}</td>
        <td><div className="e2e_recruiting_actions"><button className="viewBtn" onClick={() => navigate(`/dashboard/recruiting/${item.id}`)}>View</button><button className="editBtn" onClick={() => open("recruiterEdit",item.id)}>Edit</button><button className="deleteBtn" onClick={() => open("recruiterDelete",item.id)}>Delete</button></div></td>
      </tr>) : <tr><td colSpan="9" style={{ textAlign:"center",padding:30 }}>No recruiter applications found.</td></tr>}</tbody>
    </table></div>
    <div className="application-list-footer">
      <label className="application-bottom-rows"><select aria-label="Rows per page" value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setCurrentPage(1); }}>{[5, 10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
    <FormView openForm={openForm} setOpenForm={setOpenForm} applicationId={selectedApplicationId} refreshData={fetchApplications} />
  </div>;
}

export default Recruiting;
