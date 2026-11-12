import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import WeeklyTimesheets,{safeTimesheetCsv,weekMonday} from './WeeklyTimesheets';
import {teamflowApi} from './api';
import {exportTeamflowExcel} from './config';
jest.mock('./config',()=>({...jest.requireActual('./config'),exportTeamflowExcel:jest.fn().mockResolvedValue(undefined)}));
jest.mock('react-router-dom',()=>({useLocation:()=>({search:'?year=2026&week_no=46'})}),{virtual:true});
jest.mock('../../auth/ThemeContext',()=>({useTheme:()=>({darkMode:false})}));
jest.mock('./api',()=>({teamflowApi:{weekly:jest.fn(),options:jest.fn(),saveWeek:jest.fn(),copyWeek:jest.fn(),importWeek:jest.fn(),reviewWeek:jest.fn(),tasks:jest.fn(),archive:jest.fn()},teamflowMessage:e=>e.message,saveTeamflowBlob:jest.fn()}));
const entry={id:14,user_id:37,candidate_id:9,user_name:'Synthetic Candidate',year:2026,week_no:46,entry_type:'project',project_id:4,project_name:'Synthetic Project',task_name:'Daily work (automatic)',worked_on:'Implemented weekly work review',source_type:'attendance',mon_hours:2,tue_hours:0,wed_hours:0,thu_hours:0,fri_hours:0,sat_hours:0,sun_hours:0,total_hours:2,status:'Draft',revision:3};
const week={year:2026,week_no:46,days:['mon','tue','wed','thu','fri','sat','sun'].map((key,i)=>({key,date:'2026-11-'+String(i+9).padStart(2,'0'),max_hours:24}))};
const work={id:81,login_time:'2026-11-09 09:00:00',logout_time:'2026-11-09 11:00:00',project_name:'Synthetic Project',module_name:'Backend work',working_on:'Implement the weekly editor',worked_on:'Added work logs and review actions',progress_percent:85,daily_hours:{mon:2},linked_entries:1};
const own={week,entries:[entry],daily_work:[work],summary:{today_hours:0,week_hours:2,pending:0,approved:0,status:'Draft'},scope:'OWN',candidate_id:9,permissions:{view:true,create:true,edit:true,delete:true,export:true}};
beforeEach(()=>{jest.clearAllMocks();teamflowApi.weekly.mockResolvedValue({data:own});teamflowApi.options.mockResolvedValue({data:{users:[{id:9,user_id:37,name:'Synthetic Candidate'}],projects:[{id:4,name:'Synthetic Project'}]}});teamflowApi.saveWeek.mockResolvedValue({message:'Saved'});teamflowApi.copyWeek.mockResolvedValue({message:'Copied with zero hours'});teamflowApi.reviewWeek.mockResolvedValue({message:'Approved'});teamflowApi.tasks.mockResolvedValue({data:[{id:7,summary:'Task selection'}]});});

