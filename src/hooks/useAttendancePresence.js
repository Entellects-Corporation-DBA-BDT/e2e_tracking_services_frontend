import {useEffect,useState} from "react";
import {getTodayAttendance} from "../api/employeeApi";

export function attendancePresence(snapshot,now=Date.now()){
 if(!snapshot?.data)return {state:"unknown",label:"Attendance status unavailable"};
 const {data,receivedAt}=snapshot;
 const serverTime=Date.parse(data.current_time);
 if(!Number.isFinite(serverTime))return {state:"unknown",label:"Attendance status unavailable"};
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(serverTime+Math.max(0,now-receivedAt)));
 const fields=Object.fromEntries(parts.map(p=>[p.type,p.value]));
 const date=`${fields.year}-${fields.month}-${fields.day}`,time=`${fields.hour}:${fields.minute}:${fields.second}`;
 const record=data.record;
 if(!record||data.work_date!==date||record.time_out!=="00:00:00")return {state:"offline",label:"Offline - not clocked in"};
 const end=data.schedule?.work_end||"18:30:00";
 return time>end?{state:"overdue",label:"Shift ended - attendance logout pending"}:{state:"online",label:"Online - clocked in"};
}
export default function useAttendancePresence(userId,enabled){
 const [snapshot,setSnapshot]=useState(null),[now,setNow]=useState(Date.now);
 useEffect(()=>{
  let active=true,inFlight=false;setSnapshot(null);
  if(!userId||!enabled)return;
  const refresh=async()=>{if(inFlight||document.visibilityState==="hidden")return;inFlight=true;try{const data=await getTodayAttendance(undefined,true);if(active){setSnapshot(data.success===false?null:{data,receivedAt:Date.now()});setNow(Date.now());}}catch(error){if(active)setSnapshot(null);}finally{inFlight=false;}};
  const tick=()=>{setNow(Date.now());refresh();};
  refresh();const timer=window.setInterval(tick,30000);
  window.addEventListener("e2e-attendance-changed",refresh);window.addEventListener("focus",tick);document.addEventListener("visibilitychange",tick);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener("e2e-attendance-changed",refresh);window.removeEventListener("focus",tick);document.removeEventListener("visibilitychange",tick);};
 },[userId,enabled]);
 return attendancePresence(snapshot,now);
}
