import "../../styles/Dashboard/table.css";

function DashboardTable({ activities }) {

  /* ACTION FUNCTIONS */

  const handleView = (item) => {

    alert(`Viewing ${item.candidateName}`);

  };

  const handleEdit = (item) => {

    alert(`Editing ${item.candidateName}`);

  };

  const handleDelete = (id) => {

    alert(`Deleting Row ID: ${id}`);

  };

  return (

    <div className="activity-container">

    <div className="activity-header">
        <h3>Recent Activities</h3>
    </div>

    <div className="activity-list">

        {activities.map((item,index)=>(

            <div
                key={index}
                className={`activity-card ${item.type}`}
            >

                <div className="activity-left">

                    <div className="activity-icon">

                        {item.type==="placement" ? "🏆" : "🎯"}

                    </div>

                </div>

                <div className="activity-content">

                    <div className="activity-message">

                        {item.message}

                    </div>

                    <div className="candidate-list">

                        {item.candidate_names.map((name,i)=>(

                            <span
                                key={i}
                                className="candidate-chip"
                            >
                                {name}
                            </span>

                        ))}

                    </div>

                </div>

                <div className="activity-date">

                    {item.date}

                </div>

            </div>

        ))}

    </div>

</div>

  );
}

export default DashboardTable;