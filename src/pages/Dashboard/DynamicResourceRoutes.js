import { Route } from "react-router-dom";
import { usePermissions } from "../../auth/PermissionContext";
import Recruiting from "./Recruiting";
import BenchSales from "./BenchSales";
import HotList from "./HotList";
import Jobs from "./Jobs";
import PrimeVendors from "./PrimeVendors";
import Clients from "./Clients";
import Candidates from "./Candidates";
import Training from "./Training";
import CandidateOnboarding from "./CandidateOnboarding";
import EmployeeStatusReport from "./EmpStatus";
import UserManagement from "./UserManagement";
import MyProfile from "./MyProfile";
import PermissionMatrix from "./PermissionMatrix";
import DocumentReminders from "./DocumentReminders";
import ApplicationPageView from "./ApplicationPageView";
import PrimeVendorView from "./PrimeVendorView";
import EmployeeView from "./EmployeeView";
import CandidateView from "../../forms/CandidateView";
import JobView from "../../forms/JobView";
import AccessCatalog from "./AccessCatalog";
import AttendanceManagement from "./AttendanceManagement";

const PAGE_COMPONENTS = {
  recruiting: <Recruiting />,
  "bench-sales": <BenchSales />,
  hotlist: <HotList />,
  jobs: <Jobs />,
  vendors: <PrimeVendors />,
  clients: <Clients />,
  candidates: <Candidates />,
  training: <Training />,
  "candidate-onboarding": <CandidateOnboarding />,
  employees: <EmployeeStatusReport />,
  users: <UserManagement />,
  profile: <MyProfile />,
  attendance: <AttendanceManagement />,
  permissions: <PermissionMatrix />,
  positions: <AccessCatalog type="positions" />,
  resources: <AccessCatalog type="resources" />,
  "document-reminders": <DocumentReminders />,
};

const DETAIL_COMPONENTS = {
  recruiting: [{ suffix: ":applicationId", element: <ApplicationPageView module="recruiter" /> }],
  "bench-sales": [{ suffix: ":applicationId", element: <ApplicationPageView module="bench" /> }],
  vendors: [{ suffix: ":vendorId", element: <PrimeVendorView /> }],
  candidates: [{ suffix: ":candidateId", element: <CandidateView /> }],
  employees: [{ suffix: ":employeeId", element: <EmployeeView /> }],
  profile: [{ suffix: ":employeeId", element: <EmployeeView /> }],
  jobs: [{ suffix: "jobview/:jobId", absolute: true, element: <JobView /> }],
};

const relativePath = (route) => route.replace(/^\/dashboard\/?/, "").replace(/^\/|\/$/g, "");

export default function useDynamicResourceRoutes() {
  const { resources } = usePermissions();
  return resources
    .filter((resource) => resource.resource_type === "PAGE"
      && resource.permissions?.view
      && resource.route
      && resource.component_key
      && resource.component_key !== "dashboard")
    .flatMap((resource) => {
      const component = PAGE_COMPONENTS[resource.component_key];
      if (!component) return [];
      const path = relativePath(resource.route);
      const routes = [<Route key={resource.id} path={path} element={component} />];
      for (const detail of DETAIL_COMPONENTS[resource.component_key] || []) {
        const detailPath = detail.absolute ? detail.suffix : `${path}/${detail.suffix}`;
        routes.push(<Route key={`${resource.id}-${detailPath}`} path={detailPath} element={detail.element} />);
      }
      return routes;
    });
}
