import {getEmployeePhoto,uploadEmployeePhoto,removeEmployeePhoto} from "./employeeApi";
import axiosInstance from "./axiosInstance";
import Cookies from "js-cookie";
jest.mock("./axiosInstance",()=>({get:jest.fn(),post:jest.fn(),delete:jest.fn()}));
jest.mock("js-cookie",()=>({get:jest.fn()}));
beforeEach(()=>jest.clearAllMocks());
test("concurrent portrait readers share one request and reuse the loaded blob",async()=>{Cookies.get.mockReturnValue("session-one");const blob=new Blob(["photo"]);axiosInstance.get.mockResolvedValue({data:blob});const [a,b]=await Promise.all([getEmployeePhoto(7),getEmployeePhoto(7)]);expect(a).toBe(blob);expect(b).toBe(blob);await getEmployeePhoto(7);expect(axiosInstance.get).toHaveBeenCalledTimes(1);});
test("upload refreshes cached bytes, removal invalidates, and another login cannot reuse cache",async()=>{Cookies.get.mockReturnValue("session-two");axiosInstance.get.mockResolvedValue({data:new Blob(["old"])});await getEmployeePhoto(8);const file=new File(["new"],"photo.png",{type:"image/png"});axiosInstance.post.mockResolvedValue({data:{success:true}});await uploadEmployeePhoto(8,file);expect(await getEmployeePhoto(8)).toBe(file);expect(axiosInstance.get).toHaveBeenCalledTimes(1);axiosInstance.delete.mockResolvedValue({data:{success:true}});await removeEmployeePhoto(8);await getEmployeePhoto(8);expect(axiosInstance.get).toHaveBeenCalledTimes(2);Cookies.get.mockReturnValue("session-three");await getEmployeePhoto(8);expect(axiosInstance.get).toHaveBeenCalledTimes(3);});
