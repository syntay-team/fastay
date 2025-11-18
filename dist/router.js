import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { logger } from './logger.js';
/**
 * Converte caminho do arquivo em rota Express (somente arquivos route.ts)
 */
export function filePathToRoute(apiDir, filePath, baseRoute) {
    const rel = path.relative(apiDir, filePath);
    const parts = rel.split(path.sep);
    const filename = parts.pop();
    if (filename !== 'route.ts' && filename !== 'route.js')
        return null;
    const segments = parts
        .map((s) => s.startsWith('[') && s.endsWith(']') ? `:${s.slice(1, -1)}` : s)
        .filter(Boolean);
    return `${baseRoute}/${segments.join('/')}`.replace(/\/+/g, '/');
}
/**
 * Retorna todos arquivos .ts/.js recursivamente
 */
export function collectFiles(dir) {
    let out = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
        const full = path.join(dir, it.name);
        if (it.isDirectory())
            out = out.concat(collectFiles(full));
        else if (/\.(ts|js|mts|mjs)$/.test(it.name))
            out.push(full);
    }
    return out;
}
/**
 * Wrapper para suportar return JSON/string/number e capturar erros runtime
 */
function wrapHandler(fn, routePath, filePath) {
    return async (req, res, next) => {
        try {
            const result = fn.length >= 2 ? await fn(req, res) : await fn(req);
            if (res.headersSent)
                return;
            if (result === undefined)
                return;
            if (typeof result === 'string')
                return res.send(result);
            if (typeof result === 'number')
                return res.send(String(result));
            return res.json(result);
        }
        catch (err) {
            const stack = err?.stack?.split('\n').slice(0, 3).join('\n') || '';
            // logger.error(
            //   `✗ Runtime Error in route [${req.method} ${routePath}]\n` +
            //     `  File: ${filePath}\n` +
            //     `  ${err.name}: ${err.message || 'Unknown error'}\n` +
            //     `  Stack: ${stack}`
            // );
            let fileInfo = '';
            if (err.stack) {
                const stackLine = err.stack.split('\n')[1]; // pega primeira linha depois do erro
                const match = stackLine.match(/\((.*):(\d+):(\d+)\)/);
                if (match) {
                    const [_, file, line, col] = match;
                    fileInfo = `${file}:${line}:${col}`;
                    // Tenta mostrar o trecho da linha que deu erro
                    if (fs.existsSync(file)) {
                        const codeLines = fs.readFileSync(file, 'utf-8').split('\n');
                        const codeSnippet = codeLines[parseInt(line) - 1].trim();
                        fileInfo += ` → ${codeSnippet}`;
                    }
                }
            }
            // logger.group(`✗ Runtime Error in route  [${req.method} ${routePath}]`);
            logger.error(`${err.name}: ${err.message}`);
            if (fileInfo)
                logger.error(`Location: ${fileInfo}`);
            next(err);
        }
    };
}
/**
 * Carrega todas as rotas do diretório apiDir
 */
export async function loadApiRoutes(app, baseRoute, apiDirectory) {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiDir = path.join(process.cwd(), isDev ? apiDirectory : 'dist/api');
    if (!fs.existsSync(apiDir))
        return 0;
    const files = collectFiles(apiDir);
    let cont = 0;
    logger.group('Routes Loaded');
    for (const file of files) {
        const route = filePathToRoute(apiDir, file, baseRoute);
        if (!route)
            continue;
        try {
            const fileUrl = pathToFileURL(file).href;
            const mod = await import(fileUrl);
            const httpMethods = [
                'GET',
                'POST',
                'PUT',
                'DELETE',
                'PATCH',
                'OPTIONS',
                'HEAD',
            ];
            for (const m of httpMethods) {
                if (typeof mod[m] === 'function') {
                    app[m.toLowerCase()](route, wrapHandler(mod[m], route, file));
                    cont++;
                    logger.success(`Route: [${m}] ${route}`);
                }
            }
            if (mod.default && typeof mod.default === 'function') {
                app.get(route, wrapHandler(mod.default, route, file));
                cont++;
                logger.success(`Route: [GET] ${route}`);
            }
        }
        catch (err) {
            const stack = err?.stack?.split('\n').slice(0, 3).join('\n') || '';
            // logger.error(
            //   `✗ Boot Error importing ${file}\n` +
            //     `  Message: ${err.message || 'Unknown error'}\n` +
            //     `  Stack: ${stack}`
            // );
            let fileInfo = '';
            if (err.stack) {
                const stackLine = err.stack.split('\n')[1]; // pega primeira linha depois do erro
                const match = stackLine.match(/\((.*):(\d+):(\d+)\)/);
                if (match) {
                    const [_, file, line, col] = match;
                    fileInfo = `${file}:${line}:${col}`;
                    // Tenta mostrar o trecho da linha que deu erro
                    if (fs.existsSync(file)) {
                        const codeLines = fs.readFileSync(file, 'utf-8').split('\n');
                        const codeSnippet = codeLines[parseInt(line) - 1].trim();
                        fileInfo += ` → ${codeSnippet}`;
                    }
                }
            }
            // logger.group(`✗ Boot Error importing ${file}`);
            logger.error(`${err.name}: ${err.message}`);
            if (fileInfo)
                logger.error(`Location: ${fileInfo}`);
        }
    }
    return cont;
}
