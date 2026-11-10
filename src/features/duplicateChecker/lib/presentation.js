import { CircleCheck, FileText, GitBranch, Github, HardDrive, Layers, Ticket } from 'lucide-react';
import { SOURCE_LABELS } from '../types';
export const TONE_CLASSES = {
  green: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    panel: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-800',
    icon: 'bg-emerald-600 text-white'
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    panel: 'border-amber-200 bg-amber-50',
    text: 'text-amber-900',
    icon: 'bg-amber-500 text-white'
  },
  red: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    panel: 'border-rose-200 bg-rose-50',
    text: 'text-rose-800',
    icon: 'bg-rose-600 text-white'
  }
};
export const VERDICT_META = {
  NEW: {
    label: 'NEW',
    tone: 'green',
    icon: CircleCheck
  },
  ALREADY_IMPLEMENTED: {
    label: 'ALREADY IMPLEMENTED',
    tone: 'red',
    icon: GitBranch
  },
  ALREADY_DOCUMENTED: {
    label: 'ALREADY DOCUMENTED',
    tone: 'amber',
    icon: FileText
  },
  PARTIALLY_EXISTS: {
    label: 'PARTIALLY EXISTS',
    tone: 'amber',
    icon: Layers
  }
};
export const SOURCE_META = {
  jira: {
    label: SOURCE_LABELS.jira,
    hint: 'Past stories',
    icon: Ticket
  },
  drive: {
    label: SOURCE_LABELS.drive,
    hint: 'Documents',
    icon: HardDrive
  },
  github: {
    label: SOURCE_LABELS.github,
    hint: 'Code',
    icon: Github
  }
};
export function scoreTone(score) {
  if (score >= 80) return 'red';
  if (score >= 40) return 'amber';
  return 'green';
}
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});
export function formatDateTime(iso) {
  return dateTimeFormatter.format(new Date(iso));
}
