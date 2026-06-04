import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hluvtxycsaoqivlphbag.supabase.co';
const supabaseKey = 'sb_publishable_mQAeaTBKkhviKHTfJxjtOw_H1G5GaEA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Insert data
  console.log('1. Attempting to insert test data...');
  const { data: insertData, error: insertError } = await supabase
    .from('user_profiles')
    .upsert({ user_id: 'test_user_123', data: { groups: [] } });

  if (insertError) {
    console.error('Insert Error:', insertError.message);
  } else {
    console.log('Insert Success!');
  }

  // Test 2: Read data
  console.log('2. Attempting to read test data...');
  const { data: selectData, error: selectError } = await supabase
    .from('user_profiles')
    .select('data')
    .eq('user_id', 'test_user_123')
    .single();

  if (selectError) {
    console.error('Select Error:', selectError.message);
  } else {
    console.log('Select Success! Data:', selectData);
  }
}

test();
