export declare const logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    success: (msg: string) => void;
    gear: (msg: string) => void;
    space(lines?: number): void;
    group(title: string): void;
    raw(msg: string): void;
    timeStart(): number;
    timeEnd(start: number): string;
};
//# sourceMappingURL=logger.d.ts.map