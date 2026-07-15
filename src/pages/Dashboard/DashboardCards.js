import "../../styles/Dashboard/cards.css";
import { memo, useMemo } from "react";
import {
  FaUsers,
  FaBriefcase,
  FaUserTie,
  FaChartLine,
} from "react-icons/fa";

const STANDARD_METRICS = ["submissions", "interviews", "placements"];

const formatMetricTitle = (key) => key
  .split("_")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");

function DashboardCards({ summary = {} }) {
  const cards = useMemo(() => {
    const secondaryMetric = summary.active_candidates !== undefined
      ? "active_candidates"
      : Object.keys(summary).find((key) => (
        !STANDARD_METRICS.includes(key)
        && !key.endsWith("_growth")
        && typeof summary[key] === "number"
      )) || "active_candidates";

    return [
      {
        key: "submissions",
        title: "Submissions",
        icon: <FaBriefcase />,
      },
      {
        key: secondaryMetric,
        title: formatMetricTitle(secondaryMetric),
        icon: <FaChartLine />,
      },
      {
        key: "interviews",
        title: "Interviews",
        icon: <FaUsers />,
      },
      {
        key: "placements",
        title: "Placements",
        icon: <FaUserTie />,
      },
    ].map((card) => ({
      ...card,
      count: summary[card.key] ?? 0,
      growth: summary[`${card.key}_growth`] ?? "",
    }));
  }, [summary]);

  return (

    <div className="e2e_cards_grid">

      {cards.map((item, index) => (

        <div
          className="e2e_single_card"
          key={index}
        >

          <div className="e2e_card_top">

            <div>

              <p>{item.title}</p>

              <h2>{item.count}</h2>

            </div>

            <div className="e2e_card_icon">

              {item.icon}

            </div>

          </div>

          <div className="e2e_card_bottom">

            {item.growth !== "" && <span>{item.growth}</span>}

          </div>

        </div>

      ))}

    </div>
  );
}

export default memo(DashboardCards);
