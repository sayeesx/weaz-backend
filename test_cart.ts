import { createSupabaseUserClient, supabaseAdmin } from './src/config/supabase';
import { env } from './src/config/env';
import { safeInsert } from './src/utils/safeSchema';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });
const token = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function start() {
    const s = createSupabaseUserClient(token);
    const { data: newCart, error } = await safeInsert(s, 'carts', {
        user_id: 'd643d5e4-d407-4e62-a99d-bd13647e4959', 
        status: 'active',
        environment: env.APP_ENV,
        subtotal: 0,
        delivery_fee: 25,
        total: 25
    });
    console.log('Result:', error || newCart);
}
start();
