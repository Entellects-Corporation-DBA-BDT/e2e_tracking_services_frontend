import {Navigate} from 'react-router-dom';
import {usePermissions} from '../../auth/PermissionContext';

export default function CandidatePortalManagement(){
 const {can}=usePermissions();
 if(can('teamflow_candidates','view'))return <Navigate to="/dashboard/teamflow/candidates" replace/>;
 return <main className="teamflow-page"><h1>Candidate Portal Management</h1><p role="alert">Candidate management access is not enabled for your account. Ask your administrator to enable the TeamFlow Candidates permission.</p></main>;
}
