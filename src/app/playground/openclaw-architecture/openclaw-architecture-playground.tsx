'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComponentDef {
  id: string;
  label: string;
  description: string;
  detail: string;
  x: string;
  y: string;
  width: string;
  activeAtSteps: number[];
}

// ---------------------------------------------------------------------------
// Architecture data
// ---------------------------------------------------------------------------

const COMPONENTS: ComponentDef[] = [
  {
    id: 'channel-discord',
    label: 'Discord',
    description: 'Channel Plugin',
    detail:
      'Plugin que conecta con la API de Discord. Recibe mensajes, reacciones y comandos slash. Traduce eventos de Discord al formato interno del gateway, manejando rate limits y reconexion automatica con WebSocket.',
    x: '2%',
    y: '5%',
    width: '18%',
    activeAtSteps: [1, 6],
  },
  {
    id: 'channel-telegram',
    label: 'Telegram',
    description: 'Channel Plugin',
    detail:
      'Plugin para Telegram Bot API. Soporta mensajes de texto, inline queries, callbacks de botones, y stickers. Usa long polling o webhooks segun la configuracion del despliegue.',
    x: '2%',
    y: '22%',
    width: '18%',
    activeAtSteps: [1, 6],
  },
  {
    id: 'channel-whatsapp',
    label: 'WhatsApp',
    description: 'Channel Plugin',
    detail:
      'Plugin para WhatsApp Business API. Maneja mensajes de texto, imagenes, documentos y plantillas. Implementa la logica de sesion de 24 horas y templates aprobados por Meta.',
    x: '2%',
    y: '39%',
    width: '18%',
    activeAtSteps: [1, 6],
  },
  {
    id: 'channel-signal',
    label: 'Signal',
    description: 'Channel Plugin',
    detail:
      'Plugin para Signal Messenger. Prioriza privacidad end-to-end. Maneja mensajes cifrados, grupos, y reacciones. Usa el protocolo Signal para comunicacion segura.',
    x: '2%',
    y: '56%',
    width: '18%',
    activeAtSteps: [1, 6],
  },
  {
    id: 'channel-slack',
    label: 'Slack',
    description: 'Channel Plugin',
    detail:
      'Plugin para Slack Events API. Soporta menciones, threads, slash commands, y Block Kit para respuestas ricas. Maneja workspaces multiples y permisos OAuth.',
    x: '2%',
    y: '73%',
    width: '18%',
    activeAtSteps: [1, 6],
  },
  {
    id: 'dispatch',
    label: 'Dispatch',
    description: 'Normalizacion y enrutamiento',
    detail:
      'Capa de normalizacion que recibe mensajes de cualquier canal y los transforma a un formato interno unificado. Extrae metadata (usuario, canal, contexto), valida el payload, y determina a que agente dirigir el mensaje. Implementa colas de prioridad y deduplicacion.',
    x: '28%',
    y: '15%',
    width: '18%',
    activeAtSteps: [2],
  },
  {
    id: 'command-gating',
    label: 'Command Gating',
    description: 'Autorizacion y permisos',
    detail:
      'Sistema de autorizacion que evalua si el usuario tiene permisos para ejecutar el comando solicitado. Verifica roles, rate limits por usuario, y politicas de acceso. Puede rechazar, encolar, o escalar mensajes segun las reglas configuradas.',
    x: '28%',
    y: '55%',
    width: '18%',
    activeAtSteps: [3],
  },
  {
    id: 'acp',
    label: 'ACP Protocol',
    description: 'Agent Communication Protocol',
    detail:
      'Protocolo estandar de comunicacion entre gateway y agentes. Define el esquema de mensajes, capacidades del agente, y formato de respuestas. Permite descubrimiento de servicios, negociacion de formato, y entrega confiable. Inspirado en protocolos como MCP pero orientado a agentes autonomos.',
    x: '54%',
    y: '35%',
    width: '18%',
    activeAtSteps: [4],
  },
  {
    id: 'agent',
    label: 'Agent Core',
    description: 'Motor del agente',
    detail:
      'Nucleo del agente que procesa mensajes entrantes. Coordina la seleccion de modelo (elige el LLM optimo para la tarea), invoca skills relevantes, consulta la memoria de contexto, y genera la respuesta. Implementa un loop ReAct para tareas que requieren multiples pasos.',
    x: '80%',
    y: '5%',
    width: '18%',
    activeAtSteps: [5],
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Capacidades modulares',
    detail:
      'Modulos plug-and-play que extienden las capacidades del agente. Cada skill encapsula una funcion especifica: busqueda web, ejecucion de codigo, generacion de imagenes, consulta de bases de datos. Se activan segun el contexto del mensaje y pueden componerse para tareas complejas.',
    x: '80%',
    y: '30%',
    width: '18%',
    activeAtSteps: [5],
  },
  {
    id: 'memory',
    label: 'Memory',
    description: 'Contexto persistente',
    detail:
      'Sistema de memoria que persiste informacion entre conversaciones. Almacena contexto del usuario, historial de interacciones, y preferencias aprendidas. Usa embeddings para recuperacion semantica y tiene politicas de expiracion para gestionar el tamano.',
    x: '80%',
    y: '55%',
    width: '18%',
    activeAtSteps: [5],
  },
  {
    id: 'delivery',
    label: 'A2UI Renderer',
    description: 'Entrega de respuestas',
    detail:
      'Capa que traduce la respuesta estructurada del agente (bloques de texto, codigo, imagenes, acciones) al formato optimo de cada plataforma destino. Adapta la respuesta para clientes nativos (macOS, iOS, Android) o canales de texto (Discord, Telegram), maximizando la riqueza de la presentacion.',
    x: '54%',
    y: '73%',
    width: '18%',
    activeAtSteps: [6],
  },
];

