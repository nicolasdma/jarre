/**
 * Simple translations for UI content.
 * Add new keys as needed.
 */

export type Language = 'es' | 'en';

const translations = {
  // Navigation
  'nav.library': { es: 'Biblioteca', en: 'Library' },
  'nav.dashboard': { es: 'Panel', en: 'Dashboard' },
  'nav.logout': { es: 'Salir', en: 'Logout' },

  // Dashboard
  'dashboard.welcome': { es: 'Bienvenido', en: 'Welcome' },
  'dashboard.currentPhase': { es: 'Fase actual', en: 'Current phase' },
  'dashboard.totalConcepts': { es: 'Conceptos Totales', en: 'Total Concepts' },
  'dashboard.conceptsStarted': { es: 'Conceptos Iniciados', en: 'Concepts Started' },
  'dashboard.evaluations': { es: 'Evaluaciones', en: 'Evaluations' },
  'dashboard.streak': { es: 'Racha', en: 'Streak' },
  'dashboard.days': { es: 'días', en: 'days' },
  'dashboard.masteryProgress': { es: 'Progreso de Dominio', en: 'Mastery Progress' },
  'dashboard.masteryDescription': { es: 'Tu distribución de dominio de conceptos', en: 'Your concept mastery distribution' },
  'dashboard.quickActions': { es: 'Acciones Rápidas', en: 'Quick Actions' },
  'dashboard.browseLibrary': { es: 'Ver Biblioteca', en: 'Browse Library' },
  'dashboard.continuePhase': { es: 'Continuar Fase', en: 'Continue Phase' },
  'dashboard.settings': { es: 'Configuración', en: 'Settings' },
  'dashboard.settingsDescription': { es: 'Configura tus preferencias', en: 'Configure your preferences' },

  // Mastery levels
  'mastery.exposed': { es: 'Expuesto', en: 'Exposed' },
  'mastery.understood': { es: 'Comprendido', en: 'Understood' },
  'mastery.applied': { es: 'Aplicado', en: 'Applied' },
  'mastery.criticized': { es: 'Criticado', en: 'Criticized' },
  'mastery.taught': { es: 'Enseñado', en: 'Taught' },

  // Library
  'library.title': { es: 'Biblioteca', en: 'Library' },
  'library.subtitle': { es: 'Tu plan de estudios personalizado', en: 'Your personalized study plan' },
  'library.resources': { es: 'recursos', en: 'resources' },
  'library.resource': { es: 'recurso', en: 'resource' },
  'library.locked': { es: 'Bloqueado', en: 'Locked' },
  'library.unlocked': { es: 'Desbloqueado', en: 'Unlocked' },
  'library.completed': { es: 'Completado', en: 'Completed' },
  'library.concepts': { es: 'conceptos', en: 'concepts' },
  'library.requires': { es: 'Requiere', en: 'Requires' },
  'library.startEvaluation': { es: 'Iniciar Evaluación', en: 'Start Evaluation' },
  'library.evaluated': { es: 'evaluados', en: 'evaluated' },
  'library.bestScore': { es: 'Mejor', en: 'Best' },
  'library.attempt': { es: 'intento', en: 'attempt' },
  'library.attempts': { es: 'intentos', en: 'attempts' },

  // Evaluation
  'eval.title': { es: 'Evaluación', en: 'Evaluation' },
  'eval.ready': { es: '¿Listo para evaluar tu comprensión?', en: 'Ready to test your understanding?' },
  'eval.instructions': { es: 'Responde las siguientes preguntas sobre los conceptos de este recurso. Tus respuestas serán evaluadas por IA.', en: 'Answer the following questions about the concepts from this resource. Your answers will be evaluated by AI.' },
  'eval.start': { es: 'Comenzar Evaluación', en: 'Start Evaluation' },
  'eval.generating': { es: 'Generando preguntas...', en: 'Generating questions...' },
  'eval.question': { es: 'Pregunta', en: 'Question' },
  'eval.of': { es: 'de', en: 'of' },
  'eval.concept': { es: 'Concepto', en: 'Concept' },
  'eval.yourAnswer': { es: 'Tu respuesta', en: 'Your answer' },
  'eval.answerPlaceholder': { es: 'Escribe tu respuesta aquí...', en: 'Write your answer here...' },
  'eval.previous': { es: 'Anterior', en: 'Previous' },
  'eval.next': { es: 'Siguiente', en: 'Next' },
  'eval.submit': { es: 'Enviar Evaluación', en: 'Submit Evaluation' },
  'eval.submitting': { es: 'Evaluando respuestas...', en: 'Evaluating answers...' },
  'eval.results': { es: 'Resultados', en: 'Results' },
  'eval.overallScore': { es: 'Puntuación General', en: 'Overall Score' },
  'eval.feedback': { es: 'Retroalimentación', en: 'Feedback' },
  'eval.correct': { es: 'Correcto', en: 'Correct' },
  'eval.incorrect': { es: 'Incorrecto', en: 'Incorrect' },
  'eval.backToLibrary': { es: 'Volver a la Biblioteca', en: 'Back to Library' },
  'eval.tryAgain': { es: 'Intentar de Nuevo', en: 'Try Again' },

  // Phases
  'phase.1': { es: 'Sistemas Distribuidos', en: 'Distributed Systems' },
  'phase.2': { es: 'LLMs + Razonamiento', en: 'LLMs + Reasoning' },
  'phase.3': { es: 'RAG + Memoria', en: 'RAG + Memory' },
  'phase.4': { es: 'Seguridad + Guardrails', en: 'Safety + Guardrails' },
  'phase.5': { es: 'Inferencia + Economía', en: 'Inference + Economics' },
  'phase.6': { es: 'Frameworks', en: 'Frameworks' },

  // Common
  'common.loading': { es: 'Cargando...', en: 'Loading...' },
  'common.error': { es: 'Error', en: 'Error' },
  'common.language': { es: 'Idioma', en: 'Language' },
  'common.login': { es: 'Ingresar', en: 'Login' },
  'common.signup': { es: 'Registrarse', en: 'Sign up' },
  'common.signin': { es: 'Iniciar sesión', en: 'Sign in' },
  'common.open': { es: 'Abrir', en: 'Open' },
  'common.evaluate': { es: 'Evaluar', en: 'Evaluate' },
  'common.estimated': { es: 'estimado', en: 'estimated' },
  'common.more': { es: 'más', en: 'more' },
  'common.phases': { es: 'fases', en: 'phases' },
  'common.across': { es: 'en', en: 'across' },

  // Library specific
  'library.signInPrompt': { es: 'para ver tu progreso y estado de desbloqueo personalizado.', en: 'to track your progress and see personalized unlock status.' },

  // Notes
  'notes.title': { es: 'Notas', en: 'Notes' },
  'notes.addSection': { es: 'Agregar Sección', en: 'Add Section' },
  'notes.addSubsection': { es: 'Agregar Subsección', en: 'Add Subsection' },
  'notes.editSection': { es: 'Editar Sección', en: 'Edit Section' },
  'notes.deleteSection': { es: 'Eliminar Sección', en: 'Delete Section' },
  'notes.deleteSubsection': { es: 'Eliminar Subsección', en: 'Delete Subsection' },
  'notes.sectionTitle': { es: 'Título de la sección', en: 'Section title' },
  'notes.subsectionTitle': { es: 'Título de la subsección', en: 'Subsection title' },
  'notes.content': { es: 'Contenido', en: 'Content' },
  'notes.save': { es: 'Guardar', en: 'Save' },
  'notes.cancel': { es: 'Cancelar', en: 'Cancel' },
  'notes.saving': { es: 'Guardando...', en: 'Saving...' },
  'notes.saved': { es: 'Guardado', en: 'Saved' },
  'notes.empty': { es: 'No hay notas aún. ¡Agrega tu primera sección!', en: 'No notes yet. Add your first section!' },
  'notes.confirmDelete': { es: '¿Eliminar esta sección y todas sus subsecciones?', en: 'Delete this section and all its subsections?' },
  'notes.confirmDeleteSub': { es: '¿Eliminar esta subsección?', en: 'Delete this subsection?' },
  'notes.placeholder': { es: 'Escribe tus notas aquí... (soporta markdown)', en: 'Write your notes here... (supports markdown)' },

  // Resource page
  'resource.evaluate': { es: 'Evaluar', en: 'Evaluate' },
  'resource.openResource': { es: 'Abrir Recurso', en: 'Open Resource' },
  'resource.phase': { es: 'Fase', en: 'Phase' },
  'resource.estimatedTime': { es: 'Tiempo estimado', en: 'Estimated time' },
  'resource.hours': { es: 'horas', en: 'hours' },
  'resource.concepts': { es: 'Conceptos que enseña', en: 'Concepts taught' },
  'resource.notFound': { es: 'Recurso no encontrado', en: 'Resource not found' },
  'resource.backToLibrary': { es: 'Volver a la Biblioteca', en: 'Back to Library' },

  // Evaluation History
  'history.title': { es: 'Evaluaciones Anteriores', en: 'Previous Evaluations' },
  'history.empty': { es: 'No has completado ninguna evaluación de este recurso aún.', en: 'You haven\'t completed any evaluations for this resource yet.' },
  'history.viewDetail': { es: 'Ver Detalle', en: 'View Detail' },
  'history.newEvaluation': { es: 'Nueva Evaluación', en: 'New Evaluation' },
  'history.score': { es: 'Puntuación', en: 'Score' },
  'history.date': { es: 'Fecha', en: 'Date' },
  'history.questions': { es: 'preguntas', en: 'questions' },
  'history.backToResource': { es: 'Volver al Recurso', en: 'Back to Resource' },

  // Evaluation Detail Page
  'evalDetail.title': { es: 'Detalle de Evaluación', en: 'Evaluation Detail' },
  'evalDetail.notFound': { es: 'Evaluación no encontrada', en: 'Evaluation not found' },
  'evalDetail.completedAt': { es: 'Completada el', en: 'Completed on' },
  'evalDetail.yourAnswer': { es: 'Tu respuesta', en: 'Your answer' },
  'evalDetail.feedback': { es: 'Retroalimentación', en: 'Feedback' },
  'evalDetail.questionType': { es: 'Tipo', en: 'Type' },

  // Question Types
  'questionType.explanation': { es: 'Explicación', en: 'Explanation' },
  'questionType.scenario': { es: 'Escenario', en: 'Scenario' },
  'questionType.error_detection': { es: 'Detección de Error', en: 'Error Detection' },
  'questionType.connection': { es: 'Conexión', en: 'Connection' },
  'questionType.tradeoff': { es: 'Trade-off', en: 'Trade-off' },

  // Study View
  'study.title': { es: 'Estudio', en: 'Study' },
  'study.noUrl': { es: 'Este recurso no tiene URL asociada', en: 'This resource has no associated URL' },
  'study.embedBlocked': { es: 'No se pudo cargar el contenido embebido', en: 'Could not load embedded content' },
  'study.openNewTab': { es: 'Abrir en nueva pestaña', en: 'Open in new tab' },
  'study.canvasHint': { es: 'Dibuja, escribe, conecta ideas', en: 'Draw, write, connect ideas' },
  'study.saving': { es: 'Guardando...', en: 'Saving...' },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, language: Language): string {
  return translations[key]?.[language] || translations[key]?.en || key;
}

export function getPhaseNames(language: Language): Record<string, string> {
  return {
    '1': t('phase.1', language),
    '2': t('phase.2', language),
    '3': t('phase.3', language),
    '4': t('phase.4', language),
    '5': t('phase.5', language),
    '6': t('phase.6', language),
  };
}

export function getMasteryLevels(language: Language) {
  return [
    { level: '0', name: t('mastery.exposed', language), color: 'bg-stone-200' },
    { level: '1', name: t('mastery.understood', language), color: 'bg-amber-200' },
    { level: '2', name: t('mastery.applied', language), color: 'bg-blue-200' },
    { level: '3', name: t('mastery.criticized', language), color: 'bg-green-200' },
    { level: '4', name: t('mastery.taught', language), color: 'bg-purple-200' },
  ];
}
