import { useCallback, useEffect, useState } from "react";
import { getPrimeVendors } from "../../api/primeVendorApi";
import PrimeVendorForm from "../../forms/NewPrimeVendorForm";
import PrimeVendorDeleteConfirmation from "../../forms/PrimeVendorDeleteConfirmation";
import "../../styles/Dashboard/primevendors.css";
import Loader from "./Loader";
import Pagination from "./Pagination";
import { useNavigate } from "react-router-dom";

function PrimeVendors() {
  const navigate = useNavigate();
  const [openAction, setOpenAction] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVendors = useCallback(async () => {
    try {
      setTableLoading(true);
      setError("");
      const response = await getPrimeVendors(currentPage, entries, debouncedSearch);

      if (!response.success) {
        setError(response.message || "Failed to load prime vendors.");
        setTableData([]);
        return;
      }

      setTableData(response.data || []);
      setTotalPages(Math.max(response.total_pages || 1, 1));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load prime vendors.");
      setTableData([]);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  }, [currentPage, debouncedSearch, entries]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const openVendorAction = (action, vendor = null) => {
    setSelectedVendor(vendor);
    setOpenAction(action);
  };

  const closeAction = () => {
    setOpenAction(null);
    setSelectedVendor(null);
  };

  const handleDeleted = () => {
    if (tableData.length === 1 && currentPage > 1) {
      setCurrentPage((page) => page - 1);
    } else {
      fetchVendors();
    }
  };

  if (initialLoading) return <Loader fullPage />;

  return (
    <div className="e2e_prime_page">
      <div className="e2e_prime_top">
        <div className="e2e_prime_left">
          <h2>Prime Vendors List</h2>
          <div className="e2e_prime_heading_line" />
        </div>
        <div className="e2e_prime_right">
          <button onClick={() => openVendorAction("create")}>+ Add New</button>
        </div>
      </div>

      <div className="e2e_prime_filters">
        <div className="e2e_prime_filter_right">
          <input
            type="search"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          value={entries}
          className="e2e_pagination_number e2e_prime_page_size"
          aria-label="Rows per page"
          onChange={(event) => {
            setEntries(Number(event.target.value));
            setCurrentPage(1);
          }}
        >
          {[5, 10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {error && <div className="e2e_prime_error">{error}</div>}

      <div className="e2e_prime_table_wrapper">
        <table className="e2e_prime_table">
          <thead className="e2e_prime_table_head">
            <tr className="e2e_prime_table_head_row">
              <th className="e2e_prime_th e2e_prime_th_id">#</th>
              <th className="e2e_prime_th e2e_prime_th_vendor">Vendor</th>
              <th className="e2e_prime_th e2e_prime_th_recruiter">Recruiter</th>
              <th className="e2e_prime_th e2e_prime_th_phone">Contact</th>
              <th className="e2e_prime_th e2e_prime_th_action">Action</th>
            </tr>
          </thead>
          <tbody className="e2e_prime_table_body">
            {tableLoading ? (
              <tr><td className="e2e_prime_empty" colSpan="5">Loading...</td></tr>
            ) : tableData.length ? (
              tableData.map((vendor, index) => (
                <tr key={vendor.id} className="e2e_prime_table_row">
                  <td className="e2e_prime_td e2e_prime_td_id">{(currentPage - 1) * entries + index + 1}</td>
                  <td className="e2e_prime_td e2e_prime_td_vendor">
                    <div className="e2e_prime_details">
                      <p className="e2e_prime_text">Company: <strong>{vendor.vcompany || "—"}</strong></p>
                      <p className="e2e_prime_text">Location: <strong>{vendor.blocation || "—"}</strong></p>
                    </div>
                  </td>
                  <td className="e2e_prime_td e2e_prime_td_recruiter">{vendor.rname || "—"}</td>
                  <td className="e2e_prime_td e2e_prime_td_phone">
                    <div className="e2e_prime_details">
                      <span>{vendor.phone || "—"}</span>
                      <span>{vendor.email || "—"}</span>
                    </div>
                  </td>
                  <td className="e2e_prime_td e2e_prime_td_action">
                    <div className="e2e_prime_actions">
                      <button className="viewBtn" onClick={() => navigate(`/dashboard/vendors/${vendor.id}`)}>View</button>
                      <button className="editBtn" onClick={() => openVendorAction("edit", vendor)}>Edit</button>
                      <button className="deleteBtn" onClick={() => openVendorAction("delete", vendor)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="e2e_prime_empty" colSpan="5">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {["create", "edit"].includes(openAction) && (
        <PrimeVendorForm mode={openAction} vendorId={selectedVendor?.id} closePopup={closeAction} refreshData={fetchVendors} />
      )}

      {openAction === "delete" && (
        <PrimeVendorDeleteConfirmation
          vendorId={selectedVendor?.id}
          vendorName={selectedVendor?.vcompany}
          onClose={closeAction}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

export default PrimeVendors;
