import { useCallback, useEffect, useState } from "react";
import "../../styles/Dashboard/recruiting.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";
import { getRecruiterApplications } from "../../api/applicationApi";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaFileAlt, FaShieldAlt, FaPlus, FaUsers, FaCheck } from "react-icons/fa";
import ApplicationListControls from "./ApplicationListControls";
import { downloadApplicationExcel } from "../../utils/applicationListTools";
import { formatEasternDate } from "../../utils/easternTime";

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
  const [datePeriod, setDatePeriod] = useState("all");
  const [dateFilters, setDateFilters] = useState({ start_date: "", end_date: "" });
  const [exporting, setExporting] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setError("");
      initialLoading ? setInitialLoading(true) : setTableLoading(true);
      const response = await getRecruiterApplications(currentPage, entries, debouncedSearch, dateFilters);
      setTableData(response.data || []);
      setTotalPages(response.total_pages || 1);
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
  const displayDate = (date) => formatEasternDate(date);

  if (initialLoading) return <Loader fullPage />;

  return <div className="e2e_recruiting_page recruiting-workspace">
    <header className="e2e_recruiting_top">
      <div className="recruiting-title"><span className="recruiting-title-icon"><FaUsers /></span><div><h2>Recruiting</h2><p>Manage candidate submissions, feedback and placements.</p></div></div>
      <div className="e2e_recruiting_right">
        <button type="button" className="recruiting-tool-button" onClick={() => navigate("/dashboard/recruiting/performance")}><FaArrowRight /> Performance</button>
        <button type="button" className="recruiting-tool-button" onClick={() => navigate("/ai-tools/document-check")}><FaShieldAlt /> Document Check</button>
        <button type="button" className="recruiting-tool-button" onClick={() => navigate("/ai-tools/resume-match")}><FaFileAlt /> Resume Match</button>
        <button type="button" className="recruiting-primary-button" onClick={() => open("recruiter")}><FaPlus /> Add New</button>
      </div>
    </header>

    {error && <p role="alert" style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>}
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

    <div className="e2e_recruiting_table_wrapper" role="region" aria-label="Recruiter applications" tabIndex={0}><table><colgroup><col className="recruiting-col-number" /><col className="recruiting-col-date" /><col /><col /><col /><col className="recruiting-col-status" /><col /><col /><col className="recruiting-col-actions" /></colgroup><thead><tr><th>#</th><th>Submission Date</th><th>Recruiter Name</th><th>Candidate Name</th><th>Client</th><th>Status</th><th>POC</th><th>Feedback</th><th>Action</th></tr></thead>
      <tbody>{tableLoading ? <tr><td colSpan="9" style={{ textAlign:"center",padding:30 }}>Loading...</td></tr> : tableData.length ? tableData.map((item,index) => <tr key={item.id} className={Number(item.process_id) === 3 ? "recruiting-row-placed" : ""}>
        <td>{(currentPage-1)*entries+index+1}</td>
        <td>{displayDate(item.date_created)}</td>
        <td style={{ color:Number(loginUserId)===Number(item.employee_id)?"#16a34a":"inherit",fontWeight:Number(loginUserId)===Number(item.employee_id)?700:400 }}>{item.employee_name || "-"}</td>
        <td><strong>{item.candidate_name || "-"}</strong>{item.role && <small className="recruiting-candidate-role">{item.role}</small>}</td>
        <td>{item.client || "-"}</td>
        <td className="e2e_recruiting_td_process">
          <div className="e2e_recruiting_process_content">
            <span className={["e2e_recruiting_process_badge", "e2e_recruiting_process_" + processStatus(item.process_id).className].join(" ")}>
              {processStatus(item.process_id).className === "placed" && <FaCheck aria-hidden="true" />}
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
      <label className="application-bottom-rows">Rows<select aria-label="Rows per page" value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setCurrentPage(1); }}>{[5, 10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <span className="recruiting-page-caption">Page {currentPage} of {totalPages}</span>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
    <FormView openForm={openForm} setOpenForm={setOpenForm} applicationId={selectedApplicationId} refreshData={fetchApplications} />
  </div>;
}

export default Recruiting;
