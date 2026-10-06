import {employeeProfileCompletion} from "./employeeProfileCompletion";
import fixtures from "./employeeCompletionFixtures.json";
test.each(fixtures)("directory and profile completion match $expected percent",({employee,expected})=>{expect(employeeProfileCompletion(employee).percentage).toBe(expected);});
