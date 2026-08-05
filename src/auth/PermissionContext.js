import { createContext,useCallback,useContext,useEffect,useMemo,useState } from "react";
import Cookies from "js-cookie";
import { getAuthorizationProfile } from "../api/permissionApi";
import { PermissionService } from "./PermissionService";

const PermissionContext=createContext(null);
export function PermissionProvider({children}){
 const [token,setToken]=useState(()=>Cookies.get("jwtToken")||null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(Boolean(token)),[error,setError]=useState("");
 const refresh=useCallback(async()=>{if(!token){setProfile(null);setLoading(false);return}setLoading(true);try{setProfile(await getAuthorizationProfile());setError("")}catch(e){setError(e?.response?.status===403?"forbidden":"unauthorized");if(e?.response?.status===401)Cookies.remove("jwtToken")}finally{setLoading(false)}},[token]);
 useEffect(()=>{refresh()},[refresh]);
 useEffect(()=>{
  const sessionChanged=()=>{setProfile(null);setError("");setToken(Cookies.get("jwtToken")||null)};
  window.addEventListener("e2e-auth-changed",sessionChanged);
  window.addEventListener("storage",sessionChanged);
  return()=>{window.removeEventListener("e2e-auth-changed",sessionChanged);window.removeEventListener("storage",sessionChanged)};
 },[]);
 const value=useMemo(()=>{
  const resources=profile?.resources||[];
  const roleName=String(profile?.user?.role?.name||profile?.user?.role||profile?.user?.user_type||"").toLowerCase();
  const positionName=String(profile?.user?.position||profile?.user?.position_name||"").toLowerCase();
  const isAdmin=Boolean(profile?.user?.super_admin||profile?.user?.is_admin||[1,2].includes(Number(profile?.user?.position_id))||["admin","administrator","super admin","super_admin"].includes(roleName)||["admin","super admin"].includes(positionName));
  const getResource=name=>PermissionService.resource(profile,name);
  return {profile,user:profile?.user,resources,loading,error,refresh,getResource,isAdmin,logout:()=>{
   Cookies.remove("jwtToken");localStorage.removeItem("userData");setProfile(null);setToken(null);setError("");
   window.dispatchEvent(new CustomEvent("e2e-auth-changed"));
  },
   can:(resource,action="view")=>PermissionService.can(profile,resource,action),
   scope:resource=>PermissionService.scope(profile,resource)};
 },[profile,loading,error,refresh]);
 return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}
export const usePermissions=()=>useContext(PermissionContext);
export function ProtectedComponent({resource,action="view",children}){return usePermissions()?.can(resource,action)?children:null}
