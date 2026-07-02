import "../../styles/Dashboard/graphs.css";

import { useEffect, useState } from "react";
import { getSubmissionAnalytics } from "../../api/applicationApi";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import {
  FaCode,
  FaDatabase,
  FaPython,
  FaAws,
  FaArrowRight,
} from "react-icons/fa";


/* =========================
   SKILLS
========================= */

function DashboardGraphs() {
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

  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [category, setCategory] = useState("benchsales");

  const [candidateData, setCandidateData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);

  const loadSubmissionAnalytics = async () => {
    try {
      setLoading(true);

      const res = await getSubmissionAnalytics(
        startDate,
        endDate,
        category
      );

      console.log("API Response:", res);

      const formatted = res.data.map((item, index) => ({
        name: item.label,
        value: item.value,
        color: COLORS[index % COLORS.length],
      }));

      setCandidateData(formatted);
      setTotal(res.total);
      const ICONS = [
        <FaCode />,
        <FaDatabase />,
        <FaPython />,
        <FaAws />,
        <FaCode />,
        <FaDatabase />,
        <FaPython />,
        <FaAws />,
        <FaCode />,
      ];
      const skillData = res.data.map((item, index) => ({
        name: item.label,
        value: Number(((item.value / res.total) * 100).toFixed(1)),
        submissions: item.value,
        color: COLORS[index % COLORS.length],
        icon: ICONS[index % ICONS.length],
      }));

      setSkills(skillData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissionAnalytics();
  }, [startDate, endDate, category]);

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

      {/* =========================
          TOP SKILLS
      ========================= */}

      <div className="e2e_card">
        <div className="e2e_card_header">
          <h3 className="e2e_card_title">Top Skills</h3>
          <button className="e2e_view_all">View All</button>
        </div>
        <div className="e2e_skills_list">
          {skills.map((item, index) => (
            <div
              className="e2e_skill_item"
              key={index}
            >
              <div className="e2e_skill_left">
                <div
                  className="e2e_skill_icon"
                  style={{
                    background: `${item.color}20`,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                <p>{item.name}</p>
              </div>
              <div className="e2e_skill_bar_wrapper">
                <div className="e2e_skill_bar_bg">
                  <div
                    className="e2e_skill_bar_fill"
                    style={{
                      width: `${item.value}%`,
                      background: item.color,
                    }}
                  ></div>

                </div>
                <span>
                  {item.value}% ({item.submissions})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="e2e_card">
        <div className="e2e_graph_filter_header">
          <h3 className="e2e_card_title">Submission Analytics</h3>
        </div>
        <div className="e2e_graph_filters">
          <div className="e2e_graph_filter_item">
            <label>Start Date</label>
            <input
              type="date"
              className="e2e_graph_input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="e2e_graph_filter_item">
            <label>End Date</label>
            <input
              type="date"
              className="e2e_graph_input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="e2e_graph_filter_item">
            <label>Category</label>
            <select
              className="e2e_graph_select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="benchsales">Recruiting</option>
              <option value="recruiting">Bench Sales</option>
              <option value="hotlist">Hot List</option>
              <option value="jobs">Jobs</option>
              <option value="primevendors">Prime Vendors</option>
              <option value="clients">Clients</option>
              <option value="candidates">Candidates</option>
            </select>
          </div>
          <button
            className="e2e_graph_apply_btn"
            onClick={loadSubmissionAnalytics}
          >
            Apply Filter
          </button>
        </div>

      </div>

    </div>

  );
}

export default DashboardGraphs;