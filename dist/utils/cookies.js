import { parse, serialize } from "cookie";
export class RequestCookies {
    constructor(cookieHeader) {
        this.setCookies = [];
        this.cookies = cookieHeader ? parse(cookieHeader) : {};
    }
    get(name) {
        const value = this.cookies[name];
        return value ? { value } : undefined;
    }
    has(name) {
        return this.cookies[name] !== undefined;
    }
    all() {
        return { ...this.cookies };
    }
    set(name, value, options = {}) {
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
    delete(name, options = {}) {
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
    applyToResponse(res) {
        for (const c of this.setCookies) {
            res.appendHeader
                ? res.appendHeader("Set-Cookie", c)
                : res.setHeader("Set-Cookie", c);
        }
    }
}
export const cookies = RequestCookies;
