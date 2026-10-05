import {fireEvent,render,screen,within,waitFor} from "@testing-library/react";
import AttendanceConfigurations from "./AttendanceConfigurations";
import {getMailSender,saveMailSender,getLeaveMailSettings,saveLeaveMailSettings} from "../api/employeeApi";
const mockNavigate=jest.fn();
const mockUser={email:"hr@example.com",position_id:1};
jest.mock("react-router-dom",()=>({useNavigate:()=>mockNavigate}),{virtual:true});
jest.mock("../auth/PermissionContext",()=>({usePermissions:()=>({can:()=>true,user:mockUser})}));
jest.mock("../api/employeeApi",()=>({getMailSender:jest.fn(),saveMailSender:jest.fn(),removeMailSender:jest.fn(),getLeaveMailSettings:jest.fn(),saveLeaveMailSettings:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();mockUser.position_id=1;getMailSender.mockResolvedValue({success:true,configured:false});getLeaveMailSettings.mockResolvedValue({success:true,configured:false})});
const sender=()=>within(screen.getByRole("article",{name:"Your Sender Mailbox"}));
const leave=()=>within(screen.getByRole("article",{name:"Leave Approval Mailbox"}));
test("verifies one sender for pre-offers and payslips and clears the password form",async()=>{
 saveMailSender.mockResolvedValue({success:true,configured:true,message:"Verified sender",data:{smtp_username:"hr@example.com",smtp_host:"smtp.ionos.com",smtp_port:587,encryption:"tls"}});
 render(<AttendanceConfigurations/>);fireEvent.click(await sender().findByRole("button",{name:"Configure Mailbox"}));fireEvent.change(sender().getByLabelText("Webmail / App Password"),{target:{value:"test-secret"}});fireEvent.click(sender().getByRole("button",{name:"Verify & Save"}));
 await sender().findByText("Verified sender");expect(saveMailSender).toHaveBeenCalledWith(expect.objectContaining({email:"hr@example.com",password:"test-secret"}));expect(sender().queryByLabelText("Webmail / App Password")).not.toBeInTheDocument();
});
test("retains mailbox fields after authentication failure and permits retry",async()=>{
 saveMailSender.mockRejectedValue({response:{data:{message:"Authentication failed"}}});render(<AttendanceConfigurations/>);fireEvent.click(await sender().findByRole("button",{name:"Configure Mailbox"}));fireEvent.change(sender().getByLabelText("Webmail / App Password"),{target:{value:"test-secret"}});fireEvent.click(sender().getByRole("button",{name:"Verify & Save"}));
 expect(await sender().findByRole("alert")).toHaveTextContent("Authentication failed");expect(sender().getByLabelText("SMTP Host")).toHaveValue("smtp.ionos.com");expect(sender().getByRole("button",{name:"Verify & Save"})).toBeEnabled();
});
test("saves the organization leave sender and HR recipient separately",async()=>{
 saveLeaveMailSettings.mockResolvedValue({success:true,configured:true,message:"Verified leave mailbox",data:{from_email:"hr@example.com",to_email:"approvals@example.com",smtp_host:"smtp.ionos.com",smtp_port:587,encryption:"tls"}});
 render(<AttendanceConfigurations/>);fireEvent.click(await leave().findByRole("button",{name:"Configure Mailbox"}));fireEvent.change(leave().getByLabelText("HR Approval Recipient"),{target:{value:"approvals@example.com"}});fireEvent.change(leave().getByLabelText("Webmail / App Password"),{target:{value:"test-secret"}});fireEvent.click(leave().getByRole("button",{name:"Verify & Save"}));
 await leave().findByText("Verified leave mailbox");expect(saveLeaveMailSettings).toHaveBeenCalledWith(expect.objectContaining({from_email:"hr@example.com",to_email:"approvals@example.com"}));expect(saveMailSender).not.toHaveBeenCalled();
});
test("retries a failed sender status load and links back to Employees",async()=>{
 getMailSender.mockRejectedValueOnce(new Error("offline"));render(<AttendanceConfigurations/>);fireEvent.click(await sender().findByRole("button",{name:"Retry Loading"}));await sender().findByRole("button",{name:"Configure Mailbox"});expect(getMailSender).toHaveBeenCalledTimes(2);fireEvent.click(screen.getByRole("button",{name:"Go to Employees"}));await waitFor(()=>expect(mockNavigate).toHaveBeenCalledWith("/dashboard/employee-status"));
});


test("HR can configure a mailbox different from their login email",async()=>{
 mockUser.position_id=2;saveMailSender.mockResolvedValue({success:true,configured:true,message:"Verified alternate sender",data:{smtp_username:"recruitment@example.com",smtp_host:"smtp.ionos.com",smtp_port:587,encryption:"tls"}});
 render(<AttendanceConfigurations/>);fireEvent.click(await sender().findByRole("button",{name:"Configure Mailbox"}));fireEvent.change(sender().getByLabelText(/^Sender Email/),{target:{value:"recruitment@example.com"}});fireEvent.change(sender().getByLabelText("Webmail / App Password"),{target:{value:"test-secret"}});fireEvent.click(sender().getByRole("button",{name:"Verify & Save"}));
 await sender().findByText("Verified alternate sender");expect(saveMailSender).toHaveBeenCalledWith(expect.objectContaining({email:"recruitment@example.com",password:"test-secret"}));expect(screen.queryByRole("article",{name:"Leave Approval Mailbox"})).not.toBeInTheDocument();
});
