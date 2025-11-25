import { ServerResponse } from "http";
export declare class RequestCookies {
    private cookies;
    setCookies: string[];
    constructor(cookieHeader?: string);
    get(name: string): {
        value: string;
    } | undefined;
    has(name: string): boolean;
    all(): {
        [x: string]: string | undefined;
    };
    set(name: string, value: string, options?: {
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none';
        domain?: string;
        maxAge?: number;
    }): void;
    delete(name: string, options?: {
        path?: string;
        domain?: string;
    }): void;
    clear(): void;
    applyToResponse(res: ServerResponse): void;
}
export declare const cookies: typeof RequestCookies;
//# sourceMappingURL=cookies.d.ts.map