const CHANNELS = ['Discord', 'Telegram', 'WhatsApp', 'Signal', 'Slack'] as const;

interface FlowStep {
  step: number;
  title: string;
  description: string;
}

const FLOW_STEPS: FlowStep[] = [
  { step: 0, title: 'Listo', description: 'Pulsa "Iniciar flujo" para simular un mensaje a traves de la arquitectura.' },
  { step: 1, title: '1. Mensaje recibido en canal', description: 'Un usuario envia un mensaje desde el canal seleccionado. El plugin del canal captura el evento y lo prepara para el gateway.' },
  { step: 2, title: '2. Normalizacion y despacho', description: 'Dispatch normaliza el mensaje al formato interno unificado. Extrae metadata del usuario, valida el payload, y determina la ruta.' },
  { step: 3, title: '3. Autorizacion y routing', description: 'Command Gating verifica permisos del usuario, evalua rate limits, y decide si el mensaje procede, se encola, o se rechaza.' },
  { step: 4, title: '4. Traduccion ACP al Gateway', description: 'El mensaje normalizado se traduce al protocolo ACP y se envia al agente. ACP maneja el descubrimiento de capacidades y la negociacion de formato.' },
  { step: 5, title: '5. Procesamiento del agente', description: 'El agente recibe el mensaje, selecciona el modelo adecuado, invoca skills relevantes, consulta la memoria, y genera una respuesta estructurada.' },
  { step: 6, title: '6. Entrega de respuesta', description: 'A2UI renderiza la respuesta del agente al formato optimo del canal destino. El plugin del canal entrega el mensaje al usuario.' },
];

// ---------------------------------------------------------------------------
// Connection arrows data
// ---------------------------------------------------------------------------

interface Connection {
  from: string;
  to: string;
  activeAtSteps: number[];
}

