-- Fix Pháp luật đại cương to belong to PTIT instead of UTT

-- First, find or get the PTIT school ID
-- The school might already exist with a different ID

-- Update Pháp luật đại cương to PTIT using the existing school
UPDATE subjects 
SET "schoolId" = (
    SELECT id FROM schools WHERE code = 'PTIT' OR name LIKE '%Bưu chính Viễn thông%' LIMIT 1
), "updatedAt" = NOW()
WHERE slug = 'phap-luat-dai-cuong';

-- Verify the change
SELECT s.name as subject_name, s.slug, sc.name as school_name, sc.code as school_code
FROM subjects s
LEFT JOIN schools sc ON s."schoolId" = sc.id
WHERE s.slug = 'phap-luat-dai-cuong';
