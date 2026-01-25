SELECT 
    s.name as subject, 
    c.name as chapter, 
    t.name as topic,
    (SELECT COUNT(*) FROM questions q WHERE q."topicId" = t.id) as question_count
FROM topics t 
JOIN chapters c ON t."chapterId" = c.id
JOIN subjects s ON c."subjectId" = s.id
ORDER BY s.name, c."order", t."order"
LIMIT 50;
