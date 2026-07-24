import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaBriefcase, FaIdBadge, FaRedo, FaTrashAlt, FaUser, FaUserTag } from "react-icons/fa";
import { getEmployeeById, removeCompanyName } from "../../api/employeeApi";
import AssignCompanyNameModal from "../../components/AssignCompanyNameModal";
import AttendancePanel from "../../components/AttendancePanel";
import "../../styles/Dashboard/recordView.css";
import "../../styles/Dashboard/empstatus.css";
import { usePermissions } from "../../auth/PermissionContext";

function EmployeeView() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState("");

  const loadEmployee = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getEmployeeById(employeeId);
      setEmployee(response.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Employee could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { loadEmployee(); }, [loadEmployee]);

  const handleRemove = async () => {
    try {
      const response = await removeCompanyName(employee.id);
      setRemoving(false);
      setToast(response.message);
      loadEmployee();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Company Name mapping could not be removed.");
      setRemoving(false);
    }
  };

  if (loading && !employee) return <div className="e2e_record_state"><span className="e2e_record_spinner" /><h2>Loading employee...</h2></div>;
  if (!employee) return <div className="e2e_record_state e2e_record_error"><div>!</div><h2>Unable to open employee</h2><p>{error}</p><span><button onClick={() => navigate("/dashboard/employee-status")}><FaArrowLeft /> Back</button><button onClick={loadEmployee}><FaRedo /> Try Again</button></span></div>;

  return (
    <article className="e2e_record_page e2e_record_blue">
      <button className="e2e_record_back" onClick={() => navigate("/dashboard/employee-status")}><FaArrowLeft /> Back to Employees</button>
      <header className="e2e_record_hero"><div className="e2e_record_avatar"><FaUser /></div><div><p>Employee · {employee.employee_id}</p><h1>{employee.legal_name}</h1><span>{employee.company_name ? `Company Name: ${employee.company_name}` : "Company Name not assigned"}</span></div><strong className={`e2e_record_status ${employee.user_id ? "" : "unassigned"}`}>{employee.user_id ? "Assigned" : "Not Assigned"}</strong></header>

      {error && <div className="e2e_empstatus_error" role="alert">{error}</div>}
      <section className="e2e_record_card">
        <div className="e2e_record_card_title"><FaUser /><div><h2>Legal Employee Information</h2><p>HR-owned identity information. Legal names remain visible only in Employee Management.</p></div></div>
        <dl className="e2e_record_grid">
          {[["legal_name","Legal Name"],["employee_id","Employee ID"],["contact_info","Contact Information"],["gender","Gender"],["birthdate","Birth Date"],["created_on","Created On"]].map(([key,label]) => <div className="e2e_record_field" key={key}><dt><FaIdBadge /> {label}</dt><dd>{employee[key] || "Not provided"}</dd></div>)}
        </dl>
      </section>
      <AttendancePanel employeeId={employee.id} canManage={can("attendance", "edit")} />

      <section className="e2e_record_card e2e_company_identity_card">
        <div className="e2e_record_card_title"><FaUserTag /><div><h2>Company Identity</h2><p>The alias used across dashboards, applications, interviews, placements, and reports.</p></div></div>
        <dl className="e2e_record_grid">
          <div className="e2e_record_field"><dt><FaUser /> Legal Name</dt><dd>{employee.legal_name}</dd></div>
          <div className="e2e_record_field"><dt><FaUserTag /> Company Name</dt><dd>{employee.company_name || "Not Assigned"}</dd></div>
          <div className="e2e_record_field"><dt><FaIdBadge /> Username</dt><dd>{employee.username || "Not Assigned"}</dd></div>
          <div className="e2e_record_field"><dt><FaBriefcase /> Role</dt><dd>{employee.role || "Not Assigned"}</dd></div>
          <div className="e2e_record_field"><dt><FaIdBadge /> Status</dt><dd>{employee.user_status || "Not Assigned"}</dd></div>
        </dl>
        <div className="e2e_identity_actions">{employee.user_id ? <button className="remove" onClick={() => setRemoving(true)}><FaTrashAlt /> Remove Company Name</button> : <button className="assign" onClick={() => setAssigning(true)}><FaUserTag /> Assign Company Name</button>}</div>
      </section>

      {assigning && <AssignCompanyNameModal employee={employee} onClose={() => setAssigning(false)} onAssigned={(message) => { setAssigning(false); setToast(message); loadEmployee(); }} />}
      {removing && <div className="e2e_alias_overlay"><section className="e2e_remove_dialog" role="alertdialog" aria-modal="true"><div><FaTrashAlt /></div><h2>Remove Company Name?</h2><p>Remove <strong>{employee.company_name}</strong> from <strong>{employee.legal_name}</strong>? The User account will not be deleted.</p><footer><button className="secondary" onClick={() => setRemoving(false)}>Cancel</button><button className="danger" onClick={handleRemove}>Remove Mapping</button></footer></section></div>}
      {toast && <div className="e2e_identity_toast" role="status">{toast}</div>}
    </article>
  );
}

export default EmployeeView;
