import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyEmployeeProfile } from "../../api/employeeApi";

function MyProfile() {
  const navigate=useNavigate();
  const [message,setMessage]=useState("Opening your employee profile...");
  useEffect(()=>{getMyEmployeeProfile().then(r=>navigate(`/dashboard/my-profile/${r.data.id}`,{replace:true})).catch(e=>setMessage(e?.response?.data?.message||"Your login is not linked to an Employee profile yet."));},[navigate]);
  return <div className="e2e_record_state"><span className="e2e_record_spinner"/><h2>My Profile</h2><p>{message}</p></div>;
}
export default MyProfile;
