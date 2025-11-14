import express, { Application, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export type CreateAppOptions = {
  apiDir?: string; // default: "src/api"
  baseRoute?: string; // default: "/api"
  expressOptions?: any;
};

/**
 * Helper: converte um caminho de ficheiro do API para a rota Express.
 * Ex: src/api/users/[id]/get.ts -> /api/users/:id
 *      src/api/users/get.ts -> /api/users
 */
function filePathToRoute(apiDir: string, filePath: string, baseRoute: string) {
  const rel = path.relative(apiDir, filePath); // users/[id]/get.ts  ou users/get.ts
  const parts = rel.split(path.sep); // ['users','[id]','get.ts']
  // remove filename if it's method file (get.ts) — route path is folder path
  const filename = parts[parts.length - 1];
  const nameNoExt = filename.replace(/\.[tj]s$/, '');
  let segments = parts.slice(0, -1); // folder segments
  // support also route files that are direct: users.ts -> route /users
  const isMethodFile = /^(get|post|put|delete|patch|options|head)$/i.test(
    nameNoExt
  );
  if (!isMethodFile) {
    // treat file as the last segment (users.ts -> /users)
    segments.push(nameNoExt);
  }
  // convert [id] -> :id
  const route = segments
    .map((s) =>
      s.startsWith('[') && s.endsWith(']') ? `:${s.slice(1, -1)}` : s
    )
    .filter(Boolean)
    .join('/');
  return `${baseRoute}/${route}`.replace(/\/+/g, '/'); // ensure single slashes
}

/**
 * Recursively encontra todos os ficheiros .ts/.js dentro de apiDir
 */
function collectFiles(dir: string): string[] {
  let out: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      out = out.concat(collectFiles(full));
    } else if (it.isFile()) {
      if (/\.(ts|js|mts|mjs)$/.test(it.name)) out.push(full);
    }
  }
  return out;
}

/**
 * Wrap: recebe handler export (possible shapes)
 * - export async function GET(req) { return {...} }
 * - or export async function GET(req,res) { res.send(...) }
 * Our wrapper supports both.
 */
function wrapHandler(fn: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // prefer calling with (req, res) if function length >=2
      const result = fn.length >= 2 ? await fn(req, res) : await fn(req);
      if (res.headersSent) return; // handler handled response
      if (result === undefined) {
        // nothing returned, assume handler used res
        return;
      }
      if (typeof result === 'string') return res.send(result);
      if (typeof result === 'number')
        return res.status(200).send(String(result));
      // default send json
      return res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Load routes from apiDir: will import each file and mount exported handlers.
 */
export async function loadApiRoutes(
  app: Application,
  apiDir: string,
  baseRoute: string
) {
  if (!fs.existsSync(apiDir)) {
    // nothing to do
    return;
  }
  const files = collectFiles(apiDir);

  for (const file of files) {
    // dynamic import considers file URL
    const fileUrl = pathToFileURL(file).href;
    // import module dynamically
    // eslint-disable-next-line no-await-in-loop
    const mod = await import(fileUrl);
    const filename = path.basename(file);
    const methodName = filename.replace(/\.[tj]s$/, ''); // could be get/post or custom
    const route = filePathToRoute(apiDir, file, baseRoute);

    // If module exports HTTP methods named GET, POST, etc.
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
        (app as any)[m.toLowerCase()](route, wrapHandler(mod[m]));
      }
    }

    // If file was a method file (get.ts) we already mounted via exported functions.
    // Also support default export as a handler function (applies to any method: GET)
    if (mod.default && typeof mod.default === 'function') {
      // Mount default at GET
      app.get(route, wrapHandler(mod.default));
    }

    // Logging (dev): show loaded routes
    // console.log(`Loaded route: ${route} -> ${file}`);
  }
}

/**
 * Create an express app wired with file-based API routes
 */
export async function createApp(opts?: CreateAppOptions) {
  const apiDir = opts?.apiDir ?? path.resolve(process.cwd(), 'src', 'api');
  const baseRoute = opts?.baseRoute ?? '/api';
  const app = express();
  app.use(express.json());
  // basic health check
  app.get('/_health', (_, res) => res.json({ ok: true }));
  // load routes
  await loadApiRoutes(app, apiDir, baseRoute);

  return app;
}
