import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '../db/tables';

type PhaseMetaRow = {
  phase: string;
  sort_order: number;
  is_primary: boolean;
  title_es: string;
  title_en: string;
  objective_es: string;
  objective_en: string;
  outcomes_es: string[];
  outcomes_en: string[];
};

type ConceptRow = {
  id: string;
  name: string;
  phase: string;
  canonical_definition: string;
};

type ConceptPrereqRow = {
  concept_id: string;
  prerequisite_id: string;
};

type ResourceRow = {
  id: string;
  title: string;
  phase: string;
  type: string;
  url: string | null;
  estimated_hours: number | null;
  sort_order: number | null;
};

type ResourceConceptRow = {
  resource_id: string;
  concept_id: string;
  is_prerequisite: boolean;
};

type PhaseMetaFallback = {
  phase: string;
  sortOrder: number;
  isPrimary: boolean;
  titleEs: string;
  titleEn: string;
  objectiveEs: string;
  objectiveEn: string;
};

export type CurriculumTemplate = {
  version: string;
  generatedAt: string;
  phases: CurriculumTemplatePhase[];
  stats: {
    phaseCount: number;
    conceptCount: number;
    resourceCount: number;
  };
};

export type CurriculumTemplatePhase = {
  phase: string;
  sortOrder: number;
  isPrimary: boolean;
  title: {
    es: string;
    en: string;
  };
  objective: {
    es: string;
    en: string;
  };
  outcomes: {
    es: string[];
    en: string[];
  };
  concepts: CurriculumTemplateConcept[];
  resources: CurriculumTemplateResource[];
};

export type CurriculumTemplateConcept = {
  id: string;
  name: string;
  canonicalDefinition: string;
  prerequisites: string[];
  taughtByResourceIds: string[];
};

export type CurriculumTemplateResource = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  estimatedHours: number | null;
  sortOrder: number;
  teachesConceptIds: string[];
  prerequisiteConceptIds: string[];
};

export type CurriculumAuditReport = {
  generatedAt: string;
  summary: {
    phaseCount: number;
    conceptCount: number;
    resourceCount: number;
  };
  conceptsWithoutTeacher: Array<{
    phase: string;
    conceptId: string;
  }>;
  resourcesWithoutConceptMappings: Array<{
    phase: string;
    resourceId: string;
  }>;
  backwardConceptPrerequisites: Array<{
    conceptId: string;
    conceptPhase: string;
    prerequisiteId: string;
    prerequisitePhase: string;
  }>;
  backwardResourcePrerequisites: Array<{
    resourceId: string;
    resourcePhase: string;
    prerequisiteConceptId: string;
    prerequisiteConceptPhase: string;
  }>;
  duplicateCoreUrlsInPhase: Array<{
    phase: string;
    url: string;
    resourceIds: string[];
  }>;
};

