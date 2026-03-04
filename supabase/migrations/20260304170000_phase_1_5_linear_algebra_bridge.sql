-- Phase 1.5: Linear Algebra Bridge (between distributed systems and core ML)
-- Goal: add an explicit bridge so learners can build matrix/gradient intuition
-- before Phase 2 (Micrograd / Makemore).

ALTER TYPE study_phase ADD VALUE IF NOT EXISTS '1.5' AFTER '1';
