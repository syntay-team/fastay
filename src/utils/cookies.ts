import { IncomingMessage, ServerResponse } from 'http';

export class RequestCookies {
  private cookies: Map<string, string> = new Map();
  private setCookies: string[] = []; // para armazenar cookies que serão enviados no response

  constructor(cookieHeader?: string) {
    if (!cookieHeader) return;

    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (!name) return;
      this.cookies.set(name, decodeURIComponent(rest.join('=')));
    });
  }

  public get(name: string) {
    const value = this.cookies.get(name);
    if (!value) return undefined;
    return { value };
  }

  public has(name: string) {
    return this.cookies.has(name);
  }

  public all() {
    const obj: Record<string, string> = {};
    this.cookies.forEach((v, k) => (obj[k] = v));
    return obj;
  }

  public set(
    name: string,
    value: string,
    options: {
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Lax' | 'Strict' | 'None';
      domain?: string;
      maxAge?: number;
    } = {}
  ) {
    let cookieStr = `${name}=${encodeURIComponent(value)}`;
    if (options.path) cookieStr += `; Path=${options.path}`;
    if (options.httpOnly) cookieStr += `; HttpOnly`;
    if (options.secure) cookieStr += `; Secure`;
    if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
    if (options.domain) cookieStr += `; Domain=${options.domain}`;
    if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;

    this.setCookies.push(cookieStr);
    this.cookies.set(name, value);
  }

  public delete(
    name: string,
    options: { path?: string; domain?: string } = {}
  ) {
    this.set(name, '', {
      path: options.path,
      domain: options.domain,
      maxAge: 0,
    });
    this.cookies.delete(name);
  }

  public clear() {
    this.cookies.forEach((_, name) => this.delete(name));
  }

  public toString() {
    return this.setCookies.join('; ');
  }

  public applyToResponse(res: ServerResponse) {
    this.setCookies.forEach((c) => res.setHeader('Set-Cookie', c));
  }
}

export const cookies = RequestCookies;
