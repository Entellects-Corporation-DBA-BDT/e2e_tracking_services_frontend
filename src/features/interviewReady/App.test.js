import {render,screen,fireEvent,waitFor,act} from '@testing-library/react';
import InterviewReady from './App';
import * as ai from './lib/ai';
import {DEMO_RESUME,DEMO_JD,DEMO_ANALYSIS,DEMO_TAILORED,DEMO_QUESTIONS,DEMO_FEEDBACK,DEMO_REPORT} from './lib/demoData';
jest.mock('./lib/ai');
// Brand icons are not available in every deployed Lucide release.
// Rendering the complete workflow must not depend on the Github export.
jest.mock('lucide-react',()=>({...jest.requireActual('lucide-react'),Github:undefined}));
jest.setTimeout(30000);
jest.mock('./lib/download',()=>({resumeToPlainText:r=>r.professionalSummary,copyToClipboard:jest.fn(),downloadResumeDocx:jest.fn(),downloadResumePdf:jest.fn(),downloadTextPdf:jest.fn(),reportToText:()=>''}));
beforeEach(()=>{jest.clearAllMocks();ai.fetchConfigStatus.mockResolvedValue({configured:true,provider:'Fixture',model:'Fixture'});ai.analyzeMatch.mockResolvedValue(DEMO_ANALYSIS);ai.tailorResume.mockResolvedValue({...DEMO_TAILORED});ai.generateQuestions.mockResolvedValue(DEMO_QUESTIONS);ai.evaluateAnswer.mockResolvedValue(DEMO_FEEDBACK);ai.generateReport.mockResolvedValue({...DEMO_REPORT});});
async function setupInterview(){
 render(<InterviewReady/>);
 fireEvent.change(screen.getByLabelText('Resume text editor'),{target:{value:DEMO_RESUME}});
 fireEvent.change(screen.getByLabelText('Job Description text editor'),{target:{value:DEMO_JD}});
 fireEvent.click(screen.getByRole('button',{name:/Continue to Review/}));
 fireEvent.click(screen.getByRole('button',{name:/Analyze Resume and JD/}));
 fireEvent.click(await screen.findByRole('button',{name:/Tailor my resume/}));
 fireEvent.click(await screen.findByRole('button',{name:/Continue to interview setup/}));
 fireEvent.click(screen.getByRole('button',{name:/Generate 10 questions/}));
 await screen.findByText('Question 1 of 10');
}
test('preserves a failed answer for retry, pauses, skips and marks early-ended report incomplete',async()=>{
 await setupInterview();
 ai.evaluateAnswer.mockResolvedValueOnce(null);
 fireEvent.change(screen.getByLabelText('Your answer to the interview question'),{target:{value:'My concrete example from actual experience.'}});
 fireEvent.click(screen.getByRole('button',{name:'Pause'}));expect(screen.getByRole('button',{name:'Submit Answer'})).toBeDisabled();
 fireEvent.click(screen.getAllByRole('button',{name:'Resume'})[0]);fireEvent.click(screen.getByRole('button',{name:'Submit Answer'}));
 await screen.findByText(/Your answer was not lost/);
 expect(screen.getByLabelText('Your answer to the interview question')).toHaveValue('My concrete example from actual experience.');
 fireEvent.click(screen.getByRole('button',{name:'Submit Answer'}));
 await screen.findByText('Feedback on your answer');
 fireEvent.click(screen.getByRole('button',{name:'Next Question'}));fireEvent.click(screen.getByRole('button',{name:'Skip'}));
 fireEvent.click(screen.getByRole('button',{name:'End Interview'}));fireEvent.click(screen.getByRole('button',{name:'End interview'}));
 await screen.findByText('Your mock interview report');
 expect(screen.getByText(/incomplete/i)).toBeInTheDocument();
 expect(ai.generateReport.mock.calls[0][0]).toHaveLength(2);
 fireEvent.click(screen.getAllByRole('checkbox')[0]);
 fireEvent.click(screen.getByRole('button',{name:/Retry selected/}));
 await screen.findByText('Question 2 of 10');
 fireEvent.click(screen.getByRole('button',{name:'Skip'}));fireEvent.click(screen.getByRole('button',{name:'Next Question'}));
 await screen.findByText('Your mock interview report');
 expect(screen.queryByText('Question 3 of 10')).not.toBeInTheDocument();
});
test('clear session unmounts pending analysis so old output cannot return',async()=>{
 let finish;ai.analyzeMatch.mockImplementation(()=>new Promise(resolve=>finish=resolve));
 render(<InterviewReady/>);
 fireEvent.change(screen.getByLabelText('Resume text editor'),{target:{value:DEMO_RESUME}});fireEvent.change(screen.getByLabelText('Job Description text editor'),{target:{value:DEMO_JD}});
 fireEvent.click(screen.getByRole('button',{name:/Continue to Review/}));fireEvent.click(screen.getByRole('button',{name:/Analyze Resume and JD/}));
 fireEvent.click(screen.getByRole('button',{name:'Clear session'}));fireEvent.click(screen.getByRole('button',{name:'Clear everything'}));
 await waitFor(()=>expect(screen.getByLabelText('Resume text editor')).toHaveValue(''));
 await act(async()=>finish(DEMO_ANALYSIS));
 await waitFor(()=>expect(screen.queryByRole('button',{name:/Tailor my resume/})).not.toBeInTheDocument());
 expect(ai.cancelInterviewRequests).toHaveBeenCalled();
});
