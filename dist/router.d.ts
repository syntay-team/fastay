import { Application } from 'express';
/**
 * Converte caminho do arquivo em rota Express (somente arquivos route.ts)
 */
export declare function filePathToRoute(apiDir: string, filePath: string, baseRoute: string): string | null;
/**
 * Retorna todos arquivos .ts/.js recursivamente
 */
export declare function collectFiles(dir: string): string[];
/**
 * Carrega todas as rotas do diretório apiDir
 */
export declare function loadApiRoutes(app: Application, apiDir: string, baseRoute: string): Promise<number>;
