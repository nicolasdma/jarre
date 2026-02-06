/**
 * Jarre - Seed Database
 *
 * Populates Supabase with all concepts, resources, and projects.
 * Run with: npx tsx scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { concepts, resources, projects } from './seed-data';

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedConcepts() {
  console.log('\n📚 Seeding concepts...');

  // First, insert all concepts
  const conceptRows = concepts.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.id, // using id as slug for simplicity
    canonical_definition: c.canonicalDefinition,
    phase: c.phase.toString(),
  }));

  const { error: conceptError } = await supabase
    .from('concepts')
    .upsert(conceptRows, { onConflict: 'id' });

  if (conceptError) {
    console.error('Error inserting concepts:', conceptError);
    return false;
  }

  console.log(`  ✓ Inserted ${concepts.length} concepts`);

  // Then, insert prerequisites
  const prereqRows: Array<{ concept_id: string; prerequisite_id: string }> = [];
  for (const concept of concepts) {
    if (concept.prerequisites) {
      for (const prereqId of concept.prerequisites) {
        prereqRows.push({
          concept_id: concept.id,
          prerequisite_id: prereqId,
        });
      }
    }
  }

  if (prereqRows.length > 0) {
    const { error: prereqError } = await supabase
      .from('concept_prerequisites')
      .upsert(prereqRows, { onConflict: 'concept_id,prerequisite_id' });

    if (prereqError) {
      console.error('Error inserting prerequisites:', prereqError);
      return false;
    }

    console.log(`  ✓ Inserted ${prereqRows.length} prerequisite relationships`);
  }

  return true;
}

async function seedResources() {
  console.log('\n📖 Seeding resources...');

  // Insert resources
  const resourceRows = resources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    url: r.url || null,
    author: r.author || null,
    phase: r.phase.toString(),
    description: r.description || null,
    estimated_hours: r.estimatedHours || null,
    sort_order: r.sortOrder,
  }));

  const { error: resourceError } = await supabase
    .from('resources')
    .upsert(resourceRows, { onConflict: 'id' });

  if (resourceError) {
    console.error('Error inserting resources:', resourceError);
    return false;
  }

  console.log(`  ✓ Inserted ${resources.length} resources`);

  // Insert resource-concept mappings
  // Use a Map to deduplicate (resource_id + concept_id as key)
  const mappingMap = new Map<string, {
    resource_id: string;
    concept_id: string;
    is_prerequisite: boolean;
  }>();

  for (const resource of resources) {
    // Concepts this resource teaches (not prerequisites)
    for (const conceptId of resource.concepts) {
      const key = `${resource.id}:${conceptId}`;
      mappingMap.set(key, {
        resource_id: resource.id,
        concept_id: conceptId,
        is_prerequisite: false,
      });
    }

    // Prerequisites for this resource
    // Only add if not already in the map as a taught concept
    if (resource.prerequisites) {
      for (const prereqId of resource.prerequisites) {
        const key = `${resource.id}:${prereqId}`;
        if (!mappingMap.has(key)) {
          mappingMap.set(key, {
            resource_id: resource.id,
            concept_id: prereqId,
            is_prerequisite: true,
          });
        }
      }
    }
  }

  const mappingRows = Array.from(mappingMap.values());

  if (mappingRows.length > 0) {
    const { error: mappingError } = await supabase
      .from('resource_concepts')
      .upsert(mappingRows, { onConflict: 'resource_id,concept_id' });

    if (mappingError) {
      console.error('Error inserting resource-concept mappings:', mappingError);
      return false;
    }

    console.log(`  ✓ Inserted ${mappingRows.length} resource-concept mappings`);
  }

  return true;
}

async function seedProjects() {
  console.log('\n🔨 Seeding projects...');

  const projectRows = projects.map((p) => ({
    id: p.id,
    title: p.title,
    phase: p.phase.toString(),
    description: p.description,
    deliverables: p.deliverables,
  }));

  const { error: projectError } = await supabase
    .from('projects')
    .upsert(projectRows, { onConflict: 'id' });

  if (projectError) {
    console.error('Error inserting projects:', projectError);
    return false;
  }

  console.log(`  ✓ Inserted ${projects.length} projects`);

  return true;
}

async function main() {
  console.log('🌱 Starting database seed...');
  console.log(`   URL: ${supabaseUrl}`);

  const conceptsOk = await seedConcepts();
  if (!conceptsOk) process.exit(1);

  const resourcesOk = await seedResources();
  if (!resourcesOk) process.exit(1);

  const projectsOk = await seedProjects();
  if (!projectsOk) process.exit(1);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSummary:');
  console.log(`  - ${concepts.length} concepts`);
  console.log(`  - ${resources.length} resources`);
  console.log(`  - ${projects.length} projects`);
}

main().catch(console.error);
