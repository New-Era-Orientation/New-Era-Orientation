-- Update Logistics và PLDC to CHAPTER mode
UPDATE subjects SET "practiceMode" = 'CHAPTER' 
WHERE slug IN ('dai-cuong-logistics-va-chuoi-cung-ung', 'phap-luat-dai-cuong');

-- Update Tin học THPT to TOPIC mode  
UPDATE subjects SET "practiceMode" = 'TOPIC'
WHERE slug = 'tin-hoc-thpt';

-- All other subjects default to QUESTION_IDS (already set by schema default)

-- Verify
SELECT slug, "practiceMode" FROM subjects;
