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
    () => analyticsData.map((item, index) => ({
        name: item.label,
        value: Number(item.value) || 0,
        color: COLORS[index % COLORS.length],
      })),
    [analyticsData]
  );

  return (

    <div className="e2e_dashboard_grid">
      {/* =========================
          CANDIDATES OVERVIEW
      ========================= */}
      <div className="e2e_card">
        <h3 className="e2e_card_title">Submissions Overview</h3>
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
                  <p>{item.name}</p>
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
          <div className="e2e_graph_filter_item">
            <label>Category</label>
            <select
              className="e2e_graph_select"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="all">All Submissions</option>
              <option value="recruiters">Recruiters</option>
              <option value="benchsales">Bench Sales</option>
            </select>
          </div>
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
