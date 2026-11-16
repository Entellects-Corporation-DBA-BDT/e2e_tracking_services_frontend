import {useEffect,useState} from 'react';
import {FaLayerGroup} from 'react-icons/fa';
import {teamflowApi} from './api';

export default function ProjectIdentity({project={},name,compact=false}){
 const label=name||project.name||project.project_name||'Project';
 const file=project.logo_file_id||project.files?.find(f=>f.entity_type==='projects'&&!Number(f.missing)&&/^image\/(jpeg|png|webp)$/.test(f.mime_type||''))?.id;
 const [portrait,setPortrait]=useState('');
 useEffect(()=>{let active=true,url='';setPortrait('');if(file)teamflowApi.file(file,true).then(blob=>{if(active){url=URL.createObjectURL(blob);setPortrait(url);}}).catch(()=>{});return()=>{active=false;if(url)URL.revokeObjectURL(url);};},[file]);
 let hash=0;for(const char of String(project.project_id||project.project||project.id||label))hash=(hash*31+char.charCodeAt(0))|0;
 return <span className={'tf-project-identity'+(compact?' is-compact':'')}><span className="tf-project-mark" style={{'--project-hue':`${Math.abs(hash)%360}`}} aria-hidden="true">{portrait?<img src={portrait} alt="" onError={()=>setPortrait('')}/>:<FaLayerGroup/>}</span><span className="tf-project-label">{label}{!compact&&project.projectKey&&<small>{project.projectKey}</small>}</span></span>;
}
