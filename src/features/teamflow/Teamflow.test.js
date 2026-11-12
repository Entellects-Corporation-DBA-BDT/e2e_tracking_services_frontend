import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import TeamflowPage from './TeamflowPage';
import TeamflowProfile from './TeamflowProfile';
import TeamflowFiles from './TeamflowFiles';
import CandidatePortalManagement from './CandidatePortalManagement';
import {CandidateWorkSwitch,CandidateAttendancePanel} from './CandidateAttendance';
import {Navigate} from 'react-router-dom';
import {teamflowApi} from './api';
jest.mock('react-router-dom',()=>({Navigate:jest.fn(()=>null),useLocation:()=>({search:''}),useNavigate:()=>jest.fn(),useParams:()=>({})}),{virtual:true});
const mockRefresh=jest.fn();
const mockCan=jest.fn(()=>true);
jest.mock('../../auth/PermissionContext',()=>({usePermissions:()=>({user:{id:37,is_teamflow_candidate:true},refresh:mockRefresh,can:mockCan})}));
jest.mock('../../auth/ThemeContext',()=>({useTheme:()=>({darkMode:false})}));
jest.mock('./api',()=>({teamflowApi:{list:jest.fn(),options:jest.fn(),save:jest.fn(),detail:jest.fn(),clock:jest.fn(),updateWork:jest.fn(),insights:jest.fn(),profile:jest.fn(),saveProfile:jest.fn(),file:jest.fn(),replaceFile:jest.fn()},teamflowMessage:error=>error.message,saveTeamflowBlob:jest.fn()}));
const timesheet={id:101,user_id:37,user_name:'Synthetic Candidate',year:2026,week_no:46,project_id:4,project_name:'Synthetic project',task_name:'Synthetic task',status:'Draft',total_hours:8,mon_hours:8};
const response={data:[timesheet],total:12,page:1,total_pages:2,scope:'OWN',permissions:{view:true,create:true,edit:true,delete:true,export:true,upload:true}};
beforeEach(()=>{jest.clearAllMocks();mockCan.mockReturnValue(true);teamflowApi.list.mockResolvedValue(response);teamflowApi.insights.mockResolvedValue({data:{days:[],sessions:[],summary:{},can_clock:true,open_session:null}});teamflowApi.options.mockResolvedValue({data:{users:[{user_id:37,name:'Synthetic Candidate'}],projects:[{id:4,name:'Synthetic project'}]}});teamflowApi.save.mockResolvedValue({success:true,message:'Saved'});teamflowApi.clock.mockResolvedValue({success:true});mockRefresh.mockResolvedValue();});
const mount=element=>render(element);

test('existing Candidate Portal Management route opens TeamFlow candidates',()=>{
 mount(<CandidatePortalManagement/>);
 expect(mockCan).toHaveBeenCalledWith('teamflow_candidates','view');
 expect(Navigate.mock.calls[0][0]).toEqual({to:'/dashboard/teamflow/candidates',replace:true});
});

test('candidate portal explains missing access instead of rendering an empty page',()=>{
 mockCan.mockReturnValueOnce(false);
 mount(<CandidatePortalManagement/>);
 expect(screen.getByRole('alert')).toHaveTextContent('TeamFlow Candidates permission');
 expect(Navigate).not.toHaveBeenCalled();
});

test('timesheet edit keeps linked ownership and sends fractional hours',async()=>{
 mount(<TeamflowPage section="timesheets"/>);
 fireEvent.click(await screen.findByRole('button',{name:'Actions for Synthetic task'}));
 fireEvent.click(screen.getByRole('menuitem',{name:'Edit'}));
 const dialog=screen.getByRole('dialog');
 expect(within(dialog).queryByLabelText('Candidate')).toBeNull();
 fireEvent.change(within(dialog).getByLabelText('Mon hours'),{target:{value:'1.25'}});
 fireEvent.click(within(dialog).getByRole('button',{name:'Save record'}));
 await waitFor(()=>expect(teamflowApi.save).toHaveBeenCalledWith('timesheets',101,expect.objectContaining({user_id:37,mon_hours:'1.25'}),null));
});

test('pagination and filters are passed to the permission-scoped API',async()=>{
 mount(<TeamflowPage section="timesheets"/>);await screen.findByText('Synthetic task');
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 await waitFor(()=>expect(teamflowApi.list).toHaveBeenLastCalledWith('timesheets',expect.objectContaining({page:2}),expect.anything()));
 fireEvent.change(screen.getByRole('combobox',{name:'Status'}),{target:{value:'Pending'}});
 await waitFor(()=>expect(teamflowApi.list).toHaveBeenLastCalledWith('timesheets',expect.objectContaining({page:1,status:'Pending'}),expect.anything()));
});

