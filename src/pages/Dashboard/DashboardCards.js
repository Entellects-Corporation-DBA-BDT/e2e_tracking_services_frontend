import "../../styles/Dashboard/cards.css";
import { memo, useMemo } from "react";
import {
  FaUsers,
  FaBriefcase,
  FaUserTie,
  FaChartLine,
} from "react-icons/fa";
import { usePermissions } from "../../auth/PermissionContext";

const STANDARD_METRICS = ["submissions", "interviews", "placements"];

const formatMetricTitle = (key) => key
  .split("_")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");

function DashboardCards({
  summary = {},
  selectedCard = "submissions",
  category = "all",
  onSelect = () => {},
}) {
  const { can } = usePermissions();
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
    ].filter((card) => can(`dashboard_${card.key}`, "view")).map((card) => ({
      ...card,
      count: summary[card.key] ?? 0,
      growth: summary[`${card.key}_growth`] ?? "",
      recruitingCount: summary.category_breakdown?.recruiters?.[card.key],
      benchSalesCount: summary.category_breakdown?.benchsales?.[card.key],
    }));
  }, [summary, can]);

  return (

    <div className="e2e_cards_grid">

      {cards.map((item, index) => (

        <button
          type="button"
          className={`e2e_single_card${selectedCard === item.key ? " e2e_single_card_active" : ""}`}
          key={item.key}
          onClick={() => onSelect(item.key)}
          aria-pressed={selectedCard === item.key}
          aria-controls="dashboard-data-table"
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
            <div className="e2e_card_category_counts">
              {(category === "all" || category === "recruiters") && (
                <span className="recruiting"><i />Recruiting <b>{Number(item.recruitingCount ?? (category === "recruiters" ? item.count : 0)) || 0}</b></span>
              )}
              {(category === "all" || category === "benchsales") && (
                <span className="benchsales"><i />Bench Sales <b>{Number(item.benchSalesCount ?? (category === "benchsales" ? item.count : 0)) || 0}</b></span>
              )}
            </div>
            {item.growth !== "" && <span>{item.growth}</span>}
          </div>

        </button>

      ))}

    </div>
  );
}

export default memo(DashboardCards);
