import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

export interface CookieItem {
  value: string;
}

export interface RequestCookies {
  /**
   * Retrieves a cookie by its name.
   * @param name - The name of the cookie to retrieve.
   * @returns An object containing the cookie's value, or undefined if not found.
   */
  get(name: string): CookieItem | undefined;

  /**
   * Checks if a cookie with the given name exists.
   * @param name - The name of the cookie to check.
   * @returns True if the cookie exists, false otherwise.
   */
  has(name: string): boolean;

  /**
   * Returns all cookies as a key-value object.
   * @returns An object where keys are cookie names and values are cookie values.
   */
  all(): Record<string, string>;
}

export interface Request extends ExpressRequest {
  /**
   * Represents the cookies sent in a request.
   */
  cookies: RequestCookies;
  formData: () => Promise<FormData>;
  // params:
  // query:
}

export type Response = ExpressResponse;
export type Next = NextFunction;

declare global {
  type FastayResponse = {
    status?: number;
    body?: any;
    cookies?: Record<string, { value: string; options?: any }>;
    headers?: Record<string, string>;
    redirect?: string;
    file?: { path: string; filename?: string; options?: any };
    stream?: NodeJS.ReadableStream;
    raw?: Buffer | string;
  };
}

export type RouteHandler =
  | (() => FastayResponse | any)
  | ((req: Request) => FastayResponse | any)
  | ((req: Request, res: Response) => FastayResponse | any);

export interface CookieItem {
  value: string;
}

// declare module 'express-serve-static-core' {
//   interface Request {
//     typedCookies: RequestCookies | any;
//   }
// }
