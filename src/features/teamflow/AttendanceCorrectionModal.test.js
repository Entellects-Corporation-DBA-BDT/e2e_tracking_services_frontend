import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import AttendanceCorrectionModal from './AttendanceCorrectionModal';
import {CandidateWorkSwitch} from './CandidateAttendance';
import {teamflowApi} from './api';
jest.mock('./api',()=>({teamflowApi:{correctAttendance:jest.fn()},teamflowMessage:e=>e.message}));
jest.mock('./ProjectIdentity',()=>()=>null);

test('admin correction sends exact Eastern times and a reason, then refreshes attendance',async()=>{
 teamflowApi.correctAttendance.mockResolvedValue({success:true});const onSaved=jest.fn(),onClose=jest.fn();
 render(<AttendanceCorrectionModal row={{id:42,login_time:'2026-11-12 09:00:00',logout_time:'2026-11-12 18:00:00'}} onSaved={onSaved} onClose={onClose}/>);
 fireEvent.change(screen.getByLabelText('Clock out (ET)'),{target:{value:'2026-11-12T17:00:00'}});
 fireEvent.change(screen.getByLabelText('Reason for correction'),{target:{value:'Verified actual clock-out with candidate'}});
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));
 await waitFor(()=>expect(onSaved).toHaveBeenCalledTimes(1));expect(onClose).toHaveBeenCalledTimes(1);
 expect(teamflowApi.correctAttendance).toHaveBeenCalledWith(42,{login_time:'2026-11-12T09:00:00',logout_time:'2026-11-12T17:00',reason:'Verified actual clock-out with candidate'});
});
test('an overdue snapshot cannot display days of working time',()=>{
 render(<CandidateWorkSwitch attendance={{data:{received_at:Date.now(),max_session_seconds:32400,open_session:{duration_seconds:259200}},projects:[],reload:jest.fn()}}/>);
 expect(screen.getByText('09:00:00')).toBeInTheDocument();
});
