import { parse, serialize } from "cookie";
import { ServerResponse } from "http";

export class RequestCookies {
  private cookies: Record<string, string | undefined>;
  public setCookies: string[] = [];

  constructor(cookieHeader?: string) {
    this.cookies = cookieHeader ? parse(cookieHeader) : {};
  }

  get(name: string) {
    const value = this.cookies[name];
    return value ? { value } : undefined;
  }

  has(name: string) {
    return this.cookies[name] !== undefined;
  }

  all() {
    return { ...this.cookies };
  }

  set(
    name: string,
    value: string,
    options: {
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      domain?: string;
      maxAge?: number;
    } = {}
  ) {
    const cookieStr = serialize(name, value, {
      path: options.path,
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite,
      domain: options.domain,
      maxAge: options.maxAge,
    });

    this.setCookies.push(cookieStr);
    this.cookies[name] = value;
  }

  delete(name: string, options: { path?: string; domain?: string } = {}) {
    const cookieStr = serialize(name, "", {
      path: options.path,
      domain: options.domain,
      maxAge: 0,
    });

    this.setCookies.push(cookieStr);
    delete this.cookies[name];
  }

  clear() {
    Object.keys(this.cookies).forEach((name) => this.delete(name));
  }

  applyToResponse(res: ServerResponse) {
    for (const c of this.setCookies) {
      res.appendHeader
        ? res.appendHeader("Set-Cookie", c)
        : res.setHeader("Set-Cookie", c);
    }
  }
}

export const cookies = RequestCookies;