const CONNECTIONS: Connection[] = [
  { from: 'channel-discord', to: 'dispatch', activeAtSteps: [1, 2] },
  { from: 'channel-telegram', to: 'dispatch', activeAtSteps: [1, 2] },
  { from: 'channel-whatsapp', to: 'dispatch', activeAtSteps: [1, 2] },
  { from: 'channel-signal', to: 'dispatch', activeAtSteps: [1, 2] },
  { from: 'channel-slack', to: 'dispatch', activeAtSteps: [1, 2] },
  { from: 'dispatch', to: 'command-gating', activeAtSteps: [2, 3] },
  { from: 'command-gating', to: 'acp', activeAtSteps: [3, 4] },
  { from: 'acp', to: 'agent', activeAtSteps: [4, 5] },
  { from: 'agent', to: 'skills', activeAtSteps: [5] },
  { from: 'agent', to: 'memory', activeAtSteps: [5] },
  { from: 'acp', to: 'delivery', activeAtSteps: [5, 6] },
  { from: 'delivery', to: 'channel-discord', activeAtSteps: [6] },
  { from: 'delivery', to: 'channel-telegram', activeAtSteps: [6] },
  { from: 'delivery', to: 'channel-whatsapp', activeAtSteps: [6] },
  { from: 'delivery', to: 'channel-signal', activeAtSteps: [6] },
  { from: 'delivery', to: 'channel-slack', activeAtSteps: [6] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OpenClawArchitecturePlayground() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState(0);
  const [sourceChannel, setSourceChannel] = useState<(typeof CHANNELS)[number]>('Discord');
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimation = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAnimation();
  }, [clearAnimation]);

  const startFlow = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedComponent(null);
    setFlowStep(1);

    const advanceStep = (step: number) => {
      if (step > 6) {
        setIsAnimating(false);
        setFlowStep(0);
        return;
      }
      animationRef.current = setTimeout(() => {
        setFlowStep(step);
        advanceStep(step + 1);
      }, 2000);
    };

    advanceStep(2);
  }, [isAnimating]);

  const stopFlow = useCallback(() => {
    clearAnimation();
    setIsAnimating(false);
    setFlowStep(0);
  }, [clearAnimation]);

  const handleComponentClick = useCallback((id: string) => {
    setSelectedComponent((prev) => (prev === id ? null : id));
  }, []);

  const isComponentActive = useCallback(
    (comp: ComponentDef): boolean => {
      if (flowStep === 0) return false;
      // For channels, only highlight the selected source channel (or all on step 6)
      if (comp.id.startsWith('channel-')) {
        const channelName = comp.label;
        if (flowStep === 1) return channelName === sourceChannel;
        if (flowStep === 6) return true;
        return false;
      }
      return comp.activeAtSteps.includes(flowStep);
    },
    [flowStep, sourceChannel]
  );

  const isConnectionActive = useCallback(
    (conn: Connection): boolean => {
      if (flowStep === 0) return false;
      // For channel connections, only highlight the selected source
      if (conn.from.startsWith('channel-') && flowStep === 1) {
        const comp = COMPONENTS.find((c) => c.id === conn.from);
        return comp?.label === sourceChannel;
      }
      if (conn.to.startsWith('channel-') && flowStep === 6) {
        return true;
      }
      return conn.activeAtSteps.includes(flowStep);
    },
    [flowStep, sourceChannel]
  );

  const selectedDetail = COMPONENTS.find((c) => c.id === selectedComponent);
  const currentFlowStep = FLOW_STEPS[flowStep];

  return (
    <PlaygroundLayout
      accentColor="#6366f1"
      lessons={<LessonGuide />}
      disableTutor
    >
      <div className="h-full flex flex-col p-6 overflow-y-auto">
        {/* Controls */}
        <div className="shrink-0 mb-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                Canal origen:
              </span>
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSourceChannel(ch)}
                  disabled={isAnimating}
                  className={`px-3 py-1.5 font-mono text-[11px] tracking-wider border transition-colors ${
                    sourceChannel === ch
                      ? 'bg-[#6366f1] text-white border-[#6366f1]'
                      : 'border-j-border text-j-text-secondary hover:border-j-text/30 disabled:opacity-40'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {!isAnimating ? (
                <button
                  onClick={startFlow}
                  className="px-4 py-1.5 bg-[#6366f1] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#4f46e5] transition-colors"
                >
                  Iniciar flujo
                </button>
              ) : (
                <button
                  onClick={stopFlow}
                  className="px-4 py-1.5 border border-red-500 text-red-400 font-mono text-[11px] tracking-wider uppercase hover:bg-red-500/10 transition-colors"
                >
                  Detener
                </button>
              )}
            </div>
          </div>

          {/* Flow step indicator */}
          <div className="border border-j-border p-3">
            <div className="flex items-center gap-3 mb-2">
              {FLOW_STEPS.slice(1).map((s) => (
                <div
                  key={s.step}
                  className={`h-1 flex-1 transition-colors duration-300 ${
                    s.step === flowStep
                      ? 'bg-[#6366f1]'
                      : s.step < flowStep
                        ? 'bg-[#6366f1]/40'
                        : 'bg-j-border'
                  }`}
                />
              ))}
            </div>
            <p className="font-mono text-xs text-j-text">{currentFlowStep.title}</p>
            <p className="text-xs text-j-text-secondary mt-1">{currentFlowStep.description}</p>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="flex-1 min-h-[400px] relative border border-j-border bg-j-bg-elevated">
          {/* Connection lines using SVG overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {CONNECTIONS.map((conn) => {
              const fromComp = COMPONENTS.find((c) => c.id === conn.from);
              const toComp = COMPONENTS.find((c) => c.id === conn.to);
              if (!fromComp || !toComp) return null;

              const fromX = parseFloat(fromComp.x) + parseFloat(fromComp.width);
              const fromY = parseFloat(fromComp.y) + 5;
              const toX = parseFloat(toComp.x);
              const toY = parseFloat(toComp.y) + 5;

              // Special cases for vertical connections
              let x1Pct: number, y1Pct: number, x2Pct: number, y2Pct: number;

              if (conn.from === 'dispatch' && conn.to === 'command-gating') {
                x1Pct = parseFloat(fromComp.x) + parseFloat(fromComp.width) / 2;
                y1Pct = parseFloat(fromComp.y) + 12;
                x2Pct = parseFloat(toComp.x) + parseFloat(toComp.width) / 2;
                y2Pct = parseFloat(toComp.y);
              } else if (conn.from === 'agent' && (conn.to === 'skills' || conn.to === 'memory')) {
                x1Pct = parseFloat(fromComp.x) + parseFloat(fromComp.width) / 2;
                y1Pct = parseFloat(fromComp.y) + 12;
                x2Pct = parseFloat(toComp.x) + parseFloat(toComp.width) / 2;
                y2Pct = parseFloat(toComp.y);
              } else if (conn.from === 'acp' && conn.to === 'delivery') {
                x1Pct = parseFloat(fromComp.x) + parseFloat(fromComp.width) / 2;
                y1Pct = parseFloat(fromComp.y) + 12;
                x2Pct = parseFloat(toComp.x) + parseFloat(toComp.width) / 2;
                y2Pct = parseFloat(toComp.y);
              } else if (conn.to.startsWith('channel-') && conn.from === 'delivery') {
                x1Pct = parseFloat(fromComp.x);
                y1Pct = parseFloat(fromComp.y) + 5;
                x2Pct = parseFloat(toComp.x) + parseFloat(toComp.width);
                y2Pct = parseFloat(toComp.y) + 5;
              } else {
                x1Pct = fromX;
                y1Pct = fromY;
                x2Pct = toX;
                y2Pct = toY;
              }

              const active = isConnectionActive(conn);

              return (
                <line
                  key={`${conn.from}-${conn.to}`}
                  x1={`${x1Pct}%`}
                  y1={`${y1Pct}%`}
                  x2={`${x2Pct}%`}
                  y2={`${y2Pct}%`}
                  stroke={active ? '#6366f1' : '#333'}
                  strokeWidth={active ? 2 : 1}
                  strokeDasharray={active ? 'none' : '4 4'}
                  opacity={active ? 1 : 0.3}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Component boxes */}
          {COMPONENTS.map((comp) => {
            const active = isComponentActive(comp);
            const selected = selectedComponent === comp.id;

            return (
              <button
                key={comp.id}
                onClick={() => handleComponentClick(comp.id)}
                className={`absolute p-3 border text-left transition-all duration-300 ${
                  active
                    ? 'border-[#6366f1] bg-[#6366f1]/10 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : selected
                      ? 'border-[#6366f1]/60 bg-[#6366f1]/5'
                      : 'border-j-border bg-j-bg hover:border-j-text/30'
                }`}
                style={{
                  left: comp.x,
                  top: comp.y,
                  width: comp.width,
                  zIndex: 2,
                }}
              >
                <p
                  className={`font-mono text-[11px] tracking-wider font-medium transition-colors duration-300 ${
                    active ? 'text-[#6366f1]' : 'text-j-text'
                  }`}
                >
                  {comp.label}
                </p>
                <p className="font-mono text-[9px] text-j-text-tertiary mt-0.5 tracking-wide">
                  {comp.description}
                </p>
              </button>
            );
          })}

          {/* Gateway label in center */}
          <div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{ left: '28%', top: '38%', width: '18%', height: '14%' }}
          >
            <div className="border border-dashed border-j-text-tertiary/30 w-full h-full flex items-center justify-center">
              <span className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary/50 uppercase">
                Gateway
              </span>
            </div>
          </div>
        </div>

        {/* Component Detail Panel */}
        {selectedDetail && !isAnimating && (
          <div className="shrink-0 mt-4 border border-[#6366f1]/30 bg-[#6366f1]/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-sm text-[#6366f1] font-medium">
                {selectedDetail.label}
              </h3>
              <button
                onClick={() => setSelectedComponent(null)}
                className="font-mono text-[10px] text-j-text-tertiary hover:text-j-text transition-colors"
              >
                Cerrar
              </button>
            </div>
            <p className="font-mono text-[10px] tracking-wider text-j-text-tertiary uppercase mb-2">
              {selectedDetail.description}
            </p>
            <p className="text-sm text-j-text-secondary leading-relaxed">
              {selectedDetail.detail}
            </p>
          </div>
        )}
      </div>
    </PlaygroundLayout>
  );
}
