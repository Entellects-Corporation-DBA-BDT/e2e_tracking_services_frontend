import { FaArrowLeft,FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
export default function ForbiddenPage(){const navigate=useNavigate();return <main className="e2e_forbidden"><div><FaLock/></div><h1>403</h1><h2>Access Restricted</h2><p>Your role does not have permission to open this resource. Contact an administrator if you need access.</p><button onClick={()=>navigate("/dashboard")}><FaArrowLeft/> Return to Dashboard</button></main>}
