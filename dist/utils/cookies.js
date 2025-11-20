export class RequestCookies {
    constructor(cookieHeader) {
        this.cookies = new Map();
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
}
