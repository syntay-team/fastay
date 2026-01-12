import { logger } from "./logger.js";
import fs from "fs/promises";
import path from "path";
// Cache for read files
const fileCache = new Map();
/**
 * Extracts information from the stack trace in an optimized way.
 */
function extractErrorInfo(err) {
    if (!err.stack)
        return null;
    // Get the first relevant line from the stack.
    const stackLines = err.stack.split("\n");
    const relevantLine = stackLines.find((line) => line.includes("(") &&
        line.includes(".ts:") &&
        !line.includes("node_modules") &&
        !line.includes("Error:"));
    if (!relevantLine)
        return null;
    // Optimized regex to capture file, line and column.
    const match = relevantLine.match(/\((.*?):(\d+):(\d+)\)/);
    if (!match)
        return null;
    const [, file, line, column] = match;
    return { file, line, column, snippet: "" };
}
/**
 * Reads code snippets in an optimized way with caching.
 */
async function getCodeSnippet(filePath, lineNumber) {
    try {
        // Normalize file path
        const normalizedPath = path.resolve(filePath);
        // Check cache
        if (fileCache.has(normalizedPath)) {
            const content = fileCache.get(normalizedPath);
            const lines = content.split("\n");
            return lines[lineNumber - 1]?.trim() || "";
        }
        // Read the file only if it is a .ts/.js file from the project.
        if (!normalizedPath.includes("node_modules") &&
            (normalizedPath.endsWith(".ts") || normalizedPath.endsWith(".js"))) {
            const content = await fs.readFile(normalizedPath, "utf-8");
            // Cache only in development
            if (process.env.NODE_ENV === "development") {
                fileCache.set(normalizedPath, content);
            }
            const lines = content.split("\n");
            return lines[lineNumber - 1]?.trim() || "";
        }
    }
    catch {
        // Ignore reading errors
    }
    return "";
}
/**
 * Optimized error logging
 */
function logError(err, route, fileInfo) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
        logger.group(`✗ Error [${route}]`);
        logger.error(`${err.name}: ${err.message}`);
        if (fileInfo) {
            logger.error(`Location: ${fileInfo}`);
        }
        // Stack trace only for unexpected errors
        if (err instanceof TypeError || err instanceof ReferenceError) {
            logger.raw(err.stack?.split("\n").slice(0, 5).join("\n") || "");
        }
    }
    else {
        // Minimalist log in production
        logger.error(`[${route}] ${err.name}: ${err.message}`);
        // Detailed log for critical errors only
        if (err instanceof SyntaxError || err.message?.includes("Unexpected")) {
            logger.raw(err.stack?.split("\n")[0] || "");
        }
    }
}
/**
 * Handler error
 */
export function errorHandler(err, req, res, next) {
    // If headers have already been sent, delegate to the next handler.
    if (res.headersSent) {
        return next(err);
    }
    const route = `${req.method} ${req.originalUrl}`;
    const error = err instanceof Error ? err : new Error(String(err));
    let fileInfo = "";
    if (process.env.NODE_ENV === "development") {
        const errorInfo = extractErrorInfo(error);
        if (errorInfo) {
            fileInfo = `${path.basename(errorInfo.file)}:${errorInfo.line}:${errorInfo.column}`;
            // Load snippet asynchronously
            getCodeSnippet(errorInfo.file, parseInt(errorInfo.line))
                .then((snippet) => {
                if (snippet) {
                    logger.error(`Code: ${snippet}`);
                }
            })
                .catch(() => { }); // Ignore reading errors
        }
    }
    logError(error, route, fileInfo);
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
    const isDev = process.env.NODE_ENV === "development";
    res.status(statusCode);
    const response = {
        error: errorMessage,
        status: statusCode,
        path: req.originalUrl,
    };
    if (isDev) {
        response.message = error.message;
        if (error.stack && statusCode === 500) {
            response.stack = error.stack.split("\n").slice(0, 3);
        }
        if (fileInfo) {
            response.location = fileInfo;
        }
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Error-Type", error.name);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(response);
}
/**
 * Factory
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
        if (opts.logDetails) {
            logger.error(`[${route}] ${error.name}: ${error.message}`);
        }
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
