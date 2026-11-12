import {Navigate} from 'react-router-dom';
import {usePermissions} from '../../auth/PermissionContext';
import TeamflowPage from './TeamflowPage';
export default function CandidateAttendanceRoute(){
 const {user,can}=usePermissions();
 if(user?.is_teamflow_candidate&&can('profile','view'))return <Navigate to="/dashboard/my-profile?tab=attendance" replace/>;
 return <TeamflowPage section="attendance"/>;
}
