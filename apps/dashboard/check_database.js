const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pcuvnlpxzgmxcczqoxim.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdXZubHB4emdteGNjenFveGltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0MDUyMSwiZXhwIjoyMDUyNjE2NTIxfQ.rAJD5RyIcJCWNvdqkJrKozUhEi6xUmMIhPUn0Z52b-M'

const database = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('Checking database content...')
  
  // Check users
  const users = await database.from('users').select('*').limit(10)
  console.log(`Users found: ${users.data?.length || 0}`)
  
  // Check companies  
  const companies = await database.from('companies').select('*').limit(10)
  console.log(`Companies found: ${companies.data?.length || 0}`)
  
  // Check blocked_threats
  const threats = await database.from('blocked_threats').select('*').limit(5)
  console.log(`Blocked threats found: ${threats.data?.length || 0}`)
  
  // Check api_usage_logs
  const apiLogs = await database.from('api_usage_logs').select('*').limit(5)
  console.log(`API logs found: ${apiLogs.data?.length || 0}`)
}

checkDatabase().catch(console.error)
