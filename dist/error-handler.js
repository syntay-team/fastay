import { logger } from "./logger.js";
import fs from "fs/promises";
import path from "path";
// Cache para arquivos lidos (evita leitura repetida)
const fileCache = new Map();
/**
 * Extrai informações do stack trace de forma otimizada
 */
function extractErrorInfo(err) {
    if (!err.stack)
        return null;
    // Pega a primeira linha relevante do stack (ignora a linha do erro)
    const stackLines = err.stack.split("\n");
    const relevantLine = stackLines.find((line) => line.includes("(") &&
        line.includes(".ts:") &&
        !line.includes("node_modules") &&
        !line.includes("Error:"));
    if (!relevantLine)
        return null;
    // Regex otimizado para capturar arquivo, linha e coluna
    const match = relevantLine.match(/\((.*?):(\d+):(\d+)\)/);
    if (!match)
        return null;
    const [, file, line, column] = match;
    return { file, line, column, snippet: "" };
}
/**
 * Lê snippet de código de forma otimizada com cache
 */
async function getCodeSnippet(filePath, lineNumber) {
    try {
        // Normalizar caminho do arquivo
        const normalizedPath = path.resolve(filePath);
        // Verificar cache
        if (fileCache.has(normalizedPath)) {
            const content = fileCache.get(normalizedPath);
            const lines = content.split("\n");
            return lines[lineNumber - 1]?.trim() || "";
        }
        // Ler arquivo apenas se for um arquivo .ts/.js do projeto
        if (!normalizedPath.includes("node_modules") &&
            (normalizedPath.endsWith(".ts") || normalizedPath.endsWith(".js"))) {
            const content = await fs.readFile(normalizedPath, "utf-8");
            // Cache apenas em desenvolvimento
            if (process.env.NODE_ENV === "development") {
                fileCache.set(normalizedPath, content);
            }
            const lines = content.split("\n");
            return lines[lineNumber - 1]?.trim() || "";
        }
    }
    catch {
        // Ignorar erros de leitura
    }
    return "";
}
/**
 * Log de erro otimizado
 */
function logError(err, route, fileInfo) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
        logger.group(`✗ Error [${route}]`);
        logger.error(`${err.name}: ${err.message}`);
        if (fileInfo) {
            logger.error(`Location: ${fileInfo}`);
        }
        // Stack trace apenas para erros não esperados
        if (err instanceof TypeError || err instanceof ReferenceError) {
            logger.raw(err.stack?.split("\n").slice(0, 5).join("\n") || "");
        }
    }
    else {
        // Log minimalista em produção
        logger.error(`[${route}] ${err.name}: ${err.message}`);
        // Log detalhado apenas para erros críticos
        if (err instanceof SyntaxError || err.message?.includes("Unexpected")) {
            logger.raw(err.stack?.split("\n")[0] || "");
        }
    }
}
/**
 * Handler de erros otimizado para Fastay
 */
export function errorHandler(err, req, res, next) {
    // Se headers já foram enviados, delegar para próximo handler
    if (res.headersSent) {
        return next(err);
    }
    const route = `${req.method} ${req.originalUrl}`;
    const error = err instanceof Error ? err : new Error(String(err));
    // Informações adicionais apenas em desenvolvimento
    let fileInfo = "";
    if (process.env.NODE_ENV === "development") {
        const errorInfo = extractErrorInfo(error);
        if (errorInfo) {
            fileInfo = `${path.basename(errorInfo.file)}:${errorInfo.line}:${errorInfo.column}`;
            // Carregar snippet de forma assíncrona
            getCodeSnippet(errorInfo.file, parseInt(errorInfo.line))
                .then((snippet) => {
                if (snippet) {
                    logger.error(`Code: ${snippet}`);
                }
            })
                .catch(() => { }); // Ignorar erros de leitura
        }
    }
    // Log otimizado
    logError(error, route, fileInfo);
    // Determinar status code
    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    if (error instanceof SyntaxError || error.message?.includes("Unexpected")) {
        statusCode = 400;
        errorMessage = "Invalid Request";
    }
    else if (error.name === "ValidationError") {
        statusCode = 422;
        errorMessage = "Validation Failed";
    }
    // Resposta otimizada
    const isDev = process.env.NODE_ENV === "development";
    res.status(statusCode);
    // JSON response otimizado
    const response = {
        error: errorMessage,
        status: statusCode,
        path: req.originalUrl,
    };
    // Detalhes apenas em desenvolvimento
    if (isDev) {
        response.message = error.message;
        if (error.stack && statusCode === 500) {
            response.stack = error.stack.split("\n").slice(0, 3);
        }
        if (fileInfo) {
            response.location = fileInfo;
        }
    }
    // Cabeçalhos de segurança
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Error-Type", error.name);
    // Cache-control para respostas de erro
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(response);
}
/**
 * Factory para criar error handlers customizados
 */
export function createErrorHandler(options) {
    const opts = {
        logDetails: process.env.NODE_ENV === "development",
        includeStack: process.env.NODE_ENV === "development",
        customMessages: {},
        ...options,
    };
    return (err, req, res, next) => {
        if (res.headersSent)
            return next(err);
        const error = err instanceof Error ? err : new Error(String(err));
        const route = `${req.method} ${req.originalUrl}`;
        // Log customizado
        if (opts.logDetails) {
            logger.error(`[${route}] ${error.name}: ${error.message}`);
        }
        // Status code customizado
        let statusCode = 500;
        if (error.name in opts.customMessages) {
            statusCode = 400;
        }
        // Response
        res.status(statusCode).json({
            error: opts.customMessages[error.name] || "Internal Server Error",
            ...(opts.includeStack && {
                details: error.message,
                ...(statusCode === 500 && { stack: error.stack?.split("\n")[0] }),
            }),
        });
    };
}
