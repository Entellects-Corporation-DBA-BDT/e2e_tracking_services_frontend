import { useEffect, useState } from "react";
import "../../styles/Dashboard/candidates.css";
import Loader from "./Loader";
import NewCandidateForm from "../../forms/NewCandidateForm";

function Candidates() {

  const [loading, setLoading] = useState(true);
  const [showCandidatePopup, setShowCandidatePopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState(10);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setTableData([

        {
          id: 1,
          requirementDate: "28-May-2026",
          requirementName: "Senior Java Developer",
          clientName: "Infosys",
        },

        {
          id: 2,
          requirementDate: "27-May-2026",
          requirementName: "React Developer",
          clientName: "TCS",
        },

        {
          id: 3,
          requirementDate: "26-May-2026",
          requirementName: "DevOps Engineer",
          clientName: "Wipro",
        },

        {
          id: 4,
          requirementDate: "25-May-2026",
          requirementName: ".NET Developer",
          clientName: "Accenture",
        },

        {
          id: 5,
          requirementDate: "24-May-2026",
          requirementName: "Python Developer",
          clientName: "Cognizant",
        },

      ]);

      setLoading(false);

    }, 1000);

  }, []);

  const filteredData = tableData

    .filter(
      (item) =>
        item.requirementName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

        ||

        item.clientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )

    .slice(0, entries);

  if (loading) {

    return <Loader />;

  }

  return (

    <div className="e2e_candidates_page">

      {/* TOP */}

      <div className="e2e_candidates_top">

        <div>

          <h2>
            Candidates Application List
          </h2>

          <div className="e2e_candidates_heading_line"></div>

        </div>

        <button
          className="e2e_candidates_add_btn"
          onClick={() =>
            setShowCandidatePopup(true)
          }
        >

          + Add New

        </button>

      </div>

      {/* FILTERS */}

      <div className="e2e_candidates_filters">

        {/* <div className="e2e_candidates_filter_left">

          <label>
            Category :
          </label>

          <select className="e2e_candidates_select">

            <option>
              Candidates
            </option>

          </select>

          <button className="e2e_candidates_report_btn">

            Generate Report

          </button>

        </div> */}

        <div className="e2e_candidates_filter_right">

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="e2e_candidates_search"
          />

        </div>

      </div>

      {/* SHOW ENTRIES */}

      <div className="e2e_candidates_show_row">

        <div>

          Show

          <select
            className="e2e_candidates_entries"
            value={entries}
            onChange={(e) =>
              setEntries(Number(e.target.value))
            }
          >

            <option value={10}>
              10
            </option>

            <option value={25}>
              25
            </option>

            <option value={50}>
              50
            </option>

          </select>

          entries

        </div>

      </div>

      {/* TABLE */}

      <div className="e2e_candidates_table_wrapper">

        <table className="e2e_candidates_table">

          <thead className="e2e_candidates_thead">

            <tr className="e2e_candidates_head_row">

              <th className="e2e_candidates_th_id">
                #
              </th>

              <th className="e2e_candidates_th_date">
                Requirement Date
              </th>

              <th className="e2e_candidates_th_requirement">
                Requirement Name
              </th>

              <th className="e2e_candidates_th_client">
                Client Name
              </th>

              <th className="e2e_candidates_th_action">
                Action
              </th>

            </tr>

          </thead>

          <tbody className="e2e_candidates_tbody">

            {filteredData.map((item, index) => (

              <tr
                key={item.id}
                className="e2e_candidates_row"
              >

                <td className="e2e_candidates_td_id">

                  {index + 1}

                </td>

                <td className="e2e_candidates_td_date">

                  {item.requirementDate}

                </td>

                <td className="e2e_candidates_td_requirement">

                  <div className="e2e_candidates_details">

                    <p>

                      Requirement :

                      <strong>

                        {item.requirementName}

                      </strong>

                    </p>

                  </div>

                </td>

                <td className="e2e_candidates_td_client">

                  {item.clientName}

                </td>

                <td className="e2e_candidates_td_action">

                  <div className="e2e_candidates_actions">

                    <button className="e2e_candidates_view_btn">

                      View

                    </button>

                    <button className="e2e_candidates_edit_btn">

                      Edit

                    </button>

                    <button className="e2e_candidates_delete_btn">

                      Delete

                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
      {showCandidatePopup && (
        <NewCandidateForm
          closePopup={() =>
            setShowCandidatePopup(false)
          }
        />
      )}
    </div>

  );

}

export default Candidates;