import "../../styles/Dashboard/graphs.css";

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import {
  FaArrowRight,
  FaLightbulb,
  FaBullseye,
  FaCheckCircle,
} from "react-icons/fa";

const COLORS = [
  "#4285F4",
  "#8E54FF",
  "#F9A826",
  "#FF5B6E",
  "#52C56B",
  "#00C2A8",
  "#7D5FFF",
  "#FF7F50",
];

const EMPTY_ANALYTICS = [];
const CATEGORY_COLORS = {
  recruiters: ["#6d4aff", "#8e72ff", "#a998ff", "#5133d6"],
  benchsales: ["#0f9f8f", "#20b8a6", "#50cbbb", "#087f72"],
};


/* =========================
   SKILLS
========================= */

function DashboardGraphs({
  analytics = {},
  selectedFilter,
  startDate,
  endDate,
  category,
  onStartDateChange,
  onEndDateChange,
  onFilterChange,
  onCategoryChange,
  onApplyDateFilter,
}) {
  const analyticsData = Array.isArray(analytics)
    ? analytics
    : Array.isArray(analytics.data)
      ? analytics.data
      : Array.isArray(analytics.analytics)
        ? analytics.analytics
        : Array.isArray(analytics.submissions)
          ? analytics.submissions
          : EMPTY_ANALYTICS;

  const total = Number(analytics.total) || analyticsData.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  const candidateData = useMemo(
    () => analyticsData.map((item, index) => {
      const itemCategory = item.category || "other";
      const categoryIndex = analyticsData.slice(0, index).filter((entry) => entry.category === itemCategory).length;
      const palette = CATEGORY_COLORS[itemCategory] || COLORS;
      return {
        name: item.label,
        value: Number(item.value) || 0,
        category: itemCategory,
        categoryLabel: item.category_label || "Other",
        color: palette[categoryIndex % palette.length],
      };
    }),
    [analyticsData]
  );

  return (

    <div className="e2e_dashboard_grid">
      {/* =========================
          CANDIDATES OVERVIEW
      ========================= */}
      <div className="e2e_card">
        <h3 className="e2e_card_title">Submissions by Employee</h3>
        <div className="e2e_chart_layout">
          <div className="e2e_chart_wrapper">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={candidateData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {candidateData.map((item, index) => (
                    <Cell
                      key={index}
                      fill={item.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="e2e_chart_center">
              <h2>{total}</h2>
              <p>Total</p>
            </div>
          </div>
          <div className="e2e_chart_legend">
            {candidateData.map((item, index) => (
              <div
                className="e2e_legend_item"
                key={index}
              >
                <div className="e2e_legend_left">
                  <span
                    className="e2e_dot"
                    style={{ background: item.color }}
                  ></span>
                  <p>{item.name}<small className={["e2e_employee_category", item.category].join(" ")}>{item.categoryLabel}</small></p>
                </div>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="e2e_view_btn">
          View Details
          <FaArrowRight />
        </button>
      </div>

      <div className="e2e_card">
        <div className="e2e_graph_filter_header">
          <h3 className="e2e_card_title">Submission Analytics</h3>
        </div>
        <div className="e2e_graph_filters">
          <div className="e2e_graph_filter_item">
            <label>Time Period</label>
            <select
              className="e2e_graph_select"
              value={selectedFilter}
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {selectedFilter === "custom" && (
            <>
              <div className="e2e_graph_filter_item">
                <label>Start Date</label>
                <input
                  type="date"
                  className="e2e_graph_input"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </div>
              <div className="e2e_graph_filter_item">
                <label>End Date</label>
                <input
                  type="date"
                  className="e2e_graph_input"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </>
          )}
          <fieldset className="e2e_category_switch">
            <legend>Category</legend>
            {[["all", "All"], ["recruiters", "Recruiting"], ["benchsales", "Bench Sales"]].map(([value, label]) => (
              <label key={value} className={category === value ? "active" : ""}>
                <input type="radio" name="dashboard-category" value={value} checked={category === value} onChange={(e) => onCategoryChange(e.target.value)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          {selectedFilter === "custom" && (
            <button
              type="button"
              className="e2e_graph_apply_btn"
              disabled={!startDate || !endDate || startDate > endDate}
              onClick={onApplyDateFilter}
            >
              Apply Filter
            </button>
          )}
        </div>

      </div>
      <aside className="e2e_insight_panel" aria-label="Recruiting insight">
        <div className="e2e_insight_heading"><FaLightbulb /><span>Recruiting Insight</span></div>
        <blockquote>
          “Every submission is a new opportunity. Consistency, quality, and timely
          follow-up turn submissions into successful placements.”
        </blockquote>
        <p className="e2e_insight_signature">— E2E Tracking Services</p>
        <div className="e2e_focus_list">
          <h4><FaBullseye /> Focus Today</h4>
          {["Submit quality candidates", "Follow up on pending interviews", "Update candidate feedback", "Convert interviews into placements"].map((item) => (
            <p key={item}><FaCheckCircle /> {item}</p>
          ))}
        </div>
      </aside>

    </div>

  );
}

export default memo(DashboardGraphs);
