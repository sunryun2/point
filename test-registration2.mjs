import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hluvtxycsaoqivlphbag.supabase.co';
const supabaseKey = 'sb_publishable_mQAeaTBKkhviKHTfJxjtOw_H1G5GaEA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const loginId = 'test_signup_2';
  
  console.log('Checking existing user...');
  const { data: existingUser, error: checkError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', loginId)
    .single();

  console.log('existingUser:', existingUser);
  console.log('checkError:', checkError);
  
  if (existingUser) {
      console.log('User exists');
      return;
  }

  console.log('Inserting...');
  const { error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: loginId,
      data: { password: '123', name: 'test', phone: '010', groups: [] }
    });

  if (error) {
    console.error('Registration Error:', error);
  } else {
    console.log('Registration Success!');
  }
}

test();
