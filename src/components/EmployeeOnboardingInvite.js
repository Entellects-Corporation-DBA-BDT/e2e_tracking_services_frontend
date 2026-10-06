import {useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {FaEnvelope,FaCopy,FaTimes,FaCog} from "react-icons/fa";
import {getMailSender,getEmployeeOnboardingRoles,sendEmployeeOnboardingInvite} from "../api/employeeApi";
import "../styles/employeeCollection.css";
import "../styles/Dashboard/attendanceManagement.css";
import "../styles/attendanceConfigurations.css";
export default function EmployeeOnboardingInvite(){
 const navigate=useNavigate();
 const [sender,setSender]=useState(null),[senderError,setSenderError]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const [invite,setInvite]=useState(null),[onboardingRoles,setOnboardingRoles]=useState({}),[roleError,setRoleError]=useState("");
 const onMessage=(text,isError=false)=>{setMessage(isError?"":text);setError(isError?text:"")};
 useEffect(()=>{let active=true;getMailSender().then(r=>{if(active)setSender(r)}).catch(e=>{if(active)setSenderError(e?.response?.data?.message||"Mailbox status could not be loaded.")});getEmployeeOnboardingRoles().then(r=>{if(active)setOnboardingRoles(r.roles||{})}).catch(()=>{if(active)setRoleError("Roles could not be loaded. Please retry.")});return()=>{active=false}},[]);
 const refreshSender=()=>{setSenderError("");setSender(null);getMailSender().then(setSender).catch(e=>setSenderError(e?.response?.data?.message||"Mailbox status could not be loaded."))};
  const sendOnboarding = async event => {
    event.preventDefault();
    if (busy || !invite.selected_role || invite.public_url) return;
    setBusy(true);
    try {
      const result = await sendEmployeeOnboardingInvite({
        personal_email: invite.personal_email,
        selected_role: invite.selected_role,
        candidate_name: invite.candidate_name,
        app_url: window.location.origin
      });
      setInvite(current => ({
        ...current,
        public_url: result.public_url
      }));
      onMessage(result.message);
    } catch (e) {
      onMessage(e?.response?.data?.message || "Onboarding form could not be sent.", true);
    } finally {
      setBusy(false);
    }
  };
return <section className="employee-invitation-card"><div className="attendance-config-heading"><span className="attendance-config-icon"><FaEnvelope/></span><div><p className="attendance-config-eyebrow">CANDIDATE ONBOARDING</p><h2>Employee Public Form</h2><p>Send a role-specific pre-offer and collect candidate details and documents securely.</p></div></div>
 <div className="attendance-config-actions"><button type="button" className="primary" disabled={busy||!sender?.configured} onClick={()=>{setError("");setMessage("");setInvite({personal_email:"",selected_role:"",candidate_name:"",public_url:""})}}><FaEnvelope/> Employee Public Form</button><button type="button" onClick={()=>navigate("/dashboard/attendance/configurations")}><FaCog/> Mail Configurations</button><span className={`attendance-mail-status ${sender?.configured?"ready":""}`}>{sender?.configured?`Sender: ${sender.data.smtp_username}`:senderError?"Mailbox unavailable":sender===null?"Checking mailbox...":"Set up your sender mailbox to send invitations."}</span></div>
 {senderError&&<p role="alert">{senderError} <button type="button" onClick={refreshSender}>Retry</button></p>}{error&&!invite&&<p role="alert" className="collection-error">{error}</p>}{message&&<p role="status" className="attendance-config-success">{message}</p>}
 {invite && <div className="payslip-overlay"><section className="onboarding-invite-modal" role="dialog" aria-modal="true" aria-label="Send Pre-Offer Invitation"><header><div><h2>Send Pre-Offer Invitation</h2><p>Congratulate your selected candidate and collect their joining information.</p></div><button type="button" disabled={busy} onClick={() => setInvite(null)}><FaTimes /></button></header><form onSubmit={sendOnboarding}><label>Candidate Name <small>Optional</small><input value={invite.candidate_name || ""} disabled={Boolean(invite.public_url)} onChange={e => setInvite({
              ...invite,
              candidate_name: e.target.value
            })} maxLength={250} /></label><label>Selected Role *<select required value={invite.selected_role || ""} disabled={Boolean(invite.public_url) || !Object.keys(onboardingRoles).length} onChange={e => setInvite({
              ...invite,
              selected_role: e.target.value
            })}><option value="">Select role</option>{Object.entries(onboardingRoles).map(([key, role]) => <option key={key} value={key}>{role.name}</option>)}</select></label>{roleError ? <p className="collection-error" role="alert">{roleError}<button type="button" onClick={() => {
              setRoleError("");
              getEmployeeOnboardingRoles().then(r => setOnboardingRoles(r.roles || {})).catch(() => setRoleError("Roles could not be loaded. Please retry."));
            }}>Retry roles</button></p> : !Object.keys(onboardingRoles).length && <p role="status">Loading available roles…</p>}{onboardingRoles[invite.selected_role] && <div className="preoffer-role-summary"><h3>Congratulations! Selected as {onboardingRoles[invite.selected_role].name}</h3><p>The BeeData pre-offer email will include these responsibilities and the secure information form link.</p><ul>{onboardingRoles[invite.selected_role].responsibilities.map(item => <li key={item}>{item}</li>)}</ul></div>}<label>Candidate Personal Email<input required type="email" value={invite.personal_email} disabled={Boolean(invite.public_url)} onChange={e => setInvite({
              ...invite,
              personal_email: e.target.value
            })} placeholder="employee@email.com" /></label>{invite.public_url && <div className="public-url-result"><span><small>Public URL · Expires in 7 days</small><input readOnly value={invite.public_url} /></span><button type="button" onClick={async () => {
              try { await navigator.clipboard.writeText(invite.public_url); onMessage("Public onboarding URL copied."); } catch { onMessage("Copy unavailable. Select and copy the URL manually.", true); }
            }}><FaCopy /> Copy URL</button></div>}{error && <p className="collection-error" role="alert">{error}</p>}<p className="invite-security-note">The URL is private, expires automatically, and can be edited for four days after the first submission.</p><footer><button type="button" disabled={busy} onClick={() => setInvite(null)}>Close</button>{!invite.public_url && <button disabled={busy || !invite.selected_role || Boolean(invite.public_url)}><FaEnvelope /> {busy ? "Sending..." : "Send Pre-Offer & Form"}</button>}</footer></form></section></div>}</section>;
}
