import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMinus, FiSquare, FiCopy, FiX, FiFileText } from "react-icons/fi";
import "./RecruiterApplicationForm.css";
import ApplicationView from "./ApplicationView";
import BenchSales from "./BenchSales";
import "./index.css"
import DeleteConfirmation from "./DeleteConfirmation";
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

  const windowRef=useRef(null);
  const [windowMode,setWindowMode]=useState("normal");
  const benchWindow=openForm==="bench"||openForm==="benchEdit";
  const recruiterWindow=benchWindow||openForm==="recruiter"||openForm==="recruiterEdit";
  const windowTitle=benchWindow?(openForm==="benchEdit"?"Edit Bench Sales Application":"New Bench Sales Application"):(openForm==="recruiterEdit"?"Edit Recruiter Application":"New Recruiter Application");
  useEffect(()=>{setWindowMode("normal")},[openForm,applicationId]);
  useEffect(()=>{
    if(!recruiterWindow)return;
    const previous=document.activeElement;
    windowRef.current?.querySelector('button')?.focus();
    return()=>{if(previous?.isConnected)previous.focus();};
  },[recruiterWindow]);
  const trapWindowFocus=event=>{
    if(event.key!=="Tab"||windowMode==="minimized")return;
    const fields=Array.from(windowRef.current.querySelectorAll('button:not(:disabled),input:not(:disabled):not([hidden]),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]'));
    const first=fields[0],last=fields[fields.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };

  useEffect(()=>{
    if(!recruiterWindow||windowMode==="minimized")return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous};
  },[recruiterWindow,windowMode]);

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

  if(recruiterWindow)return createPortal(
    <div className={`recruiter-window-overlay ${windowMode}`}>
      <section ref={windowRef} onKeyDown={trapWindowFocus} className="recruiter-window" role="dialog" aria-modal={windowMode!=="minimized"?true:undefined} aria-label={windowTitle}>
        <header className="recruiter-window-header">
          <div className="recruiter-window-title"><FiFileText/><div><h2>{windowTitle}</h2><p>Candidate submission & supporting documents</p></div></div>
          <div className="recruiter-window-controls">
            <button type="button" aria-label={windowMode==="minimized"?"Restore form":"Minimize form"} title={windowMode==="minimized"?"Restore":"Minimize"} onClick={()=>setWindowMode(windowMode==="minimized"?"normal":"minimized")}><FiMinus/></button>
            <button type="button" aria-label={windowMode==="maximized"?"Restore window size":"Maximize form"} title={windowMode==="maximized"?"Restore size":"Maximize"} onClick={()=>setWindowMode(windowMode==="maximized"?"normal":"maximized")}>{windowMode==="maximized"?<FiCopy/>:<FiSquare/>}</button>
            <button type="button" aria-label="Close form" title="Close" onClick={()=>setOpenForm(null)}><FiX/></button>
          </div>
        </header>
        <div className="recruiter-window-content" hidden={windowMode==="minimized"}>{renderForms()}</div>
      </section>
    </div>,document.body);

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
