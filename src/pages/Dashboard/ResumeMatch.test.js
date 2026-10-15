import { searchTechfetch } from '../../features/resumeMatch/techfetchSearch';
jest.mock('../../features/resumeMatch/techfetchSearch');
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
test('uploads can be ranked and removed without stale results',async()=>{
 open();fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'We need a React Python AWS engineer with experience building web applications and cloud services.'}});
 fireEvent.click(screen.getByRole('tab',{name:'Resume Search'}));
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
 expect(screen.getByText(/Upload resumes or search TechFetch/)).toBeInTheDocument();
});

test('failed history saving preserves rankings and releases the comparison controls',async()=>{
 saveResumeMatchHistory.mockRejectedValueOnce(new Error('History service timed out'));
 open();await waitFor(()=>expect(getResumeMatchStatus).toHaveBeenCalled());
 fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'We need a React Python AWS engineer with experience building web applications and cloud services.'}});
 fireEvent.click(screen.getByRole('tab',{name:'Resume Search'}));
 fireEvent.change(screen.getByLabelText('Upload resumes'),{target:{files:[new File(['Resume text'],'resume.txt',{type:'text/plain'})]}});
 await screen.findByRole('button',{name:'Remove Alex Example'});
 fireEvent.click(screen.getByRole('button',{name:/Score & rank candidates/}));
 expect(await screen.findByText(/History could not be saved/)).toHaveTextContent('History service timed out');
 expect(screen.getByText('Ranked candidates')).toBeInTheDocument();
 await waitFor(()=>expect(screen.getByRole('button',{name:/Score & rank candidates/})).not.toBeDisabled());
});


test('TechFetch search labels fallback, clears password and saves the correct history source',async()=>{
 searchTechfetch.mockResolvedValueOnce({source:'techfetch-demo',candidates:[{id:'remote-1',name:'Sample Remote Candidate',title:'React engineer',state:'CA',skills:['React'],experience:4,resumeText:'React AWS Python'}]});
 open();await waitFor(()=>expect(getResumeMatchStatus).toHaveBeenCalled());
 fireEvent.change(screen.getByLabelText('Job description'),{target:{value:'We need a React Python AWS engineer with experience building web applications and cloud services.'}});
 fireEvent.click(screen.getByRole('tab',{name:'TechFetch Search'}));
 fireEvent.change(screen.getByLabelText('TechFetch username / email'),{target:{value:'example@example.test'}});
 fireEvent.change(screen.getByLabelText('TechFetch password'),{target:{value:'test-only-password'}});
 fireEvent.change(screen.getByLabelText('Search keywords'),{target:{value:'React'}});
 fireEvent.change(screen.getByLabelText('US state'),{target:{value:'CA'}});
 fireEvent.click(screen.getByRole('button',{name:'Search resumes'}));
 expect(await screen.findByText(/The search service returned demonstration profiles/)).toBeInTheDocument();
 await waitFor(()=>expect(screen.getByLabelText('TechFetch password').value).toBe(''));
 expect(screen.getByText(/TechFetch \(demo fallback\)/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Score & rank candidates/}));
 await waitFor(()=>expect(saveResumeMatchHistory).toHaveBeenCalledWith(expect.objectContaining({source:'techfetch-demo',state_filter:'CA'})));
});


test('starts with TechFetch and presents the requested source order',async()=>{
 open();await waitFor(()=>expect(getResumeMatchStatus).toHaveBeenCalled());const tabs=screen.getAllByRole('tab');
 expect(tabs.map(tab=>tab.textContent)).toEqual([' TechFetch Search',' Resume Search']);
 expect(tabs[0]).toHaveAttribute('aria-selected','true');
 expect(screen.getByLabelText('TechFetch username / email')).toBeInTheDocument();
});
