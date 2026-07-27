import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { ProtectedButton } from "../../auth/PermissionComponents";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AccessCatalog({ type }) {
  const resource = type === "positions" ? "positions" : "resources";
  const singular = resource === "positions" ? "position" : "resource";
  const nameField = resource === "positions" ? "position_name" : "resource_name";
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/${singular}/list`, { params: { page: 1, limit: 100, search } });
      setRows(response.data.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to load ${resource}.`);
    }
  }, [resource, search, singular]);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    const payload = editing;
    const endpoint = editing.id ? `/${singular}/update/${editing.id}` : `/${singular}/create`;
    await axiosInstance[editing.id ? "put" : "post"](endpoint, payload);
    setEditing(null);
    load();
  };

  const remove = async (row) => {
    await axiosInstance.delete(`/${singular}/delete/${row.id}`);
    setRemoving(null);
    load();
  };

  return <div className="user-management">
    <header><div><h2>{resource === "positions" ? "Position Management" : "Resource Management"}</h2><p>Database-controlled authorization catalog.</p></div>
      <ProtectedButton resource={resource} action="create"><button onClick={() => setEditing({ [nameField]: "", status: "Active" })}>+ Add</button></ProtectedButton>
    </header>
    <div className="user-toolbar"><label><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${resource}...`} /></label></div>
    {error && <div className="e2e_empstatus_error">{error}</div>}
    <div className="user-table"><table><thead><tr><th>Name</th><th>Display Name</th><th>Route</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}><td>{row[nameField]}</td><td>{row.display_name || "—"}</td><td>{row.route || "—"}</td><td>{row.status}</td><td><div>
        <ProtectedButton resource={resource} action="edit"><button onClick={() => setEditing(row)}>Edit</button></ProtectedButton>
        <ProtectedButton resource={resource} action="delete"><button className="danger" onClick={() => setRemoving(row)}>Remove</button></ProtectedButton>
      </div></td></tr>)}</tbody></table></div>
    {editing && <div className="e2e_alias_overlay"><section className="employee-form-modal"><form onSubmit={save}><h2>{editing.id ? "Edit" : "Add"} {singular}</h2>
      <label>Name<input required value={editing[nameField] || ""} onChange={(event) => setEditing({ ...editing, [nameField]: event.target.value })} /></label>
      {resource === "resources" && <><label>Display Name<input value={editing.display_name || ""} onChange={(event) => setEditing({ ...editing, display_name: event.target.value })} /></label><label>Route<input value={editing.route || ""} onChange={(event) => setEditing({ ...editing, route: event.target.value })} /></label></>}
      <label>Status<select value={editing.status || "Active"} onChange={(event) => setEditing({ ...editing, status: event.target.value })}><option>Active</option><option>Inactive</option></select></label>
      <footer><button type="button" className="secondary" onClick={() => setEditing(null)}>Cancel</button><button className="primary">Save</button></footer>
    </form></section></div>}
    <ConfirmDialog open={Boolean(removing)} title={`Remove ${singular}?`}
      message={`Remove ${removing?.[nameField] || `this ${singular}`}? This may affect permissions and linked dashboard access.`}
      confirmLabel={`Remove ${singular}`} onCancel={()=>setRemoving(null)} onConfirm={()=>remove(removing)} />
  </div>;
}
