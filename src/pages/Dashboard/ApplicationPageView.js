import { useNavigate, useParams } from "react-router-dom";
import ApplicationView from "../../forms/ApplicationView";

function ApplicationPageView({ module }) {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const isRecruiter = module === "recruiter";

  return (
    <ApplicationView
      applicationId={applicationId}
      module={module}
      standalone
      title={isRecruiter ? "Recruiter Application" : "Bench Sales Application"}
      onBack={() => navigate(isRecruiter ? "/dashboard/recruiting" : "/dashboard/bench-sales")}
    />
  );
}

export default ApplicationPageView;
