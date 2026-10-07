import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaBriefcase, FaIdBadge, FaRedo, FaTrashAlt, FaUser, FaUserTag, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaCalendarAlt, FaHome, FaGraduationCap, FaFileAlt, FaClock, FaChartLine } from "react-icons/fa";
import { getEmployeeById, removeCompanyName, getEmployeeAttendance } from "../../api/employeeApi";
import EmployeeProfilePhoto from "../../components/EmployeeProfilePhoto";
import EmployeeAttendanceSwitch from "../../components/EmployeeAttendanceSwitch";
import "../../styles/employeeProfile.css";
import EmployeeProfileOverview from "../../components/EmployeeProfileOverview";
import "../../styles/profileReferenceLayout.css";
import {normalizeCollection} from "../../utils/employeeCollection";
import EmployeeProfileInformation from "../../components/EmployeeProfileInformation";
import AssignCompanyNameModal from "../../components/AssignCompanyNameModal";
import AttendanceActions from "../../components/AttendanceActions";
import AttendancePanel from "../../components/AttendancePanel";
import "../../styles/Dashboard/recordView.css";
import "../../styles/Dashboard/empstatus.css";
import { usePermissions } from "../../auth/PermissionContext";
const sectionGroups={
 "profile-overview":["profile-completion"],
 "profile-details":["profile-details"],
 "profile-family":["profile-family","profile-references"],
 "profile-bank":["profile-bank"],
 "profile-employment":["profile-employment","profile-experience"],
 "profile-education":["profile-education","profile-certifications","profile-skills"],
 "profile-documents":["profile-documents","profile-declaration"],
 "profile-attendance":[],"profile-leave":[],"profile-activity":[]
};
const parentSection=id=>Object.keys(sectionGroups).find(key=>key===id||sectionGroups[key].includes(id));

