import { useCallback,useEffect,useState } from "react";
import { FaEdit,FaSearch,FaTrash,FaUserPlus,FaUsers } from "react-icons/fa";
import { createUser,deleteUser,getUsers,updateUser } from "../../api/userApi";
import { getPositions } from "../../api/employeeApi";
import Pagination from "./Pagination";
import "../../styles/Dashboard/userManagement.css";
import { ProtectedComponent } from "../../auth/PermissionContext";

const blank={nick_name:"",email:"",password:"",position_id:"",status:"Active"};
function UserManagement(){
 const [users,setUsers]=useState([]),[search,setSearch]=useState(""),[query,setQuery]=useState(""),[page,setPage]=useState(1),[pages,setPages]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState(""),[editing,setEditing]=useState(null),[deleting,setDeleting]=useState(null),[positions,setPositions]=useState([]),[toast,setToast]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await getUsers({page,limit:20,search:query});setUsers(r.data||[]);setPages(r.total_pages||1)}catch(e){setError(e?.response?.data?.message||"Users could not be loaded.")}finally{setLoading(false)}},[page,query]);
 useEffect(()=>{const t=setTimeout(()=>setQuery(search.trim()),350);return()=>clearTimeout(t)},[search]);useEffect(()=>{load()},[load]);useEffect(()=>{getPositions().then(r=>setPositions(r.data||[])).catch(()=>{})},[]);
 const save=async(form)=>{try{const r=form.id?await updateUser(form.id,form):await createUser(form);setEditing(null);setToast(r.message);load()}catch(e){throw new Error(e?.response?.data?.message||"User could not be saved.")}};
 return <div className="user-management"><header><div><h2>User Management</h2><p>Manage Company Names, login access, roles, status, and permissions identity.</p></div><ProtectedComponent resource="users" action="create"><button onClick={()=>setEditing(blank)}><FaUserPlus/> Add User</button></ProtectedComponent></header>
 <div className="user-toolbar"><label><FaSearch/><input placeholder="Search Company Name, email or role..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label></div>
 {error&&<div className="e2e_empstatus_error">{error}</div>}<div className="user-table"><table><thead><tr><th>Company Name</th><th>Username</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead><tbody>{loading?<tr><td colSpan="6">Loading users...</td></tr>:users.map(u=><tr key={u.id}><td><strong>{u.nick_name}</strong></td><td>{u.email}</td><td>{u.position_name||"—"}</td><td><span className={`user-status ${u.status.toLowerCase()}`}>{u.status}</span></td><td>{u.last_login||"Never"}</td><td><div><button onClick={()=>setEditing({...u,password:""})}><FaEdit/> Edit</button><button className="danger" onClick={()=>setDeleting(u)}><FaTrash/> Remove</button></div></td></tr>)}</tbody></table></div><Pagination currentPage={page} totalPages={pages} onPageChange={setPage}/>
 {editing&&<UserModal value={editing} positions={positions} onClose={()=>setEditing(null)} onSave={save}/>}
 {deleting&&<div className="e2e_alias_overlay"><section className="e2e_remove_dialog"><div><FaTrash/></div><h2>Remove User?</h2><p>Remove <strong>{deleting.nick_name}</strong>? Any Employee mapping will be cleared, but the Employee and attendance history remain.</p><footer><button className="secondary" onClick={()=>setDeleting(null)}>Cancel</button><button className="danger" onClick={async()=>{try{const r=await deleteUser(deleting.id);setDeleting(null);setToast(r.message);load()}catch(e){setDeleting(null);setError(e?.response?.data?.message||"User could not be removed.")}}}>Remove User</button></footer></section></div>}
 {toast&&<div className="e2e_identity_toast">{toast}</div>}</div>
}
function UserModal({value,positions,onClose,onSave}) {
 const [form,setForm]=useState(value);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=async(e)=>{
  e.preventDefault();setSaving(true);setError("");
  try{await onSave(form)}catch(err){setError(err.message)}finally{setSaving(false)}
 };
 return <div className="e2e_alias_overlay"><section className="employee-form-modal">
  <header><div><FaUsers/><span><h2>{form.id?"Edit User":"Add User"}</h2><p>Create an application identity without creating an Employee.</p></span></div></header>
  <form onSubmit={submit}><div className="employee-form-grid">
   <label>Company Name / Alias<input required name="nick_name" value={form.nick_name} onChange={change}/></label>
   <label>Username / Email<input required type="email" name="email" value={form.email} onChange={change}/></label>
   <label>Password<input required={!form.id} minLength="6" type="password" name="password" value={form.password} onChange={change} placeholder={form.id?"Leave blank to keep current password":""}/></label>
   <label>Role<select required name="position_id" value={form.position_id} onChange={change}><option value="">Select role</option>{positions.map(p=><option key={p.id} value={p.id}>{p.position_name}</option>)}</select></label>
   <label>Status<select name="status" value={form.status} onChange={change}><option>Active</option><option>Inactive</option><option>Blocked</option></select></label>
  </div>{error&&<p className="e2e_alias_error">{error}</p>}<footer><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving?"Saving...":"Save User"}</button></footer></form>
 </section></div>
}
export default UserManagement;
