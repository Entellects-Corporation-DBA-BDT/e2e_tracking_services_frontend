import { useMemo } from 'react';
import { Cloud, FolderOpen, Gauge, GitBranch, Settings as SettingsIcon, Ticket, Bot } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { ConnectButton, Field, INPUT_CLASS, SettingsSection } from '../components/settings/SettingsSection';
const LLM_OPTIONS = [{
  value: 'openai',
  label: 'OpenAI'
}, {
  value: 'anthropic',
  label: 'Anthropic'
}, {
  value: 'gemini',
  label: 'Google Gemini'
}];
export default function SettingsPage({
  settings,
  onChange
}) {
  const repos = useMemo(() => settings.githubRepos.split(',').map(repo => repo.trim()).filter(Boolean), [settings.githubRepos]);
  return <>
      <PageHeader title="Settings" subtitle="Preview connection settings and tune how strict sample matching is." />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <SettingsIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm leading-normal text-amber-900">
          These are connection previews from the original sample tool. Live connectors are not implemented. Do not enter production secrets here. Changes apply only until you reload.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight text-slate-900">Demo mode</h2>
                <p className="mt-1 text-sm leading-normal text-slate-500">
                  Analyses use built-in sample data. Live connections are not available yet.
                </p>
              </div>
            </div>
            <button type="button" role="switch" aria-checked={settings.demoMode} aria-label="Demo mode" onClick={() => onChange({
            demoMode: !settings.demoMode
          })} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${settings.demoMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${settings.demoMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <SettingsSection title="Jira" description="Where past stories are searched." icon={<Ticket className="h-4 w-4" aria-hidden="true" />}>
          <Field id="jira-url" label="Site URL">
            <input id="jira-url" className={INPUT_CLASS} value={settings.jiraUrl} onChange={event => onChange({
            jiraUrl: event.target.value
          })} />
          </Field>
          <Field id="jira-email" label="Account email">
            <input id="jira-email" type="email" className={INPUT_CLASS} placeholder="you@company.com" value={settings.jiraEmail} onChange={event => onChange({
            jiraEmail: event.target.value
          })} />
          </Field>
          <Field id="jira-token" label="API token">
            <input id="jira-token" type="password" autoComplete="off" className={INPUT_CLASS} value={settings.jiraToken} onChange={event => onChange({
            jiraToken: event.target.value
          })} />
          </Field>
        </SettingsSection>

        <SettingsSection title="Google Drive" description="Folder that holds requirement and design documents." icon={<FolderOpen className="h-4 w-4" aria-hidden="true" />}>
          <Field id="drive-folder" label="Folder ID" hint="Found at the end of the folder's web address.">
            <input id="drive-folder" className={INPUT_CLASS} value={settings.driveFolderId} onChange={event => onChange({
            driveFolderId: event.target.value
          })} />
          </Field>
          <ConnectButton connected={settings.driveConnected} onToggle={() => onChange({
          driveConnected: !settings.driveConnected
        })} />
        </SettingsSection>

        <SettingsSection title="GitHub" description="Token and repositories used for code searches." icon={<GitBranch className="h-4 w-4" aria-hidden="true" />}>
          <Field id="github-token" label="Personal access token">
            <input id="github-token" type="password" autoComplete="off" className={INPUT_CLASS} value={settings.githubToken} onChange={event => onChange({
            githubToken: event.target.value
          })} />
          </Field>
          <Field id="github-repos" label="Repositories" hint="Separate repositories with commas.">
            <input id="github-repos" className={INPUT_CLASS} value={settings.githubRepos} onChange={event => onChange({
            githubRepos: event.target.value
          })} />
          </Field>
          {repos.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Repositories to search">
              {repos.map(repo => <li key={repo} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{repo}</li>)}
            </ul>}
        </SettingsSection>

        <SettingsSection title="Language model" description="Used to summarize stories and explain verdicts." icon={<Cloud className="h-4 w-4" aria-hidden="true" />}>
          <Field id="llm-provider" label="Provider">
            <select id="llm-provider" className={`${INPUT_CLASS} cursor-pointer`} value={settings.llmProvider} onChange={event => onChange({
            llmProvider: event.target.value
          })}>
              {LLM_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field id="llm-key" label="API key">
            <input id="llm-key" type="password" autoComplete="off" className={INPUT_CLASS} value={settings.llmApiKey} onChange={event => onChange({
            llmApiKey: event.target.value
          })} />
          </Field>
        </SettingsSection>

        <SettingsSection title="Match thresholds" description="Decide when a result counts as related or as a clear match." icon={<Gauge className="h-4 w-4" aria-hidden="true" />}>
          <Field id="similar-threshold" label={`Similar score: ${settings.similarThreshold}`} hint="Matches at or above this score count as related.">
            <input id="similar-threshold" type="range" min={0} max={100} value={settings.similarThreshold} onChange={event => {
            const value = Number(event.target.value);
            onChange({
              similarThreshold: value,
              strongThreshold: Math.max(value, settings.strongThreshold)
            });
          }} className="w-full cursor-pointer accent-blue-600" />
          </Field>
          <Field id="strong-threshold" label={`Strong match score: ${settings.strongThreshold}`} hint="Matches at or above this score count as a clear match.">
            <input id="strong-threshold" type="range" min={settings.similarThreshold} max={100} value={settings.strongThreshold} onChange={event => onChange({
            strongThreshold: Number(event.target.value)
          })} className="w-full cursor-pointer accent-blue-600" />
          </Field>
        </SettingsSection>
      </div>
    </>;
}
