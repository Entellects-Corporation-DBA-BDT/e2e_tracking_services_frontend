import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSave, FaShieldAlt, FaUndo } from "react-icons/fa";
import { getPositions } from "../../api/employeeApi";
import { getUsers } from "../../api/userApi";
import {
  getPositionPermissions,
  getUserPermissions,
  resetUserPermissions,
  savePositionPermissions,
  saveUserPermissions,
} from "../../api/permissionApi";
import { ProtectedComponent } from "../../auth/PermissionContext";
import "../../styles/Dashboard/permissionMatrix.css";

const actions = ["view", "create", "edit", "delete", "export", "import", "upload", "download", "approve", "reject", "assign", "manage", "print", "share"];
const scopes = ["OWN", "TEAM", "DEPARTMENT", "OFFICE", "ALL"];
const hasOverride = (value) => value !== null && value !== undefined;

export default function PermissionMatrix() {
  const [mode, setMode] = useState("position");
  const [positions, setPositions] = useState([]);
  const [position, setPosition] = useState("");
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getPositions().then((response) => {
      const data = response.data || [];
      setPositions(data);
      if (data.length) setPosition(String(data[0].id));
    }).catch(() => setError("Positions could not be loaded."));
    getUsers({ page: 1, limit: 500 }).then((response) => {
      const data = response.data || [];
      setUsers(data);
      if (data.length) setUser(String(data[0].id));
    }).catch(() => setError("Users could not be loaded."));
  }, []);

  const load = useCallback(async () => {
    const id = mode === "position" ? position : user;
    if (!id) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = mode === "position"
        ? await getPositionPermissions(id)
        : await getUserPermissions(id);
      setRows(response.data || []);
      setSelectedUser(response.user || null);
    } catch (requestError) {
      setRows([]);
      setError(requestError?.response?.data?.message || "Permissions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [mode, position, user]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    if (mode !== "user") return null;
    let granted = 0;
    let denied = 0;
    let overrides = 0;
    rows.forEach((row) => actions.forEach((action) => {
      if (Number(row[`effective_can_${action}`])) granted += 1;
      else denied += 1;
      if (hasOverride(row[`can_${action}`])) overrides += 1;
    }));
    return { granted, denied, overrides };
  }, [mode, rows]);

  const togglePosition = (index, action) => setRows((current) => current.map((row, rowIndex) => (
    rowIndex === index ? { ...row, [`can_${action}`]: Number(!Number(row[`can_${action}`])) } : row
  )));

  const toggleUser = (index, action) => setRows((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const desired = Number(!Number(row[`effective_can_${action}`]));
    const roleDefault = Number(row[`position_can_${action}`]);
    return {
      ...row,
      [`can_${action}`]: desired === roleDefault ? null : desired,
      [`effective_can_${action}`]: desired,
    };
  }));

  const setScope = (index, value) => setRows((current) => current.map((row, rowIndex) => (
    rowIndex === index ? { ...row, data_scope: value === "inherit" ? null : value } : row
  )));

  const announce = (text) => {
    setMessage(text);
    window.dispatchEvent(new CustomEvent("e2e-permissions-changed"));
  };

  const save = async () => {
    const id = mode === "position" ? position : user;
    if (!id) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = mode === "position"
        ? await savePositionPermissions(id, rows)
        : await saveUserPermissions(id, rows);
      announce(response.message);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Permissions could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!user || !window.confirm("Remove every override for this user and restore their position permissions?")) return;
    setSaving(true);
    setError("");
    try {
      const response = await resetUserPermissions(user);
      announce(response.message);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "User overrides could not be reset.");
    } finally {
      setSaving(false);
    }
  };

  const userLocked = mode === "user" && selectedUser?.super_admin;

  return <div className="permission-matrix">
    <header>
      <div><FaShieldAlt /><span><h2>Permission Matrix</h2><p>Manage role defaults and precise access for individual users.</p></span></div>
      <div className="permission-actions">
        {mode === "user" && <ProtectedComponent resource="permissions" action="delete"><button className="permission-reset" onClick={reset} disabled={saving || !user || userLocked}><FaUndo /> Reset to Role</button></ProtectedComponent>}
        <ProtectedComponent resource="permissions" action="edit"><button onClick={save} disabled={saving || !(mode === "position" ? position : user) || userLocked}><FaSave />{saving ? "Saving..." : "Save Permissions"}</button></ProtectedComponent>
      </div>
    </header>

    <div className="permission-tabs">
      <button className={mode === "position" ? "active" : ""} onClick={() => setMode("position")}>Position Permissions</button>
      <button className={mode === "user" ? "active" : ""} onClick={() => setMode("user")}>User Permissions</button>
    </div>

    <div className="permission-role">
      {mode === "position"
        ? <label>Position<select value={position} onChange={(event) => setPosition(event.target.value)}>{positions.map((item) => <option key={item.id} value={item.id}>{item.position_name}</option>)}</select></label>
        : <label>Specific User<select value={user} onChange={(event) => setUser(event.target.value)}>{users.map((item) => <option key={item.id} value={item.id}>{item.nick_name} - {item.email} ({item.position_name})</option>)}</select></label>}
      <p>{mode === "position" ? "These permissions are the default for every user assigned to this position." : userLocked ? "Super Admin always has full access and cannot be overridden." : "The switches show current access. Changes that differ from the role are saved as user overrides."}</p>
    </div>

    {mode === "user" && summary && !loading && <div className="permission-summary">
      <span><strong>{summary.granted}</strong> Allowed</span>
      <span><strong>{summary.denied}</strong> Denied</span>
      <span className={summary.overrides ? "has-overrides" : ""}><strong>{summary.overrides}</strong> User Overrides</span>
      <div className="permission-legend"><i className="role-dot" /> Role permission <i className="override-dot" /> User override</div>
    </div>}

    {message && <div className="permission-message">{message}</div>}
    {error && <div className="permission-error">{error}</div>}

    <div className="permission-scroll"><table><thead><tr><th>Resource</th>{actions.map((action) => <th key={action}>{action}</th>)}<th>Data Scope</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={16}>Loading permission matrix...</td></tr> : rows.map((row, index) => <tr key={row.resource_id}>
        <td><strong>{row.display_name}</strong><small>{row.resource_name}</small>{mode === "user" && <small>Role scope: {row.position_data_scope || "OWN"}</small>}</td>
        {actions.map((action) => {
          const overridden = mode === "user" && hasOverride(row[`can_${action}`]);
          const checked = mode === "position" ? Boolean(Number(row[`can_${action}`])) : Boolean(Number(row[`effective_can_${action}`]));
          const source = overridden ? "User override" : "From role";
          return <td key={action}><label className={`permission-switch ${overridden ? "user-override" : "role-inherited"}`} title={`${source}: ${checked ? "Allowed" : "Denied"}`}><input type="checkbox" checked={checked} disabled={userLocked} onChange={() => mode === "position" ? togglePosition(index, action) : toggleUser(index, action)} /><span /><small>{mode === "user" ? (overridden ? "Override" : "Role") : ""}</small></label></td>;
        })}
        <td><select value={mode === "user" ? (row.data_scope ?? "inherit") : row.data_scope || "OWN"} disabled={userLocked} onChange={(event) => setScope(index, event.target.value)}>{mode === "user" && <option value="inherit">Role ({row.position_data_scope || "OWN"})</option>}{scopes.map((scope) => <option key={scope} value={scope}>{scope}</option>)}</select></td>
      </tr>)}
    </tbody></table></div>
  </div>;
}