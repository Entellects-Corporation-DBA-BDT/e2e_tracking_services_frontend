import {Navigate} from 'react-router-dom';
import Cookies from 'js-cookie';
import {usePermissions} from './PermissionContext';
import {SELF_PROFILE_PATH} from './session';
import Homepage from '../pages/Homepage';
import Loader from '../components/Loader';
export function SessionRetry(){const {refresh,loading}=usePermissions();return <main className="e2e_record_state" role="alert"><h2>Unable to verify your session</h2><p>Check your connection and try again. Your saved session has been kept.</p><button type="button" disabled={loading} onClick={()=>refresh()}>Try again</button></main>;}
export default function SessionEntry(){const {loading,authenticated,error}=usePermissions();if(loading)return <Loader/>;if(authenticated)return <Navigate to={SELF_PROFILE_PATH} replace/>;if(error==='unavailable'&&Cookies.get('jwtToken'))return <SessionRetry/>;if(Cookies.get('jwtToken')&&!error)return <Loader/>;return <Homepage/>;}
