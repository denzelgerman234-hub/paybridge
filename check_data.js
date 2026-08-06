import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: workers } = await supabase.from('worker_profiles').select('id, full_name, email');
  console.log('Workers:', workers);
  
  const { data: fundingEvents } = await supabase.from('funding_events').select('*');
  console.log('Funding Events:', fundingEvents);
  
  const { data: gigs } = await supabase.from('worker_gigs').select('id, worker_id, client_name, funding_status, funded');
  console.log('Worker Gigs:', gigs);
}

main().catch(console.error);
