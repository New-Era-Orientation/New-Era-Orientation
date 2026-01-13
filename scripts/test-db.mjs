import pg from 'pg';
const { Pool } = pg;

// Using IP from Test-NetConnection: 3.39.47.126
const pool = new Pool({ 
    host: '3.39.47.126',
    port: 5432,
    database: 'postgres',
    user: 'postgres.zcumkoagenwvxlzuovip',
    password: 'MySecretDB!2026',
    ssl: { rejectUnauthorized: false }
});

try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected!', result.rows[0]);
} catch (e) {
    console.error('❌ Error:', e.message);
} finally {
    await pool.end();
}
