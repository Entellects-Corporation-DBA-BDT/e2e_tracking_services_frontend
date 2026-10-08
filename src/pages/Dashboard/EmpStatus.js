import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaSearch, FaUserTag, FaUsers, FaUserCheck, FaUserTimes, FaUserTie, FaBriefcase, FaLayerGroup, FaCalendarAlt } from "react-icons/fa";
import { getEmployees } from "../../api/employeeApi";
import "../../styles/Dashboard/empstatus.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import AssignCompanyNameModal from "../../components/AssignCompanyNameModal";
import EmployeeOnboardingInvite from "../../components/EmployeeOnboardingInvite";
import EmployeeFormModal from "../../components/EmployeeFormModal";
import { deleteEmployee } from "../../api/employeeApi";
import EmployeeRowActions from "../../components/EmployeeRowActions";
import ConfirmDialog from "../../components/ConfirmDialog";
import { usePermissions, ProtectedComponent } from "../../auth/PermissionContext";

function EmployeeStatusReport() {
  const navigate = useNavigate();
  const {can,isAdmin}=usePermissions();
  const [summary,setSummary]=useState({}),[options,setOptions]=useState({companies:[],roles:[]}),[total,setTotal]=useState(0);
  const [company,setCompany]=useState(""),[role,setRole]=useState(""),[status,setStatus]=useState(""),[joining,setJoining]=useState(""),[deleteBusy,setDeleteBusy]=useState(false);
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
        employment: "all", company, role, status, joining_date:joining,
      });
      setEmployees(response.data || []);
      setSummary(response.summary||{});setOptions(response.options||{companies:[],roles:[]});setTotal(Number(response.total)||0);
      setTotalPages(Math.max(response.total_pages || 1, 1));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Employees could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, entries, page, company, role, status, joining]);

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
      <div className="e2e_empstatus_top"><div><h2><FaUsers/> Employees</h2><p>Manage employee records, roles, assignments and profile information.</p><div className="e2e_empstatus_heading_line" /></div><ProtectedComponent resource="employees" action="create"><button className="e2e_employee_add" onClick={()=>{setEditing(null);setFormOpen(true)}}>+ Add Employee</button></ProtectedComponent></div>
      <div className="employee-directory-stats">{[["Total Employees","total",FaUsers,"blue"],["Active Employees","active",FaUserCheck,"green"],["Inactive Employees","inactive",FaUserTimes,"red"],["Recruiters","recruiters",FaUserTie,"violet"],["Bench Sales","bench_sales",FaBriefcase,"orange"],["Other Roles","other_roles",FaLayerGroup,"blue"]].map(([label,key,Icon,color])=><article key={key} className={color}><span><Icon/></span><div><p>{label}</p><strong>{summary[key]??"..."}</strong></div></article>)}</div>
      <ProtectedComponent resource="employees" action="create"><EmployeeOnboardingInvite/></ProtectedComponent>
      <div className="e2e_empstatus_filters">
        <label className="e2e_empstatus_search_wrap"><FaSearch /><input type="search" placeholder="Search legal name, Company Name or Employee ID..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        <select aria-label="Filter employees by company" value={company} onChange={e=>{setCompany(e.target.value);setPage(1)}}><option value="">All Companies</option>{options.companies.map(v=><option key={v}>{v}</option>)}</select>
        <select aria-label="Filter employees by role" value={role} onChange={e=>{setRole(e.target.value);setPage(1)}}><option value="">All Roles</option>{options.roles.map(v=><option key={v}>{v}</option>)}</select>
        <select aria-label="Filter employees by status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="unassigned">Not Assigned</option></select>
        <label className="employee-joining-filter"><FaCalendarAlt/><input aria-label="Filter employees by joining date" type="date" value={joining} onChange={e=>{setJoining(e.target.value);setPage(1)}}/></label>
        <button type="button" className="employee-filter-clear" onClick={()=>{setSearch("");setDebouncedSearch("");setCompany("");setRole("");setStatus("");setJoining("");setPage(1)}}>Clear</button>
      </div>
      <div className="employee-directory-table-heading"><span>{total} employee{total===1?"":"s"}</span><label className="e2e_empstatus_entries">Rows <select value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setPage(1); }}>{[10,25,50,100].map((size) => <option key={size}>{size}</option>)}</select></label>
      </div>
      {error && <div className="e2e_empstatus_error" role="alert">{error}<button type="button" onClick={loadEmployees}>Try again</button></div>}
      <div className="e2e_empstatus_table_wrapper">
        <table className="e2e_empstatus_table"><thead><tr><th>Employee ID</th><th>Legal Employee Name</th><th>Company Name</th><th>Role</th><th>Profile Completion %</th><th>Status</th><th>Joining Date</th><th>Actions</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="8" className="e2e_empstatus_empty">Loading employees...</td></tr> : employees.length ? employees.map((employee) => (
            <tr key={employee.id}>
              <td><strong>{employee.employee_id||"Not assigned"}</strong></td><td><span className="employee-directory-name"><i>{(employee.legal_name||"E").split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join("")}</i><span>{employee.legal_name}</span></span></td>
              <td>{employee.company_name ? <span className="e2e_company_identity"><FaUserTag /> {employee.company_name}</span> : <span className="e2e_not_assigned">Not Assigned</span>}</td>
              <td>{employee.role || "Not assigned"}</td>
              <td><div className="employee-list-completion"><strong>{Number.isFinite(Number(employee.profile_completion))&&employee.profile_completion!=null?`${Math.max(0,Math.min(100,Number(employee.profile_completion)))}%`:"Unavailable"}</strong><div role="progressbar" aria-label={`Profile completion for ${employee.legal_name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(employee.profile_completion)||0}><span style={{width:`${Math.max(0,Math.min(100,Number(employee.profile_completion)||0))}%`}}/></div></div></td>
              <td><span className={`employee-directory-status ${!employee.user_id?"unassigned":String(employee.user_status).toLowerCase()==="active"?"active":"inactive"}`}>{!employee.user_id?"Not Assigned":String(employee.user_status).toLowerCase()==="active"?"Active":"Inactive"}</span></td>
              <td>{employee.date_of_joining&&employee.date_of_joining!=="0000-00-00"?new Date(employee.date_of_joining+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}):"Not recorded"}</td>
              <td><EmployeeRowActions employee={employee} canEdit={can("employees","edit")&&isAdmin} canDelete={can("employees","delete")} canAssign={can("employees","assign")} onView={()=>navigate(`/dashboard/employee-status/${employee.id}`)} onEdit={()=>{setEditing(employee);setFormOpen(true)}} onDelete={()=>setDeleting(employee)} onAssign={()=>setAssigning(employee)}/></td>
            </tr>
          )) : <tr><td colSpan="8" className="e2e_empstatus_empty">No employees found.</td></tr>}</tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      {assigning && <AssignCompanyNameModal employee={assigning} onClose={() => setAssigning(null)} onAssigned={(message) => { setAssigning(null); setToast(message); loadEmployees(); }} />}
      {formOpen&&<EmployeeFormModal employee={editing} onClose={()=>setFormOpen(false)} onSaved={message=>{setFormOpen(false);setToast(message);loadEmployees()}}/>}
      <ConfirmDialog open={Boolean(deleting)} title="Delete employee?" message={`Delete ${deleting?.legal_name||"this employee"}? Their linked user account and historical attendance will be retained.`} confirmLabel="Delete Employee" busy={deleteBusy} onCancel={()=>setDeleting(null)} onConfirm={async()=>{if(deleteBusy)return;setDeleteBusy(true);try{const r=await deleteEmployee(deleting.id);setDeleting(null);setToast(r.message);loadEmployees();}catch(e){setError(e?.response?.data?.message||"Employee could not be deleted.");}finally{setDeleteBusy(false);}}}/>

      {toast && <div className="e2e_identity_toast" role="status"><FaCheckCircle /> {toast}</div>}
    </div>
  );
}

export default EmployeeStatusReport;
