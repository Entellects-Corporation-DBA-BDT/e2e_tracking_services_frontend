import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaSearch, FaUserTag } from "react-icons/fa";
import { getEmployees } from "../../api/employeeApi";
import "../../styles/Dashboard/empstatus.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import AssignCompanyNameModal from "../../components/AssignCompanyNameModal";
import EmployeeFormModal from "../../components/EmployeeFormModal";
import { deleteEmployee } from "../../api/employeeApi";
import { ProtectedComponent } from "../../auth/PermissionContext";

function EmployeeStatusReport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState("");
  const [editing,setEditing]=useState(null);
  const [formOpen,setFormOpen]=useState(false);
  const [deleting,setDeleting]=useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getEmployees({
        page,
        limit: entries,
        search: debouncedSearch,
        employment: "all",
      });
      setEmployees(response.data || []);
      setTotalPages(Math.max(response.total_pages || 1, 1));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Employees could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, entries, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (loading && !employees.length) return <Loader fullPage />;

  return (
    <div className="e2e_empstatus_page">
      <div className="e2e_empstatus_top"><div><h2>Employee Identity Management</h2><p>Keep legal employee records separate from application-facing Company Names.</p><div className="e2e_empstatus_heading_line" /></div><ProtectedComponent resource="employees" action="create"><button className="e2e_employee_add" onClick={()=>{setEditing(null);setFormOpen(true)}}>+ Add Employee</button></ProtectedComponent></div>
      <div className="e2e_empstatus_filters">
        <label className="e2e_empstatus_search_wrap"><FaSearch /><input type="search" placeholder="Search legal name, Company Name or Employee ID..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        <label className="e2e_empstatus_entries">Show <select value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setPage(1); }}>{[10,25,50,100].map((size) => <option key={size}>{size}</option>)}</select></label>
      </div>
      {error && <div className="e2e_empstatus_error" role="alert">{error}<button type="button" onClick={loadEmployees}>Try again</button></div>}
      <div className="e2e_empstatus_table_wrapper">
        <table className="e2e_empstatus_table"><thead><tr><th>Employee ID</th><th>Legal Employee Name</th><th>Company Name</th><th>Role</th><th>Assignment</th><th>Action</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="6" className="e2e_empstatus_empty">Loading employees...</td></tr> : employees.length ? employees.map((employee) => (
            <tr key={employee.id}>
              <td><strong>{employee.employee_id}</strong></td><td>{employee.legal_name}</td>
              <td>{employee.company_name ? <span className="e2e_company_identity"><FaUserTag /> {employee.company_name}</span> : <span className="e2e_not_assigned">Not Assigned</span>}</td>
              <td>{employee.role || "â€”"}</td>
              <td><span className={employee.user_id ? "e2e_assignment_badge assigned" : "e2e_assignment_badge unassigned"}>{employee.user_id ? "Assigned" : "Not Assigned"}</span></td>
              <td><div className="e2e_empstatus_actions"><button type="button" className="e2e_empstatus_view_btn" onClick={() => navigate(`/dashboard/employee-status/${employee.id}`)}>View</button><button type="button" className="editBtn" onClick={()=>{setEditing(employee);setFormOpen(true)}}>Edit</button><button type="button" className="deleteBtn" onClick={()=>setDeleting(employee)}>Remove</button>{!employee.user_id && <button type="button" className="e2e_empstatus_assign_btn" onClick={() => setAssigning(employee)}>Assign</button>}</div></td>
            </tr>
          )) : <tr><td colSpan="6" className="e2e_empstatus_empty">No employees found.</td></tr>}</tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      {assigning && <AssignCompanyNameModal employee={assigning} onClose={() => setAssigning(null)} onAssigned={(message) => { setAssigning(null); setToast(message); loadEmployees(); }} />}
      {formOpen&&<EmployeeFormModal employee={editing} onClose={()=>setFormOpen(false)} onSaved={message=>{setFormOpen(false);setToast(message);loadEmployees()}}/>}
      {deleting&&<div className="e2e_alias_overlay"><section className="e2e_remove_dialog"><div>!</div><h2>Remove Employee?</h2><p>Remove <strong>{deleting.legal_name}</strong>? Their linked User account and historical attendance will be retained.</p><footer><button className="secondary" onClick={()=>setDeleting(null)}>Cancel</button><button className="danger" onClick={async()=>{try{const r=await deleteEmployee(deleting.id);setDeleting(null);setToast(r.message);loadEmployees()}catch(e){setDeleting(null);setError(e?.response?.data?.message||"Employee could not be removed.")}}}>Remove Employee</button></footer></section></div>}
      {toast && <div className="e2e_identity_toast" role="status"><FaCheckCircle /> {toast}</div>}
    </div>
  );
}

export default EmployeeStatusReport;
