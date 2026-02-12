-- ============================================================================
-- Backfill XP: Award retroactive XP for existing user activity
--
-- Sources:
--   1. review_schedule.correct_count → 10 XP per correct MC/TF, 15 per open
--   2. evaluations (completed) → 25 XP each + 15 if score >= 80
--   3. learn_progress.completed_sections → 10 XP per section
--   4. mastery_history (level advances) → 20 XP each
--
-- This migration is idempotent: it checks for existing xp_events first.
-- ============================================================================

DO $$
DECLARE
  v_user RECORD;
  v_review RECORD;
  v_eval RECORD;
  v_progress RECORD;
  v_mastery RECORD;
  v_total_xp INTEGER;
  v_xp_level INTEGER;
  v_event_count INTEGER;
BEGIN
  -- Skip if XP events already exist (idempotent guard)
  SELECT COUNT(*) INTO v_event_count FROM xp_events;
  IF v_event_count > 0 THEN
    RAISE NOTICE 'XP events already exist (%), skipping backfill', v_event_count;
    RETURN;
  END IF;

  -- Process each user with a profile
  FOR v_user IN SELECT id FROM user_profiles LOOP
    v_total_xp := 0;

    -- =====================================================================
    -- 1. Review correct answers: 10 XP per correct MC/TF answer
    --    We use correct_count from review_schedule as the source of truth
    -- =====================================================================
    FOR v_review IN
      SELECT rs.question_id, rs.correct_count, qb.format
      FROM review_schedule rs
      JOIN question_bank qb ON qb.id = rs.question_id
      WHERE rs.user_id = v_user.id
        AND rs.correct_count > 0
    LOOP
      DECLARE
        v_xp_per INTEGER;
        v_total_review_xp INTEGER;
      BEGIN
        -- Open questions get 15 XP, MC/TF get 10 XP
        IF v_review.format = 'open' THEN
          v_xp_per := 15;
        ELSE
          v_xp_per := 10;
        END IF;

        v_total_review_xp := v_review.correct_count * v_xp_per;

        INSERT INTO xp_events (user_id, xp_amount, source, source_id, created_at)
        VALUES (
          v_user.id,
          v_total_review_xp,
          'backfill_review_correct',
          v_review.question_id,
          NOW()
        );

        v_total_xp := v_total_xp + v_total_review_xp;
      END;
    END LOOP;

    -- =====================================================================
    -- 2. Completed evaluations: 25 XP each + 15 bonus if score >= 80
    -- =====================================================================
    FOR v_eval IN
      SELECT id, overall_score, completed_at
      FROM evaluations
      WHERE user_id = v_user.id
        AND status = 'completed'
    LOOP
      INSERT INTO xp_events (user_id, xp_amount, source, source_id, created_at)
      VALUES (v_user.id, 25, 'backfill_evaluation_complete', v_eval.id, COALESCE(v_eval.completed_at, NOW()));
      v_total_xp := v_total_xp + 25;

      IF v_eval.overall_score >= 80 THEN
        INSERT INTO xp_events (user_id, xp_amount, source, source_id, created_at)
        VALUES (v_user.id, 15, 'backfill_evaluation_high_score', v_eval.id, COALESCE(v_eval.completed_at, NOW()));
        v_total_xp := v_total_xp + 15;
      END IF;
    END LOOP;

    -- =====================================================================
    -- 3. Completed sections: 10 XP per section
    -- =====================================================================
    FOR v_progress IN
      SELECT resource_id, completed_sections
      FROM learn_progress
      WHERE user_id = v_user.id
        AND completed_sections IS NOT NULL
        AND array_length(completed_sections, 1) > 0
    LOOP
      DECLARE
        v_section_count INTEGER;
        v_section_xp INTEGER;
      BEGIN
        v_section_count := array_length(v_progress.completed_sections, 1);
        v_section_xp := v_section_count * 10;

        INSERT INTO xp_events (user_id, xp_amount, source, source_id, created_at)
        VALUES (v_user.id, v_section_xp, 'backfill_section_complete', v_progress.resource_id, NOW());

        v_total_xp := v_total_xp + v_section_xp;
      END;
    END LOOP;

    -- =====================================================================
    -- 4. Mastery advances: 20 XP per level-up
    -- =====================================================================
    FOR v_mastery IN
      SELECT id, concept_id, old_level, new_level, created_at
      FROM mastery_history
      WHERE user_id = v_user.id
        AND new_level::INTEGER > old_level::INTEGER
    LOOP
      INSERT INTO xp_events (user_id, xp_amount, source, source_id, created_at)
      VALUES (v_user.id, 20, 'backfill_mastery_advance', v_mastery.concept_id, v_mastery.created_at);
      v_total_xp := v_total_xp + 20;
    END LOOP;

    -- =====================================================================
    -- Update user_profiles with backfilled totals
    -- =====================================================================
    IF v_total_xp > 0 THEN
      v_xp_level := FLOOR(SQRT(v_total_xp::NUMERIC / 100)) + 1;

      UPDATE user_profiles SET
        total_xp = v_total_xp,
        xp_level = v_xp_level,
        daily_xp_earned = 0,
        daily_xp_date = CURRENT_DATE
      WHERE id = v_user.id;

      RAISE NOTICE 'User %: backfilled % XP (level %)', v_user.id, v_total_xp, v_xp_level;
    END IF;

  END LOOP;
END;
$$;
