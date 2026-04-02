const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'governapi',
  user: 'postgres',
  password: 'postgres123'
});

async function testQuery() {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.company_id,
              c.company_name, c.subscription_plan, c.subscription_status
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.email = $1`,
      ['demo@governapi.com']
    );
    
    console.log('Query result:', result.rows[0]);
    console.log('Password hash field:', result.rows[0]?.password_hash);
    console.log('All fields:', Object.keys(result.rows[0] || {}));
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    await pool.end();
  }
}

testQuery();
