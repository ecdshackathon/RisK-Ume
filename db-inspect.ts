import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data: resumesTable } = await supabase.from('resumes').select('*').limit(5);
  console.log("RESUMES TABLE:", resumesTable);
  
  const { data: profilesTable } = await supabase.from('profiles').select('resume_url, resume_filename').limit(5);
  console.log("PROFILES TABLE:", profilesTable);
  
  // Storage
  // We need a user id, let's get one from profiles
  if (profilesTable && profilesTable.length > 0) {
     const { data: sessionData } = await supabase.auth.getSession();
     // Without admin key we can't easily list storage if RLS blocks it, but let's try.
  }
}
test().catch(console.error);
