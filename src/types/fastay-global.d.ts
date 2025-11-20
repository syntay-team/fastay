import { RequestCookies } from '../src/utils/cookies';

declare module 'express-serve-static-core' {
  interface Request {
    cookies: RequestCookies;
  }
}
