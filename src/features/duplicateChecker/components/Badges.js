import { TONE_CLASSES, VERDICT_META, scoreTone } from '../lib/presentation';
export function ScoreBadge({
  score
}) {
  return <span className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${TONE_CLASSES[scoreTone(score)].badge}`} aria-label={`Similarity score ${score} out of 100`}>
      {score}
    </span>;
}
export function VerdictBadge({
  verdict
}) {
  const meta = VERDICT_META[verdict];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${TONE_CLASSES[meta.tone].badge}`}>
      {meta.label}
    </span>;
}
