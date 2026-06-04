import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hluvtxycsaoqivlphbag.supabase.co';
const supabaseKey = 'sb_publishable_mQAeaTBKkhviKHTfJxjtOw_H1G5GaEA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Registration...');
  const loginId = 'test_signup_' + Date.now();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: loginId,
      data: {
        password: '123',
        name: 'test',
        phone: '010',
        groups: []
      }
    });

  if (error) {
    console.error('Registration Error:', error);
  } else {
    console.log('Registration Success!', data);
  }
}

test();
