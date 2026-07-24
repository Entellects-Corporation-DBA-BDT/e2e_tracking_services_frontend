import "../../styles/Dashboard/table.css";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaEye,
  FaPlus,
  FaRedo,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
} from "react-icons/fa";

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return value;
};

function DashboardTable({
  title,
  columns,
  data,
  loading,
  error,
  pagination,
  search,
  sort,
  order,
  onSearch,
  onSort,
  onPageChange,
  onLimitChange,
  onRefresh,
  onExport,
  onView,
  onAdd,
}) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    if (sort !== column.key) return <FaSort aria-hidden="true" />;
    return order === "asc"
      ? <FaSortUp aria-hidden="true" />
      : <FaSortDown aria-hidden="true" />;
  };

  return (
    <section
      id="dashboard-data-table"
      className="e2e_table_container"
      aria-busy={loading}
    >
      <div className="e2e_table_header">
        <div>
          <p className="e2e_table_eyebrow">Dashboard data</p>
          <h3>{title}</h3>
          <span>{pagination.total.toLocaleString()} records</span>
        </div>
        <div className="e2e_table_actions">
          <button type="button" onClick={onRefresh} disabled={loading}>
            <FaRedo aria-hidden="true" /> Refresh
          </button>
          <button type="button" onClick={() => onExport("excel")} disabled={loading}>
            <FaDownload aria-hidden="true" /> Export Excel
          </button>
          <button type="button" onClick={() => onExport("csv")} disabled={loading}>
            <FaDownload aria-hidden="true" /> Export CSV
          </button>
        </div>
      </div>

      <div className="e2e_table_toolbar">
        <label className="e2e_table_search">
          <FaSearch aria-hidden="true" />
          <span className="e2e_sr_only">Search {title}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search candidate, recruiter, vendor, client or technology"
          />
        </label>
        <label className="e2e_table_limit">
          Show
          <select
            value={pagination.limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((limit) => (
              <option value={limit} key={limit}>{limit}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <p className="e2e_table_loading_label" role="status">
          <span aria-hidden="true" /> Loading data...
        </p>
      )}

      <div className="e2e_table_scroll">
        <table className="e2e_dashboard_table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.sortable ? (
                    <button
                      type="button"
                      className="e2e_sort_button"
                      onClick={() => onSort(column.key)}
                    >
                      {column.label} {renderSortIcon(column)}
                    </button>
                  ) : column.label}
                </th>
              ))}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr className="e2e_skeleton_row" key={rowIndex}>
                  {Array.from({ length: columns.length + 1 }).map((__, cellIndex) => (
                    <td key={cellIndex}><span /></td>
                  ))}
                </tr>
              ))
              : data.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>{displayValue(row[column.key])}</td>
                  ))}
                  <td>
                    <div className="e2e_action_buttons">
                      <button type="button" className="e2e_view_btn" onClick={() => onView(row)}>
                        <FaEye aria-hidden="true" /> View
                      </button>
                      <button type="button" className="e2e_add_btn" onClick={() => onAdd(row)}>
                        <FaPlus aria-hidden="true" /> Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && error && (
        <div className="e2e_table_state e2e_table_error" role="alert">
          <div className="e2e_state_illustration">!</div>
          <h4>Unable to load data.</h4>
          <p>Please try again.</p>
          <button type="button" onClick={onRefresh}>Try again</button>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="e2e_table_state">
          <div className="e2e_empty_illustration" aria-hidden="true">
            <FaSearch />
          </div>
          <h4>No Records Found</h4>
          <p>Try changing your search or filters.</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="e2e_table_pagination">
          <p>
            Page <strong>{pagination.page}</strong> of <strong>{totalPages}</strong>
          </p>
          <div>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Previous page"
            >
              <FaChevronLeft />
            </button>
            <span>{pagination.page}</span>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              aria-label="Next page"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardTable;
