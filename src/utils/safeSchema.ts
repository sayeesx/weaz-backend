import { SupabaseClient } from '@supabase/supabase-js';

export async function safeInsert(client: SupabaseClient, table: string, data: any) {
  let currentData = { business_id: 'default_weaz_business', ...data };
  while (true) {
    const { data: res, error } = await client.from(table).insert(currentData).select().single();
    if (error && error.code === 'PGRST204') {
      const match = error.message.match(/Could not find the '(.+)' column/);
      if (match && match[1]) {
        delete currentData[match[1]];
        continue;
      }
    }
    // Also handle PGRST205 (table not found)
    if (error && error.code === 'PGRST205') {
       return { data: null, error: { message: `Table ${table} ignored`, code: 'IGNORED' } };
    }
    return { data: res, error };
  }
}

export async function safeUpdate(client: SupabaseClient, table: string, matchCol: string, matchVal: string, data: any) {
  let currentData = { business_id: 'default_weaz_business', ...data };
  while (true) {
    const { data: res, error } = await client.from(table).update(currentData).eq(matchCol, matchVal).select().single();
    if (error && error.code === 'PGRST204') {
      const match = error.message.match(/Could not find the '(.+)' column/);
      if (match && match[1]) {
        delete currentData[match[1]];
        continue;
      }
    }
    if (error && error.code === 'PGRST205') {
       return { data: null, error: { message: `Table ${table} ignored`, code: 'IGNORED' } };
    }
    return { data: res, error };
  }
}
