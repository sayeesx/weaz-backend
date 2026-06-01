import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  let o = await supabase.from('orders').insert({}).select('*').limit(1);
  console.log('Orders error:', o.error);
  
  let p = await supabase.from('order_payments').insert({}).select('*').limit(1);
  console.log('Payments error:', p.error);

  let c = await supabase.from('chat_sessions').insert({}).select('*').limit(1);
  console.log('Chat errors:', c.error);
}

check().catch(console.error);
