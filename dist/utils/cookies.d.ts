import { ServerResponse } from 'http';
export declare class RequestCookies {
    private cookies;
    private setCookies;
    constructor(cookieHeader?: string);
    get(name: string): {
        value: string;
    } | undefined;
    has(name: string): boolean;
    all(): Record<string, string>;
    set(name: string, value: string, options?: {
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'Lax' | 'Strict' | 'None';
        domain?: string;
        maxAge?: number;
    }): void;
    delete(name: string, options?: {
        path?: string;
        domain?: string;
    }): void;
    clear(): void;
    toString(): string;
    applyToResponse(res: ServerResponse): void;
}
export declare const cookies: typeof RequestCookies;
//# sourceMappingURL=cookies.d.ts.map