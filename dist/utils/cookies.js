export class RequestCookies {
    constructor(cookieHeader) {
        this.cookies = new Map();
        this.setCookies = []; // para armazenar cookies que serão enviados no response
        if (!cookieHeader)
            return;
        cookieHeader.split(';').forEach((cookie) => {
            const [name, ...rest] = cookie.trim().split('=');
            if (!name)
                return;
            this.cookies.set(name, decodeURIComponent(rest.join('=')));
        });
    }
    get(name) {
        const value = this.cookies.get(name);
        if (!value)
            return undefined;
        return { value };
    }
    has(name) {
        return this.cookies.has(name);
    }
    all() {
        const obj = {};
        this.cookies.forEach((v, k) => (obj[k] = v));
        return obj;
    }
    set(name, value, options = {}) {
        let cookieStr = `${name}=${encodeURIComponent(value)}`;
        if (options.path)
            cookieStr += `; Path=${options.path}`;
        if (options.httpOnly)
            cookieStr += `; HttpOnly`;
        if (options.secure)
            cookieStr += `; Secure`;
        if (options.sameSite)
            cookieStr += `; SameSite=${options.sameSite}`;
        if (options.domain)
            cookieStr += `; Domain=${options.domain}`;
        if (options.maxAge)
            cookieStr += `; Max-Age=${options.maxAge}`;
        this.setCookies.push(cookieStr);
        this.cookies.set(name, value);
    }
    delete(name, options = {}) {
        this.set(name, '', {
            path: options.path,
            domain: options.domain,
            maxAge: 0,
        });
        this.cookies.delete(name);
    }
    clear() {
        this.cookies.forEach((_, name) => this.delete(name));
    }
    toString() {
        return this.setCookies.join('; ');
    }
    applyToResponse(res) {
        this.setCookies.forEach((c) => res.setHeader('Set-Cookie', c));
    }
}
export const cookies = RequestCookies;
