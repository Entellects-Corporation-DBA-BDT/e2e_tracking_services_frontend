import { useEffect, useState } from 'react'; import { submitPublicW2, updateW2Form } from '../api/w2Api'; import '../styles/w2.css';
export const SECTIONS = [
    { title: 'Project Details', fields: [['manager_name', 'Manager Name'], ['recruiter_name', 'Recruiter Name'], ['project_consultant_name', 'Consultant Name'], ['project_start_date', 'Project Start Date', 'date'], ['project_end_date', 'End Date', 'date'], ['position_title', 'Position Title'], ['work_address', 'Work Address']] },
    { title: 'Consultant Details', fields: [['consultant_name', 'Consultant Name', 'text', true], ['consultant_address', 'Consultant Address'], ['consultant_phone', 'Cell Phone / Home Phone'], ['consultant_email', 'Email', 'email', true], ['emergency_contact', 'Emergency Contact'], ['emergency_address', 'Emergency Address']], checks: [['employment_w2', 'W2'], ['employment_1099', '1099'], ['employment_corp_to_corp', 'Corp to Corp']] },
    { title: 'Consultant End Client Details', fields: [['end_client_name', 'End Client Name'], ['end_client_address', 'Address'], ['reporting_manager', 'Reporting Manager'], ['client_phone', 'Phone'], ['client_fax', 'Fax'], ['client_email', 'Email', 'email'], ['switchboard_extension', 'Switch Board / Extension'], ['client_website', 'Website', 'url'], ['project_name', 'Project Name'], ['team_name', 'Team Name']] },
    { title: 'Invoicing Details', fields: [['invoice_company_name', 'Company Name'], ['invoice_address', 'Address'], ['invoice_phone', 'Phone'], ['invoice_fax', 'Fax'], ['invoice_email', 'Email', 'email'], ['timesheet_email', 'Time Sheet Email', 'email'], ['invoice_website', 'Website', 'url'], ['invoice_contact_person', 'Contact Person'], ['net_payment_terms', 'Net Payment Terms'], ['invoice_terms', 'Invoice Terms']] },
    { title: 'Comments', fields: [['comments', 'Comments'], ['h1b_validity', 'H1B Validity'], ['lca_h1b_amendment', 'LCA/H1B Amendment']] }
];
export const EMPTY = Object.fromEntries(SECTIONS.flatMap(s => [...s.fields, ...(s.checks || [])].map(([n]) => [n, false])).map(([k, v]) => [k, k.startsWith('employment_') ? false : '']));
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export async function downloadInteractiveW2(data) { const logoBlob = await fetch('/beedata-logo.png').then(r => r.blob()); const logo = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(logoBlob) }); const sections = SECTIONS.map(s => `<section><h2>${s.title}</h2><div class="grid">${s.fields.map(([n, l, t = 'text']) => `<label><span>${l}</span><input type="${t}" name="${n}" value="${esc(data[n])}"></label>`).join('')}</div>${s.checks ? `<fieldset><legend>Type of Employment</legend>${s.checks.map(([n, l]) => `<label><input type="checkbox" name="${n}" ${Number(data[n]) || data[n] === true ? 'checked' : ''}> ${l}</label>`).join('')}</fieldset>` : ''}</section>`).join(''); const html = `<!doctype html><html><head><meta charset="utf-8"><title>W-2 Consultant Form - ${esc(data.consultant_name)}</title><style>body{font:14px Arial;max-width:900px;margin:25px auto;color:#111}h1{text-align:center}section{border:1px solid #777;border-radius:10px;padding:14px;margin:22px 0}h2{font-size:15px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}label span{display:block;font-size:12px;font-weight:bold;margin-bottom:3px}input{box-sizing:border-box;width:100%;padding:9px;border:1px solid #bbb}fieldset label{display:block}fieldset input{width:auto}@media(max-width:600px){.grid{grid-template-columns:1fr}}@media print{button{display:none}}</style></head><body><img src="${logo}" alt="Bee Data Technology" style="display:block;max-width:380px;width:70%;margin:0 auto 20px"><h1>W-2 Consultant Form</h1><form>${sections}<button type="button" onclick="window.print()">Print / Save as PDF</button></form></body></html>`; const blob = new Blob([html], { type: 'text/html;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `w2-${(data.consultant_name || 'consultant').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`; a.click(); URL.revokeObjectURL(url) }
export default function W2Form({ initialData, recordId, onSaved, readOnly = false }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialData });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm({ ...EMPTY, ...initialData }), [initialData]);

  const change = event => setForm(current => ({
    ...current,
    [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
  }));

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setStatus('Saving your information...');
    try {
      recordId ? await updateW2Form(recordId, form) : await submitPublicW2(form);
      setStatus(recordId ? 'Changes saved successfully.' : 'Your form was submitted successfully.');
      onSaved?.();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Unable to save the form. Please review the information and try again.');
    } finally {
      setSaving(false);
    }
  };

  const wideFields = ['work_address', 'consultant_address', 'emergency_address', 'end_client_address', 'invoice_address', 'comments'];
  const multilineFields = ['work_address', 'consultant_address', 'emergency_address', 'end_client_address', 'invoice_address', 'comments'];

  return <form className={`w2-sheet ${readOnly ? 'w2-readonly' : ''}`} onSubmit={save}>
    <header className="w2-sheet-header">
      <div><span className="w2-document-label">EMPLOYMENT DOCUMENT</span><b>Data Form</b><p>Project, consultant, end-client and invoicing information</p></div>
      <span className="w2-secure-badge">Secure form</span>
    </header>

    <div className="w2-form-content">
      {SECTIONS.map((section, sectionIndex) => <section className="w2-section" key={section.title}>
        <header className="w2-section-heading"><span>{String(sectionIndex + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2><p>Provide the applicable information below.</p></div></header>
        <div className="w2-section-grid">
          {section.fields.map(([name, label, type = 'text', required = false]) => {
            const Field = multilineFields.includes(name) ? 'textarea' : 'input';
            return <label key={name} className={wideFields.includes(name) ? 'w2-field-wide' : ''}>
              <span>{label}{required && <em>Required</em>}</span>
              <Field name={name} type={Field === 'input' ? type : undefined} rows={Field === 'textarea' ? 3 : undefined} required={required} readOnly={readOnly} value={form[name] ?? ''} onChange={change} />
            </label>;
          })}
        </div>
        {section.checks && <fieldset className="w2-employment"><legend>Type of Employment</legend><div>{section.checks.map(([name, label]) => <label key={name} className={form[name] ? 'selected' : ''}><input name={name} type="checkbox" disabled={readOnly} checked={!!Number(form[name]) || form[name] === true} onChange={change} /><span>{label}</span></label>)}</div></fieldset>}
      </section>)}
    </div>

    {!readOnly && <footer className="w2-submit-bar"><div><strong>Ready to submit?</strong><span>Review all details before sending this secure form.</span></div><div><span className="w2-form-status" role="status">{status}</span><button disabled={saving}>{saving ? 'Saving...' : recordId ? 'Save changes' : 'Submit Data Form information'}</button></div></footer>}
  </form>;
}