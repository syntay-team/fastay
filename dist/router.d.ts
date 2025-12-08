import { Application } from 'express';
/** Path → route with cache */
export declare function filePathToRoute(apiDir: string, filePath: string, baseRoute: string): string | null;
/** Walk recursion limit */
export declare function collectFiles(dir: string): string[];
/** Optimized route loader with parallel import */
export declare function loadApiRoutes(app: Application, baseRoute: string, apiDirectory: string): Promise<number>;
//# sourceMappingURL=router.d.ts.map