import { useEffect, useState } from "react";
import { FaCheck, FaSearch, FaTimes, FaUserTag } from "react-icons/fa";
import { assignCompanyName, getAvailableCompanyNames } from "../api/employeeApi";

function AssignCompanyNameModal({ employee, onClose, onAssigned }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getAvailableCompanyNames(search);
        setUsers(response.data || []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Available Company Names could not be loaded.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const handleAssign = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await assignCompanyName(employee.id, selected.id);
      onAssigned(response.message || "Company Name assigned successfully.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Company Name could not be assigned.");
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="e2e_alias_overlay" role="presentation" onMouseDown={() => !saving && onClose()}>
      <section className="e2e_alias_modal" role="dialog" aria-modal="true" aria-labelledby="alias-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span><FaUserTag /></span><div><h2 id="alias-title">Assign Company Name</h2><p>{employee.legal_name} · {employee.employee_id}</p></div></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close"><FaTimes /></button>
        </header>

        {!confirming ? (
          <>
            <div className="e2e_alias_search"><FaSearch /><input autoFocus type="search" placeholder="Search company name or email..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            {error && <p className="e2e_alias_error" role="alert">{error}</p>}
            <div className="e2e_alias_users" role="listbox" aria-label="Available Company Names">
              {loading ? <div className="e2e_alias_loading"><span /> Loading available Company Names...</div>
                : users.length ? users.map((user) => (
                  <button type="button" role="option" aria-selected={selected?.id === user.id} className={selected?.id === user.id ? "selected" : ""} key={user.id} onClick={() => setSelected(user)}>
                    <span className="e2e_alias_avatar">{user.company_name.slice(0, 1).toUpperCase()}</span>
                    <span><strong>{user.company_name}</strong><small>{user.username}</small><em>{user.role || "Role not assigned"} · {user.status}</em></span>
                    {selected?.id === user.id && <FaCheck />}
                  </button>
                )) : <div className="e2e_alias_empty"><FaSearch /><strong>No available Company Names</strong><span>Try a different username or email.</span></div>}
            </div>
            <footer><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="button" className="primary" disabled={!selected} onClick={() => setConfirming(true)}>Continue</button></footer>
          </>
        ) : (
          <div className="e2e_alias_confirm">
            <div><FaUserTag /></div>
            <h3>Confirm Company Identity</h3>
            <p>Assign <strong>{selected.company_name}</strong> ({selected.username}) to <strong>{employee.legal_name}</strong>?</p>
            <small>This creates the central one-to-one employee and user identity mapping.</small>
            {error && <p className="e2e_alias_error" role="alert">{error}</p>}
            <footer><button type="button" className="secondary" disabled={saving} onClick={() => setConfirming(false)}>Back</button><button type="button" className="primary" disabled={saving} onClick={handleAssign}>{saving ? "Assigning..." : "Assign Company Name"}</button></footer>
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignCompanyNameModal;
