-- Consolidate duplicate Makemore Bigram resources into a single canonical id.
-- Goal:
--   - keep kz2h-makemore-bigram as the only id
--   - migrate content and user data from kz2h-makemore-bigram-2
--   - remove kz2h-makemore-bigram-2

BEGIN;

DO $$
DECLARE
  source_id CONSTANT TEXT := 'kz2h-makemore-bigram-2';
  target_id CONSTANT TEXT := 'kz2h-makemore-bigram';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM resources WHERE id = source_id) THEN
    RETURN;
  END IF;

  -- Ensure target exists, then overwrite target metadata with source metadata.
  INSERT INTO resources (
    id, title, type, url, author, phase, description, estimated_hours,
    sort_order, start_page, end_page, is_archived, activate_data, created_by, language
  )
  SELECT
    target_id, title, type, url, author, phase, description, estimated_hours,
    sort_order, start_page, end_page, is_archived, activate_data, created_by, language
  FROM resources AS source
  WHERE source.id = source_id
    AND NOT EXISTS (
      SELECT 1 FROM resources AS target WHERE target.id = target_id
    );

  UPDATE resources AS target
  SET
    title = source.title,
    type = source.type,
    url = source.url,
    author = source.author,
    phase = source.phase,
    description = source.description,
    estimated_hours = source.estimated_hours,
    sort_order = source.sort_order,
    start_page = source.start_page,
    end_page = source.end_page,
    is_archived = source.is_archived,
    activate_data = source.activate_data,
    created_by = source.created_by,
    language = source.language
  FROM resources AS source
  WHERE target.id = target_id
    AND source.id = source_id;

  -- Merge resource-concept mappings.
  UPDATE resource_concepts AS target
  SET is_prerequisite = source.is_prerequisite
  FROM resource_concepts AS source
  WHERE source.resource_id = source_id
    AND target.resource_id = target_id
    AND target.concept_id = source.concept_id;

  INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
  SELECT target_id, source.concept_id, source.is_prerequisite
  FROM resource_concepts AS source
  WHERE source.resource_id = source_id
    AND NOT EXISTS (
      SELECT 1
      FROM resource_concepts AS target
      WHERE target.resource_id = target_id
        AND target.concept_id = source.concept_id
    );

  -- Merge unique-per-user resource rows.
  UPDATE resource_notes AS target
  SET
    sections = CASE
      WHEN source.updated_at >= target.updated_at THEN source.sections
      ELSE target.sections
    END,
    updated_at = GREATEST(target.updated_at, source.updated_at)
  FROM resource_notes AS source
  WHERE source.resource_id = source_id
    AND target.resource_id = target_id
    AND target.user_id = source.user_id;

  INSERT INTO resource_notes (user_id, resource_id, sections, created_at, updated_at)
  SELECT source.user_id, target_id, source.sections, source.created_at, source.updated_at
  FROM resource_notes AS source
  WHERE source.resource_id = source_id
    AND NOT EXISTS (
      SELECT 1
      FROM resource_notes AS target
      WHERE target.resource_id = target_id
        AND target.user_id = source.user_id
    );

  UPDATE user_notes AS target
  SET
    content = CASE
      WHEN source.updated_at >= target.updated_at THEN source.content
      ELSE target.content
    END,
    updated_at = GREATEST(target.updated_at, source.updated_at)
  FROM user_notes AS source
  WHERE source.resource_id = source_id
    AND target.resource_id = target_id
    AND target.user_id = source.user_id;

  INSERT INTO user_notes (user_id, resource_id, content, created_at, updated_at)
  SELECT source.user_id, target_id, source.content, source.created_at, source.updated_at
  FROM user_notes AS source
  WHERE source.resource_id = source_id
    AND NOT EXISTS (
      SELECT 1
      FROM user_notes AS target
      WHERE target.resource_id = target_id
        AND target.user_id = source.user_id
    );

  UPDATE learn_progress AS target
  SET
    current_step = CASE
      WHEN source.updated_at >= target.updated_at THEN source.current_step
      ELSE target.current_step
    END,
    active_section = CASE
      WHEN source.updated_at >= target.updated_at THEN source.active_section
      ELSE target.active_section
    END,
    completed_sections = (
      SELECT COALESCE(array_agg(DISTINCT u.section_idx ORDER BY u.section_idx), '{}'::INTEGER[])
      FROM unnest(
        COALESCE(target.completed_sections, '{}'::INTEGER[]) ||
        COALESCE(source.completed_sections, '{}'::INTEGER[])
      ) AS u(section_idx)
    ),
    section_state = COALESCE(target.section_state, '{}'::JSONB) || COALESCE(source.section_state, '{}'::JSONB),
    created_at = LEAST(target.created_at, source.created_at),
    updated_at = GREATEST(target.updated_at, source.updated_at)
  FROM learn_progress AS source
  WHERE source.resource_id = source_id
    AND target.resource_id = target_id
    AND target.user_id = source.user_id;

  INSERT INTO learn_progress (
    user_id, resource_id, current_step, active_section, completed_sections, section_state, created_at, updated_at
  )
  SELECT
    source.user_id, target_id, source.current_step, source.active_section, source.completed_sections,
    source.section_state, source.created_at, source.updated_at
  FROM learn_progress AS source
  WHERE source.resource_id = source_id
    AND NOT EXISTS (
      SELECT 1
      FROM learn_progress AS target
      WHERE target.resource_id = target_id
        AND target.user_id = source.user_id
    );

  UPDATE resource_translations AS target
  SET
    activate_data = CASE
      WHEN source.translated_at >= target.translated_at THEN source.activate_data
      ELSE target.activate_data
    END,
    content_hash = CASE
      WHEN source.translated_at >= target.translated_at THEN source.content_hash
      ELSE target.content_hash
    END,
    translated_at = GREATEST(target.translated_at, source.translated_at)
  FROM resource_translations AS source
  WHERE source.resource_id = source_id
    AND target.resource_id = target_id
    AND target.language = source.language;

  INSERT INTO resource_translations (resource_id, language, activate_data, content_hash, translated_at)
  SELECT target_id, source.language, source.activate_data, source.content_hash, source.translated_at
  FROM resource_translations AS source
  WHERE source.resource_id = source_id
    AND NOT EXISTS (
      SELECT 1
      FROM resource_translations AS target
      WHERE target.resource_id = target_id
        AND target.language = source.language
    );

  -- Copy section content into target by semantic key (concept_id + sort_order).
  UPDATE resource_sections AS target
  SET
    section_title = source.section_title,
    content_markdown = source.content_markdown,
    content_original = source.content_original,
    start_page = source.start_page,
    end_page = source.end_page,
    paragraph_range = source.paragraph_range,
    segmentation_confidence = source.segmentation_confidence,
    manually_reviewed = source.manually_reviewed
  FROM resource_sections AS source
  WHERE source.resource_id = source_id
    AND target.resource_id = target_id
    AND target.concept_id = source.concept_id
    AND target.sort_order = source.sort_order;

  INSERT INTO resource_sections (
    resource_id, concept_id, section_title, sort_order, content_markdown, content_original,
    start_page, end_page, paragraph_range, segmentation_confidence, manually_reviewed
  )
  SELECT
    target_id, source.concept_id, source.section_title, source.sort_order, source.content_markdown, source.content_original,
    source.start_page, source.end_page, source.paragraph_range, source.segmentation_confidence, source.manually_reviewed
  FROM resource_sections AS source
  WHERE source.resource_id = source_id
    AND NOT EXISTS (
      SELECT 1
      FROM resource_sections AS target
      WHERE target.resource_id = target_id
        AND target.concept_id = source.concept_id
        AND target.sort_order = source.sort_order
    );

  -- Build source-section -> target-section mapping.
  CREATE TEMP TABLE tmp_makemore_section_map ON COMMIT DROP AS
  SELECT src.id AS old_section_id, tgt.id AS new_section_id
  FROM resource_sections AS src
  JOIN resource_sections AS tgt
    ON tgt.resource_id = target_id
   AND tgt.concept_id = src.concept_id
   AND tgt.sort_order = src.sort_order
  WHERE src.resource_id = source_id;

  -- Replace generated content scoped by section with source (-2) content.
  DELETE FROM inline_quizzes
  WHERE section_id IN (SELECT DISTINCT new_section_id FROM tmp_makemore_section_map);
  DELETE FROM video_segments
  WHERE section_id IN (SELECT DISTINCT new_section_id FROM tmp_makemore_section_map);

  -- Migrate section-scoped references.
  UPDATE question_bank AS qb
  SET resource_section_id = map.new_section_id
  FROM tmp_makemore_section_map AS map
  WHERE qb.resource_section_id = map.old_section_id;

  UPDATE inline_quizzes AS iq
  SET section_id = map.new_section_id
  FROM tmp_makemore_section_map AS map
  WHERE iq.section_id = map.old_section_id;

  UPDATE video_segments AS vs
  SET section_id = map.new_section_id
  FROM tmp_makemore_section_map AS map
  WHERE vs.section_id = map.old_section_id;

  UPDATE section_annotations AS sa
  SET section_id = map.new_section_id
  FROM tmp_makemore_section_map AS map
  WHERE sa.section_id = map.old_section_id;

  UPDATE exercise_results AS er
  SET section_id = map.new_section_id
  FROM tmp_makemore_section_map AS map
  WHERE er.section_id = map.old_section_id;

  UPDATE voice_sessions AS vss
  SET section_id = map.new_section_id
  FROM tmp_makemore_section_map AS map
  WHERE vss.section_id = map.old_section_id;

  UPDATE section_notes AS target
  SET
    content = CASE
      WHEN source.updated_at >= target.updated_at THEN source.content
      ELSE target.content
    END,
    updated_at = GREATEST(target.updated_at, source.updated_at)
  FROM section_notes AS source
  JOIN tmp_makemore_section_map AS map ON map.old_section_id = source.section_id
  WHERE target.section_id = map.new_section_id
    AND target.user_id = source.user_id;

  INSERT INTO section_notes (user_id, section_id, content, created_at, updated_at)
  SELECT source.user_id, map.new_section_id, source.content, source.created_at, source.updated_at
  FROM section_notes AS source
  JOIN tmp_makemore_section_map AS map ON map.old_section_id = source.section_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM section_notes AS target
    WHERE target.user_id = source.user_id
      AND target.section_id = map.new_section_id
  );

  DELETE FROM section_notes AS sn
  USING tmp_makemore_section_map AS map
  WHERE sn.section_id = map.old_section_id;

  UPDATE section_translations AS target
  SET
    section_title = CASE
      WHEN source.translated_at >= target.translated_at THEN source.section_title
      ELSE target.section_title
    END,
    content_markdown = CASE
      WHEN source.translated_at >= target.translated_at THEN source.content_markdown
      ELSE target.content_markdown
    END,
    content_hash = CASE
      WHEN source.translated_at >= target.translated_at THEN source.content_hash
      ELSE target.content_hash
    END,
    translated_at = GREATEST(target.translated_at, source.translated_at)
  FROM section_translations AS source
  JOIN tmp_makemore_section_map AS map ON map.old_section_id = source.section_id
  WHERE target.section_id = map.new_section_id
    AND target.language = source.language;

  INSERT INTO section_translations (
    section_id, language, section_title, content_markdown, content_hash, translated_at
  )
  SELECT
    map.new_section_id, source.language, source.section_title, source.content_markdown, source.content_hash, source.translated_at
  FROM section_translations AS source
  JOIN tmp_makemore_section_map AS map ON map.old_section_id = source.section_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM section_translations AS target
    WHERE target.section_id = map.new_section_id
      AND target.language = source.language
  );

  DELETE FROM section_translations AS st
  USING tmp_makemore_section_map AS map
  WHERE st.section_id = map.old_section_id;

  -- Remove source sections after all section-level refs are remapped.
  DELETE FROM resource_sections WHERE resource_id = source_id;

  -- Migrate remaining resource_id references.
  UPDATE evaluations SET resource_id = target_id WHERE resource_id = source_id;
  UPDATE voice_sessions SET resource_id = target_id WHERE resource_id = source_id;
  UPDATE consumption_log SET resource_id = target_id WHERE resource_id = source_id;
  UPDATE curriculum_resources SET resource_id = target_id WHERE resource_id = source_id;
  UPDATE pipeline_jobs SET resource_id = target_id WHERE resource_id = source_id;

  -- Remove source rows that were merged via upsert to avoid FK/cascade loss.
  DELETE FROM learn_progress WHERE resource_id = source_id;
  DELETE FROM resource_notes WHERE resource_id = source_id;
  DELETE FROM user_notes WHERE resource_id = source_id;
  DELETE FROM resource_translations WHERE resource_id = source_id;
  DELETE FROM resource_concepts WHERE resource_id = source_id;

  -- Finally remove duplicate resource id.
  DELETE FROM resources WHERE id = source_id;
END $$;

COMMIT;
