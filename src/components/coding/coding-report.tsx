'use client';

/**
 * The written scorecard after a coding mock (POST /api/interview/coding-report):
 * the verdict at senior bar, the five dimensions with quoted moments, what the
 * engineer would note, the clarifications asked and missed, English
 * corrections and the three things to drill next. A report already stored
 * with the attempt is shown as is; otherwise it is requested once.
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RUBRIC_LABELS, VERDICT_LABELS, type CodingReport, type CodingSessionFacts, type ReportTranscriptLine } from '@/lib/coding/report';

interface CodingReportViewProps {
  resourceId: string;
  problemId: string;
  transcript: ReportTranscriptLine[];
  finalCode: string;
  facts: CodingSessionFacts;
  stored: CodingReport | null;
  onReport: (report: CodingReport) => void;
  drillTitles: ReadonlyMap<string, string>;
  problemTitles: ReadonlyMap<string, string>;
  onPracticeDrill: (slug: string) => void;
  onPickProblem: (problemId: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{title}</h3>
      {children}
    </section>
  );
}

const SCORE_TONE = ['', 'text-j-error', 'text-j-error', 'text-j-text', 'text-j-success'];

export function CodingReportView(props: CodingReportViewProps) {
  const { resourceId, problemId, transcript, finalCode, facts, stored, onReport, drillTitles, problemTitles, onPracticeDrill, onPickProblem } = props;
  const [report, setReport] = useState<CodingReport | null>(stored);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (stored) {
      setReport(stored);
      return;
    }
    let cancelled = false;
    setError(null);
    fetch('/api/interview/coding-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, problemId, transcript, finalCode, facts }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'No se pudo armar el informe');
        if (cancelled) return;
        setReport(data.report as CodingReport);
        onReport(data.report as CodingReport);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
    // The session is final once it ends; re-run only on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, stored]);

  if (error) {
    return (
      <div className="space-y-2 border border-j-border p-4" data-testid="coding-report">
        <p className="text-sm text-j-error">{error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-[44px] font-mono text-[11px] uppercase tracking-[0.15em] text-j-accent">
          Reintentar
        </button>
      </div>
    );
  }
  if (!report) {
    return (
      <p className="border border-j-border p-4 text-sm text-j-text-secondary" aria-live="polite" data-testid="coding-report">
        Armando el informe del ingeniero…
      </p>
    );
  }

  return (
    <div className="space-y-6 border border-j-border p-4" data-testid="coding-report">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Informe · vara senior</p>
        <p className={cn('text-lg font-semibold', report.verdict.startsWith('strong') || report.verdict === 'yes' ? 'text-j-success' : report.verdict === 'lean_yes' ? 'text-j-text' : 'text-j-error')}>
          {VERDICT_LABELS[report.verdict]}
        </p>
        {report.summary && <p className="text-sm leading-relaxed text-j-text">{report.summary}</p>}
      </div>

      <Section title="Las cinco dimensiones (1 a 4)">
        <ul className="space-y-4">
          {report.rubric.map((r) => (
            <li key={r.dimension} className="space-y-1 text-sm">
              <p>
                <span className={cn('mr-2 inline-block min-w-[36px] font-mono text-xs', SCORE_TONE[r.score])}>{r.score}/4</span>
                <span className="font-medium text-j-text">{RUBRIC_LABELS[r.dimension]}</span>
                {r.note && <span className="text-j-text-secondary"> · {r.note}</span>}
              </p>
              {r.evidence.length > 0 && (
                <ul className="space-y-1 pl-11">
                  {r.evidence.map((e, i) => (
                    <li key={i} className="text-j-text-secondary">
                      <span className="italic text-j-text" lang="en">“{e.quote}”</span>
                      {e.note && <span> · {e.note}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {report.next.length > 0 && (
        <Section title="Lo próximo para practicar">
          <ul className="space-y-2">
            {report.next.map((n, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => (n.drill ? onPracticeDrill(n.drill) : n.problem ? onPickProblem(n.problem) : undefined)}
                  className="min-h-[44px] w-full border border-j-accent px-3 py-2 text-left hover:bg-j-accent/10"
                >
                  <span className="block text-sm font-medium text-j-text">
                    {n.what}
                    {n.drill ? ` · ${drillTitles.get(n.drill) ?? n.drill}` : n.problem ? ` · ${problemTitles.get(n.problem) ?? n.problem}` : ''} →
                  </span>
                  {n.why && <span className="block text-xs text-j-text-secondary">{n.why}</span>}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.moments.length > 0 && (
        <Section title="Momentos que movieron la nota">
          <ol className="space-y-3 text-sm">
            {report.moments.map((m, i) => (
              <li key={i} className="space-y-1">
                {m.quote && (
                  <p className="italic text-j-text" lang="en">
                    “{m.quote}”
                  </p>
                )}
                <p className="text-j-text-secondary">{m.what}</p>
                {m.better && (
                  <p className="border-l-2 border-j-accent pl-2 text-j-text" lang="en">
                    <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Mejor así</span>
                    {m.better}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {report.engineer_notes.length > 0 && (
        <Section title="Lo que anotaría el ingeniero">
          <ul className="list-disc space-y-1 pl-5 text-sm text-j-text" lang="en">
            {report.engineer_notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </Section>
      )}

      {(report.clarifications.asked.length > 0 || report.clarifications.missed.length > 0) && (
        <Section title="Preguntas de aclaración">
          <div className="grid gap-3 text-sm sm:grid-cols-2" lang="en">
            <div>
              <p className="text-xs text-j-text-tertiary">Hiciste</p>
              <ul className="list-disc pl-5 text-j-text-secondary">
                {report.clarifications.asked.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-j-text-tertiary">Te faltó</p>
              <ul className="list-disc pl-5 text-j-text">
                {report.clarifications.missed.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      )}

      {report.language.length > 0 && (
        <Section title="Inglés">
          <ul className="space-y-1 text-sm">
            {report.language.map((l, i) => (
              <li key={i} className="text-j-text">
                <span className="text-j-text-secondary">“{l.said}”</span> → {l.say}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
