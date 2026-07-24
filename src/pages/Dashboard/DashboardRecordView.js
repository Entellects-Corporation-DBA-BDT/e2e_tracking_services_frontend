import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBriefcase,
  FaCalendarAlt,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaRedo,
  FaUserTie,
} from "react-icons/fa";
import { getDashboardRecord } from "../../api/applicationApi";
import { baseUrlImg } from "../../Config/env";
import "../../styles/Dashboard/recordView.css";

const RECORD_CONFIG = {
  submissions: {
    endpoint: "submissions",
    singular: "Submission",
    backLabel: "Back to Submissions",
    accent: "blue",
    sections: [
      {
        title: "Submission Overview",
        fields: [
          ["date_created", "Submission Date"], ["status", "Status"],
          ["candidate", "Candidate"], ["technology", "Technology"],
          ["recruiter", "Recruiter"], ["recruiter_role", "Recruiter Role"],
        ],
      },
      {
        title: "Client and Vendor",
        fields: [
          ["client", "Client"], ["end_client", "End Client"],
          ["vendor", "Vendor"], ["vendor_contact", "Vendor Contact"],
          ["candidate_location", "Candidate Location"],
          ["employment_location", "Employment Location"],
        ],
      },
      {
        title: "Commercial Details",
        fields: [["rate", "Rate"], ["bill_rate", "Bill Rate"], ["visa", "Visa"]],
      },
    ],
  },
  active_candidates: {
    endpoint: "active-candidates",
    singular: "Active Candidate",
    backLabel: "Back to Active Candidates",
    accent: "violet",
    sections: [
      {
        title: "Candidate Information",
        fields: [
          ["candidate", "Candidate"], ["status", "Status"], ["email", "Email"],
          ["phone", "Phone"], ["current_location", "Current Location"],
          ["visa", "Visa"], ["technology", "Technology"],
        ],
      },
      {
        title: "Ownership and Timeline",
        fields: [
          ["recruiter", "Recruiter"], ["recruiter_role", "Recruiter Role"],
          ["created_at", "Created"], ["updated_at", "Last Updated"],
        ],
      },
    ],
  },
  interviews: {
    endpoint: "interviews",
    singular: "Interview",
    backLabel: "Back to Interviews",
    accent: "amber",
    sections: [
      {
        title: "Interview Details",
        fields: [
          ["interview_slot", "Interview Date / Slot"], ["interview_mode", "Interview Type"],
          ["candidate", "Candidate"], ["status", "Status"],
          ["technology", "Technology"], ["feedback", "Feedback"],
        ],
      },
      {
        title: "Client and Coordination",
        fields: [
          ["client", "Client"], ["end_client", "End Client"], ["vendor", "Vendor"],
          ["vendor_contact", "Vendor Contact"], ["recruiter", "Recruiter"],
          ["candidate_location", "Candidate Location"],
        ],
      },
    ],
  },
  placements: {
    endpoint: "placements",
    singular: "Placement",
    backLabel: "Back to Placements",
    accent: "green",
    sections: [
      {
        title: "Placement Overview",
        fields: [
          ["date_created", "Placement Date"], ["candidate", "Candidate"],
          ["status", "Status"], ["technology", "Technology"], ["recruiter", "Recruiter"],
        ],
      },
      {
        title: "Engagement Details",
        fields: [
          ["client", "Client"], ["end_client", "End Client"], ["vendor", "Vendor"],
          ["candidate_location", "Location"], ["employment_location", "Employment Location"],
          ["rate", "Rate"], ["bill_rate", "Bill Rate"],
        ],
      },
    ],
  },
};

const FIELD_ICONS = {
  candidate: <FaUserTie />, recruiter: <FaUserTie />,
  email: <FaEnvelope />, phone: <FaPhone />,
  date_created: <FaCalendarAlt />, interview_slot: <FaCalendarAlt />,
  candidate_location: <FaMapMarkerAlt />, current_location: <FaMapMarkerAlt />,
  employment_location: <FaMapMarkerAlt />, technology: <FaBriefcase />,
};

