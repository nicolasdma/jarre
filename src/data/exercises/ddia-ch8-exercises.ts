import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * Ch8: The Trouble with Distributed Systems — 3 exercises
 */

export const ch8Exercise1: SequenceExercise = {
  id: 'ddia-8.1',
  type: 'sequence',
  title: 'Detección de fallo en red asíncrona',
  instructions: 'Ordena los pasos que ocurren cuando un nodo envía una petición y no recibe respuesta en una red asíncrona.',
  conceptId: 'unreliable-networks',
  steps: [
    { id: 'n1', text: 'El nodo A envía una petición al nodo B por la red' },
    { id: 'n2', text: 'El timeout configurado expira sin recibir respuesta' },
    { id: 'n3', text: 'El nodo A reintenta la petición (sin saber si B la recibió)' },
    { id: 'n4', text: 'El segundo intento también expira sin respuesta' },
    { id: 'n5', text: 'El nodo A declara a B como inalcanzable, pero no puede distinguir si B falló, la red perdió el mensaje, o la respuesta se perdió' },
  ],
  correctOrder: ['n1', 'n2', 'n3', 'n4', 'n5'],
};

export const ch8Exercise2: ConnectExercise = {
  id: 'ddia-8.2',
  type: 'connect',
  title: 'Fencing tokens y protección de recursos',
  instructions: 'Conecta los nodos para mostrar cómo los fencing tokens previenen la corrupción por split-brain al proteger un recurso compartido.',
  conceptId: 'knowledge-truth',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'clientA', label: 'Client A (token 33)', x: 80, y: 50 },
    { id: 'clientB', label: 'Client B (token 34)', x: 480, y: 50 },
    { id: 'lock', label: 'Lock Service', x: 280, y: 50 },
    { id: 'fencing', label: 'Fencing Token', x: 280, y: 200 },
    { id: 'storage', label: 'Storage', x: 280, y: 350 },
  ],
  correctConnections: [
    ['lock', 'clientA'],
    ['lock', 'clientB'],
    ['lock', 'fencing'],
    ['clientB', 'storage'],
    ['fencing', 'storage'],
  ],
};

export const ch8Exercise3: SequenceExercise = {
  id: 'ddia-8.3',
  type: 'sequence',
  title: 'Problema de GC pause con lease',
  instructions: 'Ordena los pasos que muestran cómo una pausa de garbage collection puede causar que un nodo actúe con un lease expirado.',
  conceptId: 'unreliable-clocks',
  steps: [
    { id: 'g1', text: 'El nodo A obtiene un lease del servicio de locks (válido por 10 segundos)' },
    { id: 'g2', text: 'El garbage collector del nodo A inicia una pausa stop-the-world' },
    { id: 'g3', text: 'El lease del nodo A expira mientras está pausado por GC' },
    { id: 'g4', text: 'El nodo B obtiene el lease y comienza a escribir al recurso' },
    { id: 'g5', text: 'La pausa de GC del nodo A termina y cree que aún tiene el lease válido' },
  ],
  correctOrder: ['g1', 'g2', 'g3', 'g4', 'g5'],
};

export const ch8Exercises = [ch8Exercise1, ch8Exercise2, ch8Exercise3];
