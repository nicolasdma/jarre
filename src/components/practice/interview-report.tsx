'use client';

/**
 * The written report after an interview mock (POST /api/interview/report):
 * a score per question, the misconceptions, what was not known by heart, key
 * terms that came out wrong, recurring English errors and three drills to
 * practice next. The spoken closing is short; this is what to study from.
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { InterviewReport as Report, ReportTranscriptLine } from '@/lib/interview/report';

interface InterviewReportProps {
  resourceId: string;
  personaId: string;
  depth: number;
  transcript: ReportTranscriptLine[];
  /** Drill titles by slug, for the practice links. */
  drillTitles: Map<string, string>;
  onPracticeDrill: (slug: string) => void;
}

const SCORE_LABEL = ['Mal', 'Flojo', 'Incompleto', 'Completo'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{title}</h3>
      {children}
    </section>
  );
}

export function InterviewReport({ resourceId, personaId, depth, transcript, drillTitles, onPracticeDrill }: InterviewReportProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch('/api/interview/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, personaId, depth, transcript }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'No se pudo armar el reporte');
        if (!cancelled) setReport(data.report as Report);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
    // The transcript is final once the interview is done; re-run only on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (error) {
    return (
      <div className="space-y-2 border border-j-border p-4" data-testid="interview-report">
        <p className="text-sm text-red-600">{error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-[44px] font-mono text-[11px] uppercase tracking-[0.15em] text-j-accent">
          Reintentar
        </button>
      </div>
    );
  }
  if (!report) {
    return (
      <p className="border border-j-border p-4 text-sm text-j-text-secondary" aria-live="polite" data-testid="interview-report">
        Armando el reporte de la entrevista…
      </p>
    );
  }

  const total = report.questions.length ? report.questions.reduce((a, q) => a + q.score, 0) : 0;
  const max = report.questions.length * 3;

  return (
    <div className="space-y-6 border border-j-border p-4" data-testid="interview-report">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
          Reporte{max ? ` · ${total}/${max}` : ''}
        </p>
        {report.summary && <p className="text-sm leading-relaxed text-j-text">{report.summary}</p>}
      </div>

      {report.practice.length > 0 && (
        <Section title="Practicá ahora">
          <ul className="space-y-2">
            {report.practice.map((p) => (
              <li key={p.drill}>
                <button
                  type="button"
                  onClick={() => onPracticeDrill(p.drill)}
                  className="min-h-[44px] w-full border border-j-accent px-3 py-2 text-left hover:bg-j-accent/10"
                >
                  <span className="block text-sm font-medium text-j-text">{drillTitles.get(p.drill) ?? p.drill} →</span>
                  {p.why && <span className="block text-xs text-j-text-secondary">{p.why}</span>}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.misconceptions.length > 0 && (
        <Section title="Conceptos a corregir">
          <ul className="space-y-2 text-sm">
            {report.misconceptions.map((m, i) => (
              <li key={i}>
                <span className="text-j-text-secondary line-through decoration-j-text-tertiary">{m.said}</span>
                <span className="block text-j-text">{m.right}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.must_know.some((m) => m.missing.length > 0) && (
        <Section title="Lo que tenés que saber de memoria">
          {report.must_know
            .filter((m) => m.missing.length > 0)
            .map((m, i) => (
              <div key={i} className="text-sm">
                <p className="text-j-text">{m.topic}: te faltó</p>
                <ul className="list-disc pl-5 text-j-text-secondary">
                  {m.missing.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ul>
              </div>
            ))}
        </Section>
      )}

      {report.questions.length > 0 && (
        <Section title="Pregunta por pregunta">
          <ul className="space-y-2">
            {report.questions.map((q, i) => (
              <li key={i} className="text-sm">
                <span
                  className={cn(
                    'mr-2 inline-block min-w-[84px] font-mono text-[10px] uppercase tracking-[0.12em]',
                    q.score >= 3 ? 'text-j-accent' : q.score === 2 ? 'text-j-text-secondary' : 'text-red-600',
                  )}
                >
                  {q.score}/3 {SCORE_LABEL[q.score]}
                </span>
                <span className="text-j-text">{q.question}</span>
                {q.verdict && <span className="block text-j-text-secondary">{q.verdict}</span>}
                {q.missing.length > 0 && <span className="block text-xs text-j-text-tertiary">Faltó: {q.missing.join(' · ')}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(report.terms.length > 0 || report.language.length > 0) && (
        <Section title="Inglés">
          <ul className="space-y-1 text-sm">
            {report.terms.map((t, i) => (
              <li key={`t${i}`} className="text-j-text">
                Decí claro <strong>{t.say}</strong> <span className="text-j-text-secondary">(se escuchó “{t.heard}”)</span>
              </li>
            ))}
            {report.language.map((l, i) => (
              <li key={`l${i}`} className="text-j-text">
                <span className="text-j-text-secondary">“{l.said}”</span> → {l.say}
                {l.times > 1 && <span className="text-j-text-tertiary"> · {l.times} veces</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
