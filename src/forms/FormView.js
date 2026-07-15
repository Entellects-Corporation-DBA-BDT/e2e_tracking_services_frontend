import React from "react";
import ApplicationView from "./ApplicationView";
import BenchSales from "./BenchSales";
import "./index.css"
import DeleteConfirmation from "./DeleteConfirmation";
import RecruiterPerformance from "../pages/Dashboard/RecruiterPerformance.";
import JobView from "./JobView";
import CandidateForm from "./CandidateForm";

const FormView = ({
  formTitle,
  setOpenForm,
  openForm,
  refreshData,
  applicationId,
  isEdit = false,
  title,
  message,
  jobId,
  candidateId
}) => {

  const renderForms = () => {
    console.log(openForm);

    switch (openForm) {
      case "bench":
        return (
          <BenchSales
            onClose={() => setOpenForm(null)}
            refreshData={refreshData}
          />
        );

      case "benchView":
        return (
          <ApplicationView
            onClose={() => setOpenForm(null)}
            applicationId={applicationId}
            refreshData={refreshData}
          />
        );

      case "benchEdit":
        return (
          <BenchSales
            onClose={() => setOpenForm(null)}
            applicationId={applicationId}
            isEdit={true}
            refreshData={refreshData}
          />
        );

        case "performence":
        return (
          <RecruiterPerformance
            onClose={() => setOpenForm(null)}
            applicationId={applicationId}
            isEdit={true}
            refreshData={refreshData}
          />
        );
        case "candidate":
    return (
        <CandidateForm
            onClose={() => setOpenForm(null)}
            candidateId={candidateId}
            refreshData={refreshData}
        />
    );

    case "candidateEdit":
    return (
        <CandidateForm
            onClose={() => setOpenForm(null)}
            candidateId={candidateId}
            isEdit={true}
            refreshData={refreshData}
        />
    );

      case "benchDelete":
        return (
          <DeleteConfirmation
            onClose={() => setOpenForm(null)}
            applicationId={applicationId}
          />
        );

        case "jobView":
        return (
          <JobView
            onClose={() => setOpenForm(null)}
            jobId={jobId}

          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {openForm && (
        <div className="tf-form-popup-overlay">
          <div className="tf-form-popup">
            <div className="tf-form-popup-header">
              <h1 className="form-title">{formTitle}</h1>
              <button className="tfm-close-button" onClick={() => setOpenForm(null)}>
                X
              </button>
            </div>
            {renderForms()}
          </div>
        </div>
      )}
    </>
  );
};

export default FormView;