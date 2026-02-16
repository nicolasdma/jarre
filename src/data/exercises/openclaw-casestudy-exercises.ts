import type { Exercise } from '@/types';

export const openclawCasestudyExercises: Exercise[] = [
  // Exercise 1: SEQUENCE - Order the steps of ACP message flow
  {
    id: 'openclaw-casestudy.1',
    type: 'sequence',
    title: 'Flujo de mensajes en el Agent Communication Protocol',
    instructions:
      'Ordena los pasos del procesamiento de un mensaje entrante en OpenClaw, desde la recepción hasta la respuesta del agente.',
    conceptId: 'agent-protocol-design',
    steps: [
      {
        id: 'a',
        text: 'El plugin del canal recibe el mensaje de la plataforma (ej: Discord webhook)',
      },
      {
        id: 'b',
        text: 'dispatchInboundMessage normaliza y deduplicaa el mensaje',
      },
      {
        id: 'c',
        text: 'resolveCommandAuthorization verifica permisos del remitente',
      },
      {
        id: 'd',
        text: 'El AcpGatewayAgent traduce la solicitud a comandos del gateway',
      },
      {
        id: 'e',
        text: 'El agente procesa el prompt con el modelo seleccionado (con fallbacks)',
      },
      {
        id: 'f',
        text: 'deliverAgentCommandResult orquesta la entrega de la respuesta al canal',
      },
    ],
    correctOrder: ['a', 'b', 'c', 'd', 'e', 'f'],
  },

  // Exercise 2: CONNECT - Match OpenClaw components with their responsibilities
  {
    id: 'openclaw-casestudy.2',
    type: 'connect',
    title: 'Componentes de OpenClaw y sus responsabilidades',
    instructions:
      'Conecta cada componente de OpenClaw con su responsabilidad principal en el sistema.',
    conceptId: 'plugin-channel-architecture',
    svgViewBox: '0 0 700 400',
    nodes: [
      // Left column - components
      { id: 'channeldock', label: 'ChannelDock', x: 80, y: 60 },
      { id: 'memory-lancedb', label: 'memory-lancedb', x: 80, y: 140 },
      { id: 'a2ui-renderer', label: 'A2UI Renderer', x: 80, y: 220 },
      { id: 'acp-server', label: 'ACP Server', x: 80, y: 300 },
      // Right column - responsibilities
      {
        id: 'resp-translate',
        label: 'Traduce solicitudes a comandos del gateway',
        x: 500,
        y: 60,
      },
      {
        id: 'resp-abstract',
        label: 'Abstrae diferencias entre plataformas de chat',
        x: 500,
        y: 140,
      },
      {
        id: 'resp-vector',
        label: 'Busqueda vectorial en memoria de largo plazo',
        x: 500,
        y: 220,
      },
      {
        id: 'resp-render',
        label: 'Mapea JSON declarativo a componentes nativos',
        x: 500,
        y: 300,
      },
    ],
    correctConnections: [
      ['channeldock', 'resp-abstract'],
      ['memory-lancedb', 'resp-vector'],
      ['a2ui-renderer', 'resp-render'],
      ['acp-server', 'resp-translate'],
    ],
  },

  // Exercise 3: SEQUENCE - Memory retrieval flow
  {
    id: 'openclaw-casestudy.3',
    type: 'sequence',
    title: 'Flujo de memoria autoRecall en OpenClaw',
    instructions:
      'Ordena los pasos que sigue el sistema de memoria de OpenClaw cuando un agente inicia una nueva conversación y necesita recordar contexto relevante.',
    conceptId: 'agent-memory-persistence',
    steps: [
      {
        id: 'a',
        text: 'El agente inicia una nueva conversación (hook autoRecall se activa)',
      },
      {
        id: 'b',
        text: 'El sistema extrae el contexto del prompt inicial como query',
      },
      { id: 'c', text: 'OpenAI genera embeddings del query' },
      {
        id: 'd',
        text: 'LanceDB ejecuta búsqueda de similitud vectorial contra memorias almacenadas',
      },
      {
        id: 'e',
        text: 'Las memorias más relevantes se inyectan en el contexto del agente',
      },
      {
        id: 'f',
        text: 'El agente responde con conocimiento de interacciones previas',
      },
    ],
    correctOrder: ['a', 'b', 'c', 'd', 'e', 'f'],
  },
];
