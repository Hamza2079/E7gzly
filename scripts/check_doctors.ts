import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data } = await supabase.from('providers').select('id, user_id, users(full_name, avatar_url)');
  console.log(JSON.stringify(data, null, 2));
}

check();
