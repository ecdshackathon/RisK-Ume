import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkImports() {
  const { data, error } = await supabase.from('linkedin_imports').select('*').order('created_at', { ascending: false }).limit(2);
  console.log(JSON.stringify(data, null, 2));
}

checkImports();
