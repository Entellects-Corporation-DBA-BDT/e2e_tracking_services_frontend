import {useEffect,useState} from 'react';
import {teamflowApi} from './api';
export default function useTeamflowPortrait(fileId,enabled){
 const [url,setUrl]=useState('');
 useEffect(()=>{let active=true,portrait='';setUrl('');if(enabled&&fileId)teamflowApi.file(fileId,true).then(blob=>{if(active){portrait=URL.createObjectURL(blob);setUrl(portrait);}}).catch(()=>{});return()=>{active=false;if(portrait)URL.revokeObjectURL(portrait);};},[fileId,enabled]);
 return url;
}
