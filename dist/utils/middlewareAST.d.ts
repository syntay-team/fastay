import * as parser from '@babel/parser';
import * as t from '@babel/types';
import { Request, Response, NextFunction } from 'express';
export type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => any;
/**
 * Analisa o middleware e retorna informações
 */
export declare function analyzeMiddleware(mw: MiddlewareFn): {
    callsNext: boolean;
    hasReturn: boolean;
    ast: parser.ParseResult<t.File>;
    code: string;
};
/**
 * Injeta comportamento no middleware
 */
export declare function wrapMiddlewareAST(mw: MiddlewareFn): MiddlewareFn;
