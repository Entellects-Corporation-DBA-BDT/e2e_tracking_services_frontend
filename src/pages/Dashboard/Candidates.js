import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard/candidates.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";

import { getCandidateData } from "../../api/candidateApi";

const user = getUserDataFromCookies();
const loginUserId = user?.user_id;

function Candidates() {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [entries, setEntries] = useState(5);

  const [tableData, setTableData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [initialLoading, setInitialLoading] = useState(true);

  const [tableLoading, setTableLoading] = useState(false);

  const [selectedCandidateId, setSelectedCandidateId] =
    useState(null);
  const [selectedCandidateName, setSelectedCandidateName] = useState("");

  const fetchCandidates = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }

      const response = await getCandidateData(
        currentPage,
        entries,
        debouncedSearch
      );

      setTableData(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCandidates();
  }, [currentPage, entries, debouncedSearch]);

  const convertDate = (date) => {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  if (initialLoading) {
    return <Loader fullPage />;
  }

  return (
    <div className="e2e_candidates_page">

      <div className="e2e_candidates_top">
        <div>
          <h2>Candidate List</h2>
          <div className="e2e_candidates_heading_line"></div>
        </div>

        <button
          className="e2e_candidates_add_btn"
          onClick={() => setOpenForm("candidate")}
        >
          + Add New
        </button>
      </div>

      <div className="e2e_candidates_filters">

        <div className="e2e_candidates_filter_right">

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            className="e2e_candidates_search"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

        </div>

        <select
          className="e2e_candidates_entries"
          value={entries}
          onChange={(e) => {
            setEntries(Number(e.target.value));
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

      <div className="e2e_jobs_table_wrapper">

        <table className="e2e_candidates_table">

          <thead>

            <tr>

              <th>#</th>

              <th>Candidate Name</th>

              <th>Position</th>


              <th>Email</th>

              <th>Phone</th>

              <th>Status</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

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

              tableData.map((item, index) => (

                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.skills}</td>

                  <td
                    style={{
                      color:
                        Number(loginUserId) ===
                          Number(item.employee_id)
                          ? "#16a34a"
                          : "#1f1e1e",

                      fontWeight:
                        Number(loginUserId) ===
                          Number(item.employee_id)
                          ? "600"
                          : "400",
                    }}
                  >
                    {item.employee_name}
                  </td>

                  <td>{item.email}</td>

                  <td>{item.phone}</td>

                  <td>{item.status}</td>

                  <td>

                    <div className="e2e_candidates_actions">

                      <button
                        className="e2e_candidates_view_btn"
                        onClick={() => navigate(`/dashboard/candidates/${item.id}`)}
                      >
                        View
                      </button>

                      <button
                        className="e2e_candidates_edit_btn"
                        onClick={() => {
                          setSelectedCandidateId(item.id);
                          setSelectedCandidateName(item.name);
                          setOpenForm("candidateEdit");
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="e2e_candidates_delete_btn"
                        onClick={() => {
                          setSelectedCandidateId(item.id);
                          setSelectedCandidateName(item.name);
                          setOpenForm("candidateDelete");
                        }}
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

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
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <FormView
        openForm={openForm}
        setOpenForm={setOpenForm}
        candidateId={selectedCandidateId}
        recordName={selectedCandidateName}
        refreshData={fetchCandidates}
      />

    </div>
  );
}

export default Candidates;
