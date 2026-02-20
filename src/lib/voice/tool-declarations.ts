/**
 * Jarre - Voice Tutor Tool Declarations
 *
 * Function declarations for the unified voice tutor.
 * These are passed to Gemini Live so the model can invoke
 * UI actions mid-conversation (BLOCKING mode).
 */

import { Type, type Tool } from '@google/genai';

export const TUTOR_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'scroll_to_concept',
        description:
          'Scroll the UI to show a specific concept section while explaining it',
        parameters: {
          type: Type.OBJECT,
          properties: {
            conceptId: { type: Type.STRING, description: 'The concept UUID to scroll to' },
          },
          required: ['conceptId'],
        },
      },
      {
        name: 'show_definition',
        description:
          'Display a concept definition card on screen for reference',
        parameters: {
          type: Type.OBJECT,
          properties: {
            conceptId: { type: Type.STRING, description: 'The concept UUID to show' },
            highlight: {
              type: Type.BOOLEAN,
              description: 'Whether to visually highlight the card',
            },
          },
          required: ['conceptId'],
        },
      },
      {
        name: 'end_session',
        description:
          'End the voice session. Call this when session objectives are met or the student requests to stop.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: {
              type: Type.STRING,
              description: 'Why the session is ending',
              enum: ['completed', 'student_request', 'time_limit'],
            },
          },
          required: ['reason'],
        },
      },
      {
        name: 'mark_discussed',
        description:
          'Mark that a concept was substantively discussed during the session',
        parameters: {
          type: Type.OBJECT,
          properties: {
            conceptId: { type: Type.STRING, description: 'The concept UUID that was discussed' },
            understood: {
              type: Type.BOOLEAN,
              description: 'Whether the student demonstrated understanding',
            },
          },
          required: ['conceptId', 'understood'],
        },
      },
    ],
  },
];
