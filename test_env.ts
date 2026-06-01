import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });
const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const c = await s.from('carts').insert({ user_id: 'd643d5e4-d407-4e62-a99d-bd13647e4959', status: 'active', environment: 'test' }).select('*').limit(1);
  console.log('Cart Error:', c.error);
}
check();
