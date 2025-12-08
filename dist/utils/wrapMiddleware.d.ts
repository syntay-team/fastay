import { Response, NextFunction } from 'express';
import { Request } from 'src/types/request.js';
export type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => any;
/**
 * Wrapper final
 */
export declare function wrapMiddleware(mw: MiddlewareFn): MiddlewareFn;
//# sourceMappingURL=wrapMiddleware.d.ts.map