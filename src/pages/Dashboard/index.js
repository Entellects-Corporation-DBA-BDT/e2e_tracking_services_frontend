import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  getDashboardSummary,
  getRecentActivities,
  getSubmissionAnalytics,
} from "../../api/applicationApi";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import Clients from "./Clients";
import DashboardCards from "./DashboardCards";
import DashboardGraphs from "./DashboardGraphs";
import DashboardTable from "./DashboardTable";
import Loader from "./Loader";
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

import JobView from "../../forms/JobView";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPresetDateRange = (filter) => {
  const today = new Date();
  const start = new Date(today);

  if (filter === "this_week") {
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(today.getDate() - daysSinceMonday);
  } else if (filter === "this_month") {
    start.setDate(1);
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(today),
  };
};

function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilter, setAppliedFilter] = useState(() => ({
    filter: "today",
    ...getPresetDateRange("today"),
  }));
  const [category, setCategory] = useState("benchsales");
  const [summary, setSummary] = useState({});
  const [analytics, setAnalytics] = useState({ data: [], total: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeRequest = useRef(0);

  const filterParams = useMemo(() => {
    const params = {
      filter: appliedFilter.filter,
      category,
      start_date: appliedFilter.startDate,
      end_date: appliedFilter.endDate,
    };

    return params;
  }, [appliedFilter, category]);

  useEffect(() => {
    const requestId = activeRequest.current + 1;
    activeRequest.current = requestId;

    const loadDashboardData = async () => {
      setLoading(true);
      setErrorMessage("");

      const [summaryResult, analyticsResult] = await Promise.allSettled([
        getDashboardSummary(filterParams),
        getSubmissionAnalytics(filterParams),
      ]);

      if (activeRequest.current !== requestId) return;

      const failures = [];

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value || {});
      } else {
        failures.push("summary cards");
        console.error(summaryResult.reason);
      }

      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value || { data: [], total: 0 });
      } else {
        failures.push("graphs");
        console.error(analyticsResult.reason);
      }

      if (failures.length) {
        setErrorMessage(
          `Unable to refresh ${failures.join(" and ")}. Showing the last available data.`
        );
      }

      setLoading(false);
    };

    loadDashboardData();

    return () => {
      if (activeRequest.current === requestId) {
        activeRequest.current += 1;
      }
    };
  }, [filterParams]);

  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        const response = await getRecentActivities();

        if (response.success) {
          setActivities(response.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadRecentActivities();
  }, []);

  const handleStartDateChange = useCallback((date) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date) => {
    setEndDate(date);
  }, []);

  const handleCategoryChange = useCallback((nextCategory) => {
    setCategory(nextCategory);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setSelectedFilter(filter);

    if (filter !== "custom") {
      const dateRange = getPresetDateRange(filter);

      setAppliedFilter((currentFilter) => {
        if (
          currentFilter.filter === filter
          && currentFilter.startDate === dateRange.startDate
          && currentFilter.endDate === dateRange.endDate
        ) {
          return currentFilter;
        }

        return { filter, ...dateRange };
      });
    }
  }, []);

  const handleApplyDateFilter = useCallback(() => {
    if (!startDate || !endDate || startDate > endDate) return;

    setAppliedFilter((currentFilter) => {
      if (
        currentFilter.filter === "custom"
        && currentFilter.startDate === startDate
        && currentFilter.endDate === endDate
      ) {
        return currentFilter;
      }

      return { filter: "custom", startDate, endDate };
    });
  }, [startDate, endDate]);


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
                  {errorMessage && (
                    <p role="alert" className="e2e_dashboard_error">
                      {errorMessage}
                    </p>
                  )}
                  {loading ? (
                    <Loader fullPage />
                  ) : (
                    <>
                      <DashboardCards summary={summary} />
                      <DashboardGraphs
                        analytics={analytics}
                        selectedFilter={selectedFilter}
                        startDate={startDate}
                        endDate={endDate}
                        category={category}
                        onStartDateChange={handleStartDateChange}
                        onEndDateChange={handleEndDateChange}
                        onFilterChange={handleFilterChange}
                        onCategoryChange={handleCategoryChange}
                        onApplyDateFilter={handleApplyDateFilter}
                      />
                    </>
                  )}
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
            <Route
              path="jobview/:jobId"
              element={<JobView />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