const DOCUMENTS = [
  ["resume_path", "Resume"], ["r2r_path", "Right to Represent"],
  ["driving_path", "Driving Document"], ["visa_path", "Visa Document"],
  ["msc_path", "MSC Document"],
];

const readable = (value) => {
  if (value === null || value === undefined || value === "") return "Not provided";
  return value;
};

const documentUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrlImg}/${String(path).replace(/^\//, "")}`;
};

function DashboardRecordView() {
  const { recordType, recordId } = useParams();
  const navigate = useNavigate();
  const config = RECORD_CONFIG[recordType];
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecord = async () => {
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      const response = await getDashboardRecord(config.endpoint, recordId);
      setRecord(response.data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || "This record could not be loaded. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
    // record type and id intentionally define the request lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordType, recordId]);

  const documents = useMemo(
    () => DOCUMENTS.filter(([key]) => record?.[key]),
    [record]
  );

  if (!config) {
    return (
      <div className="e2e_record_state">
        <h2>Unknown record type</h2>
        <button type="button" onClick={() => navigate("/dashboard")}>Return to Dashboard</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="e2e_record_state" role="status">
        <span className="e2e_record_spinner" />
        <h2>Loading {config.singular.toLowerCase()}...</h2>
        <p>Getting the latest record information.</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="e2e_record_state e2e_record_error" role="alert">
        <div>!</div>
        <h2>Unable to open this record</h2>
        <p>{error || "The requested record was not found."}</p>
        <span>
          <button type="button" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <button type="button" onClick={loadRecord}><FaRedo /> Try Again</button>
        </span>
      </div>
    );
  }

  return (
    <article className={`e2e_record_page e2e_record_${config.accent}`}>
      <button type="button" className="e2e_record_back" onClick={() => navigate(-1)}>
        <FaArrowLeft /> {config.backLabel}
      </button>

      <header className="e2e_record_hero">
        <div className="e2e_record_avatar"><FaUserTie /></div>
        <div>
          <p>{config.singular} #{record.id}</p>
          <h1>{readable(record.candidate)}</h1>
          <span>
            {readable(record.technology)}
            {record.candidate_location || record.current_location
              ? ` • ${record.candidate_location || record.current_location}`
              : ""}
          </span>
        </div>
        <strong className="e2e_record_status">{readable(record.status)}</strong>
      </header>

      <nav className="e2e_record_quick_nav" aria-label="Record sections">
        {config.sections.map((section, index) => (
          <a href={`#record-section-${index}`} key={section.title}>{section.title}</a>
        ))}
        {(documents.length > 0 || record.remarks) && <a href="#record-supporting">Supporting Information</a>}
      </nav>

      {config.sections.map((section, sectionIndex) => (
        <section className="e2e_record_card" id={`record-section-${sectionIndex}`} key={section.title}>
          <div className="e2e_record_card_title">
            <FaBriefcase />
            <div><h2>{section.title}</h2><p>Key information for this {config.singular.toLowerCase()}.</p></div>
          </div>
          <dl className="e2e_record_grid">
            {section.fields.map(([key, label]) => (
              <div className="e2e_record_field" key={key}>
                <dt>{FIELD_ICONS[key]} {label}</dt>
                <dd>{readable(record[key])}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {(documents.length > 0 || record.remarks || record.feedback) && (
        <section className="e2e_record_card" id="record-supporting">
          <div className="e2e_record_card_title">
            <FaFileAlt />
            <div><h2>Supporting Information</h2><p>Notes and documents linked to this record.</p></div>
          </div>
          {record.remarks && <div className="e2e_record_notes"><strong>Remarks</strong><p>{record.remarks}</p></div>}
          {record.feedback && recordType !== "interviews" && (
            <div className="e2e_record_notes"><strong>Feedback</strong><p>{record.feedback}</p></div>
          )}
          {documents.length > 0 && (
            <div className="e2e_record_documents">
              {documents.map(([key, label]) => (
                <Link to={documentUrl(record[key])} target="_blank" rel="noopener noreferrer" key={key}>
                  <FaFileAlt /><span><strong>{label}</strong><small>Open document</small></span><FaExternalLinkAlt />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </article>
  );
}

export default DashboardRecordView;
