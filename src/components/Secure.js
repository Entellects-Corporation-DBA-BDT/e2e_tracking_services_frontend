import Cookies from "js-cookie";
import { Navigate,Outlet,useLocation } from "react-router-dom";
import { usePermissions } from "../auth/PermissionContext";
import Loader from "./Loader";

const normalize=path=>path.replace(/\/+$/,"")||"/";
export default function Secure(){
 const token=Cookies.get("jwtToken"),location=useLocation(),permissions=usePermissions();
 if(!token)return <Navigate to="/" replace state={{from:location}}/>;
 if(permissions.loading)return <Loader/>;
 if(permissions.error==="unauthorized")return <Navigate to="/" replace/>;
 const path=normalize(location.pathname.toLowerCase());
 const matches=permissions.resources.filter(r=>r.permissions.view&&r.route).filter(r=>{
  const route=normalize(r.route.toLowerCase());
  return path===route||path.startsWith(`${route}/`);
 }).sort((a,b)=>b.route.length-a.route.length);
 if(path==="/dashboard"&&permissions.can("dashboard"))return <Outlet/>;
 return matches.length?<Outlet/>:<Navigate to="/forbidden" replace/>;
}
