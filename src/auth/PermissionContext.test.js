import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {PermissionProvider,usePermissions} from './PermissionContext';
import {getAuthorizationProfile} from '../api/permissionApi';
import Cookies from 'js-cookie';
let mockToken='session-a';
jest.mock('js-cookie',()=>({get:jest.fn(()=>mockToken),remove:jest.fn(()=>{mockToken=null;})}));
jest.mock('../api/permissionApi',()=>({getAuthorizationProfile:jest.fn()}));
const result=id=>({user:{id,username:'Test account'},resources:[{resource:'profile',permissions:{view:false,edit:true},scope:'ALL'},{resource:'employees',permissions:{view:false},scope:'OWN'}]});
function Probe(){const p=usePermissions();return <div><span data-testid="session">{JSON.stringify({id:p.user?.id||null,loading:p.loading,error:p.error,profile:p.can('profile'),edit:p.can('profile','edit'),employees:p.can('employees'),scope:p.scope('profile')})}</span><button onClick={p.logout}>Logout</button><button onClick={()=>p.refresh()}>Retry</button></div>;}
const read=()=>JSON.parse(screen.getByTestId('session').textContent);
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();mockToken='session-a';getAuthorizationProfile.mockResolvedValue(result(7));});
test('verifies the saved token and exposes only own-profile baseline access',async()=>{render(<PermissionProvider><Probe/></PermissionProvider>);await waitFor(()=>expect(read().id).toBe(7));expect(read()).toMatchObject({profile:true,edit:false,employees:false,scope:'OWN'});expect(getAuthorizationProfile).toHaveBeenCalledWith('session-a');});
test('theme and unrelated storage events do not reset authorization or refetch it',async()=>{render(<PermissionProvider><Probe/></PermissionProvider>);await waitFor(()=>expect(read().id).toBe(7));act(()=>window.dispatchEvent(new StorageEvent('storage',{key:'e2e-theme',newValue:'dark'})));expect(read().id).toBe(7);expect(getAuthorizationProfile).toHaveBeenCalledTimes(1);});
test('invalid sessions are cleared rather than reused',async()=>{getAuthorizationProfile.mockRejectedValue({response:{status:403}});render(<PermissionProvider><Probe/></PermissionProvider>);await waitFor(()=>expect(Cookies.remove).toHaveBeenCalled());expect(read().id).toBeNull();expect(mockToken).toBeNull();});
test('a temporary verification failure keeps the token and can retry',async()=>{getAuthorizationProfile.mockRejectedValueOnce(Error('Offline'));render(<PermissionProvider><Probe/></PermissionProvider>);await waitFor(()=>expect(read().error).toBe('unavailable'));expect(mockToken).toBe('session-a');expect(Cookies.remove).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Retry'));await waitFor(()=>expect(read().id).toBe(7));});
test('a response arriving after logout cannot restore the old user',async()=>{let finish;getAuthorizationProfile.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));render(<PermissionProvider><Probe/></PermissionProvider>);fireEvent.click(screen.getByText('Logout'));await act(async()=>finish(result(7)));expect(read().id).toBeNull();expect(mockToken).toBeNull();});
test('cross-tab logout clears the verified user',async()=>{render(<PermissionProvider><Probe/></PermissionProvider>);await waitFor(()=>expect(read().id).toBe(7));mockToken=null;act(()=>window.dispatchEvent(new StorageEvent('storage',{key:'e2e-auth-session',newValue:'logout'})));await waitFor(()=>expect(read().id).toBeNull());});