const PHASE_FALLBACKS: PhaseMetaFallback[] = [
  {
    phase: '0',
    sortOrder: 0,
    isPrimary: false,
    titleEs: 'Fundamentos Matematicos',
    titleEn: 'Mathematical Foundations',
    objectiveEs: 'Base matematica para ML y deep learning.',
    objectiveEn: 'Mathematical base for ML and deep learning.',
  },
  {
    phase: '1',
    sortOrder: 1,
    isPrimary: true,
    titleEs: 'Sistemas Distribuidos',
    titleEn: 'Distributed Systems',
    objectiveEs: 'Confiabilidad, consenso y escalabilidad para sistemas AI.',
    objectiveEn: 'Reliability, consensus, and scalability for AI systems.',
  },
  {
    phase: '2',
    sortOrder: 2,
    isPrimary: true,
    titleEs: 'ML & Deep Learning',
    titleEn: 'ML & Deep Learning Foundations',
    objectiveEs: 'Fundamentos de entrenamiento y arquitectura de redes.',
    objectiveEn: 'Core training and network architecture foundations.',
  },
  {
    phase: '3',
    sortOrder: 3,
    isPrimary: true,
    titleEs: 'Secuencias, Atencion & Transformers',
    titleEn: 'Sequences, Attention & Transformers',
    objectiveEs: 'Evolucion de seq2seq a transformers.',
    objectiveEn: 'Evolution from seq2seq to transformers.',
  },
  {
    phase: '4',
    sortOrder: 4,
    isPrimary: true,
    titleEs: 'LLMs: Entrenamiento & Alineacion',
    titleEn: 'LLMs: Training, Alignment & Scaling',
    objectiveEs: 'Entrenamiento, alineacion y escalamiento de LLMs.',
    objectiveEn: 'LLM training, alignment, and scaling.',
  },
  {
    phase: '5',
    sortOrder: 5,
    isPrimary: true,
    titleEs: 'Infraestructura ML',
    titleEn: 'ML Infrastructure & Distributed Training',
    objectiveEs: 'Infraestructura de entrenamiento y serving.',
    objectiveEn: 'Training and serving infrastructure.',
  },
  {
    phase: '6',
    sortOrder: 6,
    isPrimary: true,
    titleEs: 'Agentes & Razonamiento',
    titleEn: 'Agents & Reasoning',
    objectiveEs: 'Arquitecturas agenticas robustas.',
    objectiveEn: 'Robust agent architectures.',
  },
  {
    phase: '7',
    sortOrder: 7,
    isPrimary: true,
    titleEs: 'RAG, Memoria & Contexto',
    titleEn: 'RAG, Memory & Context',
    objectiveEs: 'Recuperacion, memoria y contexto verificables.',
    objectiveEn: 'Reliable retrieval, memory, and context systems.',
  },
  {
    phase: '8',
    sortOrder: 8,
    isPrimary: true,
    titleEs: 'Seguridad & Guardrails',
    titleEn: 'Safety, Guardrails & Eval',
    objectiveEs: 'Seguridad y evaluacion de sistemas LLM.',
    objectiveEn: 'Safety and evaluation for LLM systems.',
  },
  {
    phase: '9',
    sortOrder: 9,
    isPrimary: true,
    titleEs: 'Inferencia & Economia',
    titleEn: 'Inference & Economics',
    objectiveEs: 'Costo, latencia y capacidad en produccion.',
    objectiveEn: 'Production cost, latency, and capacity.',
  },
  {
    phase: '10',
    sortOrder: 10,
    isPrimary: true,
    titleEs: 'Diseno de Sistemas',
    titleEn: 'System Design & Integration',
    objectiveEs: 'Integracion de extremo a extremo de sistemas AI.',
    objectiveEn: 'End-to-end AI systems integration.',
  },
  {
    phase: '11',
    sortOrder: 11,
    isPrimary: false,
    titleEs: 'AI para Empresa (Track alternativo)',
    titleEn: 'AI for Enterprise (Alternate track)',
    objectiveEs: 'Estrategia y adopcion empresarial de AI.',
    objectiveEn: 'Enterprise AI strategy and adoption.',
  },
];

