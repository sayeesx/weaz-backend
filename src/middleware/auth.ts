import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError, UnauthorizedError } from '../utils/errors';
import { supabaseAdmin } from '../config/supabase';
import { User } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    token?: string;
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  request.user = user;
  request.token = token;
};
