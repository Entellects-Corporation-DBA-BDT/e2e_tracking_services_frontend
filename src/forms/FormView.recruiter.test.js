import {useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import FormView from './FormView';
import {getCandidateData} from '../api/candidateApi';
jest.mock('./ApplicationView',()=>()=>null);
jest.mock('./BenchSales',()=>()=>null);
jest.mock('./DeleteConfirmation',()=>()=>null);
jest.mock('./JobView',()=>()=>null);
jest.mock('./CandidateForm',()=>()=>null);
jest.mock('./JobForm',()=>()=>null);
jest.mock('./RecordDeleteConfirmation',()=>()=>null);
jest.mock('./RecruiterApplicationView',()=>()=>null);
jest.mock('../api/candidateApi',()=>({getCandidateData:jest.fn().mockResolvedValue({data:[]}),deleteCandidate:jest.fn()}));
jest.mock('../api/jobApi',()=>({deleteJob:jest.fn()}));
jest.mock('../api/applicationApi',()=>({createRecruiterApplication:jest.fn(),getRecruiterApplicationById:jest.fn(),updateRecruiterApplication:jest.fn(),deleteRecruiterApplication:jest.fn()}));
beforeEach(()=>{getCandidateData.mockResolvedValue({data:[]});});
function Harness({initial='recruiter'}){const [form,setForm]=useState(initial);return <FormView openForm={form} setOpenForm={setForm}/>;}
test('minimize and maximize preserve typed details and selected files; close releases scroll lock',async()=>{
 render(<Harness/>);
 const name=await screen.findByPlaceholderText('Select or enter candidate name');
 fireEvent.change(name,{target:{value:'Example Candidate'}});
 const file=new File(['resume'],'resume.pdf',{type:'application/pdf'});
 fireEvent.change(document.getElementById('recruiter-resume_file'),{target:{files:[file]}});
 fireEvent.click(screen.getByRole('button',{name:'Minimize form'}));
 expect(document.querySelector('.recruiter-window-content').hidden).toBe(true);
 expect(document.body.style.overflow).not.toBe('hidden');
 fireEvent.click(screen.getByRole('button',{name:'Maximize form'}));
 expect(document.querySelector('.recruiter-window-overlay').classList.contains('maximized')).toBe(true);
 expect(screen.getByPlaceholderText('Select or enter candidate name').value).toBe('Example Candidate');
 expect(screen.getByText('resume.pdf')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Restore window size'}));
 expect(document.querySelector('.recruiter-window-overlay').classList.contains('normal')).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Close form'}));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(document.body.style.overflow).not.toBe('hidden');
});


test('Bench Sales uses the same minimize, maximize and restore window controls',()=>{
 render(<Harness initial="bench"/>);
 expect(screen.getByRole('dialog',{name:'New Bench Sales Application'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Maximize form'}));
 expect(document.querySelector('.recruiter-window-overlay').classList.contains('maximized')).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Minimize form'}));
 expect(document.querySelector('.recruiter-window-content').hidden).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Restore form'}));
 expect(document.querySelector('.recruiter-window-content').hidden).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Close form'}));
 expect(screen.queryByRole('dialog')).toBeNull();
});
