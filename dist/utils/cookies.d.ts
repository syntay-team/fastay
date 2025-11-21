export declare class RequestCookies {
    private cookies;
    constructor(cookieHeader: string | undefined);
    get(name: string): {
        value: string;
    } | undefined;
    has(name: string): boolean;
    all(): Record<string, string>;
}
export declare const cookies: typeof RequestCookies;
