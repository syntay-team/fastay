export interface CookieItem {
  value: string;
}

export interface RequestCookies {
  get(name: string): CookieItem | undefined;
  has(name: string): boolean;
  all(): Record<string, string>;
}
