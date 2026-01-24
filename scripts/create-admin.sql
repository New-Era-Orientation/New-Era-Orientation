INSERT INTO
    users (
        id,
        name,
        email,
        password,
        role,
        "emailVerified",
        "createdAt",
        "updatedAt"
    )
VALUES (
        'admin-neo-001',
        'Neo',
        'admin@neo-edu.vn',
        '$2b$12$0omgs0tGKy5ksp.dco76Ee55nkF6BRrDQAkgygD50iTWkTojkk0VuW',
        'ADMIN',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO
UPDATE
SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = 'ADMIN',
    "updatedAt" = NOW();