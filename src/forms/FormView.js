import React from "react";
import ApplicationView from "./ApplicationView";
import BenchSales from "./BenchSales";
import "./index.css"
import DeleteConfirmation from "./DeleteConfirmation";
import RecruiterPerformance from "../pages/Dashboard/RecruiterPerformance.";
import JobView from "./JobView";
import CandidateForm from "./CandidateForm";
import JobForm from "./JobForm";
import RecordDeleteConfirmation from "./RecordDeleteConfirmation";
import { deleteCandidate } from "../api/candidateApi";
import { deleteJob } from "../api/jobApi";
import RecruiterApplicationForm from "./RecruiterApplicationForm";
import { deleteRecruiterApplication } from "../api/applicationApi";
import RecruiterApplicationView from "./RecruiterApplicationView";

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
  candidateId,
  recordName
}) => {

  const usesOwnHeader = openForm === "job" || openForm === "jobEdit";

  const renderForms = () => {
    switch (openForm) {
      case "bench":
        return (
          <BenchSales
            onClose={() => setOpenForm(null)}
            refreshData={refreshData}
          />
        );

      case "recruiter":
        return <RecruiterApplicationForm onClose={() => setOpenForm(null)} refreshData={refreshData} />;

      case "recruiterView":
        return <RecruiterApplicationView applicationId={applicationId} />;

      case "recruiterEdit":
        return <RecruiterApplicationForm onClose={() => setOpenForm(null)} applicationId={applicationId} isEdit refreshData={refreshData} />;

      case "recruiterDelete":
        return <DeleteConfirmation applicationId={applicationId} deleteAction={deleteRecruiterApplication} refreshData={refreshData} onClose={() => setOpenForm(null)} title="Delete Recruiter Application" />;

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

    case "candidateDelete":
      return (
        <RecordDeleteConfirmation
          entityName="Candidate"
          recordName={recordName}
          onDelete={() => deleteCandidate(candidateId)}
          onClose={() => setOpenForm(null)}
          refreshData={refreshData}
        />
      );

    case "job":
      return (
        <JobForm
          onClose={() => setOpenForm(null)}
          refreshData={refreshData}
        />
      );

    case "jobEdit":
      return (
        <JobForm
          jobId={jobId}
          isEdit
          onClose={() => setOpenForm(null)}
          refreshData={refreshData}
        />
      );

    case "jobDelete":
      return (
        <RecordDeleteConfirmation
          entityName="Job"
          recordName={recordName}
          onDelete={() => deleteJob(jobId)}
          onClose={() => setOpenForm(null)}
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
          <div className={`tf-form-popup${usesOwnHeader ? " tf-form-popup-wide" : ""}`}>
            {!usesOwnHeader && (
              <div className="tf-form-popup-header">
                <h1 className="form-title">{formTitle}</h1>
                <button className="tfm-close-button" onClick={() => setOpenForm(null)}>
                  X
                </button>
              </div>
            )}
            {renderForms()}
          </div>
        </div>
      )}
    </>
  );
};

export default FormView;
