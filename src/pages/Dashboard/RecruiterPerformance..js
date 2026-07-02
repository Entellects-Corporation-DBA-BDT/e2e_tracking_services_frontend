
import { useEffect, useState } from "react";
import "./RecruiterPerformance.css";
import { getPerformanceDashboard } from "../../api/applicationApi";

export default function RecruiterPerformance() {

  const [recruiters, setRecruiters] = useState([]);

  const loadPerformance = async () => {
    try {
      const response = await getPerformanceDashboard();

      if (response.success) {

        const maxWeekly = Math.max(
          ...response.data.map((item) => item.weekly_submissions),
          1
        );

        const formatted = response.data.map((item) => ({
          id: item.user_id,
          name: item.employee_name,
          today: item.today_submissions,
          weekly: item.weekly_submissions,
          interviews: item.interviews,
          placements: item.placements,

          // Performance Percentage
          performance: Math.round(
            (item.weekly_submissions / maxWeekly) * 100
          ),
        }));

        setRecruiters(formatted);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  return (
    <div className="performance-card">

      <div className="performance-header">
        <h3>Recruiter Performance</h3>
      </div>

      {recruiters.length === 0 ? (
        <p style={{ textAlign: "center", padding: "20px" }}>
          No Data Available
        </p>
      ) : (
        recruiters.map((item) => (

          <div className="employee-card" key={item.id}>

            <div className="employee-top">

              <div className="employee-info">

                <div className="avatar">
                  {item.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h4>{item.name}</h4>

                  <span>
                    {item.performance >= 90
                      ? "Excellent"
                      : item.performance >= 70
                      ? "Very Good"
                      : item.performance >= 50
                      ? "Good"
                      : "Average"}
                  </span>

                </div>

              </div>

              <h2>{item.performance}%</h2>

            </div>

            <div className="progress-bg">
              <div
                className="progress-fill"
                style={{
                  width: `${item.performance}%`,
                }}
              />
            </div>

            <div className="stats">

              <div>
                <h5>{item.today}</h5>
                <p>Today</p>
              </div>

              <div>
                <h5>{item.weekly}</h5>
                <p>Week</p>
              </div>

              <div>
                <h5>{item.interviews}</h5>
                <p>Interviews</p>
              </div>

              <div>
                <h5>{item.placements}</h5>
                <p>Placements</p>
              </div>

            </div>

          </div>
        ))
      )}

    </div>
  );
}