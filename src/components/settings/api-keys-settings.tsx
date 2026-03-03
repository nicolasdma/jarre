'use client';

/**
 * Jarre - API Keys Settings Component
 *
 * Allows users to enter, test, and store their own API keys (BYOK).
 * Only rendered in managed mode.
 */

import { useState } from 'react';
import { useByok } from '@/components/contexts/byok-provider';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';

interface KeyInputProps {
  label: string;
  provider: 'deepseek' | 'gemini';
  value: string;
  onChange: (value: string) => void;
  helpUrl: string;
}

function KeyInput({ label, provider, value, onChange, helpUrl }: KeyInputProps) {
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'valid' | 'invalid' | null>(null);

  async function handleTest() {
    if (!value.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/byok/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: value.trim() }),
      });
      const data = await res.json();
      setTestResult(data.valid ? 'valid' : 'invalid');
    } catch {
      setTestResult('invalid');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-j-text-secondary">
          {label}
        </label>
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[9px] tracking-wider text-j-accent hover:underline"
        >
          Get key
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setTestResult(null);
            }}
            placeholder={`Enter your ${label} key`}
            className="w-full h-9 px-3 pr-9 font-mono text-xs bg-j-bg border border-j-border rounded-md focus:outline-none focus:ring-1 focus:ring-j-accent"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-j-text-secondary hover:text-j-text"
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={!value.trim() || testing}
          className="h-9 px-3 font-mono text-[10px] tracking-wider uppercase border border-j-border rounded-md hover:bg-j-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {testing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : testResult === 'valid' ? (
            <CheckCircle size={12} className="text-green-500" />
          ) : testResult === 'invalid' ? (
            <XCircle size={12} className="text-red-500" />
          ) : null}
          Test
        </button>
      </div>
    </div>
  );
}

export function ApiKeysSettings() {
  const { keys, hasKeys, saveKeys, removeKeys } = useByok();
  const [deepseek, setDeepseek] = useState(keys.deepseek || '');
  const [gemini, setGemini] = useState(keys.gemini || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveKeys({
      deepseek: deepseek.trim() || undefined,
      gemini: gemini.trim() || undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    removeKeys();
    setDeepseek('');
    setGemini('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-j-text">
          API Keys
        </h2>
        {hasKeys && (
          <span className="font-mono text-[9px] tracking-wider text-green-500 uppercase">
            Using your keys
          </span>
        )}
      </div>

      <p className="font-mono text-[10px] text-j-text-secondary leading-relaxed">
        Bring your own API keys to remove usage limits. Keys are encrypted and stored locally in your browser.
      </p>

      <KeyInput
        label="DeepSeek"
        provider="deepseek"
        value={deepseek}
        onChange={setDeepseek}
        helpUrl="https://platform.deepseek.com/api_keys"
      />

      <KeyInput
        label="Gemini"
        provider="gemini"
        value={gemini}
        onChange={setGemini}
        helpUrl="https://aistudio.google.com/apikey"
      />

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (!deepseek.trim() && !gemini.trim())}
          className="h-9 px-4 font-mono text-[10px] tracking-[0.2em] uppercase bg-j-accent text-j-text-on-accent rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          {saved ? 'Saved' : 'Save keys'}
        </button>

        {hasKeys && (
          <button
            type="button"
            onClick={handleClear}
            className="h-9 px-3 font-mono text-[10px] tracking-wider uppercase border border-j-border rounded-md hover:bg-red-500/10 hover:border-red-500/30 text-red-500 flex items-center gap-1.5"
          >
            <Trash2 size={12} />
            Clear keys
          </button>
        )}
      </div>
    </div>
  );
}
