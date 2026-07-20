import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getDocumentReminderDashboard } from "../../api/documentReminderApi";
import "../../styles/Dashboard/documentReminders.css";

function DocumentExpiryWidget() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ 30: 0, 60: 0, 90: 0, 180: 0 });
  useEffect(() => { getDocumentReminderDashboard().then((response) => response.success && setCounts(response.data || {})).catch(() => {}); }, []);
  return <section className="document-expiry-widget"><div className="document-expiry-widget-header"><h2><FaBell /> Documents Expiring Soon</h2><span>Click a range to view reminders</span></div><div className="document-expiry-widget-grid">{[30,60,90,180].map((days) => <button key={days} onClick={() => navigate(`/dashboard/document-reminders?days_left=${days}`)}><strong>{counts[days] || 0}</strong><span>Within {days} days</span></button>)}</div></section>;
}

export default DocumentExpiryWidget;
