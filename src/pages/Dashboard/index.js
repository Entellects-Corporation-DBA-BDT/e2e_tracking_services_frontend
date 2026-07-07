import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { getDashboardSummary, getRecentActivities } from "../../api/applicationApi";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import Clients from "./Clients";
import DashboardCards from "./DashboardCards";
import DashboardGraphs from "./DashboardGraphs";
import DashboardTable from "./DashboardTable";
import Candidates from "./Candidates";
import PrimeVendors from "./PrimeVendors";
import Recruiting from "./Recruiting";
import BenchSales from "./BenchSales";
import HotList from "./HotList";
import Jobs from "./Jobs";
import Training from "./Training";
import CandidateOnboarding from "./CandidateOnboarding";
import EmployeeStatusReport from "./EmpStatus";
// import Resources from "./Resources"; 

import "../../styles/Dashboard/index.css";

import {
  FaUsers,
  FaBriefcase,
  FaUserTie,
  FaChartLine,
} from "react-icons/fa";

function Dashboard() {
  const [cards, setCards] = useState([]);

  const [activities, setActivities] = useState([]);

  const [tableData, setTableData] =
    useState(activities);

  useEffect(() => {

  const loadDashboard = async () => {

    try {

      const [summary, activityResponse] =
        await Promise.all([
          getDashboardSummary(),
          getRecentActivities()
        ]);

      setCards([
        {
          title: "Today's Submissions",
          count: summary.today_submissions || 0,
          growth: "8%",
          icon: <FaBriefcase />,
        },
        {
          title: "Weekly Submissions",
          count: summary.weekly_submissions || 0,
          growth: "10%",
          icon: <FaChartLine />,
        },
        {
          title: "Interviews",
          count: summary.interviews || 0,
          growth: "5%",
          icon: <FaUsers />,
        },
        {
          title: "Placements",
          count: summary.placements || 0,
          growth: "0%",
          icon: <FaUserTie />,
        },
      ]);

      if (activityResponse.success) {
        setActivities(activityResponse.data);
      }

    } catch (error) {

      console.error(error);

    }

  };

  loadDashboard();

}, []);


  return (
    <div className="e2e_dashboard_main_layout">

      {/* Sidebar */}
      <Sidebar />

      {/* Right Section */}
      <div className="e2e_dashboard_right_section">

        <Navbar />

        <div className="e2e_dashboard_scroll_content">

          <Routes>

            {/* Dashboard Home */}
            <Route
              index
              element={
                <>
                  <DashboardCards
                    cards={cards}
                  />

                  <DashboardGraphs />

                  <DashboardTable
  activities={activities}
/>
                </>
              }
            />

            <Route
              path="recruiting"
              element={<Recruiting />}
            />

            <Route
              path="bench-sales"
              element={<BenchSales />}
            />

            <Route
              path="hotlist"
              element={<HotList />}
            />

            <Route
              path="jobs"
              element={<Jobs />}
            />

            <Route
              path="vendors"
              element={<PrimeVendors />}
            />

            <Route
              path="clients"
              element={<Clients />}
            />
            <Route
              path="candidates"
              element={<Candidates />}
            />

            <Route
              path="training"
              element={<Training />}
            />

            <Route
              path="candidate-onboarding"
              element={<CandidateOnboarding />}
            />

            <Route
              path="employee-status"
              element={<EmployeeStatusReport />}
            />

          </Routes>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;