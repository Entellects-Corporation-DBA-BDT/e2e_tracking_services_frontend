import { render, screen, fireEvent, waitFor, configure } from '@testing-library/react';
import ResumeMatch from './ResumeMatch';
import { getResumeMatchStatus, getResumeMatchHistory, saveResumeMatchHistory } from '../../api/resumeMatchApi';
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>}),{virtual:true});
jest.mock('../../auth/PermissionContext',()=>({usePermissions:()=>({getResource:()=>({route:'/dashboard/recruiting'})})}));
jest.mock('../../api/resumeMatchApi');
jest.mock('../../features/resumeMatch/matchingClient',()=>({rankCandidatesAsync:async(candidates,jd)=>require('../../features/resumeMatch/multiResumeAnalyzer').rankCandidates(candidates,jd)}));
jest.mock('../../features/resumeMatch/fileParser',()=>({parseFile:jest.fn(async()=> 'Alex Example\nReact Python AWS engineer with several years of experience'),candidateFromText:()=>({id:'upload1',name:'Alex Example',title:'Engineer',state:'CA',skills:[],experience:4,resumeText:'React Python AWS'})}));
jest.setTimeout(30000);
configure({asyncUtilTimeout:10000});
beforeEach(()=>{getResumeMatchStatus.mockResolvedValue({history_ready:true});getResumeMatchHistory.mockResolvedValue([]);saveResumeMatchHistory.mockResolvedValue({id:1})});
const open=()=>render(<ResumeMatch/>);
test('demo search is explicitly labelled and saves source correctly',async()=>{
 open();await waitFor(()=>expect(getResumeMatchStatus).toHaveBeenCalled());
 fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'We need a React TypeScript AWS developer with Docker experience and strong Python skills.'}});
 fireEvent.click(screen.getByRole('tab',{name:/Demo search/}));
 expect(screen.getByText('Demonstration data')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search keywords'),{target:{value:'React'}});
 fireEvent.click(screen.getByRole('button',{name:/Search sample profiles/}));
 fireEvent.click(screen.getByRole('button',{name:/Score & rank candidates/}));
 await screen.findByText('Ranked candidates');
 await waitFor(()=>expect(saveResumeMatchHistory).toHaveBeenCalledWith(expect.objectContaining({source:'demo'})));
 fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'Changed job description with enough text for another analysis of Python resumes.'}});
 expect(screen.queryByText('Ranked candidates')).not.toBeInTheDocument();
});
test('uploads can be ranked and removed without stale results',async()=>{
 open();fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'We need a React Python AWS engineer with experience building web applications and cloud services.'}});
 fireEvent.change(screen.getByLabelText('Upload resumes'),{target:{files:[new File(['Resume text'],'resume.txt',{type:'text/plain'})]}});
 await screen.findByRole('button',{name:'Remove Alex Example'});
 fireEvent.click(screen.getByRole('button',{name:/Score & rank candidates/}));
 await screen.findByText('Ranked candidates');
 await waitFor(()=>expect(screen.getByRole('button',{name:'Remove Alex Example'})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:'Remove Alex Example'}));
 expect(screen.queryByText('Ranked candidates')).not.toBeInTheDocument();
});
test('history restores only the job description and informs the user',async()=>{
 getResumeMatchHistory.mockResolvedValue([{id:1,job_description:'An existing Python job description with the required backend skills and experience.',created_at:'2026-10-13 10:00:00',source:'upload',candidate_count:2,top_score:80}]);
 open();fireEvent.click(screen.getByRole('button',{name:/My history/}));
 fireEvent.click(await screen.findByRole('button',{name:'Reuse job description'}));
 expect(screen.getByLabelText('Job description').value).toContain('existing Python');
 expect(screen.getByText(/Upload resumes or select sample candidates/)).toBeInTheDocument();
});

test('failed history saving preserves rankings and releases the comparison controls',async()=>{
 saveResumeMatchHistory.mockRejectedValueOnce(new Error('History service timed out'));
 open();await waitFor(()=>expect(getResumeMatchStatus).toHaveBeenCalled());
 fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'We need a React Python AWS engineer with experience building web applications and cloud services.'}});
 fireEvent.change(screen.getByLabelText('Upload resumes'),{target:{files:[new File(['Resume text'],'resume.txt',{type:'text/plain'})]}});
 await screen.findByRole('button',{name:'Remove Alex Example'});
 fireEvent.click(screen.getByRole('button',{name:/Score & rank candidates/}));
 expect(await screen.findByText(/History could not be saved/)).toHaveTextContent('History service timed out');
 expect(screen.getByText('Ranked candidates')).toBeInTheDocument();
 await waitFor(()=>expect(screen.getByRole('button',{name:/Score & rank candidates/})).not.toBeDisabled());
});
