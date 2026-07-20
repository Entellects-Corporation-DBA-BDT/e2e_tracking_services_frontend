import { useCallback, useEffect, useState } from "react";
import "../../styles/Dashboard/recruiting.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";
import { getRecruiterApplications } from "../../api/applicationApi";

const user = getUserDataFromCookies();
const loginUserId = user?.user_id;

function Recruiting() {
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

  const fetchApplications = useCallback(async () => {
    try {
      setError("");
      initialLoading ? setInitialLoading(true) : setTableLoading(true);
      const response = await getRecruiterApplications(currentPage, entries, debouncedSearch);
      setTableData(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Recruiter applications could not be loaded.");
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  }, [currentPage, entries, debouncedSearch, initialLoading]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const open = (form, id = null) => { setSelectedApplicationId(id); setOpenForm(form); };
  const displayDate = (date) => date ? new Date(`${date}`).toLocaleDateString() : "-";

  if (initialLoading) return <Loader fullPage />;

  return <div className="e2e_recruiting_page">
    <div className="e2e_recruiting_top">
      <div className="e2e_recruiting_left"><h2>Recruiter Application List</h2><div className="e2e_recruiting_heading_line" /></div>
      <div className="e2e_recruiting_right"><button className="e2e_recruiting_add_btn" onClick={() => open("recruiter")}>+ Add New</button></div>
    </div>

    {error && <p role="alert" style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>}
    <div className="e2e_recruiting_filters">
      <div className="e2e_recruiting_filter_right"><input type="text" placeholder="Search candidate, client, role, vendor or POC..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} /></div>
      <select value={entries} className="e2e_pagination_number" onChange={(e) => { setEntries(Number(e.target.value)); setCurrentPage(1); }}>{[5,10,25,50,100].map((value) => <option key={value} value={value}>{value}</option>)}</select>
    </div>

    <div className="e2e_recruiting_table_wrapper"><table><thead><tr><th>#</th><th>Submission Date</th><th>Recruiter Name</th><th>Candidate Name</th><th>POC</th><th>Feedback</th><th>Action</th></tr></thead>
      <tbody>{tableLoading ? <tr><td colSpan="7" style={{ textAlign:"center",padding:30 }}>Loading...</td></tr> : tableData.length ? tableData.map((item,index) => <tr key={item.id}>
        <td>{(currentPage-1)*entries+index+1}</td>
        <td>{displayDate(item.date_created)}</td>
        <td style={{ color:Number(loginUserId)===Number(item.employee_id)?"#16a34a":"inherit",fontWeight:Number(loginUserId)===Number(item.employee_id)?700:400 }}>{item.employee_name || "-"}</td>
        <td><strong>{item.candidate_name || "-"}</strong></td>
        <td>{item.poc || "-"}</td><td>{item.feedback || "-"}</td>
        <td><div className="e2e_recruiting_actions"><button className="viewBtn" onClick={() => open("recruiterView",item.id)}>View</button><button className="editBtn" onClick={() => open("recruiterEdit",item.id)}>Edit</button><button className="deleteBtn" onClick={() => open("recruiterDelete",item.id)}>Delete</button></div></td>
      </tr>) : <tr><td colSpan="7" style={{ textAlign:"center",padding:30 }}>No recruiter applications found.</td></tr>}</tbody>
    </table></div>
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    <FormView openForm={openForm} setOpenForm={setOpenForm} applicationId={selectedApplicationId} refreshData={fetchApplications} />
  </div>;
}

export default Recruiting;
