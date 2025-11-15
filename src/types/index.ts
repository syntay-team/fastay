import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

/**
 * Request e Response do Express
 * Podem ser usados nos handlers do usuário
 */
export type Request = ExpressRequest;
export type Response = ExpressResponse;
export type Next = NextFunction;
