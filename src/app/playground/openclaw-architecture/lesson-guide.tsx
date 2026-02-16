'use client';

import { useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  content: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'overview',
    title: '1. Vision General',
    content:
      'OpenClaw es un sistema para desplegar y orquestar agentes de IA a traves de multiples canales de comunicacion. Su arquitectura sigue el patron gateway: un punto central que recibe mensajes de cualquier fuente (Discord, Telegram, WhatsApp), los normaliza, y los enruta al agente correspondiente. Esto permite que el mismo agente sirva a multiples plataformas sin conocer los detalles de cada una. El desacoplamiento entre canales y logica del agente es la decision arquitectonica central.',
  },
  {
    id: 'acp',
    title: '2. Protocolo ACP',
    content:
      'El Agent Communication Protocol (ACP) define un contrato estandar entre el gateway y los agentes. En lugar de que cada agente implemente su propia interfaz HTTP, ACP establece un esquema comun de mensajes, capacidades y respuestas. Esto permite intercambiar agentes sin modificar el gateway, y conectar multiples agentes al mismo sistema. El protocolo maneja descubrimiento de capacidades, negociacion de formato, y entrega confiable de mensajes.',
  },
  {
    id: 'channels',
    title: '3. Channel Plugins',
    content:
      'Cada canal de comunicacion (Discord, Telegram, WhatsApp, Signal, Slack) se implementa como un plugin independiente. El plugin traduce el formato nativo del canal al formato interno del gateway. Esta arquitectura de plugins permite agregar nuevos canales sin modificar el core del sistema. Cada plugin maneja autenticacion, rate limiting, y particularidades del canal (reacciones en Discord, stickers en Telegram, etc.).',
  },
  {
    id: 'skills-memory',
    title: '4. Skills y Memoria',
    content:
      'El agente de OpenClaw no es monolitico: se compone de skills modulares que pueden activarse segun el contexto del mensaje. Cada skill encapsula una capacidad especifica (buscar documentacion, ejecutar codigo, generar imagenes). La memoria del agente persiste entre conversaciones usando un sistema de almacenamiento contextual. La seleccion del modelo (cual LLM usar) tambien es dinamica, eligiendo entre modelos segun la complejidad de la tarea.',
  },
  {
    id: 'a2ui',
    title: '5. A2UI y Entrega',
    content:
      'A2UI (Agent-to-UI) es la capa de renderizado que traduce las respuestas del agente a interfaces ricas en cada cliente. En lugar de enviar texto plano, el agente produce bloques estructurados (texto, codigo, imagenes, botones) que A2UI adapta al formato optimo de cada plataforma. Los clientes nativos (macOS, iOS, Android) reciben componentes ricos, mientras que canales de texto reciben formato simplificado. Esto separa la logica del agente de la presentacion.',
  },
];

export function LessonGuide() {
  const [expandedId, setExpandedId] = useState<string | null>('overview');

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3 text-sm">
      {LESSONS.map((lesson) => (
        <section key={lesson.id}>
          <button
            onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
            className="w-full text-left"
          >
            <h3 className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-1 hover:text-[#818cf8] transition-colors">
              {lesson.title}
            </h3>
          </button>
          {expandedId === lesson.id && (
            <p className="text-j-text-secondary leading-relaxed text-xs pl-1">
              {lesson.content}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
