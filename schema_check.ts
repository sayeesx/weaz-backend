import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  const result: any = {};
  
  const p = await supabase.from('products').select('*').limit(1);
  result.products = p.data && p.data[0] ? Object.keys(p.data[0]) : [];

  const c = await supabase.from('carts').select('*').limit(1);
  result.carts = c.data && c.data[0] ? Object.keys(c.data[0]) : [];
  
  const o = await supabase.from('orders').select('*').limit(1);
  result.orders = o.data && o.data[0] ? Object.keys(o.data[0]) : [];

  const op = await supabase.from('order_payments').select('*').limit(1);
  result.payments = op.data && op.data[0] ? Object.keys(op.data[0]) : [];
  
  const ch = await supabase.from('chat_sessions').select('*').limit(1);
  result.chat_sessions = ch.data && ch.data[0] ? Object.keys(ch.data[0]) : [];

  fs.writeFileSync('schema_out.json', JSON.stringify(result, null, 2));
}

checkSchema().catch(console.error);
