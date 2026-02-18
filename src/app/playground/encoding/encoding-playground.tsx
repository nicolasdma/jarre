'use client';

import { useState, useMemo } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EncodingFormat = 'json' | 'msgpack' | 'protobuf' | 'avro';

interface FieldDef {
  name: string;
  tag: number;
  type: 'string' | 'int64' | 'array<string>';
  value: string | number | string[];
}

interface EncodingResult {
  format: EncodingFormat;
  label: string;
  bytes: number;
  breakdown: { label: string; bytes: number; color: string }[];
  features: { label: string; supported: boolean }[];
}

// ---------------------------------------------------------------------------
// Encoding simulation
// ---------------------------------------------------------------------------

const DEFAULT_FIELDS: FieldDef[] = [
  { name: 'userName', tag: 1, type: 'string', value: 'Martin' },
  { name: 'favoriteNumber', tag: 2, type: 'int64', value: 1337 },
  { name: 'interests', tag: 3, type: 'array<string>', value: ['daydreaming', 'hacking'] },
];

function simulateEncoding(fields: FieldDef[]): EncodingResult[] {
  // Calculate approximate byte sizes based on DDIA examples
  const jsonStr = JSON.stringify(
    Object.fromEntries(fields.map((f) => [f.name, f.value]))
  );
  const jsonBytes = new TextEncoder().encode(jsonStr).length;

  const nameOverhead = fields.reduce((sum, f) => sum + f.name.length + 3, 0); // quotes + colon
  const valueBytes = jsonBytes - nameOverhead - 2; // minus braces

  // MessagePack: ~18% saving over JSON (field names still included)
  const msgpackBytes = Math.round(jsonBytes * 0.82);

  // Protobuf: field tags (1-2 bytes) replace names, varints for numbers
  const protobufBytes = fields.reduce((sum, f) => {
    const tagBytes = 1; // tag + wire type
    if (f.type === 'string') return sum + tagBytes + 1 + (f.value as string).length;
    if (f.type === 'int64') return sum + tagBytes + 2; // varint
    if (f.type === 'array<string>') {
      return sum + (f.value as string[]).reduce((s, v) => s + tagBytes + 1 + v.length, 0);
    }
    return sum;
  }, 0);

  // Avro: no field tags, just values concatenated
  const avroBytes = fields.reduce((sum, f) => {
    if (f.type === 'string') return sum + 1 + (f.value as string).length; // length prefix + data
    if (f.type === 'int64') return sum + 2; // varint zigzag
    if (f.type === 'array<string>') {
      return sum + 1 + (f.value as string[]).reduce((s, v) => s + 1 + v.length, 0) + 1; // block count + items + zero terminator
    }
    return sum;
  }, 0);

  return [
    {
      format: 'json',
      label: 'JSON',
      bytes: jsonBytes,
      breakdown: [
        { label: 'Nombres de campo', bytes: nameOverhead, color: '#991b1b' },
        { label: 'Valores', bytes: valueBytes, color: '#8b7355' },
        { label: 'Sintaxis ({, ", :)', bytes: jsonBytes - nameOverhead - valueBytes, color: '#9ca3af' },
      ],
      features: [
        { label: 'Legible por humanos', supported: true },
        { label: 'Schema requerido', supported: false },
        { label: 'Forward compatibility', supported: false },
        { label: 'Tipos precisos (int vs float)', supported: false },
      ],
    },
    {
      format: 'msgpack',
      label: 'MessagePack',
      bytes: msgpackBytes,
      breakdown: [
        { label: 'Nombres de campo', bytes: Math.round(nameOverhead * 0.9), color: '#991b1b' },
        { label: 'Valores', bytes: msgpackBytes - Math.round(nameOverhead * 0.9), color: '#8b7355' },
      ],
      features: [
        { label: 'Legible por humanos', supported: false },
        { label: 'Schema requerido', supported: false },
        { label: 'Forward compatibility', supported: false },
        { label: 'Tipos precisos (int vs float)', supported: true },
      ],
    },
    {
      format: 'protobuf',
      label: 'Protocol Buffers',
      bytes: protobufBytes,
      breakdown: [
        { label: 'Field tags', bytes: fields.length, color: '#991b1b' },
        { label: 'Valores', bytes: protobufBytes - fields.length, color: '#8b7355' },
      ],
      features: [
        { label: 'Legible por humanos', supported: false },
        { label: 'Schema requerido', supported: true },
        { label: 'Forward compatibility', supported: true },
        { label: 'Tipos precisos (int vs float)', supported: true },
      ],
    },
    {
      format: 'avro',
      label: 'Apache Avro',
      bytes: avroBytes,
      breakdown: [
        { label: 'Valores (sin tags)', bytes: avroBytes, color: '#8b7355' },
      ],
      features: [
        { label: 'Legible por humanos', supported: false },
        { label: 'Schema requerido', supported: true },
        { label: 'Forward compatibility', supported: true },
        { label: 'Tipos precisos (int vs float)', supported: true },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EncodingPlayground() {
  const [fields, setFields] = useState<FieldDef[]>(DEFAULT_FIELDS);
  const [extraField, setExtraField] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<EncodingFormat | null>(null);

  const fieldsWithExtra = useMemo(() => {
    if (!extraField) return fields;
    return [...fields, { name: 'email', tag: 4, type: 'string' as const, value: 'martin@example.com' }];
  }, [fields, extraField]);

  const results = useMemo(() => simulateEncoding(fieldsWithExtra), [fieldsWithExtra]);
  const maxBytes = Math.max(...results.map((r) => r.bytes));

  const handleToggleExtraField = () => setExtraField((v) => !v);
  const handleReset = () => {
    setFields(DEFAULT_FIELDS);
    setExtraField(false);
    setSelectedFormat(null);
  };

  return (
    <PlaygroundLayout
      accentColor="#991b1b"
      disableTutor
      lessons={
        <LessonGuide
          onToggleField={handleToggleExtraField}
          onSelectFormat={(f: EncodingFormat) => setSelectedFormat(f)}
          onReset={handleReset}
        />
      }
    >
      <div className="overflow-y-auto h-full p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleExtraField}
              className={`px-4 py-2 font-mono text-[11px] tracking-wider uppercase border transition-colors ${
                extraField
                  ? 'bg-[#991b1b] text-white border-[#991b1b]'
                  : 'border-j-border text-j-text hover:border-j-text'
              }`}
            >
              {extraField ? '- Quitar campo email' : '+ Agregar campo email'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 font-mono text-[11px] tracking-wider uppercase border border-j-border text-j-text-tertiary hover:text-j-text transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Encoding comparison */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              Tamano de codificacion ({fieldsWithExtra.length} campos)
            </p>

            {results.map((result) => (
              <button
                key={result.format}
                onClick={() => setSelectedFormat(result.format)}
                className={`w-full text-left p-4 border transition-colors ${
                  selectedFormat === result.format
                    ? 'border-[#991b1b] bg-[#991b1b]/5'
                    : 'border-j-border hover:border-j-text/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-j-text">{result.label}</span>
                  <span className="font-mono text-lg text-j-text font-light">{result.bytes} bytes</span>
                </div>

                {/* Bar chart */}
                <div className="flex h-6 bg-j-bg rounded-sm overflow-hidden">
                  {result.breakdown.map((b) => (
                    <div
                      key={b.label}
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(b.bytes / maxBytes) * 100}%`,
                        backgroundColor: b.color,
                        opacity: 0.7,
                      }}
                      title={`${b.label}: ${b.bytes} bytes`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-2">
                  {result.breakdown.map((b) => (
                    <div key={`legend-${b.label}`} className="flex items-center gap-1">
                      <div className="w-2 h-2" style={{ backgroundColor: b.color, opacity: 0.7 }} />
                      <span className="text-[10px] text-j-text-tertiary">{b.label}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Selected format details */}
          {selectedFormat && (
            <div className="border border-j-border p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
                Caracteristicas: {results.find((r) => r.format === selectedFormat)?.label}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {results
                  .find((r) => r.format === selectedFormat)
                  ?.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className={`text-sm ${f.supported ? 'text-green-700' : 'text-j-text-tertiary'}`}>
                        {f.supported ? '✓' : '✗'}
                      </span>
                      <span className={`text-sm ${f.supported ? 'text-j-text' : 'text-j-text-tertiary'}`}>
                        {f.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Savings summary */}
          <div className="border-t border-j-border pt-6">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              Ahorro respecto a JSON
            </p>
            <div className="grid grid-cols-3 gap-4">
              {results.filter((r) => r.format !== 'json').map((r) => {
                const jsonResult = results.find((x) => x.format === 'json')!;
                const saving = Math.round(((jsonResult.bytes - r.bytes) / jsonResult.bytes) * 100);
                return (
                  <div key={r.format} className="text-center p-3 border border-j-border">
                    <p className="text-2xl font-light text-j-text">{saving}%</p>
                    <p className="font-mono text-[10px] text-j-text-tertiary uppercase">{r.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PlaygroundLayout>
  );
}