test('weekly editor shows daily progress and accepts audited recorded-hour adjustments',async()=>{
 render(<WeeklyTimesheets/>);await screen.findByText('Added work logs and review actions');
 const input=screen.getByRole('spinbutton',{name:'MON hours for Daily work (automatic)'});expect(input).toBeEnabled();fireEvent.change(input,{target:{value:'1.5'}});
 fireEvent.click(screen.getByRole('button',{name:'Save hours'}));expect(teamflowApi.saveWeek).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Reason for adjusting recorded hours *'),{target:{value:'Non-billable break'}});
 fireEvent.click(screen.getByRole('button',{name:'Save hours'}));
 await waitFor(()=>expect(teamflowApi.saveWeek).toHaveBeenCalledWith(expect.objectContaining({year:2026,week_no:46,candidate_id:9,submit:false,entries:[expect.objectContaining({id:14,revision:3,mon_hours:'1.5',adjustment_reason:'Non-billable break'})]})));
});
test('daily work fills the empty-entry space instead of an empty placeholder',async()=>{
 teamflowApi.weekly.mockResolvedValue({data:{...own,entries:[]}});render(<WeeklyTimesheets/>);
 await screen.findByText('Added work logs and review actions');expect(screen.queryByText('No time entries yet')).toBeNull();
});
test('Excel download preserves unsaved hour edits without reloading the week',async()=>{
 render(<WeeklyTimesheets/>);await screen.findByText('Added work logs and review actions');
 fireEvent.change(screen.getByRole('spinbutton',{name:'MON hours for Daily work (automatic)'}),{target:{value:'1.25'}});
 const loads=teamflowApi.weekly.mock.calls.length;
 fireEvent.click(screen.getByRole('button',{name:'Excel'}));
 await screen.findByText('Excel report downloaded.');
 expect(exportTeamflowExcel).toHaveBeenCalledWith(expect.anything(),[expect.objectContaining({mon_hours:'1.25'})]);
 expect(teamflowApi.weekly).toHaveBeenCalledTimes(loads);
 expect(screen.getByRole('spinbutton',{name:'MON hours for Daily work (automatic)'})).toHaveValue(1.25);
});
test('candidate submits the selected week for approval',async()=>{
 render(<WeeklyTimesheets/>);fireEvent.click(await screen.findByRole('button',{name:'Submit timesheet'}));
 await waitFor(()=>expect(teamflowApi.saveWeek).toHaveBeenCalledWith({year:2026,week_no:46,candidate_id:9,submit:true,entries:[]}));
});
test('entry form selects a project task and submits its description',async()=>{
 render(<WeeklyTimesheets/>);fireEvent.click(await screen.findByRole('button',{name:'Add work entry'}));const dialog=screen.getByRole('dialog');
 fireEvent.change(within(dialog).getByLabelText('Project *'),{target:{value:'4'}});await within(dialog).findByRole('option',{name:'Task selection'});
 fireEvent.change(within(dialog).getByLabelText('Task'),{target:{value:'7'}});fireEvent.change(within(dialog).getByLabelText('Description'),{target:{value:'Completed assigned project work'}});
 fireEvent.click(within(dialog).getByRole('button',{name:'Add entry'}));await waitFor(()=>expect(teamflowApi.saveWeek).toHaveBeenCalledWith(expect.objectContaining({entries:[expect.objectContaining({entry_type:'project',project_id:'4',task_issue_id:'7',task_name:'Task selection',worked_on:'Completed assigned project work'})]})));
});
test('administrator reviews the selected candidate and week',async()=>{
 teamflowApi.weekly.mockResolvedValue({data:{...own,scope:'ALL',candidate_id:null,entries:[{...entry,status:'Pending'}],permissions:{...own.permissions,approve:true,reject:true}}});render(<WeeklyTimesheets/>);
 fireEvent.click(await screen.findByRole('button',{name:'Approve Synthetic Candidate timesheet'}));const dialog=screen.getByRole('dialog');fireEvent.click(within(dialog).getByRole('button',{name:'Approve timesheet'}));
 await waitFor(()=>expect(teamflowApi.reviewWeek).toHaveBeenCalledWith(expect.objectContaining({year:2026,week_no:46,candidate_id:9,entry_ids:[14],status:'Approved'})));
});
test('week navigation filters the API and copy uses the active week',async()=>{
 render(<WeeklyTimesheets/>);fireEvent.click(await screen.findByRole('button',{name:'Copy previous'}));await waitFor(()=>expect(teamflowApi.copyWeek).toHaveBeenCalledWith({year:2026,week_no:46,candidate_id:9}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Next week'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Next week'}));
 await waitFor(()=>expect(teamflowApi.weekly).toHaveBeenLastCalledWith(expect.objectContaining({year:2026,week_no:47}),expect.anything()));
});
test('CSV export escapes formulas and ISO weeks cross the year correctly',()=>{
 expect(safeTimesheetCsv([{...entry,task_name:'=HYPERLINK("x")'}])).toContain("'=HYPERLINK");expect(weekMonday(2027,1).toISOString().slice(0,10)).toBe('2027-01-04');
});
