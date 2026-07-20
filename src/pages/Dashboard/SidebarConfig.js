import {
  FaHome,
  FaUsers,
  FaBriefcase,
  FaClipboardList,
  FaUserTie,
  FaFire,
  FaHandshake,
  FaBuilding,
  FaGraduationCap,
  FaComments,
  FaLaptopCode,
  FaIdBadge,
  FaBell,
} from "react-icons/fa";

export const sidebarConfig = {
  dashboard: {
    icon: <FaHome className="menuIcon" />,
    route: "/dashboard",
  },
  recruiting: {
    icon: <FaUsers className="menuIcon purpleIcon" />,
    route: "/dashboard/recruiting",
  },
  bench_sales: {
    icon: <FaClipboardList className="menuIcon blueIcon" />,
    route: "/dashboard/bench-sales",
  },
  hot_list: {
    icon: <FaFire className="menuIcon redIcon" />,
    route: "/dashboard/hotlist",
  },
  jobs: {
    icon: <FaBriefcase className="menuIcon orangeIcon" />,
    route: "/dashboard/jobs",
  },
  prime_vendors: {
    icon: <FaHandshake className="menuIcon pinkIcon" />,
    route: "/dashboard/vendors",
  },
  clients: {
    icon: <FaBuilding className="menuIcon greenIcon" />,
    route: "/dashboard/clients",
  },
  candidates: {
    icon: <FaUserTie className="menuIcon violetIcon" />,
    route: "/dashboard/candidates",
  },
  document_reminders: {
    icon: <FaBell className="menuIcon orangeIcon" />,
    route: "/dashboard/document-reminders",
  },
  training: {
    icon: <FaGraduationCap className="menuIcon yellowIcon" />,
    route: "/dashboard/training",
  },
  candidate_onboarding: {
    icon: <FaLaptopCode className="menuIcon cyanIcon" />,
    route: "/dashboard/candidate-onboarding",
  },
  vendor_onboarding: {
    icon: <FaComments className="menuIcon tealIcon" />,
    route: "/dashboard/vendor-onboarding",
  },
  emp_status_report: {
    icon: <FaIdBadge className="menuIcon indigoIcon" />,
    route: "/dashboard/employee-status",
  },
};
