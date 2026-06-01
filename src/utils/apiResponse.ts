import { FastifyReply } from 'fastify';

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: { code: string; message: string };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export const success = <T>(data: T): ApiSuccess<T> => ({
  success: true,
  data,
  error: null,
});

export const fail = (code: string, message: string): ApiError => ({
  success: false,
  data: null,
  error: { code, message },
});

export const sendSuccess = <T>(reply: FastifyReply, data: T, statusCode = 200) => {
  return reply.status(statusCode).send(success(data));
};

export const sendError = (reply: FastifyReply, code: string, message: string, statusCode = 400) => {
  return reply.status(statusCode).send(fail(code, message));
};
