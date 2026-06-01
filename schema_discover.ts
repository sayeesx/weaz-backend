import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '.env') });
const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const result: any = {};

  // Products columns
  const p = await s.from('products').select('*').limit(1);
  result.products = p.data && p.data[0] ? Object.keys(p.data[0]) : (p.error || 'empty');

  // Carts columns
  const c = await s.from('carts').select('*').limit(1);
  result.carts = c.data && c.data[0] ? Object.keys(c.data[0]) : (c.error || 'empty');

  // Orders columns (insert dummy to get column error)
  const o_insert = await s.from('orders').insert({user_id: '00000000-0000-0000-0000-000000000000'}).select('*');
  result.orders_error = o_insert.error;
  // Try select with wildcard
  const o = await s.from('orders').select('*').limit(0);
  result.orders_select = o.error || 'ok';

  // Payments columns
  const pay = await s.from('payments').select('*').limit(1);
  result.payments = pay.data && pay.data[0] ? Object.keys(pay.data[0]) : (pay.error || 'empty');

  // Chat sessions columns
  const cs = await s.from('chat_sessions').select('*').limit(1);
  result.chat_sessions = cs.data && cs.data[0] ? Object.keys(cs.data[0]) : (cs.error || 'empty');

  // Chat messages columns
  const cm = await s.from('chat_messages').select('*').limit(1);
  result.chat_messages = cm.data && cm.data[0] ? Object.keys(cm.data[0]) : (cm.error || 'empty');

  // AI interactions columns
  const ai = await s.from('ai_interactions').select('*').limit(1);
  result.ai_interactions = ai.data && ai.data[0] ? Object.keys(ai.data[0]) : (ai.error || 'empty');

  // Businesses columns
  const b = await s.from('businesses').select('*').limit(1);
  result.businesses = b.data && b.data[0] ? Object.keys(b.data[0]) : (b.error || 'empty');

  // Cart items columns
  const ci = await s.from('cart_items').select('*').limit(1);
  result.cart_items = ci.data && ci.data[0] ? Object.keys(ci.data[0]) : (ci.error || 'empty');

  // Categories columns
  const cat = await s.from('categories').select('*').limit(1);
  result.categories = cat.data && cat.data[0] ? Object.keys(cat.data[0]) : (cat.error || 'empty');

  fs.writeFileSync('real_schema.json', JSON.stringify(result, null, 2));
  console.log('Done. See real_schema.json');
}
check();
