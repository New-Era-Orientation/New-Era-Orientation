const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function createAdmin() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const email = "admin@neo-edu.vn";
    const name = "Neo";
    const password = "Neothpt123";
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        const result = await pool.query(`
      INSERT INTO users (id, name, email, password, role, "emailVerified", "createdAt", "updatedAt")
      VALUES (
        'admin-neo-001',
        $1,
        $2,
        $3,
        'ADMIN',
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = 'ADMIN',
        "updatedAt" = NOW()
      RETURNING *;
    `, [name, email, hashedPassword]);

        console.log("✅ Admin user created/updated:");
        console.log("   Email:", result.rows[0].email);
        console.log("   Name:", result.rows[0].name);
        console.log("   Role:", result.rows[0].role);
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
