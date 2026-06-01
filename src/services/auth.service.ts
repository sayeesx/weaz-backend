import { createSupabaseUserClient, supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';
import { User, createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { env } from '../config/env';

// In-memory store for OTPs
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export class AuthService {
  static async sendOtp(phone: string) {
    // Generate 6 digit OTP. If DEV, use 000000 
    const otp = process.env.NODE_ENV === 'development' ? '000000' : Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    });

    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

    if (msg91AuthKey && msg91TemplateId && process.env.NODE_ENV !== 'development') {
      try {
        const cleanNumber = phone.replace('+', '');
        // MSG91 Send OTP endpoint typical structure (V5)
        const response = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=${cleanNumber}&authkey=${msg91AuthKey}&otp=${otp}`, {
          method: 'POST'
        });
        const data = await response.json();
        if (data.type === 'error') {
          console.error('[MSG91 Error]', data);
          throw new AppError('Failed to send SMS via MSG91', 'SMS_ERROR');
        }
      } catch (err: any) {
        console.error('[MSG91 Exception]', err);
        throw new AppError('Failed to reach SMS provider', 'SMS_ERROR');
      }
    } else {
      console.log(`[DEV/MOCK] Sent OTP ${otp} to ${phone} (No MSG91 config found or NODE_ENV=development)`);
    }

    return { sent: true };
  }

  static async verifyOtpAndCreateSession(phone: string, otp: string) {
    const stored = otpStore.get(phone);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new AppError('Invalid or expired OTP', 'INVALID_OTP', 400);
    }

    // OTP valid. Clear it from memory.
    otpStore.delete(phone);

    // Create a temporary secure password for the Supabase user
    const tempPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
    
    let userId: string | null = null;
    
    // Attempt to create the user
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      phone: phone,
      password: tempPassword,
      phone_confirm: true
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        // Find existing user ID
        // Note: listUsers is paginated, but for an MVP scale we use it to find the user by phone. 
        // In a huge production db, we would query the profiles table or create an RPC.
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.find(u => u.phone === phone || u.phone === phone.replace('+', ''));
        
        if (existingUser) {
          userId = existingUser.id;
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword, phone_confirm: true });
          if (updateError) throw new AppError('Failed to update internal auth for existing user', 'AUTH_ERROR');
        } else {
          // If listUsers didn't find them, try to lookup via profiles table
          const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('phone', phone).single();
          if (profile) {
            userId = profile.id;
            await supabaseAdmin.auth.admin.updateUserById(profile.id, { password: tempPassword, phone_confirm: true });
          } else {
             throw new AppError('Phone number registered but profile missing.', 'AUTH_ERROR');
          }
        }
      } else {
        throw new AppError(createError.message, 'AUTH_ERROR');
      }
    } else {
      userId = createData.user.id;
    }

    // Now that the user exists and has a known temporary password, sign in to generate a session
    const tempClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    console.log(`[AUTH] Attempting signInWithPassword for ${phone}`);
    const { data: authData, error: signInError } = await tempClient.auth.signInWithPassword({
      phone,
      password: tempPassword
    });

    if (signInError || !authData.session) {
      console.error('[signInError details]:', signInError);
      throw new AppError(`Login failed: ${signInError?.message || 'Unknown error'}`, 'AUTH_ERROR');
    }

    // Ensure profile exists for the user
    await this.getOrCreateProfile(authData.user, authData.session.access_token);

    return authData.session;
  }

  static async getOrCreateProfile(user: User, token: string, updates: { full_name?: string, preferred_language?: string } = {}) {
    const supabase = supabaseAdmin;
    
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[auth.service] fetchError details:', fetchError);
      throw new AppError('Failed to fetch profile', 'DB_ERROR');
    }

    if (existingProfile) {
      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) throw new AppError('Failed to update profile', 'DB_ERROR');
        return updatedProfile;
      }
      return existingProfile;
    }

    const newProfile = {
      id: user.id,
      phone: user.phone || null,
      role: 'customer',
      ...updates
    };

    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (insertError) throw new AppError('Failed to create profile', 'DB_ERROR');
    return createdProfile;
  }
}
