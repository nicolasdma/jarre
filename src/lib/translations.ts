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
  'library.generated': { es: 'Generado', en: 'Generated' },
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

  // Phases (AI track)
  'phase.1': { es: 'Sistemas Distribuidos', en: 'Distributed Systems' },
  'phase.1_5': { es: 'Puente de Álgebra Lineal', en: 'Linear Algebra Bridge' },
  'phase.2': { es: 'ML & Deep Learning', en: 'ML & Deep Learning Foundations' },
  'phase.3': { es: 'Secuencias, Atención & Transformers', en: 'Sequences, Attention & Transformers' },
  'phase.4': { es: 'LLMs: Entrenamiento & Alineación', en: 'LLMs: Training, Alignment & Scaling' },
  'phase.5': { es: 'Infraestructura ML', en: 'ML Infrastructure & Distributed Training' },
  'phase.6': { es: 'Agentes & Razonamiento', en: 'Agents & Reasoning' },
  'phase.7': { es: 'RAG, Memoria & Contexto', en: 'RAG, Memory & Context' },
  'phase.8': { es: 'Seguridad & Guardrails', en: 'Safety, Guardrails & Eval' },
  'phase.9': { es: 'Inferencia & Economía', en: 'Inference & Economics' },
  'phase.10': { es: 'Diseño de Sistemas', en: 'System Design & Integration' },
  'phase.11': { es: 'AI para Empresa (Track alternativo)', en: 'AI for Enterprise (Alternate track)' },

  // Phases (Travel track — South America motorcycle trip)
  'phase.travel.1': { es: 'Panorámica Continental', en: 'Continental Overview' },
  'phase.travel.2': { es: 'Colombia Caribe y Darién', en: 'Colombian Caribbean and Darién' },
  'phase.travel.3': { es: 'Colombia Andina Norte', en: 'Northern Andean Colombia' },
  'phase.travel.4': { es: 'Colombia Andina Sur', en: 'Southern Andean Colombia' },
  'phase.travel.5': { es: 'Amazonía Ecuatoriana', en: 'Ecuadorian Amazon' },
  'phase.travel.6': { es: 'Ecuador Andino y Costa', en: 'Andean and Coastal Ecuador' },
  'phase.travel.7': { es: 'Costa Peruana', en: 'Peruvian Coast' },
  'phase.travel.8': { es: 'Cordillera Blanca (Ancash)', en: 'Cordillera Blanca (Ancash)' },
  'phase.travel.9': { es: 'Andes Peruanos Sur (Cusco y Amazonía sur)', en: 'Southern Peruvian Andes (Cusco and Southern Amazon)' },
  'phase.travel.10': { es: 'Chile (sur a norte)', en: 'Chile (South to North)' },
  'phase.travel.11': { es: 'Argentina: Cuyo y Patagonia', en: 'Argentina: Cuyo and Patagonia' },

  // Phases (Aventura track — expedition preparation)
  'phase.aventura.1': { es: 'Cruzar el Darién en kayak', en: 'Crossing the Darién by kayak' },

  // Track names (segmented selector)
  'track.ai': { es: 'IA', en: 'AI' },
  'track.travel': { es: 'Viajes', en: 'Travel' },
  'track.aventura': { es: 'Aventura', en: 'Adventure' },

  // Common
  'common.loading': { es: 'Cargando...', en: 'Loading...' },
  'common.error': { es: 'Error', en: 'Error' },
  'common.language': { es: 'Idioma', en: 'Language' },
  'common.login': { es: 'Ingresar', en: 'Login' },
  'common.signup': { es: 'Registrarse', en: 'Sign up' },
  'common.signin': { es: 'Iniciar sesión', en: 'Sign in' },
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
  'questionType.design': { es: 'Diseño', en: 'Design' },

  // Study View
  'study.title': { es: 'Estudio', en: 'Study' },
  'study.noUrl': { es: 'Este recurso no tiene URL asociada', en: 'This resource has no associated URL' },
  'study.embedBlocked': { es: 'No se pudo cargar el contenido embebido', en: 'Could not load embedded content' },
  'study.openNewTab': { es: 'Abrir en nueva pestaña', en: 'Open in new tab' },
  'study.canvasHint': { es: 'Dibuja, escribe, conecta ideas', en: 'Draw, write, connect ideas' },
  'study.saving': { es: 'Guardando...', en: 'Saving...' },

  // Review
  'nav.review': { es: 'Repaso', en: 'Review' },
  'review.title': { es: 'Repasar', en: 'Review' },
  'review.subtitle': { es: 'Lo que toca recordar hoy', en: 'What is due to remember today' },
  'review.pendingCards': { es: 'preguntas pendientes', en: 'pending questions' },
  'review.noPending': { es: 'No tenés preguntas pendientes. ¡Bien hecho!', en: 'No pending questions. Well done!' },
  'review.startReview': { es: 'Comenzar Repaso', en: 'Start Review' },
  'review.verify': { es: 'Verificar', en: 'Verify' },
  'review.next': { es: 'Siguiente', en: 'Next' },
  'review.finish': { es: 'Finalizar', en: 'Finish' },
  'review.correct': { es: 'Bien hecho', en: 'Well done' },
  'review.incorrect': { es: 'Aún no', en: 'Not yet' },
  'review.almostThere': { es: '¡Casi!', en: 'Almost!' },
  'review.letsReview': { es: 'Veamos...', en: "Let's see..." },
  'review.expectedAnswer': { es: 'Respuesta esperada', en: 'Expected answer' },
  'review.yourAnswer': { es: 'Tu respuesta', en: 'Your answer' },
  'review.answerPlaceholder': { es: 'Escribí tu respuesta…', en: 'Write your answer...' },
  'review.sessionComplete': { es: 'Sesión Completada', en: 'Session Complete' },
  'review.correctCount': { es: 'Correctas', en: 'Correct' },
  'review.incorrectCount': { es: 'Incorrectas', en: 'Incorrect' },
  'review.streak': { es: 'Racha', en: 'Streak' },
  'review.nextReview': { es: 'Próxima revisión', en: 'Next review' },
  'review.evaluating': { es: 'Evaluando...', en: 'Evaluating...' },
  'review.difficulty': { es: 'Dificultad', en: 'Difficulty' },
  'review.concept': { es: 'Concepto', en: 'Concept' },
  'review.cardOf': { es: 'de', en: 'of' },
  'review.backToDashboard': { es: 'Volver al Inicio', en: 'Back to Home' },
  'review.showAnalysis': { es: 'Ver análisis', en: 'Show analysis' },
  'review.hideAnalysis': { es: 'Ocultar análisis', en: 'Hide analysis' },

  // Dashboard review section
  'dashboard.reviewPending': { es: 'Repaso Pendiente', en: 'Review Pending' },
  'dashboard.startReview': { es: 'Comenzar Repaso', en: 'Start Review' },
  'dashboard.noReviewPending': { es: 'Sin repasos pendientes', en: 'No pending reviews' },

  // Projects
  'project.project-react-agent': { es: 'Agente de Código Auto-Mejorable', en: 'Self-Improving Coding Agent' },
  'project.project-rag-system': { es: 'Agente de Conocimiento Personal', en: 'Personal Knowledge Agent' },
  'project.project-router': { es: 'Router de Modelos con Optimización Edge', en: 'Edge AI Model Router' },
  'project.project-system-design': { es: 'Orquestador de Workflows Empresarial', en: 'Enterprise Workflow Orchestrator' },
  'project.title': { es: 'Proyecto', en: 'Project' },
  'project.deliverables': { es: 'Entregables', en: 'Deliverables' },
  'project.start': { es: 'Iniciar Proyecto', en: 'Start Project' },
  'project.markComplete': { es: 'Marcar Completado', en: 'Mark Complete' },
  'project.completed': { es: 'Completado', en: 'Completed' },
  'project.inProgress': { es: 'En Progreso', en: 'In Progress' },
  'project.notStarted': { es: 'No Iniciado', en: 'Not Started' },
  'project.concepts': { es: 'Conceptos que avanza', en: 'Concepts advanced' },
  'project.milestone': { es: 'Proyecto de Fase', en: 'Phase Project' },

  // Learn Flow
  'learn.step.activate': { es: 'Resumen', en: 'Overview' },
  'learn.step.learn': { es: 'Entender', en: 'Understand' },
  'learn.step.apply': { es: 'Playground', en: 'Playground' },
  'learn.step.practiceEval': { es: 'Ensayar con el tutor', en: 'Rehearse with the tutor' },
  'learn.step.evaluate': { es: 'Evaluación por voz', en: 'Voice evaluation' },
  'learn.step.interview': { es: 'Simulacro', en: 'Mock interview' },
  'learn.step.coding': { es: 'Simulacro con código', en: 'Live coding mock' },
  'learn.step.drills': { es: 'Decirlo', en: 'Say it' },
  'learn.preQuestion.title': { es: '¿Querés adivinar antes de leer?', en: 'Want to guess before reading?' },
  'learn.preQuestion.instruction': { es: 'Es opcional. Adivinar primero ayuda a recordar después, aunque te equivoques.', en: 'It is optional. Guessing first helps you remember later, even if you get it wrong.' },
  'learn.preQuestion.submit': { es: 'Responder', en: 'Answer' },
  'learn.preQuestion.skip': { es: 'Leer directamente', en: 'Just read' },
  'learn.preQuestion.attempted': { es: 'Guardé tu respuesta', en: 'Your answer is saved' },
  'learn.postTest.title': { es: 'Una pregunta para cerrar', en: 'One question to close' },
  'learn.postTest.submit': { es: 'Revisar mi respuesta', en: 'Check my answer' },
  'learn.question.none': { es: 'Esta parte no tiene pregunta.', en: 'This part has no question.' },
  'learn.section.of': { es: 'de', en: 'of' },
  'learn.section.next': { es: 'Siguiente parte', en: 'Next part' },
  'learn.section.previous': { es: 'Sección anterior', en: 'Previous section' },
  'learn.section.complete': { es: 'Lectura terminada', en: 'Reading done' },
  'learn.continueToApply': { es: 'Siguiente: Playground', en: 'Next: Playground' },
  'learn.continueToEvaluate': { es: 'Siguiente: evaluación por voz', en: 'Next: voice evaluation' },
  'learn.backToLibrary': { es: 'Biblioteca', en: 'Library' },
  'learn.feedMode': { es: 'Repasar scrolleando', en: 'Review by scrolling' },
  'learn.guidedQuestions': { es: 'Preguntas Guía', en: 'Guided Questions' },
  'learn.guidedQuestionsDesc': { es: 'Reflexiona sobre lo que aprendiste con estas preguntas', en: 'Reflect on what you learned with these questions' },

  // Quick Quiz
  'quiz.start': { es: 'Probar Conocimiento', en: 'Test Knowledge' },
  'quiz.another': { es: 'Otra Pregunta', en: 'Another Question' },
  'quiz.done': { es: 'Listo', en: 'Done' },
  'quiz.title': { es: 'Quiz Rápido', en: 'Quick Quiz' },
  'quiz.description': { es: 'Pon a prueba tu conocimiento con una pregunta aleatoria', en: 'Test your knowledge with a random question' },
  'quiz.showAnswer': { es: 'Ver Respuesta', en: 'Show Answer' },

  // Confidence indicator
  'confidence.prompt': { es: '¿Qué tan seguro estás?', en: 'How confident are you?' },
  'confidence.low': { es: 'No muy seguro', en: 'Not sure' },
  'confidence.medium': { es: 'Bastante seguro', en: 'Fairly sure' },
  'confidence.high': { es: 'Muy seguro', en: 'Very sure' },

  // Theme
  'theme.light': { es: 'Claro', en: 'Light' },
  'theme.dark': { es: 'Oscuro', en: 'Dark' },

  // Self-explanation
  'selfExplanation.title': { es: 'Auto-explicación', en: 'Self-explanation' },
  'selfExplanation.save': { es: 'Guardar', en: 'Save' },
  'selfExplanation.saved': { es: 'Guardado', en: 'Saved' },

  // Whisper read-along
  'whisper.enable': { es: 'Lectura en voz alta', en: 'Read aloud' },
  'whisper.disable': { es: 'Desactivar lectura', en: 'Disable read-aloud' },
  'whisper.loading': { es: 'Cargando voces...', en: 'Loading voices...' },
  'whisper.hint': { es: 'Espacio', en: 'Space' },
  'whisper.setup.title': { es: 'Configurar lectura', en: 'Setup read-aloud' },
  'whisper.setup.description': {
    es: 'La lectura en voz alta usa las voces de tu sistema operativo. No necesita extensiones.',
    en: 'Read-aloud uses your operating system\'s built-in voices. No extensions needed.',
  },
  'whisper.setup.step1': {
    es: 'macOS: Ajustes > Accesibilidad > Contenido leído > Voces del sistema > descargar una voz en español',
    en: 'macOS: Settings > Accessibility > Spoken Content > System Voices > download a Spanish voice',
  },
  'whisper.setup.step2': {
    es: 'Windows: Configuración > Hora e idioma > Idioma > Agregar español > Descargar voz',
    en: 'Windows: Settings > Time & Language > Language > Add Spanish > Download voice',
  },
  'whisper.setup.step3': {
    es: 'Recarga la página después de instalar las voces',
    en: 'Reload the page after installing voices',
  },

  // Review prediction
  'prediction.title': { es: 'Predicción', en: 'Prediction' },
  'prediction.confirm': { es: 'Confirmar', en: 'Confirm' },
  'prediction.yourPrediction': { es: 'Tu predicción', en: 'Your prediction' },
  'prediction.comparison': { es: 'Predicción vs Realidad', en: 'Prediction vs Reality' },
  'prediction.predicted': { es: 'Predicho', en: 'Predicted' },
  'prediction.actual': { es: 'Real', en: 'Actual' },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, language: Language): string {
  return translations[key]?.[language] || translations[key]?.en || key;
}

export type CurriculumTrack = 'ai' | 'travel' | 'aventura';

export function getPhaseNames(
  language: Language,
  track: CurriculumTrack = 'ai',
): Record<string, string> {
  if (track === 'travel') {
    return {
      '1': t('phase.travel.1', language),
      '2': t('phase.travel.2', language),
      '3': t('phase.travel.3', language),
      '4': t('phase.travel.4', language),
      '5': t('phase.travel.5', language),
      '6': t('phase.travel.6', language),
      '7': t('phase.travel.7', language),
      '8': t('phase.travel.8', language),
      '9': t('phase.travel.9', language),
      '10': t('phase.travel.10', language),
      '11': t('phase.travel.11', language),
    };
  }

  if (track === 'aventura') {
    return {
      '1': t('phase.aventura.1', language),
    };
  }

  return {
    '1': t('phase.1', language),
    '1.5': t('phase.1_5', language),
    '2': t('phase.2', language),
    '3': t('phase.3', language),
    '4': t('phase.4', language),
    '5': t('phase.5', language),
    '6': t('phase.6', language),
    '7': t('phase.7', language),
    '8': t('phase.8', language),
    '9': t('phase.9', language),
    '10': t('phase.10', language),
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
