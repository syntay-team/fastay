import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    cookies: import('./index').RequestCookies;
    formData: () => Promise<FormData>;
  }
}
