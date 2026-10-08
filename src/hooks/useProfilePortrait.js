import {useEffect,useState} from "react";
import {getMyEmployeeProfile,getEmployeePhoto} from "../api/employeeApi";
export default function useProfilePortrait(userId,enabled){
 const [portrait,setPortrait]=useState("");
 useEffect(()=>{let active=true,revision=0,url="",employeeId=null;setPortrait("");if(!userId||!enabled)return;const load=async event=>{if(event?.detail?.employeeId&&employeeId&&Number(event.detail.employeeId)!==Number(employeeId))return;const current=++revision;if(event?.detail?.removed){if(url)URL.revokeObjectURL(url);url="";setPortrait("");return;}try{const result=await getMyEmployeeProfile();const employee=result.data;if(!employee||!active||current!==revision)return;employeeId=employee.id;let next="";if(employee.photo){const blob=await getEmployeePhoto(employee.id);if(!active||current!==revision)return;next=URL.createObjectURL(blob)}else next=employee.profile_photo_url||"";if(url)URL.revokeObjectURL(url);url=next.startsWith("blob:")?next:"";setPortrait(next)}catch{if(active&&current===revision)setPortrait("")}};load();window.addEventListener("e2e-profile-photo-changed",load);return()=>{active=false;window.removeEventListener("e2e-profile-photo-changed",load);if(url)URL.revokeObjectURL(url)}},[userId,enabled]);
 return [portrait,setPortrait];
}
