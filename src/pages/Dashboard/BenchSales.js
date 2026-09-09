import { useEffect, useState } from "react";
import "../../styles/Dashboard/benchsales.css";
import Loader from "./Loader";
import NewBenchSalesForm from "../../forms/NewBenchSalesForm";
import { getBenchSalesData } from "../../api/applicationApi";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";
import { useNavigate } from "react-router-dom";
import ApplicationListControls from "./ApplicationListControls";
import { downloadApplicationExcel } from "../../utils/applicationListTools";

const user = getUserDataFromCookies();
const loginUserId = user?.user_id;

const PROCESS_STATUS = {
  1: { label: "Submitted", className: "submitted" },
  2: { label: "Interview Scheduled", className: "interview" },
  3: { label: "Placed", className: "placed" },
};

function BenchSales() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entries, setEntries] = useState(5);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [datePeriod, setDatePeriod] = useState("all");
  const [dateFilters, setDateFilters] = useState({ start_date: "", end_date: "" });
  const [exporting, setExporting] = useState(false);

  const fetchCandidates = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }

      const response = await getBenchSalesData(
        currentPage,
        entries,
        debouncedSearch,
        dateFilters
      );

      setTableData(response.data || []);

      setTotalPages(
        response.total_pages || 1
      );
    } catch (error) {
      console.error(
        "Error fetching candidates:",
        error
      );
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  const convertDate = (date) => {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCandidates();
  }, [
    currentPage,
    entries,
    debouncedSearch,
    dateFilters,
  ]);

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await getBenchSalesData(1, 50000, debouncedSearch, dateFilters);
      downloadApplicationExcel(response.data || [], "Bench Sales", dateFilters);
    } catch (error) {
      alert(error?.response?.data?.message || "Bench Sales Excel report could not be generated.");
    } finally {
      setExporting(false);
    }
  };

  if (initialLoading) {
    return <Loader  fullPage />;
  }

  return (

    <div className="e2e_recruiting_page">
      <div className="e2e_recruiting_top">
        <div className="e2e_recruiting_left">
          <h2>
            BenchSales Application List
            <button className="performence-button" onClick={() => {
                          navigate("/dashboard/bench-sales/performance");
                        }}>Performance</button>
          </h2>
          <div className="e2e_recruiting_heading_line"></div>
        </div>

        <div className="e2e_recruiting_right">
          <button
            className="e2e_recruiting_add_btn"
            onClick={() =>
              setOpenForm("bench")
            }
          >
            + Add New
          </button>
        </div>
      </div>
      <ApplicationListControls
        period={datePeriod}
        dates={dateFilters}
        onPeriodChange={(value) => { setDatePeriod(value); setCurrentPage(1); }}
        onDatesChange={(value) => { setDateFilters(value); setCurrentPage(1); }}
        search={searchTerm}
        onSearchChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
        onExport={exportReport}
        exporting={exporting}
      />
      <div className="e2e_benchsales_table_wrapper">
        <table className="e2e_benchsales_table">
          <thead className="e2e_benchsales_thead">
            <tr className="e2e_benchsales_head_row">
              <th className="e2e_benchsales_th_id">#</th>
              <th className="e2e_benchsales_th_candidate">Candidate Details</th>

              <th className="e2e_benchsales_th_submission">Submission Date</th>
              <th className="e2e_benchsales_th_submission">Submitted By</th>

              <th className="e2e_benchsales_th_poc">POC</th>
              <th className="e2e_benchsales_th_client">Client</th>
              <th className="e2e_benchsales_th_process">Process</th>
              <th className="e2e_benchsales_th_action">Action</th>
            </tr>
          </thead>
          <tbody className="e2e_benchsales_tbody">
            {tableLoading ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "30px",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : tableData.length > 0 ? (
              tableData.map((item, index) => {
                const process = PROCESS_STATUS[Number(item.process_id)] || {
                  label: "Not Set",
                  className: "unknown",
                };

                return (
                <tr
                  key={item.id}
                  className={`e2e_benchsales_row ${process.className === "placed" ? "e2e_benchsales_row_placed" : ""}`}
                >
                  <td className="e2e_benchsales_td_id">{(currentPage - 1) * entries + index + 1} </td>
                  <td className="e2e_benchsales_td_candidate">
                    <div className="e2e_benchsales_details">
                      <p>Name : {item.candidate_id ? <button type="button" className="e2e_benchsales_record_link" onClick={() => navigate("/dashboard/candidates/" + item.candidate_id + "#reports")}>{item.candidate_name}</button> : <strong>{item.candidate_name}</strong>}</p>
                      <p>Technology :<strong>{item.role}</strong></p>
                    </div>
                  </td>
                  <td className="e2e_benchsales_td_submission">{convertDate(item.date_created)}</td>
                  <td
                    className="e2e_benchsales_td_submission"
                    style={{
                      color:
                        Number(loginUserId) === Number(item.employee_id)
                          ? "#16a34a"
                          : "#1f1e1e",
                      fontWeight:
                        Number(loginUserId) === Number(item.employee_id)
                          ? "600"
                          : "400",
                    }}
                  >
                    <button type="button" className="e2e_benchsales_record_link" onClick={() => navigate("/dashboard/employee-status/" + item.employee_id + "#profile-performance")}>{item.employee_name}</button>
                  </td>

                  <td className="e2e_benchsales_td_poc">{item.poc}</td>
                  <td className="e2e_benchsales_td_client">{item.client}</td>
                  <td className="e2e_benchsales_td_process">
                    <div className="e2e_benchsales_process_content">
                      <span className={`e2e_benchsales_process_badge e2e_benchsales_process_${process.className}`}>
                        {process.className === "placed" && <span aria-hidden="true">✓</span>}
                        {process.label}
                      </span>
                      <small className={`e2e_benchsales_process_note ${process.className === "placed" ? "visible" : ""}`}>
                        {process.className === "placed" ? "Submission placed" : "Status"}
                      </small>
                    </div>
                  </td>
                  <td className="e2e_benchsales_td_action">
                    <div className="e2e_benchsales_actions">
                      <button className="e2e_benchsales_view_btn" onClick={() => {
                        navigate(`/dashboard/bench-sales/${item.id}`);
                      }}>View</button>
                      <button
                        className="e2e_benchsales_edit_btn"
                        onClick={() => {
                          setSelectedApplicationId(item.id);
                          setOpenForm("benchEdit");
                        }}
                      >
                        Edit
                      </button>
                      <button className="e2e_benchsales_delete_btn" onClick={() => {
                          setSelectedApplicationId(item.id);
                          setOpenForm("benchDelete");
                        }}>Delete</button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "30px",
                  }}
                >
                  No Records Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="application-list-footer">
        <label className="application-bottom-rows"><select aria-label="Rows per page" value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setCurrentPage(1); }}>{[5, 10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
      {
        showPopup && (
          <NewBenchSalesForm
            closePopup={() =>
              setShowPopup(false)
            }
          />
        )
      }

      <FormView openForm={openForm} setOpenForm={setOpenForm} applicationId={selectedApplicationId} refreshData={fetchCandidates}/>

    </div>
  );
}

export default BenchSales;