test('candidate attendance uses the clock endpoint with work details',async()=>{
 mount(<CandidateWorkSwitch attendance={{data:{can_clock:true},projects:[{id:4,name:'Synthetic project'}],reload:jest.fn()}}/>);
 fireEvent.click(screen.getByRole('switch',{name:'Work attendance'}));
 expect(teamflowApi.clock).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Project *'),{target:{value:'4'}});
 fireEvent.change(screen.getByLabelText('Module / task *'),{target:{value:'Testing'}});
 fireEvent.change(screen.getByLabelText('Planned work *'),{target:{value:'Verify the integration'}});
 fireEvent.click(screen.getByRole('button',{name:'Save work plan & clock in'}));
 await waitFor(()=>expect(teamflowApi.clock).toHaveBeenCalledWith(expect.objectContaining({action:'in',project_id:'4',module_name:'Testing'})));
});

test('clock out collects completed work and task progress before ending attendance',async()=>{
 mount(<CandidateWorkSwitch attendance={{data:{can_clock:true,open_session:{module_name:'Review',duration_seconds:3600},received_at:Date.now()},projects:[],reload:jest.fn()}}/>);
 fireEvent.click(screen.getByRole('switch',{name:'Work attendance'}));
 fireEvent.change(screen.getByLabelText('Completed work *'),{target:{value:'Completed the review'}});
 fireEvent.change(screen.getByLabelText('Task progress (%)'),{target:{value:'80'}});
 fireEvent.click(screen.getByRole('button',{name:'Save work & clock out'}));
 await waitFor(()=>expect(teamflowApi.clock).toHaveBeenCalledWith(expect.objectContaining({action:'out',worked_on:'Completed the review',progress_percent:'80'})));
});

test('calendar date selects the work entries for that day',()=>{
 mount(<CandidateAttendancePanel attendance={{month:'2026-11',setMonth:jest.fn(),data:{days:[{date:'2026-11-12',hours:1,status:'Present',session_ids:[1]},{date:'2026-11-13',hours:0,status:'No entry',session_ids:[]}],sessions:[{id:1,login_time:'2026-11-12 09:00:00',logout_time:'2026-11-12 10:00:00',project_name:'Synthetic project',duration_seconds:3600}],summary:{total_hours:1}}}}/>);
 fireEvent.click(screen.getByRole('button',{name:'2026-11-13: No entry, 0 hours'}));
 expect(screen.getByText('No attendance entries for this selection.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'2026-11-12: Present, 1 hours'}));
 expect(screen.getByText('Synthetic project')).toBeInTheDocument();
});

test('attendance-generated timesheets keep hours read-only while allowing submission',async()=>{
 teamflowApi.list.mockResolvedValue({...response,data:[{...timesheet,source_type:'attendance'}]});
 mount(<TeamflowPage section="timesheets"/>);
 fireEvent.click(await screen.findByRole('button',{name:'Actions for Synthetic task'}));
 fireEvent.click(screen.getByRole('menuitem',{name:'Edit'}));
 const dialog=screen.getByRole('dialog');expect(within(dialog).getByLabelText('Mon hours')).toBeDisabled();
 fireEvent.change(within(dialog).getByLabelText('Status'),{target:{value:'Pending'}});
 fireEvent.click(within(dialog).getByRole('button',{name:'Save record'}));
 await waitFor(()=>expect(teamflowApi.save).toHaveBeenCalledWith('timesheets',101,expect.objectContaining({mon_hours:8,status:'Pending'}),null));
});

test('candidate can update current address in their separate profile',async()=>{
 teamflowApi.profile.mockResolvedValue({can_edit:true,can_manage:false,data:{id:9,user_id:37,candidate_code:'TF-C-0009',username:'synthetic@example.test',firstname:'Synthetic',lastname:'Candidate',current_address:'Old address',profile:{},collection:{schema_version:2,education:[],documents:[],employment:[],certifications:[],references:[],siblings:[],has_experience:false}}});
 teamflowApi.saveProfile.mockResolvedValue({success:true});
 mount(<TeamflowProfile/>);
 fireEvent.click(await screen.findByRole('button',{name:'Edit / Add details'}));
 fireEvent.change(screen.getByLabelText('Current address'),{target:{value:'Updated synthetic address'}});
 fireEvent.click(screen.getByRole('button',{name:'Save profile'}));
 await waitFor(()=>expect(teamflowApi.saveProfile).toHaveBeenCalledWith(undefined,expect.objectContaining({user_id:37,current_address:'Updated synthetic address'}),null,{}));
 expect(mockRefresh).toHaveBeenCalled();
});

test('missing legacy file is clearly labelled and accepts a later upload',async()=>{
 const onChange=jest.fn();teamflowApi.replaceFile.mockResolvedValue({success:true});
 mount(<TeamflowFiles files={[{id:8,original_name:'missing.pdf',missing:1}]} canReplace onChange={onChange}/>);
 expect(screen.getByText('Awaiting upload')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Upload missing.pdf'),{target:{files:[new File(['fixture'],'replacement.pdf',{type:'application/pdf'})]}});
 await waitFor(()=>expect(teamflowApi.replaceFile).toHaveBeenCalledWith(8,expect.any(File)));
 expect(onChange).toHaveBeenCalled();
});
