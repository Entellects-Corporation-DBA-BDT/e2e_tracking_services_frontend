import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import Cookies from 'js-cookie';
import {getAuthorizationProfile} from '../api/permissionApi';
import {PermissionService} from './PermissionService';
import {clearAuthSession,withSelfProfile} from './session';
const PermissionContext=createContext(null);
export function PermissionProvider({children}){
 const [token,setToken]=useState(()=>Cookies.get('jwtToken')||null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(Boolean(token)),[error,setError]=useState('');
 const currentToken=useRef(token),generation=useRef(0),inFlight=useRef(null);
 const syncSession=useCallback(()=>{const next=Cookies.get('jwtToken')||null;if(next===currentToken.current)return;generation.current++;currentToken.current=next;setToken(next);setProfile(null);setError('');setLoading(Boolean(next));},[]);
 const refresh=useCallback(async({silent=false}={})=>{
  if((Cookies.get('jwtToken')||null)!==token){syncSession();return;}
  if(!token){setProfile(null);setLoading(false);return;}
  const version=generation.current;if(!silent)setLoading(true);
  if(!inFlight.current||inFlight.current.token!==token){const request={token,promise:getAuthorizationProfile(token)};inFlight.current=request;request.promise.finally(()=>{if(inFlight.current===request)inFlight.current=null;}).catch(()=>{});}
  try{const result=await inFlight.current.promise;if(version!==generation.current||Cookies.get('jwtToken')!==token)return;if(!result?.user?.id||!Array.isArray(result.resources))throw Error('Invalid authorization response.');setProfile(withSelfProfile(result));setError('');
  }catch(e){if(version!==generation.current||Cookies.get('jwtToken')!==token)return;if([401,403].includes(e?.response?.status)){clearAuthSession(token);setError('unauthorized');}else setError('unavailable');
  }finally{if(version===generation.current)setLoading(false);}
 },[token,syncSession]);
 useEffect(()=>{refresh();},[refresh]);
 useEffect(()=>{const storage=event=>{if(event.key===null||event.key==='e2e-auth-session')syncSession();};window.addEventListener('e2e-auth-changed',syncSession);window.addEventListener('storage',storage);return()=>{window.removeEventListener('e2e-auth-changed',syncSession);window.removeEventListener('storage',storage);};},[syncSession]);
 useEffect(()=>{if(!token)return;const update=()=>refresh({silent:true}),visible=()=>{if(document.visibilityState==='visible')update();};const timer=setInterval(visible,30000);window.addEventListener('focus',update);window.addEventListener('e2e-permissions-changed',update);document.addEventListener('visibilitychange',visible);return()=>{clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('e2e-permissions-changed',update);document.removeEventListener('visibilitychange',visible);};},[token,refresh]);
 const value=useMemo(()=>{const roleName=String(profile?.user?.role?.name||profile?.user?.role||profile?.user?.user_type||'').toLowerCase(),positionName=String(profile?.user?.position||profile?.user?.position_name||'').toLowerCase();return {profile,user:profile?.user,resources:profile?.resources||[],loading,error,refresh,authenticated:Boolean(token&&profile?.user),getResource:name=>PermissionService.resource(profile,name),isAdmin:Boolean(profile?.user?.super_admin||profile?.user?.is_admin||[1,2].includes(Number(profile?.user?.position_id))||['admin','administrator','super admin','super_admin'].includes(roleName)||['admin','super admin'].includes(positionName)),logout:()=>clearAuthSession(currentToken.current),can:(resource,action='view')=>PermissionService.can(profile,resource,action),scope:resource=>PermissionService.scope(profile,resource)};},[token,profile,loading,error,refresh]);
 return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}
export const usePermissions=()=>useContext(PermissionContext);
export function ProtectedComponent({resource,action='view',children}){return usePermissions()?.can(resource,action)?children:null;}
