import { applicationDateRange } from "../../utils/applicationListTools";
import "../../styles/Dashboard/applicationListControls.css";

export default function ApplicationListControls({
  period, dates, search, onPeriodChange, onDatesChange,
  onSearchChange, onExport, exporting,
}) {
  const choosePeriod = (value) => {
    onPeriodChange(value);
    if (value !== "custom") onDatesChange(applicationDateRange(value));
  };

  return (
    <div className="application-list-controls">
      <label className="application-period-control">
        <span>Date Range</span>
        <select value={period} onChange={(event) => choosePeriod(event.target.value)}>
          <option value="all">All Dates</option><option value="today">Today</option>
          <option value="this_week">This Week</option><option value="this_month">This Month</option>
          <option value="custom">Custom Date</option>
        </select>
      </label>
      {period === "custom" && (
        <div className="application-custom-dates">
          <label><span>From</span><input type="date" value={dates.start_date} max={dates.end_date || undefined} onChange={(event) => onDatesChange({ ...dates, start_date: event.target.value })} /></label>
          <label><span>To</span><input type="date" value={dates.end_date} min={dates.start_date || undefined} onChange={(event) => onDatesChange({ ...dates, end_date: event.target.value })} /></label>
        </div>
      )}
      <label className="application-search-control">
        <span>Search by Name or Client</span>
        <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Candidate, employee, client..." />
      </label>

      <button type="button" className="application-export-button" onClick={onExport} disabled={exporting || (period === "custom" && (!dates.start_date || !dates.end_date))}>
        {exporting ? "Preparing Excel..." : "Download Excel"}
      </button>
    </div>
  );
}