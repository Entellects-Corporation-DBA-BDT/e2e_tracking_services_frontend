import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import TeamflowIssueView from './TeamflowIssueView';
import {teamflowApi} from './api';
const mockNavigate=jest.fn();
jest.mock('react-router-dom',()=>({useParams:()=>({issueId:'7'}),useNavigate:()=>mockNavigate,useLocation:()=>({state:{projectId:4}})}),{virtual:true});
jest.mock('../../auth/ThemeContext',()=>({useTheme:()=>({darkMode:false})}));
jest.mock('../../components/Discussion/EmbeddedDiscussion',()=>({url})=><div>Discussion: {url}</div>);
jest.mock('./TeamflowFiles',()=>()=> <div>Issue attachments</div>);
jest.mock('./ProjectIdentity',()=>({name})=><span>{name}</span>);
jest.mock('./api',()=>({teamflowApi:{detail:jest.fn(),options:jest.fn(),save:jest.fn()},teamflowMessage:e=>e.message}));
const issue={id:7,project:'4',project_name:'Candidate portal',summary:'Fix validation',description:'Check the complete application.',status:'Open',files:[],permissions:{can_edit:0,can_upload:0,data_scope:'OWN'}};
beforeEach(()=>{jest.clearAllMocks();teamflowApi.detail.mockResolvedValue({data:issue});teamflowApi.options.mockResolvedValue({data:{projects:[{id:4,name:'Candidate portal'}],users:[]}});});
test('direct issue page displays details, discussion and project navigation without a dialog',async()=>{
 render(<TeamflowIssueView/>);expect(await screen.findByText(issue.description)).toBeInTheDocument();expect(screen.getByText('Discussion: /dashboard/teamflow/issues/7')).toBeInTheDocument();expect(screen.queryByRole('dialog')).toBeNull();expect(screen.queryByRole('button',{name:'Edit issue'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Back to project'}));expect(mockNavigate).toHaveBeenCalledWith('/dashboard/teamflow/projects/4');
});
test('authorized editing saves inline and returns to the issue page',async()=>{
 teamflowApi.detail.mockResolvedValue({data:{...issue,permissions:{can_edit:1,data_scope:'ALL'}}});teamflowApi.save.mockResolvedValue({success:true});render(<TeamflowIssueView/>);fireEvent.click(await screen.findByRole('button',{name:'Edit issue'}));fireEvent.change(screen.getByLabelText('Summary *'),{target:{value:'Updated summary'}});fireEvent.submit(screen.getByRole('button',{name:'Save issue'}).closest('form'));await waitFor(()=>expect(teamflowApi.save).toHaveBeenCalledWith('issues','7',expect.objectContaining({summary:'Updated summary'}),null));expect(await screen.findByRole('status')).toHaveTextContent('Issue updated.');expect(screen.queryByRole('dialog')).toBeNull();
});
test('failed direct links show an error and retry instead of an empty workspace',async()=>{
 teamflowApi.detail.mockRejectedValueOnce(Error('Issue access denied.'));render(<TeamflowIssueView/>);expect(await screen.findByRole('alert')).toHaveTextContent('Issue access denied.');fireEvent.click(screen.getByRole('button',{name:'Try again'}));expect(await screen.findByText(issue.description)).toBeInTheDocument();
});
