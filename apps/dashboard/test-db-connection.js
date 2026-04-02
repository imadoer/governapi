const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pcuvnlpxzgmxcczqoxim.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdXZubHB4emdteGNjenFveGltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0MDUyMSwiZXhwIjoyMDUyNjE2NTIxfQ.rAJD5RyIcJCWNvdqkJrKozUhEi6xUmMIhPUn0Z52b-M'

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('Supabase error:', error)
    } else {
      console.log('Connection successful! Found data:', data)
    }
  } catch (err) {
    console.error('Connection failed:', err.message)
  }
}

testConnection()
