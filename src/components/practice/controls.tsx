'use client';

import { Pause, Play, Repeat, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioTime, type DrillAudio, type PlaybackRate } from './use-drill-audio';

export function Chip({
  active,
  onClick,
  children,
  title,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'min-h-[40px] border px-3 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40',
        active
          ? 'border-j-accent bg-j-accent-light text-j-accent'
          : 'border-j-border-input text-j-text-secondary hover:border-j-accent hover:text-j-accent',
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  onClick,
  children,
  disabled,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-h-[44px] bg-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent transition-colors hover:bg-j-accent-hover disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Marks a drill read by the browser's voice because it has no recording yet. */
export function SpeechLabel() {
  return (
    <span
      className="border border-j-warm px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-j-warm-dark"
      title="Este drill todavía no tiene grabación: lo lee la voz del navegador"
      data-testid="speech-label"
    >
      voz del navegador
    </span>
  );
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const RATES: PlaybackRate[] = [0.75, 1];

/** Play/pause, restart, speed and loop. */
export function AudioBar({ audio, showLoop = true }: { audio: DrillAudio; showLoop?: boolean }) {
  if (!audio.available) {
    return (
      <p className="border border-dashed border-j-border px-3 py-3 font-mono text-[11px] text-j-text-tertiary">
        Este drill todavía no tiene audio y el navegador no tiene voz.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={audio.toggle}
          aria-label={audio.playing ? 'Pausar' : 'Reproducir'}
          className="flex h-12 w-12 items-center justify-center bg-j-accent text-j-text-on-accent transition-colors hover:bg-j-accent-hover"
        >
          {audio.playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          type="button"
          onClick={audio.restart}
          aria-label="Desde el principio"
          className="flex h-12 w-12 items-center justify-center border border-j-border-input text-j-text-secondary transition-colors hover:border-j-accent hover:text-j-accent"
        >
          <RotateCcw size={18} />
        </button>
        <div className="flex gap-1">
          {RATES.map((r) => (
            <Chip key={r} active={audio.rate === r} onClick={() => audio.setRate(r)} title={`Velocidad ${r}×`}>
              {r}×
            </Chip>
          ))}
        </div>
        {audio.kind === 'speech' && <SpeechLabel />}
        {showLoop && (
          <Chip active={audio.loop} onClick={() => audio.setLoop(!audio.loop)} title="Repetir en loop">
            <span className="flex items-center gap-1.5"><Repeat size={12} /> Loop</span>
          </Chip>
        )}
      </div>
      <AudioProgress audio={audio} />
    </div>
  );
}

/**
 * The bar and the clock: the only part that follows the audio as it plays
 * (a few times a second, on the element's timeupdate). The fill is scaled,
 * not resized (no layout), and steps with each update: easing it between
 * updates kept the compositor drawing every display frame the whole time
 * the audio played.
 */
function AudioProgress({ audio }: { audio: DrillAudio }) {
  const time = useAudioTime(audio);
  const progress = audio.duration > 0 ? Math.min(1, time / audio.duration) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden bg-j-border">
        <div
          className="h-1 origin-left bg-j-accent"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-j-text-tertiary">
        {formatTime(time)} / {formatTime(audio.duration)}
      </span>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-j-border bg-j-bg-white px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-j-text-tertiary">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-j-text" data-stat={label}>{value}</p>
    </div>
  );
}
