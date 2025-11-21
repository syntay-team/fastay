// utils/cookies.ts
import { IncomingMessage } from 'http';

export class RequestCookies {
  private cookies: Map<string, string> = new Map();

  constructor(cookieHeader: string | undefined) {
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
}

export const cookies = RequestCookies;
