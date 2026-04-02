const { Pool } = require('pg');

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Missing environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    return;
  }
  
  // Parse Supabase URL for connection details
  const url = new URL(supabaseUrl);
  const host = url.hostname;
  
  const pool = new Pool({
    host: host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: supabaseServiceKey,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    client.release();
    await pool.end();
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testSupabaseConnection();
