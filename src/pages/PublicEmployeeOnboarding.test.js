import {useState} from "react";
import EmployeeCollectionFields from "../components/EmployeeCollectionFields";
import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import PublicEmployeeOnboarding from "./PublicEmployeeOnboarding";
import EmployeeFormModal from "../components/EmployeeFormModal";
import EmployeeOnboardingInvite from "../components/EmployeeOnboardingInvite";
import {getEmployeeOnboardingInvite,submitEmployeeOnboarding,getEmployeeById,getPositions,getEmployeeUploadLimits,createEmployee,updateEmployee,getEmployeeOnboardingRoles,getMailSender,getPayslipRoster,sendEmployeeOnboardingInvite} from "../api/employeeApi";
import {emptyCollection} from "../utils/employeeCollection";
jest.mock("react-router-dom",()=>({useParams:()=>({token:"test-token"}),useNavigate:()=>jest.fn()}),{virtual:true});
jest.mock("../auth/PermissionContext",()=>{const permissions={can:()=>true,user:{email:"hr@example.com"}};return {usePermissions:()=>permissions}});
jest.mock("../api/employeeApi",()=>({getEmployeeOnboardingInvite:jest.fn(),submitEmployeeOnboarding:jest.fn(),getEmployeeById:jest.fn(),getPositions:jest.fn(),getEmployeeUploadLimits:jest.fn().mockResolvedValue({}),updateEmployee:jest.fn(),createEmployee:jest.fn(),downloadEmployeeDocument:jest.fn(),getEmployeeOnboardingRoles:jest.fn(),getMailSender:jest.fn(),getPayslipRoster:jest.fn(),sendEmployeeOnboardingInvite:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();getEmployeeUploadLimits.mockResolvedValue({});getEmployeeOnboardingInvite.mockResolvedValue({success:true,personal_email:"candidate@example.com",role_name:"Web Developer",upload_limits:{max_file_bytes:2097152,max_total_bytes:7340032,max_files:20}});getPositions.mockResolvedValue({data:[{id:1,position_name:"Developer"}]});getPayslipRoster.mockResolvedValue({data:[]});getMailSender.mockResolvedValue({configured:true,data:{smtp_username:"hr@example.com"}});getEmployeeOnboardingRoles.mockResolvedValue({roles:{web_developer:{name:"Web Developer",responsibilities:["Develop responsive applications."]},hr:{name:"HR",responsibilities:["Coordinate onboarding and employee records."]}}})});
async function openPublic(){render(<PublicEmployeeOnboarding/>);await screen.findByRole("heading",{name:"Your next chapter starts here"});}
function fillBasic(){
 for(const [label,value] of [["First Name","Test"],["Last Name","Candidate"],["Date of Birth","1995-01-01"],["Permanent Address","Test address"],["Phone Number","1234567890"]])fireEvent.change(screen.getByLabelText(new RegExp("^"+label)),{target:{value}});
 fireEvent.change(screen.getByLabelText(/^Gender/),{target:{value:"Female"}});fireEvent.click(screen.getByLabelText("I confirm the declaration above."));
}
function fillEducation(index=0){
 fireEvent.change(screen.getAllByLabelText(/^Degree \/ Qualification/)[index],{target:{value:"B.Tech"}});
 fireEvent.change(screen.getAllByLabelText(/^College \/ School Name/)[index],{target:{value:"Test College"}});
 fireEvent.change(screen.getAllByLabelText(/^Year of Passing/)[index],{target:{value:"2020"}});
}
const submitButton=()=>screen.getByRole("button",{name:"Submit Information & Documents"});
test("submits dynamic education with documents and a confirmation-only declaration",async()=>{
 submitEmployeeOnboarding.mockResolvedValue({success:true,message:"Submitted",employee_id:"EMP-I-42"});await openPublic();fillBasic();fillEducation();
 fireEvent.change(screen.getByLabelText("Father's Name"),{target:{value:"Test Father"}});
 const file=new File(["%PDF"],"degree.pdf",{type:"application/pdf"});const picker=screen.getByLabelText(/^Upload Degree \/ Passing Certificate/);
 fireEvent.change(picker,{target:{files:[file]}});
 expect(screen.queryByRole("heading",{name:"Candidate Personal Details"})).not.toBeInTheDocument();expect(screen.queryByRole("heading",{name:"Document Checklist"})).not.toBeInTheDocument();
 expect(screen.queryByLabelText(/Candidate Signature/)).not.toBeInTheDocument();expect(screen.getByText("Web Developer")).toBeInTheDocument();
 fireEvent.click(submitButton());await screen.findByText(/EMP-I-42/);
 const [,body]=submitEmployeeOnboarding.mock.calls[0],payload=JSON.parse(body.get("payload"));
 expect(payload.collection.father_name).toBe("Test Father");expect(payload.collection.education[0].college).toBe("Test College");expect(payload.collection.declaration).toEqual({accepted:true});expect(payload.date_of_joining).toBe("");
 expect(body.get("documents[education_"+payload.collection.education[0].id+"_certificate][]").name).toBe("degree.pdf");
});
test("experience is optional and arbitrary companies keep their document IDs after removal",async()=>{
 submitEmployeeOnboarding.mockResolvedValue({success:true,message:"Saved",employee_id:"EMP-I-43"});await openPublic();fillBasic();fillEducation();
 expect(screen.queryByLabelText(/^Company Name/)).not.toBeInTheDocument();fireEvent.click(screen.getByLabelText("I have previous work experience"));
 for(let i=0;i<4;i++)fireEvent.click(screen.getByRole("button",{name:"+ Add another company"}));
 expect(screen.getAllByLabelText(/^Company Name/)).toHaveLength(5);
 const second=screen.getAllByLabelText(/^Company Name/)[1];fireEvent.change(second,{target:{value:"Second Company"}});
 screen.getAllByLabelText(/^Company Name/).forEach((element,index)=>{if(index!==1)fireEvent.change(element,{target:{value:"Company "+(index+1)}})});
 screen.getAllByLabelText(/^Position \/ Designation/).forEach(element=>fireEvent.change(element,{target:{value:"Developer"}}));
 screen.getAllByLabelText(/^Employment Period/).forEach(element=>fireEvent.change(element,{target:{value:"2020-2025"}}));
 const picker=screen.getAllByLabelText(/^Upload Experience \/ Relieving Letter/)[1];fireEvent.change(picker,{target:{files:[new File(["pdf"],"second.pdf",{type:"application/pdf"})]}});
 fireEvent.click(screen.getByRole("button",{name:"Remove company 1"}));expect(screen.getByText("second.pdf")).toBeInTheDocument();
 fireEvent.click(submitButton());await screen.findByText(/EMP-I-43/);const body=submitEmployeeOnboarding.mock.calls[0][1],payload=JSON.parse(body.get("payload"));
 expect(payload.collection.employment[0].company).toBe("Second Company");expect(body.get("documents[experience_"+payload.collection.employment[0].id+"][]").name).toBe("second.pdf");
});
test("unchecking experience excludes draft employers and their pending uploads",async()=>{
 submitEmployeeOnboarding.mockResolvedValue({success:true,message:"Saved",employee_id:"EMP-I-44"});await openPublic();fillBasic();fillEducation();
 const check=screen.getByLabelText("I have previous work experience");fireEvent.click(check);
 fireEvent.change(screen.getByLabelText(/^Company Name/),{target:{value:"Draft employer"}});
 fireEvent.change(screen.getByLabelText(/^Upload Experience/),{target:{files:[new File(["pdf"],"letter.pdf",{type:"application/pdf"})]}});
 fireEvent.click(check);fireEvent.click(submitButton());await screen.findByText(/EMP-I-44/);
 const body=submitEmployeeOnboarding.mock.calls[0][1],payload=JSON.parse(body.get("payload"));expect(payload.collection.has_experience).toBe(false);expect(payload.collection.employment).toEqual([]);expect(payload.document_upload_count).toBe(0);
});
test("adds education, certifications and references dynamically",async()=>{
 submitEmployeeOnboarding.mockResolvedValue({success:true,message:"Saved",employee_id:"EMP-I-45"});await openPublic();fillBasic();fillEducation();
 fireEvent.click(screen.getByRole("button",{name:"+ Add education"}));fillEducation(1);
 fireEvent.click(screen.getByRole("button",{name:"+ Add certification"}));fireEvent.click(screen.getByRole("button",{name:"+ Add certification"}));
 screen.getAllByLabelText(/^Certification Name/).forEach((element,i)=>fireEvent.change(element,{target:{value:"Certification "+(i+1)}}));
 fireEvent.click(screen.getByRole("button",{name:"+ Add reference"}));fireEvent.change(screen.getByLabelText(/^Reference Name/),{target:{value:"Former manager"}});
 fireEvent.click(submitButton());await screen.findByText(/EMP-I-45/);
 const payload=JSON.parse(submitEmployeeOnboarding.mock.calls[0][1].get("payload"));expect(payload.collection.education).toHaveLength(2);expect(payload.collection.certifications).toHaveLength(2);expect(payload.collection.references[0].name).toBe("Former manager");
});
test("retains the form after submission failure and clears error on retry",async()=>{
 submitEmployeeOnboarding.mockRejectedValueOnce({response:{data:{message:"Please retry"}}}).mockResolvedValueOnce({success:true,message:"Saved",employee_id:"EMP-I-46"});
 await openPublic();fillBasic();fillEducation();fireEvent.click(submitButton());await screen.findByRole("alert");expect(screen.getByLabelText(/^First Name/)).toHaveValue("Test");
 fireEvent.click(submitButton());await screen.findByText(/EMP-I-46/);expect(screen.queryByText("Please retry")).not.toBeInTheDocument();
});
test("rejects oversized uploads before submitting",async()=>{
 await openPublic();fillBasic();fillEducation();fireEvent.change(screen.getByLabelText(/^Upload Degree \/ Passing Certificate/),{target:{files:[new File([new Uint8Array(2097153)],"large.pdf",{type:"application/pdf"})]}});
 fireEvent.click(submitButton());expect(await screen.findByRole("alert")).toHaveTextContent("maximum file size");expect(submitEmployeeOnboarding).not.toHaveBeenCalled();
});
test("staff edits load the full record and retain previous documents and declaration",async()=>{
 const collection=emptyCollection();collection.education=[];collection.email="candidate@example.com";collection.father_name="Existing Father";collection.documents=[{id:"abc",category:"highest_degree",name:"existing.pdf"}];collection.declaration={accepted:true,candidate_name:"Test Candidate",signature:"Legacy signature",date:"2026-10-01"};
 getEmployeeById.mockResolvedValue({data:{id:7,employee_id:"EMP-I-7",firstname:"Test",lastname:"Candidate",address:"Existing address",birthdate:"1995-01-01",contact_info:"123",gender:"Female",position_id:null,schedule_id:null,collection}});
 updateEmployee.mockResolvedValue({success:true,message:"Saved"});const onSaved=jest.fn();render(<EmployeeFormModal employee={{id:7}} onClose={jest.fn()} onSaved={onSaved}/>);
 await waitFor(()=>expect(screen.getByLabelText("Father's Name")).toHaveValue("Existing Father"));expect(screen.getByText("existing.pdf")).toBeInTheDocument();expect(screen.getByLabelText("I confirm the declaration above.")).toBeDisabled();
 fireEvent.change(screen.getByLabelText("Mother's Name"),{target:{value:"Updated Mother"}});fireEvent.click(screen.getByRole("button",{name:"Save Changes"}));await waitFor(()=>expect(onSaved).toHaveBeenCalledWith("Saved"));
 const payload=JSON.parse(updateEmployee.mock.calls[0][1].get("payload"));expect(payload.address).toBe("Existing address");expect(payload.collection.documents[0].name).toBe("existing.pdf");expect(payload.collection.declaration.signature).toBe("Legacy signature");
});
test("prevents saving after a failed full-record load",async()=>{
 getEmployeeById.mockRejectedValue(new Error("unavailable"));render(<EmployeeFormModal employee={{id:7}} onClose={jest.fn()} onSaved={jest.fn()}/>);
 await screen.findByRole("alert");expect(screen.getByRole("button",{name:"Save Changes"})).toBeDisabled();
});
test("requires role selection and includes role and candidate name in the invitation",async()=>{
 sendEmployeeOnboardingInvite.mockResolvedValue({success:true,message:"Sent",public_url:"https://example.com/form"});
 render(<EmployeeOnboardingInvite/>);
 const open=await screen.findByRole("button",{name:"Employee Public Form"});await waitFor(()=>expect(open).toBeEnabled());fireEvent.click(open);
 const send=screen.getByRole("button",{name:"Send Pre-Offer & Form"});expect(send).toBeDisabled();
 fireEvent.change(screen.getByLabelText("Selected Role *"),{target:{value:"hr"}});fireEvent.change(screen.getByLabelText(/Candidate Name/),{target:{value:"Selected Candidate"}});fireEvent.change(screen.getByLabelText("Candidate Personal Email"),{target:{value:"candidate@example.com"}});
 expect(screen.getByText("Coordinate onboarding and employee records.")).toBeInTheDocument();fireEvent.click(send);
 await waitFor(()=>expect(sendEmployeeOnboardingInvite).toHaveBeenCalledWith(expect.objectContaining({selected_role:"hr",candidate_name:"Selected Candidate",personal_email:"candidate@example.com"})));
});


test("removing a company cannot remove files from an entry with a similar ID",()=>{
 const initial=emptyCollection();initial.has_experience=true;initial.employment=[{id:"a",company:"First",designation:"Developer",period:"2020-2021"},{id:"ab",company:"Second",designation:"Developer",period:"2021-2022"}];
 function Harness(){const [value,setValue]=useState(initial),[files,setFiles]=useState({});return <EmployeeCollectionFields value={value} onChange={setValue} files={files} onFilesChange={setFiles}/>;}
 render(<Harness/>);fireEvent.change(screen.getByLabelText("Upload Experience / Relieving Letter experience_ab"),{target:{files:[new File(["pdf"],"second.pdf",{type:"application/pdf"})]}});
 fireEvent.click(screen.getByRole("button",{name:"Remove company 1"}));expect(screen.getByText("second.pdf")).toBeInTheDocument();expect(screen.getByLabelText("Company Name ab")).toHaveValue("Second");
});


test("manual add generates the employee ID on the server",async()=>{
 createEmployee.mockResolvedValue({success:true,message:"Saved EMP-I-50"});const onSaved=jest.fn();render(<EmployeeFormModal onClose={jest.fn()} onSaved={onSaved}/>);
 await screen.findByRole("option",{name:"Developer"});expect(screen.queryByLabelText("Employee ID")).not.toBeInTheDocument();expect(screen.getByText("Automatic Employee ID")).toBeInTheDocument();
 for(const [label,value] of [["First Name","Test"],["Last Name","Candidate"],["Birth Date","1995-01-01"],["Phone Number","1234567890"],["Permanent Address","Test address"]])fireEvent.change(screen.getByLabelText(new RegExp("^"+label)),{target:{value}});
 fireEvent.change(screen.getByLabelText(/^Gender/),{target:{value:"Female"}});fireEvent.change(screen.getByLabelText(/^Position/),{target:{value:"1"}});fillEducation();
 fireEvent.click(screen.getByRole("button",{name:"Add Employee"}));await waitFor(()=>expect(onSaved).toHaveBeenCalledWith("Saved EMP-I-50"));expect(JSON.parse(createEmployee.mock.calls[0][0].get("payload"))).not.toHaveProperty("employee_id");
});

test("invitation stays unavailable until the sender is configured",async()=>{
 getMailSender.mockResolvedValue({configured:false});render(<EmployeeOnboardingInvite/>);const send=await screen.findByRole("button",{name:"Employee Public Form"});await screen.findByText("Set up your sender mailbox to send invitations.");expect(send).toBeDisabled();expect(screen.getByRole("button",{name:"Mail Configurations"})).toBeEnabled();expect(sendEmployeeOnboardingInvite).not.toHaveBeenCalled();
});
