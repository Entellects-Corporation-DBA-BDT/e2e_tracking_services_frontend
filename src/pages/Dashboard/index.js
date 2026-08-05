import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  getDashboardTable,
  getDashboardSummary,
  getSubmissionAnalytics,
  getWorkforceAnalytics,
} from "../../api/applicationApi";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import DashboardCards from "./DashboardCards";
import DashboardGraphs from "./DashboardGraphs";
import DashboardTable from "./DashboardTable";
import OperationsCommandCenter from "./OperationsCommandCenter";
import WorkforceSubmissionAnalytics from "./WorkforceSubmissionAnalytics";
import DashboardRecordView from "./DashboardRecordView";
import Loader from "./Loader";
import useDynamicResourceRoutes from "./DynamicResourceRoutes";
import { usePermissions } from "../../auth/PermissionContext";
// import Resources from "./Resources";

import "../../styles/Dashboard/index.css";

const formatDate = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);

const newYorkCalendarDate = () => {
  const value = formatDate(new Date());
  return new Date(`${value}T12:00:00`);
};

const getPresetDateRange = (filter) => {
  const today = newYorkCalendarDate();
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

const ConfidentialResourceNotice = () => (
  <section className='e2e_confidential_notice' role='alert'>
    <span>ADMIN ONLY</span>
    <h2>Confidential company information</h2>
    <p>Client and vendor details are company property and can only be viewed by administrators.</p>
  </section>
);

const TABLES = {
  submissions: {
    title: "Submissions",
    columns: [
      ["submission_date", "Submission Date"], ["candidate", "Candidate"],
      ["recruiter", "Recruiter"], ["vendor", "Vendor"], ["client", "Client"],
      ["technology", "Technology"], ["status", "Status"], ["rate", "Rate"],
      ["location", "Location"], ["interview_slot", "Interview Slot"],
      ["feedback", "Feedback"],
    ],
  },
  active_candidates: {
    endpoint: "active-candidates",
    title: "Active Candidates",
    columns: [
      ["candidate", "Candidate"], ["technology", "Technology"],
      ["experience", "Experience"], ["visa", "Visa"],
      ["current_location", "Current Location"], ["preferred_location", "Preferred Location"],
      ["recruiter", "Recruiter"], ["availability", "Availability"], ["status", "Status"],
    ],
  },
  interviews: {
    title: "Interviews",
    columns: [
      ["interview_date", "Interview Date"], ["candidate", "Candidate"],
      ["client", "Client"], ["vendor", "Vendor"], ["interview_type", "Interview Type"],
      ["round", "Round"], ["recruiter", "Recruiter"], ["status", "Status"],
      ["feedback", "Feedback"],
    ],
  },
  placements: {
    title: "Placements",
    columns: [
      ["placement_date", "Placement Date"], ["candidate", "Candidate"],
      ["client", "Client"], ["vendor", "Vendor"], ["recruiter", "Recruiter"],
      ["location", "Location"], ["rate", "Rate"], ["start_date", "Start Date"],
      ["status", "Status"],
    ],
  },
};

const makeColumns = (columns) => columns.map(([key, label]) => ({
  key,
  label,
  sortable: !["experience", "preferred_location", "availability", "round", "start_date", "interview_slot", "feedback"].includes(key),
}));

function Dashboard() {
  const navigate = useNavigate();
  const dynamicResourceRoutes = useDynamicResourceRoutes();
  const { can, isAdmin } = usePermissions();
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilter, setAppliedFilter] = useState(() => ({
    filter: "today",
    ...getPresetDateRange("today"),
  }));
  const [category, setCategory] = useState("all");
  const [summary, setSummary] = useState({});
  const [analytics, setAnalytics] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCard, setSelectedCard] = useState("submissions");
  const [tableData, setTableData] = useState([]);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tableLimit, setTableLimit] = useState(20);
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tableSort, setTableSort] = useState("submission_date");
  const [tableOrder, setTableOrder] = useState("desc");
  const [tableRefresh, setTableRefresh] = useState(0);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [workforceAnalytics, setWorkforceAnalytics] = useState({});
  const [workforceLoading, setWorkforceLoading] = useState(true);
  const [workforceError, setWorkforceError] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [workforceRefresh, setWorkforceRefresh] = useState(0);
  const [workforcePeriod, setWorkforcePeriod] = useState("this_week");
  const activeRequest = useRef(0);
  const activeTableRequest = useRef(0);

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
  }, [filterParams, dashboardRefresh]);

  useEffect(() => {
    let active = true;
    const loadWorkforceAnalytics = async () => {
      setWorkforceLoading(true);
      setWorkforceError("");
      try {
        const result = await getWorkforceAnalytics(selectedEmployeeId, workforcePeriod);
        if (!active) return;
        setWorkforceAnalytics(result || {});
        setSelectedEmployeeId(
          result?.selected_employee_id || result?.employees?.[0]?.employee_id || null
        );
      } catch (error) {
        if (!active) return;
        console.error(error);
        setWorkforceError(
          error?.response?.data?.message || "Weekly employee analytics could not be loaded."
        );
      } finally {
        if (active) setWorkforceLoading(false);
      }
    };
    loadWorkforceAnalytics();
    return () => { active = false; };
  }, [selectedEmployeeId, workforcePeriod, workforceRefresh, dashboardRefresh]);

  useEffect(() => {
    const refreshDashboard = () => {
      setDashboardRefresh((value) => value + 1);
      setTableRefresh((value) => value + 1);
    };
    window.addEventListener("e2e-dashboard-refresh", refreshDashboard);
    return () => window.removeEventListener("e2e-dashboard-refresh", refreshDashboard);
  }, []);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const section = document.querySelector(window.location.hash);
    if (!section) return;
    window.requestAnimationFrame(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [loading]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(tableSearch), 350);
    return () => window.clearTimeout(timer);
  }, [tableSearch]);

  const selectedTable = TABLES[selectedCard];
  const tableColumns = useMemo(
    () => makeColumns(selectedTable.columns),
    [selectedTable]
  );

  useEffect(() => {
    const requestId = activeTableRequest.current + 1;
    activeTableRequest.current = requestId;

    const loadTable = async () => {
      setTableLoading(true);
      setTableError(false);
      try {
        const result = await getDashboardTable(
          selectedTable.endpoint || selectedCard,
          {
            page: tablePage,
            limit: tableLimit,
            search: debouncedSearch,
            sort: tableSort,
            order: tableOrder,
            start_date: appliedFilter.startDate,
            end_date: appliedFilter.endDate,
            category,
          }
        );
        if (activeTableRequest.current !== requestId) return;
        setTableData((result.data || []).map((row) => ({
          ...row,
          __candidateId: selectedCard === 'active_candidates'
            ? row.id
            : row.candidate_id || row.candidateId || null,
          __recruiterEmployeeId: row.recruiter_employee_id || row.recruiterEmployeeId || null,
        })));
        setTableTotal(result.total || 0);
      } catch (error) {
        if (activeTableRequest.current !== requestId) return;
        console.error(error);
        setTableData([]);
        setTableTotal(0);
        setTableError(true);
      } finally {
        if (activeTableRequest.current === requestId) setTableLoading(false);
      }
    };

    loadTable();
  }, [
    selectedCard, selectedTable, tablePage, tableLimit, debouncedSearch,
    tableSort, tableOrder, appliedFilter, category, tableRefresh,
  ]);

  const handleCardSelect = useCallback((card) => {
    const nextTable = TABLES[card];
    setSelectedCard(card);
    setTablePage(1);
    setTableSearch("");
    setDebouncedSearch("");
    setTableSort(nextTable.columns[0][0]);
    setTableOrder('desc');
    window.requestAnimationFrame(() => {
      document.getElementById('records')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleTableSort = useCallback((column) => {
    setTablePage(1);
    setTableSort((current) => {
      if (current === column) {
        setTableOrder((currentOrder) => currentOrder === "asc" ? "desc" : "asc");
        return current;
      }
      setTableOrder("asc");
      return column;
    });
  }, []);

  const handleExport = useCallback(async (format) => {
    try {
      const rows = [];
      const pageSize = 100;
      let exportPage = 1;
      let total = 0;
      do {
        const result = await getDashboardTable(selectedTable.endpoint || selectedCard, {
          page: exportPage,
          limit: pageSize,
          search: debouncedSearch,
          sort: tableSort,
          order: tableOrder,
          start_date: appliedFilter.startDate,
          end_date: appliedFilter.endDate,
          category,
          export: 1,
        });
        rows.push(...(result.data || []));
        total = result.total || 0;
        exportPage += 1;
      } while (rows.length < total);

      const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const headers = tableColumns.map((column) => column.label);
      const values = rows.map((row) => tableColumns.map((column) => row[column.key] ?? ""));
      let blob;
      let extension;

      if (format === "excel") {
        const html = `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${values.map((row) => `<tr>${row.map((value) => `<td>${String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
        blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
        extension = "xls";
      } else {
        const csv = [headers, ...values].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
        blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
        extension = "csv";
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedCard}-${formatDate(new Date())}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setTableError(true);
    }
  }, [
    selectedCard, selectedTable, debouncedSearch, tableSort, tableOrder,
    appliedFilter, category, tableColumns,
  ]);

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
                      {/* <DocumentExpiryWidget /> */}
                      <span id='overview' className='dashboard-section-anchor' aria-hidden='true' />
                      <DashboardCards
                        summary={summary}
                        selectedCard={selectedCard}
                        onSelect={handleCardSelect}
                      />
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
                      <span id='workforce' className='dashboard-section-anchor' aria-hidden='true' />
                      <WorkforceSubmissionAnalytics
                        data={workforceAnalytics}
                        loading={workforceLoading}
                        error={workforceError}
                        selectedEmployeeId={
                          selectedEmployeeId || workforceAnalytics.selected_employee_id
                        }
                        period={workforcePeriod}
                        onPeriodChange={(nextPeriod) => {
                          setSelectedEmployeeId(null);
                          setWorkforcePeriod(nextPeriod);
                        }}
                        onEmployeeSelect={setSelectedEmployeeId}
                        onRetry={() => setWorkforceRefresh((value) => value + 1)}
                        onSubmissionOpen={(id) =>
                          navigate(`/dashboard/records/submissions/${id}`)
                        }
                      />
                      <span id='operations' className='dashboard-section-anchor' aria-hidden='true' />
                      <OperationsCommandCenter summary={summary} refreshToken={dashboardRefresh} />
                    </>
                  )}
                  <span id='records' className='dashboard-section-anchor' aria-hidden='true' />
                  <DashboardTable
                    title={selectedTable.title}
                    columns={tableColumns}
                    data={tableData}
                    loading={tableLoading}
                    error={tableError}
                    search={tableSearch}
                    sort={tableSort}
                    order={tableOrder}
                    pagination={{ page: tablePage, limit: tableLimit, total: tableTotal }}
                    onSearch={(value) => {
                      setTableSearch(value);
                      setTablePage(1);
                    }}
                    onSort={handleTableSort}
                    onPageChange={setTablePage}
                    onLimitChange={(limit) => {
                      setTableLimit(limit);
                      setTablePage(1);
                    }}
                    onRefresh={() => setTableRefresh((value) => value + 1)}
                    onExport={can(`dashboard_${selectedCard}`, "export") ? handleExport : undefined}
                    onView={(row) => navigate(
                      selectedCard === "active_candidates"
                        ? `/dashboard/candidates/${row.id}`
                        : `/dashboard/records/${selectedCard}/${row.id}`
                    )}
                    onCandidateView={(row) => row.__candidateId && navigate(`/dashboard/candidates/${row.__candidateId}#reports`)}
                    onRecruiterView={(row) => row.__recruiterEmployeeId && navigate(`/dashboard/employee-status/${row.__recruiterEmployeeId}#profile-performance`)}
                    onAdd={() => navigate(
                      selectedCard === "active_candidates"
                        ? "/dashboard/candidates"
                        : "/dashboard/bench-sales"
                    )}
                  />
                </>
              }
            />
            {dynamicResourceRoutes}
            {!isAdmin && (
              <>
                <Route path='clients/*' element={<ConfidentialResourceNotice />} />
                <Route path='vendors/*' element={<ConfidentialResourceNotice />} />
              </>
            )}
            <Route
              path="records/:recordType/:recordId"
              element={<DashboardRecordView />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
