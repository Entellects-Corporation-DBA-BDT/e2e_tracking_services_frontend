import {render,screen,fireEvent,waitFor} from "@testing-library/react";
import AttendanceCalendar from "./AttendanceCalendar";
import {setEmployeeAttendanceDate} from "../api/employeeApi";
jest.mock("../api/employeeApi",()=>({setEmployeeAttendanceDate:jest.fn()}));
beforeEach(()=>jest.clearAllMocks());
test("admin confirmation is portaled, retains failures, and closes after successful retry",async()=>{
 setEmployeeAttendanceDate.mockRejectedValueOnce({response:{data:{message:"Please retry"}}}).mockResolvedValueOnce({message:"Saved"});
 const changed=jest.fn();render(<AttendanceCalendar employeeId={7} records={[]} canManage initialMonth="2020-01-01" onChanged={changed}/>);
 fireEvent.click(screen.getByRole("button",{name:"2020-01-02: Mark present"}));const dialog=screen.getByRole("alertdialog");expect(dialog.parentElement.parentElement).toBe(document.body);expect(screen.getByText("2020-01-02")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Mark Present"}));await waitFor(()=>expect(screen.getAllByText("Please retry").length).toBeGreaterThan(0));expect(screen.getByRole("alertdialog")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Mark Present"}));await waitFor(()=>expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());expect(changed).toHaveBeenCalledTimes(1);expect(setEmployeeAttendanceDate).toHaveBeenLastCalledWith(7,"2020-01-02",true);
});
test("cancel and protected clock records never write attendance",()=>{render(<AttendanceCalendar employeeId={7} records={[{date:"2020-01-03",admin_created:0}]} canManage initialMonth="2020-01-01"/>);expect(screen.getByRole("button",{name:"2020-01-03: Recorded through clock-in"})).toBeDisabled();fireEvent.click(screen.getByRole("button",{name:"2020-01-02: Mark present"}));fireEvent.keyDown(screen.getByRole("alertdialog"),{key:"Escape"});expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();expect(setEmployeeAttendanceDate).not.toHaveBeenCalled();});
