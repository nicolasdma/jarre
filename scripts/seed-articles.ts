#!/usr/bin/env npx tsx
/**
 * Seed article resources into Supabase.
 *
 * Reads pre-lectura markdown files, splits them into concept-level sections,
 * and inserts sections + inline quizzes for each article resource.
 *
 * Usage:
 *   npx tsx scripts/seed-articles.ts
 *
 * Requires:
 *   - Resources already seeded via seed-database.ts
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TYPES
// ============================================================================

interface SectionDef {
  sectionTitle: string;
  conceptId: string;
  /** Which concept headings from the pre-lectura to include (1-based) */
  conceptNumbers: number[];
}

interface QuizDef {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
}

interface ArticleDef {
  resourceId: string;
  preLecturaPath: string;
  sections: SectionDef[];
  quizzes: QuizDef[];
}

// ============================================================================
// ARTICLE DEFINITIONS
// ============================================================================

const ARTICLES: ArticleDef[] = [
  {
    resourceId: 'agent-sandbox-patterns',
    preLecturaPath: resolve(__dirname, '../cursos/agent-sandbox-patterns-pre-lectura.md'),
    sections: [
      {
        sectionTitle: 'Por qué los agentes necesitan sandboxes',
        conceptId: 'tool-use',
        conceptNumbers: [1],
      },
      {
        sectionTitle: 'Pattern 1: Agent IN Sandbox',
        conceptId: 'react-pattern',
        conceptNumbers: [2, 3],
      },
      {
        sectionTitle: 'Pattern 2: Sandbox as Tool',
        conceptId: 'plan-and-execute',
        conceptNumbers: [4, 5, 6],
      },
      {
        sectionTitle: 'Criterios de selección',
        conceptId: 'tool-use',
        conceptNumbers: [7],
      },
      {
        sectionTitle: 'Implementación',
        conceptId: 'tool-use',
        conceptNumbers: [8],
      },
    ],
    quizzes: [], // loaded from TS module
  },
  {
    resourceId: 'clawvault-agent-memory',
    preLecturaPath: resolve(__dirname, '../cursos/clawvault-agent-memory-pre-lectura.md'),
    sections: [
      {
        sectionTitle: 'Context Death',
        conceptId: 'external-memory',
        conceptNumbers: [1],
      },
      {
        sectionTitle: 'LoCoMo Benchmark Results',
        conceptId: 'external-memory',
        conceptNumbers: [2],
      },
      {
        sectionTitle: 'The Obsidian Insight',
        conceptId: 'memory-management',
        conceptNumbers: [3],
      },
      {
        sectionTitle: 'Memory Types',
        conceptId: 'memory-management',
        conceptNumbers: [4],
      },
      {
        sectionTitle: 'Memory Graph',
        conceptId: 'memory-management',
        conceptNumbers: [5],
      },
      {
        sectionTitle: 'Observational Memory',
        conceptId: 'memory-management',
        conceptNumbers: [6],
      },
      {
        sectionTitle: 'Vault Index Pattern',
        conceptId: 'memory-management',
        conceptNumbers: [7],
      },
      {
        sectionTitle: 'Zero Cloud / Data Sovereignty',
        conceptId: 'external-memory',
        conceptNumbers: [8],
      },
    ],
    quizzes: [], // loaded from TS module
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Split a pre-lectura markdown file into concept blocks.
 * Returns a map: conceptNumber → markdown content (including heading).
 */
function splitByConceptHeadings(markdown: string): Map<number, string> {
  const result = new Map<number, string>();
  const regex = /^## Concepto (\d+):/gm;
  const matches: { index: number; num: number }[] = [];

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    matches.push({ index: match.index, num: parseInt(match[1], 10) });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : undefined;
    let content = markdown.slice(start, end).trim();

    // Remove trailing --- separator
    content = content.replace(/\n---\s*$/, '').trim();

    result.set(matches[i].num, content);
  }

  return result;
}

/**
 * Load inline quizzes from a TypeScript module's exported array.
 */
async function loadQuizzes(resourceId: string): Promise<QuizDef[]> {
  if (resourceId === 'agent-sandbox-patterns') {
    const mod = await import('../src/data/agent-sandbox-patterns-inline-quizzes');
    return mod.agentSandboxPatternsQuizzes.map((q) => ({
      sectionTitle: q.sectionTitle,
      positionAfterHeading: q.positionAfterHeading,
      sortOrder: q.sortOrder,
      format: q.format as 'mc' | 'tf' | 'mc2',
      questionText: q.questionText,
      options: q.options ?? null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
  }

  if (resourceId === 'clawvault-agent-memory') {
    const mod = await import('../src/data/clawvault-agent-memory-inline-quizzes');
    return mod.clawvaultAgentMemoryQuizzes.map((q) => ({
      sectionTitle: q.sectionTitle,
      positionAfterHeading: q.positionAfterHeading,
      sortOrder: q.sortOrder,
      format: q.format as 'mc' | 'tf' | 'mc2',
      questionText: q.questionText,
      options: q.options ?? null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
  }

  return [];
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  for (const article of ARTICLES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${article.resourceId}`);
    console.log('='.repeat(60));

    // 1. Verify resource exists
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id')
      .eq('id', article.resourceId)
      .single();

    if (resourceError || !resource) {
      console.error(`Resource "${article.resourceId}" not found. Run seed-database.ts first.`);
      continue;
    }

    // 2. Read and split pre-lectura
    const markdown = readFileSync(article.preLecturaPath, 'utf-8');
    const conceptBlocks = splitByConceptHeadings(markdown);
    console.log(`Found ${conceptBlocks.size} concept blocks in pre-lectura`);

    // 3. Build sections
    const sections = article.sections.map((def, i) => {
      const contentParts: string[] = [];
      for (const num of def.conceptNumbers) {
        const block = conceptBlocks.get(num);
        if (block) {
          contentParts.push(block);
        } else {
          console.warn(`  Warning: Concept ${num} not found in pre-lectura`);
        }
      }

      return {
        resource_id: article.resourceId,
        concept_id: def.conceptId,
        section_title: def.sectionTitle,
        sort_order: i,
        content_markdown: contentParts.join('\n\n---\n\n'),
      };
    });

    // 4. Clear existing sections for this resource
    const { error: deleteSecError } = await supabase
      .from('resource_sections')
      .delete()
      .eq('resource_id', article.resourceId);

    if (deleteSecError) {
      console.error(`Error clearing sections: ${deleteSecError.message}`);
      continue;
    }

    // 5. Insert sections
    const { data: insertedSections, error: insertSecError } = await supabase
      .from('resource_sections')
      .insert(sections)
      .select('id, section_title');

    if (insertSecError) {
      console.error(`Error inserting sections: ${insertSecError.message}`);
      continue;
    }

    console.log(`\n✓ Inserted ${insertedSections.length} sections:`);
    const titleToId = new Map<string, string>();
    for (const s of insertedSections) {
      console.log(`  ${s.section_title} → ${s.id}`);
      titleToId.set(s.section_title, s.id);
    }

    // 6. Load inline quizzes
    const quizzes = await loadQuizzes(article.resourceId);
    if (quizzes.length === 0) {
      console.log('  No inline quizzes found, skipping.');
      continue;
    }

    // 7. Clear existing quizzes for these sections
    const sectionIds = insertedSections.map((s) => s.id);
    const { error: deleteQuizError } = await supabase
      .from('inline_quizzes')
      .delete()
      .in('section_id', sectionIds);

    if (deleteQuizError) {
      console.error(`Error clearing quizzes: ${deleteQuizError.message}`);
    }

    // 8. Map quizzes to section IDs and insert
    const quizzesToInsert = [];
    let skipped = 0;

    for (const quiz of quizzes) {
      const sectionId = titleToId.get(quiz.sectionTitle);
      if (!sectionId) {
        console.warn(`  Warning: No section for quiz sectionTitle "${quiz.sectionTitle}", skipping.`);
        skipped++;
        continue;
      }

      quizzesToInsert.push({
        section_id: sectionId,
        position_after_heading: quiz.positionAfterHeading,
        sort_order: quiz.sortOrder,
        format: quiz.format === 'mc2' ? 'mc' : quiz.format, // mc2 → mc in DB
        question_text: quiz.questionText,
        options: quiz.options,
        correct_answer: quiz.correctAnswer,
        explanation: quiz.explanation,
        is_active: true,
      });
    }

    if (quizzesToInsert.length > 0) {
      const { error: insertQuizError } = await supabase
        .from('inline_quizzes')
        .insert(quizzesToInsert);

      if (insertQuizError) {
        console.error(`Error inserting quizzes: ${insertQuizError.message}`);
      } else {
        console.log(`✓ Inserted ${quizzesToInsert.length} inline quizzes`);
        if (skipped > 0) {
          console.log(`  (${skipped} skipped due to missing sections)`);
        }
      }
    }

    // Summary by section
    const countBySection = new Map<string, number>();
    for (const q of quizzesToInsert) {
      const title = [...titleToId.entries()].find(([, id]) => id === q.section_id)?.[0] ?? 'unknown';
      countBySection.set(title, (countBySection.get(title) ?? 0) + 1);
    }
    console.log('\n  Per-section quiz breakdown:');
    for (const [title, count] of countBySection) {
      console.log(`    ${title}: ${count} quizzes`);
    }
  }

  console.log('\n✓ All articles seeded successfully.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
