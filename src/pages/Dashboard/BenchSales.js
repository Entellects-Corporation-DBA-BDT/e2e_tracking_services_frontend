import { useEffect, useState } from "react";
import "../../styles/Dashboard/benchsales.css";
import Loader from "./Loader";
import NewBenchSalesForm from "../../forms/NewBenchSalesForm";
import { getBenchSalesData } from "../../api/applicationApi";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";
import { useNavigate } from "react-router-dom";

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
        debouncedSearch
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
  ]);


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
                          setOpenForm("performence");
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
      <div className="e2e_recruiting_filters">
        <div className="e2e_recruiting_filter_right">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(
                e.target.value
              );

              setCurrentPage(1);
            }}
          />
          
        </div>

        <select
          value={entries}
          className="e2e_pagination_number"
          onChange={(e) => {
            setEntries(
              Number(e.target.value)
            );
            setCurrentPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
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
                      <p>Name : <strong>{item.candidate_name}</strong></p>
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
                    {item.employee_name}
                  </td>

                  <td className="e2e_benchsales_td_poc">{item.poc}</td>
                  <td className="e2e_benchsales_td_client">{item.client}</td>
                  <td className="e2e_benchsales_td_process">
                    <span className={`e2e_benchsales_process_badge e2e_benchsales_process_${process.className}`}>
                      {process.className === "placed" && <span aria-hidden="true">✓</span>}
                      {process.label}
                    </span>
                    {process.className === "placed" && <small className="e2e_benchsales_placed_note">Submission placed</small>}
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
      <Pagination
        currentPage={
          currentPage
        }
        totalPages={
          totalPages
        }
        onPageChange={
          setCurrentPage
        }
      />
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
