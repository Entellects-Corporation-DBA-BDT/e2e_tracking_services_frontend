import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import App from './App';
import {verdictService} from './services/verdictService';
import {buildAnalysis,toSourceResult} from './lib/analysis';
jest.mock('./mocks/delay',()=>({delay:()=>Promise.resolve()}));

test('runs an original sample, shows source matches and reopens it from history',async()=>{
 render(<App/>);
 expect(screen.getByRole('note').textContent).toContain('Sample analysis');
 fireEvent.change(await screen.findByLabelText('Try a sample story'),{target:{value:'PROJ-412'}});
 expect(screen.getByLabelText('Title').value).toContain('reset their password');
 fireEvent.click(screen.getByRole('button',{name:'Analyze requirement'}));
 expect(await screen.findByRole('heading',{name:'ALREADY IMPLEMENTED'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Jira'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Google Drive'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'GitHub'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'History'}));
 fireEvent.change(screen.getByRole('searchbox',{name:'Search analyses'}),{target:{value:'PROJ-412'}});
 const row=screen.getAllByRole('row')[1];fireEvent.keyDown(row,{key:'Enter'});
 const dialog=screen.getByRole('dialog');expect(within(dialog).getByRole('heading',{name:'ALREADY IMPLEMENTED'})).toBeTruthy();
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).toBeNull();
});

test('surfaces partial-source failures and incomplete verdict instead of hiding them',async()=>{
 render(<App/>);fireEvent.change(await screen.findByLabelText('Try a sample story'),{target:{value:'PROJ-301'}});
 fireEvent.click(screen.getByRole('button',{name:'Analyze requirement'}));
 expect(await screen.findByText('Google Drive search failed')).toBeTruthy();
 expect(await screen.findByText(/result may be incomplete/)).toBeTruthy();
});

test('validates inputs and clearly rejects unimplemented live connections',async()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Analyze requirement'}));
 expect(screen.getByRole('alert').textContent).toContain('Enter a Jira story key');
 fireEvent.click(screen.getByRole('button',{name:'Settings'}));
 fireEvent.click(screen.getByRole('switch',{name:'Demo mode'}));
 fireEvent.click(screen.getByRole('button',{name:'Analyze'}));
 fireEvent.change(screen.getByLabelText('Story key'),{target:{value:'PROJ-412'}});
 fireEvent.click(screen.getByRole('button',{name:'Analyze requirement'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('Live connections are not implemented'));
});

test('retains all four source verdicts and does not lose incomplete-source notices',async()=>{
 const compute=verdictService.computeVerdict,t={similar:60,strong:80};
 expect(compute([],[],[],t).verdict).toBe('NEW');
 expect(compute([{title:'Done',score:90,status:'Done'}],[],[],t).verdict).toBe('ALREADY_IMPLEMENTED');
 expect(compute([],[{title:'Design',score:90}],[],t).verdict).toBe('ALREADY_DOCUMENTED');
 expect(compute([{title:'Related',score:65,status:'Open'}],[],[],t).verdict).toBe('PARTIALLY_EXISTS');
 const failed=await toSourceResult('drive',async()=>{throw Error('Unavailable');});
 expect(failed.status).toBe('error');
 const analysis=buildAnalysis({id:'example',createdAt:new Date().toISOString(),story:{storyKey:'PROJ-1',title:'Example'},understanding:{},sources:{drive:failed},verdict:{verdict:'NEW',confidence:0,explanation:'No matches.'}});
 expect(analysis.explanation).toContain('could not be searched');
});
