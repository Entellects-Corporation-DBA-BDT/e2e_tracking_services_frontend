import {render,screen,fireEvent} from "@testing-library/react";
import EmployeeView from "./EmployeeView";
import {getEmployeeById,getEmployeeAttendance} from "../../api/employeeApi";
const mockAttendanceRender=jest.fn();
const mockNavigate=jest.fn();
const mockActions=jest.fn();
const mockAttendancePermission={allowed:true};
beforeEach(()=>{mockAttendancePermission.allowed=true});
jest.mock("react-router-dom",()=>({useParams:()=>({employeeId:"3"}),useLocation:()=>({pathname:"/dashboard/my-profile/3"}),useNavigate:()=>mockNavigate}),{virtual:true});
jest.mock("../../auth/PermissionContext",()=>({usePermissions:()=>({can:resource=>resource!=="attendance"||mockAttendancePermission.allowed,scope:()=>"ALL",user:{id:7}})}));
jest.mock("../../api/employeeApi",()=>({getEmployeeById:jest.fn(),removeCompanyName:jest.fn(),getEmployeeAttendance:jest.fn().mockResolvedValue({summary:{present_days:0,total_hours:0},data:[],trend:[],leaves:[]})}));
jest.mock("../../components/EmployeeProfileInformation",()=>props=> <div>Profile information<span data-testid="visible-sections">{props.visibleSections.join(",")}</span></div>);
jest.mock("../../components/EmployeeAttendanceSwitch",()=>()=> <div>Attendance switch</div>);
jest.mock("../../components/AttendanceActions",()=>props=>{mockActions(props);return <div>Leave Management</div>});
jest.mock("../../components/AttendancePanel",()=>props=>{mockAttendanceRender(props);return <div data-testid="attendance-report">Attendance Report<button onClick={props.onHide}>Hide Attendance Report</button></div>});
test("attendance insights only mount when opened and hide on request",async()=>{
 getEmployeeAttendance.mockResolvedValue({summary:{present_days:0,total_hours:0},data:[],trend:[],leaves:[]});getEmployeeById.mockResolvedValue({data:{id:3,user_id:7,employee_id:"BDT-I-133",legal_name:"Test Employee",role:"HR"}});render(<EmployeeView/>);await screen.findByText("Profile information");expect(screen.queryByTestId("attendance-report")).not.toBeInTheDocument();expect(mockAttendanceRender).not.toHaveBeenCalled();fireEvent.click(screen.getByRole("tab",{name:"Attendance"}));expect(screen.getByTestId("attendance-report")).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:"Hide Attendance Report"}));expect(screen.queryByTestId("attendance-report")).not.toBeInTheDocument();
});

test("monthly attendance is not fetched without attendance permission",async()=>{
 mockAttendancePermission.allowed=false;getEmployeeById.mockResolvedValue({data:{id:3,user_id:7,employee_id:"BDT-I-133",legal_name:"Test Employee",role:"HR"}});render(<EmployeeView/>);await screen.findByText("Profile information");expect(getEmployeeAttendance).not.toHaveBeenCalled();expect(screen.queryByRole("button",{name:"View Attendance Report"})).not.toBeInTheDocument();
});
 test("tabs isolate details and remove project content",async()=>{
 getEmployeeAttendance.mockResolvedValue({summary:{present_days:0,total_hours:0}});getEmployeeById.mockResolvedValue({data:{id:3,user_id:7,legal_name:"Test Employee",role:"HR"}});render(<EmployeeView/>);await screen.findByText("Profile information");
 expect(screen.getByTestId("visible-sections")).toHaveTextContent("profile-completion");
 fireEvent.click(screen.getByRole("tab",{name:"Personal"}));expect(screen.getByTestId("visible-sections").textContent).toBe("profile-details");expect(screen.queryByText("Company Identity")).not.toBeInTheDocument();expect(screen.queryByText("Total Hours")).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("tab",{name:"Employment"}));expect(screen.getByText("Company Identity")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("tab",{name:"Documents"}));expect(screen.getByTestId("visible-sections")).toHaveTextContent("profile-documents,profile-declaration");expect(screen.queryByText("Company Identity")).not.toBeInTheDocument();expect(screen.queryByText(/Projects/)).not.toBeInTheDocument();
 });
 test.each([["Sr. IT Recruiter","/dashboard/recruiting/performance"],["Jr. Bench Sales","/dashboard/bench-sales/performance"]])("%s opens the correct performance report",async(role,route)=>{
 getEmployeeAttendance.mockResolvedValue({summary:{}});getEmployeeById.mockResolvedValue({data:{id:3,user_id:7,legal_name:"Test Employee",role}});render(<EmployeeView/>);await screen.findByText("Profile information");fireEvent.click(screen.getByRole("button",{name:"Performance"}));expect(mockNavigate).toHaveBeenCalledWith(route);
 });

test("leave management is available only in the Leave tab and hidden in profile attendance",async()=>{getEmployeeAttendance.mockResolvedValue({summary:{}});getEmployeeById.mockResolvedValue({data:{id:3,user_id:7,legal_name:"Test Employee",role:"HR"}});render(<EmployeeView/>);await screen.findByText("Profile information");expect(screen.queryByText("Leave Management")).not.toBeInTheDocument();fireEvent.click(screen.getByRole("tab",{name:"Leave"}));expect(screen.getByText("Leave Management")).toBeInTheDocument();expect(mockActions).toHaveBeenLastCalledWith(expect.objectContaining({isOwn:true,showClock:false,showHolidays:false,canManage:true}));fireEvent.click(screen.getByRole("tab",{name:"Attendance"}));expect(screen.queryByText("Leave Management")).not.toBeInTheDocument();expect(mockAttendanceRender).toHaveBeenLastCalledWith(expect.objectContaining({showLeave:false}));});

test("Performance is the last profile navigation action",async()=>{getEmployeeAttendance.mockResolvedValue({summary:{}});getEmployeeById.mockResolvedValue({data:{id:3,user_id:7,legal_name:"Employee",role:"IT Recruiter"}});render(<EmployeeView/>);await screen.findByText("Profile information");const nav=screen.getByRole("tablist",{name:"Profile sections"});expect(nav.querySelectorAll('button')[nav.querySelectorAll('button').length-1]).toHaveTextContent("Performance");});
