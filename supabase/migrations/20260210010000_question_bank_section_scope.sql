-- Add optional section-level scoping to question_bank.
-- When resource_section_id is set, the question is specific to that section.
-- When NULL, the question applies to the whole concept (existing behavior).
ALTER TABLE question_bank
  ADD COLUMN resource_section_id UUID REFERENCES resource_sections(id);

CREATE INDEX idx_question_bank_section
  ON question_bank (resource_section_id)
  WHERE resource_section_id IS NOT NULL;
