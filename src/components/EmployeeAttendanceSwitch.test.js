import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import EmployeeAttendanceSwitch from "./EmployeeAttendanceSwitch";
import {getTodayAttendance,clockAttendance} from "../api/employeeApi";
jest.mock("../api/employeeApi",()=>({getTodayAttendance:jest.fn(),clockAttendance:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();getTodayAttendance.mockResolvedValue({work_date:"2026-10-05",network:{allowed:true},record:null})});
test("logs in and out inline using the stored employee code",async()=>{
 const changed=jest.fn();clockAttendance.mockResolvedValue({success:true,message:"Attendance recorded"});render(<EmployeeAttendanceSwitch employeeCode="BDT-I-133" onChanged={changed}/>);const toggle=await screen.findByRole("switch",{name:"Attendance login"});await waitFor(()=>expect(toggle).toBeEnabled());
 getTodayAttendance.mockResolvedValue({work_date:"2026-10-05",network:{allowed:true},record:{time_in:"09:30:00",time_out:"00:00:00"}});fireEvent.click(toggle);await waitFor(()=>expect(toggle).toHaveAttribute("aria-checked","true"));expect(clockAttendance).toHaveBeenCalledWith("in","BDT-I-133");expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
 getTodayAttendance.mockResolvedValue({work_date:"2026-10-05",network:{allowed:true},record:{time_in:"09:30:00",time_out:"18:30:00"}});fireEvent.click(toggle);await screen.findByText("Shift completed");expect(clockAttendance).toHaveBeenLastCalledWith("out","BDT-I-133");expect(toggle).toBeDisabled();expect(changed).toHaveBeenCalledTimes(2);
});
test("keeps the attendance switch disabled outside the allowed network",async()=>{
 getTodayAttendance.mockResolvedValue({network:{allowed:false,ip:"203.0.113.10"},record:null});render(<EmployeeAttendanceSwitch employeeCode="BDT-I-133"/>);await screen.findByText(/Company network required/);const toggle=screen.getByRole("switch");expect(toggle).toBeDisabled();fireEvent.click(toggle);expect(clockAttendance).not.toHaveBeenCalled();
});
test("preserves logged-out state when the server rejects attendance",async()=>{
 clockAttendance.mockRejectedValue({response:{data:{message:"Company IP required"}}});render(<EmployeeAttendanceSwitch employeeCode="BDT-I-133"/>);const toggle=screen.getByRole("switch");await waitFor(()=>expect(toggle).toBeEnabled());fireEvent.click(toggle);expect(await screen.findByRole("alert")).toHaveTextContent("Company IP required");expect(toggle).toHaveAttribute("aria-checked","false");
});

test("compact banner preserves network protection and opens the report",async()=>{
 getTodayAttendance.mockResolvedValue({work_date:"2026-10-06",network:{allowed:false,ip:"203.0.113.10"},record:{time_in:"09:12:00",time_out:"00:00:00"}});const view=jest.fn();render(<EmployeeAttendanceSwitch compact employeeCode="BDT-I-133" onViewAttendance={view}/>);await screen.findByText(/Company network required. Current IP/);expect(screen.getByRole("switch")).toBeDisabled();fireEvent.click(screen.getByRole("button",{name:/View Attendance/}));expect(view).toHaveBeenCalledTimes(1);expect(clockAttendance).not.toHaveBeenCalled();
});

 test("attendance login requires an assigned employee ID",async()=>{
 render(<EmployeeAttendanceSwitch employeeCode={null} compact/>);await screen.findByText(/HR must assign your employee ID/);await waitFor(()=>expect(getTodayAttendance).toHaveBeenCalled());expect(screen.getByRole("switch")).toBeDisabled();fireEvent.click(screen.getByRole("switch"));expect(clockAttendance).not.toHaveBeenCalled();
 });
