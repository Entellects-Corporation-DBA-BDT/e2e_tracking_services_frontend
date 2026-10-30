import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import Workshop from './Workshop';
import {workshopOptions,workshopList,workshopSave,workshopDelete,workshopExport,workshopPhoto} from '../../api/workshopApi';
import {downloadWorkshopWorkbook} from '../../utils/workshopTools';
jest.mock('../../api/workshopApi');
jest.mock('../../auth/ThemeContext',()=>({useTheme:()=>({darkMode:false})}));
jest.mock('../../utils/workshopTools',()=>({...jest.requireActual('../../utils/workshopTools'),downloadWorkshopWorkbook:jest.fn().mockResolvedValue(0)}));
const user={id:1,name:'Alex Fixture',position_id:4,position_name:'Web Developer',status:'Active'};
const row={id:11,meeting_date:'2026-10-30',day:'Friday',position_id:4,team_name:'Web Developer',topic:'Weekly learning',presenter_id:1,presenter_name:user.name,created_by_name:user.name,attendees:[user],photos:[],remarks:'Action notes',can_edit:true,can_delete:true};
beforeEach(()=>{jest.clearAllMocks();workshopOptions.mockResolvedValue({positions:[{id:4,position_name:'Web Developer',status:'Active'}],users:[user],permissions:{create:true,edit:true,delete:true,export:true,upload:true},limits:{max_photos:6,max_file_bytes:5242880,max_total_bytes:20971520}});workshopList.mockImplementation(async params=>({items:[row],total:6,page:params.page,limit:params.limit,total_pages:Math.ceil(6/params.limit),stats:{total:6,teams:1,presenters:1,photos:0}}));workshopSave.mockResolvedValue({id:12});workshopDelete.mockResolvedValue({});workshopExport.mockResolvedValue({items:[row]});workshopPhoto.mockResolvedValue(new Blob(['fixture'],{type:'image/png'}));URL.createObjectURL=jest.fn(()=> 'blob:fixture');URL.revokeObjectURL=jest.fn();});
test('starts with date and day, applies server filters and paginates at five rows',async()=>{
 render(<Workshop/>);await screen.findByText('Weekly learning');
 expect(screen.getAllByRole('columnheader').slice(0,2).map(n=>n.textContent)).toEqual(['Date','Day']);
 expect(screen.getByLabelText('Meetings per page')).toHaveValue('5');
 fireEvent.change(screen.getByPlaceholderText('Search workshop meetings...'),{target:{value:'learning'}});fireEvent.click(screen.getByRole('button',{name:'Apply filters'}));
 await waitFor(()=>expect(workshopList).toHaveBeenLastCalledWith(expect.objectContaining({search:'learning',page:1,limit:5}),expect.anything()));
 fireEvent.click(screen.getByRole('button',{name:'Next page'}));await waitFor(()=>expect(workshopList).toHaveBeenLastCalledWith(expect.objectContaining({page:2}),expect.anything()));
});
test('adds a meeting using selected user ids and multipart data',async()=>{
 render(<Workshop/>);await screen.findByText('Weekly learning');await waitFor(()=>expect(screen.getByRole('button',{name:'Add meeting'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Add meeting'}));const dialog=screen.getByRole('dialog');
 fireEvent.change(within(dialog).getByLabelText('Team / position'),{target:{value:'4'}});
 fireEvent.change(within(dialog).getByLabelText('Meeting topic'),{target:{value:'Knowledge sharing'}});
 fireEvent.change(within(dialog).getByLabelText(/Meeting presenter/),{target:{value:'1'}});
 fireEvent.click(within(dialog).getByRole('button',{name:'Add meeting'}));
 await waitFor(()=>expect(workshopSave).toHaveBeenCalled());const form=workshopSave.mock.calls[0][1];expect(form.get('topic')).toBe('Knowledge sharing');expect(form.get('position_id')).toBe('4');expect(JSON.parse(form.get('attendee_ids'))).toEqual(['1']);
});
test('requires confirmation before deleting and exports all applied filters rather than one page',async()=>{
 render(<Workshop/>);await screen.findByText('Weekly learning');fireEvent.click(screen.getByRole('button',{name:'Delete meeting Weekly learning'}));expect(workshopDelete).not.toHaveBeenCalled();fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Remove meeting'}));await waitFor(()=>expect(workshopDelete).toHaveBeenCalledWith(11));
 fireEvent.click(screen.getByRole('button',{name:'Download Excel'}));await waitFor(()=>expect(downloadWorkshopWorkbook).toHaveBeenCalled());expect(workshopExport.mock.calls[0][0]).not.toHaveProperty('page');
});
