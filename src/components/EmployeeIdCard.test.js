import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import EmployeeIdCard from "./EmployeeIdCard";
import {getEmployeePhoto} from "../api/employeeApi";
jest.mock('../api/employeeApi',()=>({getEmployeePhoto:jest.fn()}));jest.mock('qrcode',()=>({toDataURL:jest.fn().mockResolvedValue('data:image/png;base64,qr')}));
beforeEach(()=>{jest.clearAllMocks();URL.createObjectURL=jest.fn(()=> 'blob:portrait');URL.revokeObjectURL=jest.fn();getEmployeePhoto.mockResolvedValue(new Blob(['portrait']));});
test('preview loads saved profile photo, real details and restores focus on close',async()=>{const close=jest.fn(),trigger=document.createElement('button');document.body.appendChild(trigger);trigger.focus();const {unmount}=render(<EmployeeIdCard employee={{id:7,employee_id:'BDT-I-081',legal_name:'Ramarao Kalinga',photo:'encrypted-photo',role:'Web Developer'}} onClose={close}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Download PDF'})).toBeEnabled(),{timeout:10000});expect(getEmployeePhoto).toHaveBeenCalledWith(7);expect(screen.getByText(/hr_ind@bedatatech.com/)).toBeInTheDocument();expect(screen.queryByText('Department')).toBeNull();expect(screen.getByAltText('Ramarao Kalinga')).toHaveAttribute('src','blob:portrait');expect(screen.getAllByText('BDT-I-081').length).toBeGreaterThan(0);fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});expect(close).toHaveBeenCalledTimes(1);unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:portrait');expect(trigger).toHaveFocus();trigger.remove();});
test('failed asset loading is reported and download remains unavailable',async()=>{getEmployeePhoto.mockRejectedValue(new Error('failed'));render(<EmployeeIdCard employee={{id:7,employee_id:'BDT-I-081',photo:'encrypted-photo'}} onClose={()=>{}}/>);await screen.findByRole('alert');expect(screen.getByRole('button',{name:'Download PDF'})).toBeDisabled();});

test('candidate card uses the candidate identity, initials and authorized candidate profile URL',async()=>{
 render(<EmployeeIdCard employee={{id:9,employee_id:'TF-C-0009',legal_name:'Synthetic Candidate',role:'Developer'}} kind="Candidate" verificationPath="/dashboard/teamflow/candidates/9/profile" onClose={()=>{}}/>);
 await waitFor(()=>expect(screen.getByRole('button',{name:'Download PDF'})).toBeEnabled(),{timeout:10000});
 expect(screen.getByRole('heading',{name:'Candidate ID Card'})).toBeInTheDocument();
 expect(screen.getByText('SC')).toBeInTheDocument();
 expect(getEmployeePhoto).not.toHaveBeenCalled();
 expect(require('qrcode').toDataURL).toHaveBeenCalledWith(expect.stringContaining('/dashboard/teamflow/candidates/9/profile'),expect.anything());
});