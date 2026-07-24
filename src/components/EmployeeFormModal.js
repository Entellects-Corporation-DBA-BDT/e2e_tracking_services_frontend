import { useEffect, useState } from "react";
import { FaTimes, FaUserPlus } from "react-icons/fa";
import { createEmployee, getPositions, updateEmployee } from "../api/employeeApi";

const empty = { employee_id:"",firstname:"",lastname:"",address:"",birthdate:"",contact_info:"",gender:"",position_id:"",schedule_id:"0",photo:"" };
function EmployeeFormModal({ employee, onClose, onSaved }) {
  const [form,setForm]=useState(employee ? {...empty,...employee} : empty);
  const [positions,setPositions]=useState([]);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{getPositions().then(r=>setPositions(r.data||[])).catch(()=>{});},[]);
  const change=e=>setForm(current=>({...current,[e.target.name]:e.target.value}));
  const submit=async e=>{e.preventDefault();setSaving(true);setError("");try{const result=employee?await updateEmployee(employee.id,form):await createEmployee(form);onSaved(result.message);}catch(err){setError(err?.response?.data?.message||"Employee could not be saved.");}finally{setSaving(false);}};
  return <div className="e2e_alias_overlay" onMouseDown={()=>!saving&&onClose()}><section className="employee-form-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
    <header><div><FaUserPlus/><span><h2>{employee?"Edit Employee":"Add Employee"}</h2><p>Maintain the employee's legal HR identity.</p></span></div><button onClick={onClose}><FaTimes/></button></header>
    <form onSubmit={submit}><div className="employee-form-grid">
      <label>Employee ID<input required name="employee_id" value={form.employee_id} onChange={change}/></label>
      <label>First Name<input required name="firstname" value={form.firstname} onChange={change}/></label>
      <label>Last Name<input required name="lastname" value={form.lastname} onChange={change}/></label>
      <label>Birth Date<input required type="date" name="birthdate" value={form.birthdate==="0000-00-00"?"":form.birthdate} onChange={change}/></label>
      <label>Contact Information<input required name="contact_info" value={form.contact_info} onChange={change}/></label>
      <label>Gender<select required name="gender" value={form.gender} onChange={change}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
      <label>Position<select required name="position_id" value={form.position_id} onChange={change}><option value="">Select position</option>{positions.map(p=><option key={p.id} value={p.id}>{p.position_name}</option>)}</select></label>
      <label>Schedule ID<input type="number" min="0" name="schedule_id" value={form.schedule_id} onChange={change}/></label>
      <label className="wide">Address<textarea required name="address" value={form.address} onChange={change}/></label>
    </div>{error&&<p className="e2e_alias_error">{error}</p>}<footer><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving?"Saving...":employee?"Save Changes":"Add Employee"}</button></footer></form>
  </section></div>;
}
export default EmployeeFormModal;
