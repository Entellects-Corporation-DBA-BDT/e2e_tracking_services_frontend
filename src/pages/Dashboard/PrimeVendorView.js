import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBuilding,
  FaEnvelope,
  FaFax,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaRedo,
  FaUserTie,
} from "react-icons/fa";
import { getPrimeVendorById } from "../../api/primeVendorApi";
import "../../styles/Dashboard/recordView.css";

const fields = [
  ["vcompany", "Company", <FaBuilding />],
  ["rname", "Recruiter / Contact", <FaUserTie />],
  ["phone", "Phone", <FaPhone />],
  ["email", "Email", <FaEnvelope />],
  ["fax", "Fax", <FaFax />],
  ["blocation", "Business Location", <FaMapMarkerAlt />],
  ["caddress", "Company Address", <FaMapMarkerAlt />],
  ["documents", "Documents", <FaFileAlt />],
];

function PrimeVendorView() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVendor = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPrimeVendorById(vendorId);
      if (response.success) setVendor(response.data);
      else setError(response.message || "Prime vendor could not be loaded.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Prime vendor could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => { loadVendor(); }, [loadVendor]);

  if (loading) {
    return <div className="e2e_record_state" role="status"><span className="e2e_record_spinner" /><h2>Loading prime vendor...</h2><p>Getting the latest company information.</p></div>;
  }

  if (!vendor) {
    return <div className="e2e_record_state e2e_record_error" role="alert"><div>!</div><h2>Unable to open prime vendor</h2><p>{error || "No vendor record was found."}</p><span><button type="button" onClick={() => navigate("/dashboard/vendors")}><FaArrowLeft /> Back</button><button type="button" onClick={loadVendor}><FaRedo /> Try Again</button></span></div>;
  }

  return (
    <article className="e2e_record_page e2e_record_violet">
      <button type="button" className="e2e_record_back" onClick={() => navigate("/dashboard/vendors")}>
        <FaArrowLeft /> Back to Prime Vendors
      </button>
      <header className="e2e_record_hero">
        <div className="e2e_record_avatar"><FaBuilding /></div>
        <div><p>Prime Vendor #{vendor.id}</p><h1>{vendor.vcompany || "Unnamed Company"}</h1><span>{vendor.blocation || "Location not provided"}</span></div>
        <strong className="e2e_record_status">Vendor</strong>
      </header>
      <nav className="e2e_record_quick_nav" aria-label="Vendor sections">
        <a href="#vendor-information">Vendor Information</a>
        <a href="#vendor-feedback">Feedback</a>
      </nav>
      <section className="e2e_record_card" id="vendor-information">
        <div className="e2e_record_card_title"><FaBuilding /><div><h2>Vendor Information</h2><p>Company, contact, and business details.</p></div></div>
        <dl className="e2e_record_grid">
          {fields.map(([key, label, icon]) => (
            <div className="e2e_record_field" key={key}>
              <dt>{icon} {label}</dt><dd>{vendor[key] || "Not provided"}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="e2e_record_card" id="vendor-feedback">
        <div className="e2e_record_card_title"><FaFileAlt /><div><h2>Feedback and Notes</h2><p>Additional information recorded for this vendor.</p></div></div>
        <div className="e2e_record_notes"><strong>Feedback</strong><p>{vendor.feedback || "No feedback has been added."}</p></div>
      </section>
    </article>
  );
}

export default PrimeVendorView;