function EmployeeView() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can,user,scope,resources=[] } = usePermissions();
  const profileTabs=useRef(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAttendance,setShowAttendance]=useState(false);
  const [activeSection,setActiveSection]=useState("profile-overview");
  useEffect(()=>{const nav=profileTabs.current,active=nav?.querySelector('[aria-selected="true"]');if(!nav?.clientWidth||!active||nav.scrollWidth<=nav.clientWidth)return;nav.scrollLeft=Math.max(0,nav.scrollLeft+active.getBoundingClientRect().left-nav.getBoundingClientRect().left-(nav.clientWidth-active.offsetWidth)/2);},[activeSection]);
  const [attendanceRevision,setAttendanceRevision]=useState(0);
  const [monthly,setMonthly]=useState(null);
  const [monthlyError,setMonthlyError]=useState("");
  const canViewAttendance=can("attendance","view");
  useEffect(()=>{document.body.classList.add("e2e-profile-reference");return()=>document.body.classList.remove("e2e-profile-reference","reference-sidebar-hidden")},[]);
  useEffect(()=>{let active=true;setMonthly(null);setMonthlyError("");if(!employee?.id||!canViewAttendance)return;const now=new Date();const ymd=d=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);const end=ymd(now),start=end.slice(0,7)+"-01";getEmployeeAttendance(employee.id,{start_date:start,end_date:end,limit:100}).then(r=>{if(active)setMonthly(r)}).catch(()=>{if(active)setMonthlyError("Attendance summary could not be loaded.")});return()=>{active=false}},[employee?.id,canViewAttendance,attendanceRevision]);
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
  useEffect(()=>{if(showAttendance)window.requestAnimationFrame(()=>document.getElementById("profile-attendance")?.scrollIntoView?.({behavior:"smooth",block:"start"}))},[showAttendance]);
  useEffect(() => {
    const selectHash=()=>{const section=parentSection(window.location.hash.slice(1));if(section){setActiveSection(section);if(section==="profile-attendance")setShowAttendance(true)}};
    selectHash();window.addEventListener("hashchange",selectHash);
    return()=>window.removeEventListener("hashchange",selectHash);
  }, []);
  const selectSection=id=>{const section=parentSection(id);if(section){setActiveSection(section);if(section==="profile-attendance")setShowAttendance(true)}};


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

  const isOwn=Number(employee.user_id)>0 && Number(employee.user_id)===Number(user?.id);
  const canManageEmployee=can("employees","edit") && scope("employees")==="ALL";
  const canEdit=isOwn || canManageEmployee;
  const canAssign=can("employees","assign") && scope("employees")==="ALL";
  const role=[employee.position_name,employee.position,employee.role].filter(Boolean).join(" ").toLowerCase().replace(/[^a-z]/g,"");
  const performanceResource=role.includes("recruit")?"recruiting":role.includes("bench")&&role.includes("sales")?"bench_sales":null;
  const resource=resources.find(item=>item.resource===performanceResource);
  const performanceRoute=performanceResource&&can(performanceResource,"view")?`${resource?.route|| (performanceResource==="recruiting"?"/dashboard/recruiting":"/dashboard/bench-sales")}/performance`:null;
  const tabs=[["profile-overview","Overview",FaHome],["profile-details","Personal",FaUser],["profile-family","Family & References",FaUserTag],["profile-bank","Banking",FaIdBadge],["profile-employment","Employment",FaBriefcase],...(canViewAttendance?[["profile-attendance","Attendance",FaClock],["profile-leave","Leave",FaCalendarAlt]]:[]),["profile-education","Education",FaGraduationCap],["profile-documents","Documents",FaFileAlt],["profile-activity","Activity",FaCalendarAlt]];
  return (
    <article className='e2e_record_page e2e_record_blue reference-profile-page'>
      <span id='profile-overview' className='profile-section-anchor' aria-hidden='true' />
      {!location.pathname.startsWith('/dashboard/my-profile/') && <button className='e2e_record_back' onClick={() => navigate('/dashboard/employee-status')}><FaArrowLeft /> Back to Employees</button>}
      <header className="e2e_record_hero reference-profile-hero"><div className="reference-person"><EmployeeProfilePhoto employee={employee} canEdit={canEdit} onSaved={setToast}/><div className="reference-person-copy"><div className="reference-name-line"><h1>{employee.legal_name||[employee.firstname,employee.lastname].filter(Boolean).join(" ")}</h1><strong className="reference-status">{employee.user_status|| (employee.user_id?"Assigned":"Not Assigned")}</strong></div><div className="reference-role-identity"><h2>{employee.position_name||employee.position||employee.role||"Position not assigned"}</h2>{employee.employee_id&&<span className="reference-employee-id" aria-label={`Employee ID ${employee.employee_id}`}>{employee.employee_id}</span>}</div><div className="reference-contact-line"><span><FaEnvelope/>{normalizeCollection(employee.collection).email||employee.payroll_email||"Email not provided"}</span><span><FaPhoneAlt aria-hidden="true"/>{employee.contact_info||"Phone not provided"}</span><span><FaMapMarkerAlt/>{employee.payroll_profile?.location||employee.address||"Location not provided"}</span><span><FaCalendarAlt/>Joined {employee.date_of_joining||employee.joining_date||"Not recorded"}</span></div></div></div>
      {isOwn&&canViewAttendance?<EmployeeAttendanceSwitch compact employeeCode={employee.employee_id} onViewAttendance={()=>{setShowAttendance(true);setActiveSection("profile-attendance")}} onChanged={()=>setAttendanceRevision(n=>n+1)}/>:canViewAttendance?<section className="reference-today-card reference-admin-attendance"><header><span className="admin-attendance-icon"><FaCalendarAlt/></span><div><h2>Attendance Insights</h2><small>Employee attendance</small></div></header><p>Review working hours, punctuality and daily attendance records.</p><button type="button" onClick={()=>{setShowAttendance(true);setActiveSection("profile-attendance")}}><FaChartLine/> View Attendance <span aria-hidden="true">&rarr;</span></button></section>:null}</header>
      <nav ref={profileTabs} className="employee-profile-actions reference-profile-tabs" role="tablist" aria-label="Profile sections" onKeyDown={event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)||event.target.getAttribute("role")!=="tab")return;event.preventDefault();const buttons=Array.from(event.currentTarget.querySelectorAll('[role="tab"]'));const index=buttons.indexOf(event.target);const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:(index+(event.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length;buttons[next].focus();buttons[next].click()}}>
        {tabs.map(([id,label,Icon])=><span className="profile-tab-item" key={id}><button key={id} id={"tab-"+id} type="button" role="tab" aria-selected={activeSection===id} tabIndex={activeSection===id?0:-1} aria-controls="profile-tab-panel" className={activeSection===id?"active":""} onClick={()=>selectSection(id)}><Icon/>{label}</button></span>)}
        <button type="button" className="profile-performance-link" disabled={!performanceRoute} onClick={()=>navigate(performanceRoute)} title={performanceRoute?"Open role performance report":"Performance is unavailable for this role or your permissions"}><FaChartLine/>Performance</button>

      </nav>
      {error && <div className="e2e_empstatus_error" role="alert">{error}</div>}
      <div id="profile-tab-panel" className="profile-tab-panel" role="tabpanel" aria-labelledby={"tab-"+activeSection}>
      {activeSection==="profile-overview"&&<EmployeeProfileOverview employee={employee} attendance={monthly} attendanceError={monthlyError} canViewAttendance={canViewAttendance}/>}
      <EmployeeProfileInformation employee={employee} canEdit={canEdit} onSaved={message=>{setToast(message);loadEmployee()}} canManageDocuments={canManageEmployee} visibleSections={sectionGroups[activeSection]||[]} onNavigateSection={selectSection}/>
      {activeSection==="profile-activity"&&<EmployeeProfileOverview details section={activeSection} employee={employee} attendance={monthly} attendanceError={monthlyError} canViewAttendance={canViewAttendance}/>}
      {activeSection==="profile-leave"&&canViewAttendance&&<AttendanceActions employeeCode={employee.employee_id} isOwn={isOwn} canManage={can("attendance","edit")&&scope("attendance")==="ALL"} showClock={false} showHolidays={false} leaveTitle="Leave Management" onChanged={()=>setAttendanceRevision(n=>n+1)}/>}
      <span id='profile-attendance'  className='profile-section-anchor' aria-hidden='true' />
      {activeSection==="profile-attendance"&&canViewAttendance&&<section className="profile-attendance-insights reference-attendance-container">{!showAttendance?<header><div><h2>Attendance Insights</h2><p>Review working hours, punctuality and daily attendance.</p></div><button type="button" onClick={()=>setShowAttendance(true)}>View Attendance Report</button></header>:<div className="profile-attendance-report"><AttendancePanel reference showLeave={false} key={attendanceRevision} showClock={false} employeeId={employee.id} employeeCode={employee.employee_id} isOwn={isOwn} canManage={can("attendance","edit")&&scope("attendance")==="ALL"} onHide={()=>setShowAttendance(false)}/></div>}</section>}

      {activeSection==="profile-employment"&&<section id='profile-identity' className='e2e_record_card e2e_company_identity_card profile-section-target'>
        <div className="e2e_record_card_title"><FaUserTag /><div><h2>Company Identity</h2><p>The alias used across dashboards, applications, interviews, placements, and reports.</p></div></div>
        <dl className="e2e_record_grid">
          <div className="e2e_record_field"><dt><FaUser /> Legal Name</dt><dd>{employee.legal_name}</dd></div>
          <div className="e2e_record_field"><dt><FaUserTag /> Company Name</dt><dd>{employee.company_name || "Not Assigned"}</dd></div>
          <div className="e2e_record_field"><dt><FaIdBadge /> Username</dt><dd>{employee.username || "Not Assigned"}</dd></div>
          <div className="e2e_record_field"><dt><FaBriefcase /> Role</dt><dd>{employee.role || "Not Assigned"}</dd></div>
          <div className="e2e_record_field"><dt><FaIdBadge /> Status</dt><dd>{employee.user_status || "Not Assigned"}</dd></div>
        </dl>
        <div className="e2e_identity_actions">{canAssign && (employee.user_id ? <button className="remove" onClick={() => setRemoving(true)}><FaTrashAlt /> Remove Company Name</button> : <button className="assign" onClick={() => setAssigning(true)}><FaUserTag /> Assign Company Name</button>)}</div>
      </section>}
      </div>

      {assigning && <AssignCompanyNameModal employee={employee} onClose={() => setAssigning(false)} onAssigned={(message) => { setAssigning(false); setToast(message); loadEmployee(); }} />}
      {removing && <div className="e2e_alias_overlay"><section className="e2e_remove_dialog" role="alertdialog" aria-modal="true"><div><FaTrashAlt /></div><h2>Remove Company Name?</h2><p>Remove <strong>{employee.company_name}</strong> from <strong>{employee.legal_name}</strong>? The User account will not be deleted.</p><footer><button className="secondary" onClick={() => setRemoving(false)}>Cancel</button><button className="danger" onClick={handleRemove}>Remove Mapping</button></footer></section></div>}
      {toast && <div className="e2e_identity_toast" role="status">{toast}</div>}
    </article>
  );
}

export default EmployeeView;
