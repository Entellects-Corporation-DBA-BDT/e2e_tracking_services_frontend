import { useEffect,useState } from "react";
import { FaSave,FaShieldAlt } from "react-icons/fa";
import { getPositions } from "../../api/employeeApi";
import { getPositionPermissions,savePositionPermissions } from "../../api/permissionApi";
import "../../styles/Dashboard/permissionMatrix.css";

const actions=["view","create","edit","delete","export","import","upload","download","approve","reject","assign","manage","print","share"];
const scopes=["OWN","TEAM","DEPARTMENT","OFFICE","ALL"];
export default function PermissionMatrix(){
 const[positions,setPositions]=useState([]),[position,setPosition]=useState(""),[rows,setRows]=useState([]),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{getPositions().then(r=>{const data=r.data||[];setPositions(data);if(data.length)setPosition(String(data[0].id))})},[]);
 useEffect(()=>{if(!position)return;setLoading(true);getPositionPermissions(position).then(r=>setRows(r.data||[])).finally(()=>setLoading(false))},[position]);
 const toggle=(index,action)=>setRows(current=>current.map((row,i)=>i===index?{...row,[`can_${action}`]:Number(!Number(row[`can_${action}`]))}:row));
 const setScope=(index,value)=>setRows(current=>current.map((row,i)=>i===index?{...row,data_scope:value}:row));
 const save=async()=>{setSaving(true);setMessage("");try{const r=await savePositionPermissions(position,rows);setMessage(r.message)}catch(e){setMessage(e?.response?.data?.message||"Permissions could not be saved.")}finally{setSaving(false)}};
 return <div className="permission-matrix"><header><div><FaShieldAlt/><span><h2>Permission Matrix</h2><p>Backend-enforced action permissions and record scope by position.</p></span></div><button onClick={save} disabled={saving||!position}><FaSave/>{saving?"Saving...":"Save Matrix"}</button></header>
 <div className="permission-role"><label>Position<select value={position} onChange={e=>setPosition(e.target.value)}>{positions.map(p=><option key={p.id} value={p.id}>{p.position_name}</option>)}</select></label><p>Changes take effect on the next authorization refresh.</p></div>{message&&<div className="permission-message">{message}</div>}
 <div className="permission-scroll"><table><thead><tr><th>Resource</th>{actions.map(a=><th key={a}>{a}</th>)}<th>Data Scope</th></tr></thead><tbody>{loading?<tr><td colSpan={16}>Loading permission matrix...</td></tr>:rows.map((row,index)=><tr key={row.resource_id}><td><strong>{row.display_name}</strong><small>{row.resource_name}</small></td>{actions.map(action=><td key={action}><label className="permission-switch"><input type="checkbox" checked={Boolean(Number(row[`can_${action}`]))} onChange={()=>toggle(index,action)}/><span/></label></td>)}<td><select value={row.data_scope||"OWN"} onChange={e=>setScope(index,e.target.value)}>{scopes.map(scope=><option key={scope}>{scope}</option>)}</select></td></tr>)}</tbody></table></div>
 </div>
}
