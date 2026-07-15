import { useEffect, useState } from "react";
import "../../styles/Dashboard/jobs.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import FormView from "../../forms/FormView";
import getUserDataFromCookies from "../../utils/getUserDataFromCookies";
import { useNavigate } from "react-router-dom";

import { getJobsData } from "../../api/jobApi";

const user = getUserDataFromCookies();
const loginUserId = user?.user_id;

function Jobs() {
  const [openForm, setOpenForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [entries, setEntries] = useState(5);

  const [tableData, setTableData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [initialLoading, setInitialLoading] = useState(true);

  const [tableLoading, setTableLoading] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }

      const response = await getJobsData(
        currentPage,
        entries,
        debouncedSearch
      );

      setTableData(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      console.error("Error fetching jobs:", err);
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
    fetchJobs();
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
    <div className="e2e_jobs_page">

      <div className="e2e_jobs_top">

        <div className="e2e_jobs_left">

          <h2>Jobs List</h2>

          <div className="e2e_jobs_heading_line"></div>

        </div>

        <div className="e2e_jobs_right">

          <button
            onClick={() => setOpenForm("job")}
          >
            + Add New
          </button>

        </div>

      </div>

      <div className="e2e_jobs_filters">

        <div className="e2e_jobs_filter_right">

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

        </div>

        <select
          value={entries}
          className="e2e_pagination_number"
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

        <table>

          <thead>

            <tr>

              <th>#</th>

              <th>Job Details</th>

              <th>Location</th>

              <th>Date of Posted</th>


              <th>Status</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {tableLoading ? (

              <tr>

                <td
                  colSpan="7"
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

                  <td>

                    <div className="e2e_jobs_details">

                      <p>


                        <strong>

                          {item.position}

                        </strong>

                      </p>

                      <p>

                        <strong>

                          {item.technology}

                        </strong>

                      </p>

                    </div>

                  </td>
                  <td>

                    {item.location}

                  </td>

                  <td>

                    {convertDate(item.created_at)}

                  </td>


                  <td>

                    {item.status}

                  </td>

                  <td>

                    <div className="e2e_jobs_actions">

                      <button
                        className="viewBtn"
                        onClick={() => navigate(`/dashboard/jobview/${item.id}`)}
                      >
                        View
                      </button>

                      <button
                        className="editBtn"
                        onClick={() => {
                          setSelectedJobId(item.id);
                          setOpenForm("jobEdit");
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="deleteBtn"
                        onClick={() => {
                          setSelectedJobId(item.id);
                          setOpenForm("jobDelete");
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
                  colSpan="7"
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
        jobId={selectedJobId}
        refreshData={fetchJobs}
      />

    </div>
  );
}

export default Jobs;