const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client created successfully');
  console.log('URL:', supabaseUrl);
  
  // Test basic connection
  supabase.from('apis').select('*').limit(1).then(({ data, error }) => {
    if (error) {
      console.log('Table access result:', error.message);
    } else {
      console.log('Can access database, found', data ? data.length : 0, 'records');
    }
  }).catch(err => console.log('Connection test failed:', err.message));
} else {
  console.log('Missing Supabase credentials');
}
