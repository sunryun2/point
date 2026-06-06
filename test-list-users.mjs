import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hluvtxycsaoqivlphbag.supabase.co';
const supabaseKey = 'sb_publishable_mQAeaTBKkhviKHTfJxjtOw_H1G5GaEA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('user_profiles').select('user_id, data');
  console.log('Users in DB:');
  if (data) {
    data.forEach(u => console.log(`- ${u.user_id} (Password: ${u.data.password})`));
  }
}
test();
