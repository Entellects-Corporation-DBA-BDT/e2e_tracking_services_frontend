import {FaComments,FaHome,FaShieldAlt,FaUserTie,FaUsersCog} from "react-icons/fa";
export const RESOURCE_GROUPS=[
 {id:"overview",label:"Overview",icon:FaHome,keys:["dashboard"]},
 {id:"talent",label:"Talent Acquisition",icon:FaUserTie,keys:["recruiting","recruiters","jobs","candidates"]},
 {id:"sales",label:"Sales & Relationships",icon:FaUserTie,keys:["bench_sales","hot_list","hotlist","prime_vendors","clients"]},
 {id:"onboarding",label:"Onboarding & Compliance",icon:FaShieldAlt,keys:["candidate_onboarding","vendor_onboarding","training","documents","document_reminders","w2_forms"]},
 {id:"people",label:"People & Workplace",icon:FaUsersCog,keys:["employees","emp_status_report","attendance","profile"]},
 {id:"collaboration",label:"Communication",icon:FaComments,keys:["chat","chat_notifications"]},
 {id:"administration",label:"Administration",icon:FaShieldAlt,keys:["users","permissions","positions","settings","audit_logs","resources","candidate_access","candidate_portal_admin","candidate_portal_management","teamflow_admin","chat_admin"]}
];
export const visiblePageResources=resources=>resources.filter(item=>item.permissions?.view&&item.route&&item.resource_type==="PAGE"&&item.component_key);
export function groupResources(resources,includeMore=true){const visible=visiblePageResources(resources),used=new Set(),groups=RESOURCE_GROUPS.map(group=>{const items=visible.filter(item=>group.keys.includes(item.resource));items.forEach(item=>used.add(item.id));return{...group,items}});const more=visible.filter(item=>!used.has(item.id));if(includeMore&&more.length)groups.push({id:"more",label:"More Resources",icon:FaShieldAlt,keys:[],items:more});return groups.filter(group=>group.items.length)}