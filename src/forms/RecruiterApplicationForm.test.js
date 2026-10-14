import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecruiterApplicationForm from './RecruiterApplicationForm';
import { getCandidateData } from '../api/candidateApi';
import { createRecruiterApplication, getRecruiterApplicationById, updateRecruiterApplication } from '../api/applicationApi';
jest.mock('../api/candidateApi', () => ({getCandidateData:jest.fn()}));
jest.mock('../api/applicationApi', () => ({createRecruiterApplication:jest.fn(),getRecruiterApplicationById:jest.fn(),updateRecruiterApplication:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();getCandidateData.mockResolvedValue({data:[]});createRecruiterApplication.mockResolvedValue({success:true});updateRecruiterApplication.mockResolvedValue({success:true});});
test('new submission sends separate candidate and existing feedback',async()=>{
 render(<RecruiterApplicationForm />);
 fireEvent.change(await screen.findByLabelText('Candidate Feedback'),{target:{value:'Available next week'}});
 fireEvent.change(screen.getByPlaceholderText('Enter feedback'),{target:{value:'Client requested interview'}});
 fireEvent.change(screen.getByPlaceholderText('Select or enter candidate name'),{target:{value:'Example Candidate'}});
 fireEvent.click(screen.getByRole('button',{name:'Save Application'}));
 await waitFor(()=>expect(createRecruiterApplication).toHaveBeenCalled());
 const payload=createRecruiterApplication.mock.calls[0][0];
 expect(payload.get('candidate_feedback')).toBe('Available next week');expect(payload.get('feedback')).toBe('Client requested interview');
});
test('edit loads and can clear candidate feedback without clearing client feedback',async()=>{
 getRecruiterApplicationById.mockResolvedValue({success:true,data:{candidate_name:'Example Candidate',feedback:'Client notes',candidate_feedback:'Previous candidate notes'}});
 render(<RecruiterApplicationForm isEdit applicationId={42}/>);
 const input=await screen.findByLabelText('Candidate Feedback');expect(input.value).toBe('Previous candidate notes');
 fireEvent.change(input,{target:{value:''}});fireEvent.click(screen.getByRole('button',{name:'Update Application'}));
 await waitFor(()=>expect(updateRecruiterApplication).toHaveBeenCalled());
 expect(updateRecruiterApplication.mock.calls[0][1].get('candidate_feedback')).toBe('');expect(updateRecruiterApplication.mock.calls[0][1].get('feedback')).toBe('Client notes');
});
