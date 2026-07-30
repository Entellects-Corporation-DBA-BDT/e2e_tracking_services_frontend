import { useCallback, useEffect, useState } from "react";
import { FaCalendarCheck, FaCheck, FaClock, FaPlus, FaTimes, FaTrash, FaUserCheck, FaUserTimes } from "react-icons/fa";
import {
  addEmployeeLeave, deleteHoliday, getEmployees, getHolidays, getLeaves,
  getAttendanceIpPermissions, getMonthlyAttendance, getTodayAttendance, reviewLeave, saveHoliday, updateEmployeeWfhPermission,
} from "../../api/employeeApi";
import { usePermissions } from "../../auth/PermissionContext";
import MyProfile from "./MyProfile";
import ConfirmDialog from "../../components/ConfirmDialog";
import "../../styles/Dashboard/attendanceManagement.css";

const blankLeave = { employee_id:"", leave_type:"paid", start_date:"", end_date:"", duration:"full_day", reason:"" };
const blankHoliday = { holiday_date:"", name:"", description:"", is_optional:false };

function AttendanceManagement() {
  const { can, user } = usePermissions();
  const admin = can("attendance","edit");
  const superAdmin = Boolean(user?.super_admin);
  const [tab,setTab]=useState("today");
  const localDate=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  const [selectedDate,setSelectedDate]=useState(localDate),[selectedMonth,setSelectedMonth]=useState(localDate.slice(0,7));
  const [leaves,setLeaves]=useState([]),[employees,setEmployees]=useState([]),[holidays,setHolidays]=useState([]);
  const [today,setToday]=useState({data:[],total_employees:0,present:0,absent:0,late:0,working:0});
  const [monthly,setMonthly]=useState({data:[]}),[ipPermissions,setIpPermissions]=useState([]),[savingRestriction,setSavingRestriction]=useState(null),[restrictionSearch,setRestrictionSearch]=useState("");
  const [leave,setLeave]=useState(blankLeave),[holiday,setHoliday]=useState(blankHoliday);
  const [status,setStatus]=useState(""),[message,setMessage]=useState({text:"",error:false}),[loading,setLoading]=useState(true);
  const [confirmation,setConfirmation]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const requests=[getLeaves(status?{status}:{}),getEmployees({limit:100,page:1,employment:"current"}),getHolidays(new Date().getFullYear()),getTodayAttendance(selectedDate),getMonthlyAttendance(selectedMonth)];
      if(superAdmin)requests.push(getAttendanceIpPermissions());
      const [leaveResult,employeeResult,holidayResult,todayResult,monthResult,settingsResult]=await Promise.all(requests);
      setLeaves(leaveResult.data||[]);setEmployees(employeeResult.data||[]);setHolidays(holidayResult.data||[]);
      setToday(todayResult||{data:[]});setMonthly(monthResult||{data:[]});
      if(settingsResult)setIpPermissions(settingsResult.data||[]);
    }catch(error){setMessage({text:error?.response?.data?.message||"Attendance management could not be loaded.",error:true});}
    finally{setLoading(false);}
  },[status,selectedDate,selectedMonth,superAdmin]);
  useEffect(()=>{if(admin)load();},[admin,load]);
  if(!admin)return <MyProfile/>;

  const decide=async(id,next)=>{
    try{const result=await reviewLeave(id,{status:next});setMessage({text:result.message,error:false});load();}
    catch(error){setMessage({text:error?.response?.data?.message||"Leave could not be updated.",error:true});}
  };
  const addLeave=async(event)=>{
    event.preventDefault();
    try{const result=await addEmployeeLeave(leave);setMessage({text:result.message,error:false});setLeave(blankLeave);load();}
    catch(error){setMessage({text:error?.response?.data?.message||"Leave could not be added.",error:true});}
  };
  const addHoliday=async(event)=>{
    event.preventDefault();
    try{const result=await saveHoliday(holiday);setMessage({text:result.message,error:false});setHoliday(blankHoliday);load();}
    catch(error){setMessage({text:error?.response?.data?.message||"Holiday could not be saved.",error:true});}
  };

  return <main className="attendance-management">
    <header className="attendance-management-hero"><span><FaCalendarCheck/></span><div><p>HR & ADMIN</p><h1>Attendance Management</h1><small>Approve leave, add employee leave, and maintain the company holiday calendar. All attendance times use US Eastern Time (ET).</small></div></header>
    <nav>{[["today","Daily Attendance"],["monthly","Monthly Summary"],...(superAdmin?[["restriction","IP Restriction"]]:[]),["approvals","Leave Approvals"],["add-leave","Add Employee Leave"],["holidays","Holidays"]].map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    {message.text&&<p className={`attendance-admin-message ${message.error?"error":""}`}>{message.text}</p>}
    {loading?<div className="attendance-loading"><span/> Loading attendance management...</div>:<>
      {tab==="today"&&<section className="attendance-admin-section">
        <div className="attendance-section-title"><div><h2>Daily Attendance</h2><p>Select any date to review every active employee.</p></div><label className="attendance-date-filter">Date<input type="date" max={localDate} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label></div>
        <div className="attendance-today-cards">
          <article><FaUserCheck/><span><small>Current Employees</small><strong>{today.total_employees||0}</strong></span></article>
          <article className="present"><FaCalendarCheck/><span><small>Present Today</small><strong>{today.present||0}</strong></span></article>
          <article className="absent"><FaUserTimes/><span><small>Absent Today</small><strong>{today.absent||0}</strong></span></article>
          <article className="late"><FaClock/><span><small>Late Today</small><strong>{today.late||0}</strong></span></article>
        </div>
        <div className="attendance-admin-table"><table><thead><tr><th>Employee</th><th>Company Login</th><th>Role</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>{today.data?.length?today.data.map(row=><tr key={row.id}><td><strong>{row.legal_name}</strong><small>{row.employee_id}</small></td><td><strong>{row.company_name}</strong><small>{row.username}</small></td><td>{row.role||"-"}</td><td>{row.present?`${row.time_in} ET`:"-"}</td><td>{row.present?(row.time_out==="00:00:00"?"Working":`${row.time_out} ET`):"-"}</td><td>{row.present?`${row.hours||0} h`:"-"}</td><td><mark className={row.present?"approved":"rejected"}>{row.present?(Number(row.status)===1?"Present - On time":"Present - Late"):"Absent"}</mark></td></tr>):<tr><td colSpan="7">No current employees are assigned to company users.</td></tr>}</tbody></table></div>
      </section>}
      {tab==="monthly"&&<section className="attendance-admin-section">
        <div className="attendance-section-title"><div><h2>Monthly Attendance Summary</h2><p>Totals for every active employee through {monthly.end_date||"the selected month"}.</p></div><label className="attendance-date-filter">Month<input type="month" max={localDate.slice(0,7)} value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}/></label></div>
        <div className="attendance-admin-table"><table><thead><tr><th>Employee</th><th>Company Login</th><th>Role</th><th>Present Days</th><th>Half Days</th><th>Late Days</th><th>Total Hours</th></tr></thead><tbody>{monthly.data?.length?monthly.data.map(row=><tr key={row.id}><td><strong>{row.legal_name}</strong><small>{row.employee_id}</small></td><td><strong>{row.company_name}</strong><small>{row.username}</small></td><td>{row.role||"-"}</td><td>{row.present_days}</td><td>{row.half_days}</td><td>{row.late_days}</td><td><strong>{row.total_hours||0} h</strong></td></tr>):<tr><td colSpan="7">No employees found for this month.</td></tr>}</tbody></table></div>
      </section>}
      {tab==="restriction"&&superAdmin&&<section className="attendance-admin-section attendance-restriction-card">
        <div className="attendance-section-title"><div><h2>Employee WFH Access</h2><p>Company IP restriction remains active. Grant an exception only to employees currently working from home.</p></div><input className="restriction-search" placeholder="Search employee..." value={restrictionSearch} onChange={e=>setRestrictionSearch(e.target.value)}/></div>
        <div className="attendance-admin-table"><table><thead><tr><th>Employee</th><th>Company Login</th><th>Role</th><th>Attendance Access</th><th>Action</th></tr></thead><tbody>{ipPermissions.filter(row=>`${row.legal_name} ${row.employee_code} ${row.company_name} ${row.username}`.toLowerCase().includes(restrictionSearch.toLowerCase())).map(row=><tr key={row.employee_id}><td><strong>{row.legal_name}</strong><small>{row.employee_code}</small></td><td><strong>{row.company_name}</strong><small>{row.username}</small></td><td>{row.role||"-"}</td><td><mark className={row.wfh_allowed?"approved":"rejected"}>{row.wfh_allowed?"WFH allowed":"Company network only"}</mark></td><td><button className={`wfh-toggle ${row.wfh_allowed?"remove":"grant"}`} disabled={savingRestriction===row.employee_id} onClick={async()=>{setSavingRestriction(row.employee_id);try{const result=await updateEmployeeWfhPermission(row.employee_id,!row.wfh_allowed);setIpPermissions(current=>current.map(item=>item.employee_id===row.employee_id?{...item,wfh_allowed:result.wfh_allowed}:item));setMessage({text:`${row.legal_name}: ${result.message}`,error:false});}catch(error){setMessage({text:error?.response?.data?.message||"WFH permission could not be updated.",error:true});}finally{setSavingRestriction(null);}}}>{savingRestriction===row.employee_id?"Saving...":row.wfh_allowed?"Remove WFH Access":"Grant WFH Access"}</button></td></tr>)}</tbody></table></div>
        <small>Only Super Admin can grant or remove these employee-specific exceptions.</small>
      </section>}      {tab==="approvals"&&<section className="attendance-admin-section">
        <div className="attendance-section-title"><div><h2>Leave Requests</h2><p>Review pending requests and view completed decisions.</p></div>
          <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        <div className="attendance-admin-table"><table><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Duration</th><th>Reason</th><th>Status</th><th>Approved / Rejected By</th><th>Action</th></tr></thead>
          <tbody>{leaves.length?leaves.map(row=><tr key={row.id}><td><strong>{row.employee_name}</strong><small>{row.employee_id}</small></td><td>{row.leave_type}</td><td>{row.start_date}<br/>{row.end_date}</td><td>{row.duration.replaceAll("_"," ")}</td><td>{row.reason}</td><td><mark className={row.status}>{row.status}</mark></td><td>{row.status==="pending"?"--":<span className="leave-reviewer"><strong>{row.reviewer_display_name||"HR"}</strong><small>{row.review_source||"Website"}{row.reviewed_at?` - ${row.reviewed_at}`:""}</small></span>}</td><td>{row.status==="pending"?<span className="attendance-decision"><button title="Approve" onClick={()=>setConfirmation({type:"leave",row,next:"approved"})}><FaCheck/></button><button title="Reject" onClick={()=>setConfirmation({type:"leave",row,next:"rejected"})}><FaTimes/></button></span>:"--"}</td></tr>):<tr><td colSpan="8">No leave requests found.</td></tr>}</tbody></table></div>
      </section>}
      {tab==="add-leave"&&<section className="attendance-admin-section"><div className="attendance-section-title"><div><h2>Add Approved Leave</h2><p>Record leave directly for an employee. It is approved immediately.</p></div></div>
        <form className="attendance-admin-form" onSubmit={addLeave}>
          <label>Employee<select required value={leave.employee_id} onChange={e=>setLeave({...leave,employee_id:e.target.value})}><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.employee_id} - {e.legal_name}</option>)}</select></label>
          <label>Leave type<select value={leave.leave_type} onChange={e=>setLeave({...leave,leave_type:e.target.value})}>{["paid","sick","casual","unpaid","bereavement","other"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Start date<input required type="date" value={leave.start_date} onChange={e=>setLeave({...leave,start_date:e.target.value,end_date:leave.end_date||e.target.value})}/></label>
          <label>End date<input required type="date" min={leave.start_date} value={leave.end_date} onChange={e=>setLeave({...leave,end_date:e.target.value})}/></label>
          <label>Duration<select value={leave.duration} onChange={e=>setLeave({...leave,duration:e.target.value})}><option value="full_day">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></select></label>
          <label className="wide">Reason<textarea required value={leave.reason} onChange={e=>setLeave({...leave,reason:e.target.value})}/></label>
          <button><FaPlus/> Add Approved Leave</button>
        </form></section>}
      {tab==="holidays"&&<section className="attendance-admin-section"><div className="attendance-section-title"><div><h2>Company Holidays</h2><p>Employees cannot clock attendance on these Eastern Time dates.</p></div></div>
        <form className="attendance-holiday-form" onSubmit={addHoliday}><input required type="date" value={holiday.holiday_date} onChange={e=>setHoliday({...holiday,holiday_date:e.target.value})}/><input required placeholder="Holiday name" value={holiday.name} onChange={e=>setHoliday({...holiday,name:e.target.value})}/><input placeholder="Description (optional)" value={holiday.description} onChange={e=>setHoliday({...holiday,description:e.target.value})}/><label><input type="checkbox" checked={holiday.is_optional} onChange={e=>setHoliday({...holiday,is_optional:e.target.checked})}/> Optional</label><button>Save Holiday</button></form>
        <div className="attendance-holiday-list">{holidays.length?holidays.map(item=><article key={item.id}><time>{item.holiday_date}</time><div><strong>{item.name}</strong><small>{item.description||"Company holiday"}{Number(item.is_optional)===1?" - Optional":""}</small></div><button onClick={()=>setConfirmation({type:"holiday",row:item})}><FaTrash/></button></article>):<p>No holidays added for this year.</p>}</div>
      </section>}
    </>}
    <ConfirmDialog open={Boolean(confirmation)}
      title={confirmation?.type==="holiday"?"Delete Holiday?":`${confirmation?.next==="approved"?"Approve":"Reject"} Leave Request?`}
      message={confirmation?.type==="holiday"
        ? `Delete ${confirmation?.row?.name} on ${confirmation?.row?.holiday_date}? Employees will no longer see it as a holiday.`
        : `${confirmation?.next==="approved"?"Approve":"Reject"} ${confirmation?.row?.employee_name}'s leave from ${confirmation?.row?.start_date} to ${confirmation?.row?.end_date}?`}
      confirmLabel={confirmation?.type==="holiday"?"Delete Holiday":confirmation?.next==="approved"?"Approve Leave":"Reject Leave"}
      danger={confirmation?.type==="holiday"||confirmation?.next==="rejected"} onCancel={()=>setConfirmation(null)}
      onConfirm={async()=>{const action=confirmation;setConfirmation(null);if(action.type==="holiday"){await deleteHoliday(action.row.id);load();}else decide(action.row.id,action.next);}} />
  </main>;
}
export default AttendanceManagement;
