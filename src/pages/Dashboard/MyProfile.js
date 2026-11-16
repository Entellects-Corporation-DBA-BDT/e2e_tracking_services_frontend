import {usePermissions} from '../../auth/PermissionContext';
import TeamflowProfile from '../../features/teamflow/TeamflowProfile';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyEmployeeProfile } from "../../api/employeeApi";

function MyProfile() {
  const navigate=useNavigate();
  const {user}=usePermissions();
  const [message,setMessage]=useState(''),[loading,setLoading]=useState(true),[version,setVersion]=useState(0);
  useEffect(()=>{if(user?.is_teamflow_candidate)return;let active=true;setLoading(true);getMyEmployeeProfile().then(r=>{if(active)navigate(`/dashboard/my-profile/${r.data.id}`,{replace:true});}).catch(e=>{if(active)setMessage(e?.response?.data?.message||'Your employee profile could not be loaded. Please try again.');}).finally(()=>active&&setLoading(false));return()=>{active=false;};},[navigate,user?.id,user?.is_teamflow_candidate,version]);
  if(user?.is_teamflow_candidate)return <TeamflowProfile/>;
  if(loading)return <div className="e2e_record_state" role="status"><span className="e2e_record_spinner"/><h2>My Profile</h2><p>Opening your employee profile…</p></div>;
  return <main className="e2e_record_state"><h1>My Profile</h1><h2>{user?.display_name||user?.username||user?.nick_name||'Your account'}</h2><dl><dt>Email</dt><dd>{user?.email||'Not recorded'}</dd><dt>Position</dt><dd>{user?.position||'Not recorded'}</dd><dt>Account status</dt><dd>{user?.status||'Active'}</dd></dl><p role="status">{message}</p><button type="button" onClick={()=>setVersion(n=>n+1)}>Reload profile</button></main>;
}
export default MyProfile;