function phaseToNumber(phase: string): number {
  const parsed = Number.parseInt(phase, 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function defaultPhaseOutcomes(titleEs: string, titleEn: string): { es: string[]; en: string[] } {
  return {
    es: [`Demostrar dominio operativo en ${titleEs}.`],
    en: [`Demonstrate operational mastery in ${titleEn}.`],
  };
}

async function fetchPhaseMetadata(supabase: SupabaseClient): Promise<PhaseMetaRow[]> {
  const { data, error } = await supabase
    .from(TABLES.curriculumPhaseMetadata)
    .select('phase, sort_order, is_primary, title_es, title_en, objective_es, objective_en, outcomes_es, outcomes_en')
    .order('sort_order', { ascending: true });

  if (!error) {
    return (data as PhaseMetaRow[]) || [];
  }

  if (error.message.includes('curriculum_phase_metadata')) {
    return PHASE_FALLBACKS.map((phase) => ({
      phase: phase.phase,
      sort_order: phase.sortOrder,
      is_primary: phase.isPrimary,
      title_es: phase.titleEs,
      title_en: phase.titleEn,
      objective_es: phase.objectiveEs,
      objective_en: phase.objectiveEn,
      outcomes_es: defaultPhaseOutcomes(phase.titleEs, phase.titleEn).es,
      outcomes_en: defaultPhaseOutcomes(phase.titleEs, phase.titleEn).en,
    }));
  }

  throw new Error(`Failed to fetch curriculum phase metadata: ${error.message}`);
}

async function fetchCoreResources(supabase: SupabaseClient): Promise<ResourceRow[]> {
  const buildBaseQuery = () =>
    supabase
      .from(TABLES.resources)
      .select('id, title, phase, type, url, estimated_hours, sort_order')
      .eq('is_archived', false)
      .is('created_by', null)
      .order('phase', { ascending: true })
      .order('sort_order', { ascending: true });

  const withSource = await buildBaseQuery().eq('curriculum_source', 'core');

  if (!withSource.error) {
    return (withSource.data as ResourceRow[]) || [];
  }

  if (
    withSource.error.code === '42703' ||
    withSource.error.message.includes('curriculum_source')
  ) {
    const fallback = await buildBaseQuery();
    if (fallback.error) {
      throw new Error(`Failed to fetch core resources: ${fallback.error.message}`);
    }
    return (fallback.data as ResourceRow[]) || [];
  }

  throw new Error(`Failed to fetch core resources: ${withSource.error.message}`);
}

export async function buildCoreCurriculumTemplate(supabase: SupabaseClient): Promise<CurriculumTemplate> {
  const [
    phaseMetadata,
    conceptsResult,
    conceptPrereqResult,
    resources,
    resourceConceptsResult,
  ] = await Promise.all([
    fetchPhaseMetadata(supabase),
    supabase
      .from(TABLES.concepts)
      .select('id, name, phase, canonical_definition')
      .order('phase', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('concept_prerequisites')
      .select('concept_id, prerequisite_id'),
    fetchCoreResources(supabase),
    supabase
      .from(TABLES.resourceConcepts)
      .select('resource_id, concept_id, is_prerequisite'),
  ]);

  if (conceptsResult.error) {
    throw new Error(`Failed to fetch concepts: ${conceptsResult.error.message}`);
  }

  if (conceptPrereqResult.error) {
    throw new Error(`Failed to fetch concept prerequisites: ${conceptPrereqResult.error.message}`);
  }

  if (resourceConceptsResult.error) {
    throw new Error(`Failed to fetch resource-concept mappings: ${resourceConceptsResult.error.message}`);
  }

  const concepts = (conceptsResult.data as ConceptRow[]) || [];
  const conceptPrereqs = (conceptPrereqResult.data as ConceptPrereqRow[]) || [];
  const resourceConcepts = (resourceConceptsResult.data as ResourceConceptRow[]) || [];

  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));

  const conceptPrereqsByConceptId = new Map<string, string[]>();
  for (const prereq of conceptPrereqs) {
    const existing = conceptPrereqsByConceptId.get(prereq.concept_id) || [];
    existing.push(prereq.prerequisite_id);
    conceptPrereqsByConceptId.set(prereq.concept_id, existing);
  }

  const mappingsByResourceId = new Map<string, ResourceConceptRow[]>();
  for (const mapping of resourceConcepts) {
    const existing = mappingsByResourceId.get(mapping.resource_id) || [];
    existing.push(mapping);
    mappingsByResourceId.set(mapping.resource_id, existing);
  }

  const taughtByResourceByConceptId = new Map<string, Set<string>>();
  for (const resource of resources) {
    const mappings = mappingsByResourceId.get(resource.id) || [];
    for (const mapping of mappings) {
      if (mapping.is_prerequisite) continue;
      if (!taughtByResourceByConceptId.has(mapping.concept_id)) {
        taughtByResourceByConceptId.set(mapping.concept_id, new Set<string>());
      }
      taughtByResourceByConceptId.get(mapping.concept_id)?.add(resource.id);
    }
  }

  const phasesPresent = new Set<string>();
  for (const phase of phaseMetadata) phasesPresent.add(phase.phase);
  for (const concept of concepts) phasesPresent.add(concept.phase);
  for (const resource of resources) phasesPresent.add(resource.phase);

  const phaseMetaByPhase = new Map(phaseMetadata.map((phase) => [phase.phase, phase]));

  const orderedPhases = [...phasesPresent]
    .sort((a, b) => {
      const metaA = phaseMetaByPhase.get(a);
      const metaB = phaseMetaByPhase.get(b);
      if (metaA && metaB) return metaA.sort_order - metaB.sort_order;
      return phaseToNumber(a) - phaseToNumber(b);
    });

  const phases: CurriculumTemplatePhase[] = orderedPhases.map((phase) => {
    const phaseMeta = phaseMetaByPhase.get(phase);

    const phaseConcepts = concepts
      .filter((concept) => concept.phase === phase)
      .map((concept): CurriculumTemplateConcept => ({
        id: concept.id,
        name: concept.name,
        canonicalDefinition: concept.canonical_definition,
        prerequisites: [...(conceptPrereqsByConceptId.get(concept.id) || [])].sort(),
        taughtByResourceIds: [...(taughtByResourceByConceptId.get(concept.id) || new Set<string>())].sort(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const phaseResources = resources
      .filter((resource) => resource.phase === phase)
      .map((resource): CurriculumTemplateResource => {
        const mappings = mappingsByResourceId.get(resource.id) || [];
        const teachesConceptIds = mappings
          .filter((mapping) => !mapping.is_prerequisite)
          .map((mapping) => mapping.concept_id)
          .filter((conceptId) => conceptById.has(conceptId))
          .sort();

        const prerequisiteConceptIds = mappings
          .filter((mapping) => mapping.is_prerequisite)
          .map((mapping) => mapping.concept_id)
          .filter((conceptId) => conceptById.has(conceptId))
          .sort();

        return {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          url: resource.url,
          estimatedHours: resource.estimated_hours,
          sortOrder: resource.sort_order ?? 0,
          teachesConceptIds,
          prerequisiteConceptIds,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

    const titleEs = phaseMeta?.title_es || `Fase ${phase}`;
    const titleEn = phaseMeta?.title_en || `Phase ${phase}`;

    return {
      phase,
      sortOrder: phaseMeta?.sort_order ?? phaseToNumber(phase),
      isPrimary: phaseMeta?.is_primary ?? true,
      title: {
        es: titleEs,
        en: titleEn,
      },
      objective: {
        es: phaseMeta?.objective_es || `Objetivo curricular para fase ${phase}.`,
        en: phaseMeta?.objective_en || `Curriculum objective for phase ${phase}.`,
      },
      outcomes: {
        es: phaseMeta?.outcomes_es || defaultPhaseOutcomes(titleEs, titleEn).es,
        en: phaseMeta?.outcomes_en || defaultPhaseOutcomes(titleEs, titleEn).en,
      },
      concepts: phaseConcepts,
      resources: phaseResources,
    };
  });

  const conceptCount = phases.reduce((total, phase) => total + phase.concepts.length, 0);
  const resourceCount = phases.reduce((total, phase) => total + phase.resources.length, 0);

  return {
    version: 'core-template.v1',
    generatedAt: new Date().toISOString(),
    phases,
    stats: {
      phaseCount: phases.length,
      conceptCount,
      resourceCount,
    },
  };
}

export function auditCurriculumTemplate(template: CurriculumTemplate): CurriculumAuditReport {
  const conceptPhaseMap = new Map<string, string>();
  const resourcePhaseMap = new Map<string, string>();

  const conceptsWithoutTeacher: CurriculumAuditReport['conceptsWithoutTeacher'] = [];
  const resourcesWithoutConceptMappings: CurriculumAuditReport['resourcesWithoutConceptMappings'] = [];
  const backwardConceptPrerequisites: CurriculumAuditReport['backwardConceptPrerequisites'] = [];
  const backwardResourcePrerequisites: CurriculumAuditReport['backwardResourcePrerequisites'] = [];
  const duplicateCoreUrlsInPhase: CurriculumAuditReport['duplicateCoreUrlsInPhase'] = [];

  for (const phase of template.phases) {
    for (const concept of phase.concepts) {
      conceptPhaseMap.set(concept.id, phase.phase);
    }
    for (const resource of phase.resources) {
      resourcePhaseMap.set(resource.id, phase.phase);
    }
  }

  for (const phase of template.phases) {
    const byUrl = new Map<string, string[]>();

    for (const resource of phase.resources) {
      if (resource.teachesConceptIds.length === 0 && resource.prerequisiteConceptIds.length === 0) {
        resourcesWithoutConceptMappings.push({
          phase: phase.phase,
          resourceId: resource.id,
        });
      }

      for (const prerequisiteConceptId of resource.prerequisiteConceptIds) {
        const prerequisitePhase = conceptPhaseMap.get(prerequisiteConceptId);
        if (!prerequisitePhase) continue;
        if (phaseToNumber(prerequisitePhase) > phaseToNumber(phase.phase)) {
          backwardResourcePrerequisites.push({
            resourceId: resource.id,
            resourcePhase: phase.phase,
            prerequisiteConceptId,
            prerequisiteConceptPhase: prerequisitePhase,
          });
        }
      }

      if (resource.url) {
        const normalized = resource.url.trim().toLowerCase();
        const existing = byUrl.get(normalized) || [];
        existing.push(resource.id);
        byUrl.set(normalized, existing);
      }
    }

    for (const [url, resourceIds] of byUrl) {
      if (resourceIds.length > 1) {
        duplicateCoreUrlsInPhase.push({
          phase: phase.phase,
          url,
          resourceIds: resourceIds.sort(),
        });
      }
    }

    for (const concept of phase.concepts) {
      if (concept.taughtByResourceIds.length === 0) {
        conceptsWithoutTeacher.push({
          phase: phase.phase,
          conceptId: concept.id,
        });
      }

      for (const prerequisiteId of concept.prerequisites) {
        const prerequisitePhase = conceptPhaseMap.get(prerequisiteId);
        if (!prerequisitePhase) continue;

        if (phaseToNumber(prerequisitePhase) > phaseToNumber(phase.phase)) {
          backwardConceptPrerequisites.push({
            conceptId: concept.id,
            conceptPhase: phase.phase,
            prerequisiteId,
            prerequisitePhase,
          });
        }
      }
    }
  }

  const conceptCount = template.phases.reduce((total, phase) => total + phase.concepts.length, 0);
  const resourceCount = template.phases.reduce((total, phase) => total + phase.resources.length, 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      phaseCount: template.phases.length,
      conceptCount,
      resourceCount,
    },
    conceptsWithoutTeacher,
    resourcesWithoutConceptMappings,
    backwardConceptPrerequisites,
    backwardResourcePrerequisites,
    duplicateCoreUrlsInPhase,
  };
}

export function hasBlockingCurriculumIssues(report: CurriculumAuditReport): boolean {
  return (
    report.conceptsWithoutTeacher.length > 0 ||
    report.resourcesWithoutConceptMappings.length > 0 ||
    report.backwardConceptPrerequisites.length > 0 ||
    report.backwardResourcePrerequisites.length > 0 ||
    report.duplicateCoreUrlsInPhase.length > 0
  );
}
