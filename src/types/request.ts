import * as http from 'http';
import * as net from 'net';

export interface CookieItem {
  value: string;
}

export interface RequestCookies {
  /**
   * Retrieves a cookie by its name.
   * @param name - The name of the cookie to retrieve.
   * @returns An object containing the cookie's value, or undefined if not found.
   */
  get(name: string): CookieItem | undefined;

  /**
   * Checks if a cookie with the given name exists.
   * @param name - The name of the cookie to check.
   * @returns True if the cookie exists, false otherwise.
   */
  has(name: string): boolean;

  /**
   * Returns all cookies as a key-value object.
   * @returns An object where keys are cookie names and values are cookie values.
   */
  all(): Record<string, string>;
}

/**
 * Interface representing the Fastay Request object
 * @interface Request
 * @extends http.IncomingMessage
 */
export interface Request extends http.IncomingMessage {
  // ==================== CORE EXPRESS PROPERTIES ====================

  /**
   * Contains a reference to the instance of the Express application that is using the middleware.
   * @type {Express}
   */
  app: Express;

  /**
   * The URL path on which a router instance was mounted.
   * @type {string}
   * @example
   * // app.use('/admin', router)
   * // req.baseUrl would be '/admin'
   */
  baseUrl: string;

  /**
   * Contains key-value pairs of data submitted in the request body.
   * By default, it is undefined and is populated when you use body-parsing middleware such as express.json() or express.urlencoded().
   * @type {any}
   */
  body: any;

  /**
   * When using cookie-parser middleware, this property is an object that contains cookies sent by the request.
   * If the request contains no cookies, it defaults to {}.
   * @type {RequestCookies}
   */
  cookies: RequestCookies;

  /**
   * A function that parses and returns the request body as a FormData object.
   * @returns {Promise<FormData>} A promise that resolves to a FormData object representing the parsed form data.
   */
  formData: () => Promise<FormData>;

  /**
   * Indicates whether the request is "fresh". It is the opposite of req.stale.
   * It is true if the cache-control request header doesn't have a no-cache directive
   * and any of the following are true:
   * - The if-modified-since request header is specified and last-modified request header is equal to or earlier than the modified response header.
   * - The if-none-match request header is *.
   * - The if-none-match request header, after being parsed into its directives, does not match the etag response header.
   * @type {boolean}
   */
  fresh: boolean;

  /**
   * Contains the hostname derived from the Host HTTP header.
   * @type {string}
   */
  hostname: string;

  /**
   * Contains the remote IP address of the request.
   * When the trust proxy setting does not evaluate to false, the value of this property
   * is derived from the left-most entry in the X-Forwarded-For header.
   * @type {string}
   */
  ip: string;

  /**
   * When the trust proxy setting does not evaluate to false, this property contains an array of IP addresses
   * specified in the X-Forwarded-For request header. Otherwise, it contains an empty array.
   * @type {string[]}
   */
  ips: string[];

  /**
   * Contains a string corresponding to the HTTP method of the request: GET, POST, PUT, and so on.
   * @type { 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'OPTIONS'
    | 'HEAD'
    | string}
   */
  method:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'OPTIONS'
    | 'HEAD'
    | string;

  /**
   * This property is much like req.url; however, it retains the original request URL, allowing you to rewrite req.url freely for internal routing purposes.
   * @type {string}
   * @example
   * // GET /search?q=something
   * console.log(req.originalUrl); // '/search?q=something'
   */
  originalUrl: string;

  /**
   * This property is an object containing properties mapped to the named route "parameters".
   * For example, if you have the route /user/:name, then the "name" property is available as req.params.name.
   * This object defaults to {}.
   * @type {object}
   */
  params: any;

  /**
   * Contains the path part of the request URL.
   * @type {string}
   * @example
   * // example.com/users?sort=desc
   * console.log(req.path); // '/users'
   */
  path: string;

  /**
   * Contains the request protocol string: either http or (for TLS requests) https.
   * When the trust proxy setting does not evaluate to false, this property will use the value of the X-Forwarded-Proto header field if present.
   * @type {string}
   */
  protocol: string;

  /**
   * This property is an object containing a property for each query string parameter in the route.
   * When query parser is set to disabled, it is an empty object {}.
   * @type {object}
   */
  query: any;

  /**
   * Contains the currently-matched route, a string. For example:
   * @type {string}
   * @example
   * app.get('/user/:id?', function userIdHandler(req, res) {
   *   console.log(req.route); // { path: '/user/:id?', ... }
   * });
   */
  route: any;

  /**
   * A Boolean property that is true if a TLS connection is established.
   * Equivalent to: req.protocol === 'https'
   * @type {boolean}
   */
  secure: boolean;

  /**
   * When using cookie-parser middleware, this property contains signed cookies sent by the request, unsigned and ready for use.
   * Signed cookies reside in a different object to show developer intent; otherwise, a malicious attack could be placed on req.cookie values.
   * @type {object}
   */
  signedCookies: any;

  /**
   * Indicates whether the request is "stale", and is the opposite of req.fresh.
   * For more information, see req.fresh.
   * @type {boolean}
   */
  stale: boolean;

  /**
   * Contains an array of subdomains in the domain name of the request.
   * @type {string[]}
   * @example
   * // Host: "tobi.ferrets.example.com"
   * console.log(req.subdomains); // ['ferrets', 'tobi']
   */
  subdomains: string[];

  /**
   * True if the request's X-Requested-With header field is "XMLHttpRequest", indicating that the request was issued by a client library such as jQuery.
   * @type {boolean}
   */
  xhr: boolean;

  // ==================== EXPRESS METHODS ====================

  /**
   * Checks if the specified content types are acceptable, based on the request's Accept HTTP header field.
   * The method returns the best match, or if none of the specified content types is acceptable, returns false.
   * @param {string|string[]} types - The content types to check
   * @returns {string|false} The best matching content type, or false if none are acceptable
   * @example
   * // Accept: text/html
   * req.accepts('html'); // => 'html'
   * req.accepts('text/html'); // => 'text/html'
   */
  accepts(types: string | string[]): string | false;

  /**
   * Returns the first accepted charset of the specified character sets, based on the request's Accept-Charset HTTP header field.
   * @param {string|string[]} charsets - The charsets to check
   * @returns {string|false} The best matching charset, or false if none are acceptable
   */
  acceptsCharsets(charsets: string | string[]): string | false;

  /**
   * Returns the first accepted encoding of the specified encodings, based on the request's Accept-Encoding HTTP header field.
   * @param {string|string[]} encodings - The encodings to check
   * @returns {string|false} The best matching encoding, or false if none are acceptable
   */
  acceptsEncodings(encodings: string | string[]): string | false;

  /**
   * Returns the first accepted language of the specified languages, based on the request's Accept-Language HTTP header field.
   * @param {string|string[]} langs - The languages to check
   * @returns {string|false} The best matching language, or false if none are acceptable
   */
  acceptsLanguages(langs: string | string[]): string | false;

  /**
   * Returns the specified HTTP request header field (case-insensitive match).
   * The Referrer and Referer fields are interchangeable.
   * @param {string} field - The header field name
   * @returns {string} The header value
   * @example
   * req.get('Content-Type'); // => "text/plain"
   * req.get('content-type'); // => "text/plain"
   */
  get(field: string): string;

  /**
   * Alias for req.get().
   * @param {string} name - The header field name
   * @returns {string} The header value
   */
  header(name: string): string;

  /**
   * Checks if the incoming request contains the "Content-Type" header field and if it matches the given type string.
   * @param {string|string[]} types - The content type(s) to check for
   * @returns {string|false} The matching content type, or false if no match
   * @example
   * // With Content-Type: text/html; charset=utf-8
   * req.is('html'); // => 'html'
   * req.is('text/html'); // => 'text/html'
   */
  is(types: string | string[]): string | false;

  /**
   * Parse Range header field, capping to the given size.
   * The ranges property is an array of ranges, or undefined if there are no ranges.
   * @param {number} size - The maximum size of the range
   * @returns {any} An array of ranges or undefined
   */
  range(size: number, options?: any): any;

  // ==================== NODE.JS HTTP INHERITED PROPERTIES ====================

  /**
   * @deprecated Since v13.4.0, v12.16.0 - Use request.destroyed instead
   * Is true if the request has been aborted.
   * @type {boolean}
   */
  aborted: boolean;

  /**
   * The request/response headers object. Key-value pairs of header names and values.
   * @type {http.IncomingHttpHeaders}
   */
  headers: http.IncomingHttpHeaders;

  /**
   * The raw request/response headers list exactly as they were received.
   * @type {string[]}
   */
  rawHeaders: string[];

  /**
   * The raw request/response trailer keys and values exactly as they were received.
   * Only populated at the 'end' event.
   * @type {string[]}
   */
  rawTrailers: string[];

  /**
   * The net.Socket object associated with the connection.
   * @type {net.Socket}
   */
  socket: net.Socket;

  /**
   * The request/response trailers object. Only populated at the 'end' event.
   * @type {NodeJS.Dict<string>}
   */
  trailers: NodeJS.Dict<string>;

  /**
   * The request method as a string. Read only. Example: 'GET', 'DELETE'.
   * @type {string}
   */

  /**
   * Request URL string. This contains only the URL that is present in the actual HTTP request.
   * @type {string}
   */
  url: string;

  /**
   * In case of server request, the HTTP version sent by the client.
   * @type {string}
   */
  httpVersion: string;

  /**
   * The 3-digit HTTP response status code. E.G. 404.
   * @type {number}
   */
  statusCode: number;

  /**
   * The HTTP response status message (reason phrase). E.G. OK or Internal Server Error.
   * @type {string}
   */
  statusMessage: string;

  /**
   * Calls destroy() on the socket that received the IncomingMessage.
   * @returns {this}
   */
  destroy(error?: Error): this;

  // ==================== ADDITIONAL PROPERTIES (Common Middlewares) ====================

  /**
   * File object(s) uploaded via multer middleware
   * @type {Express.Multer.File|Express.Multer.File[]}
   */
  file?: Express.Multer.File;
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };

  /**
   * Authenticated user object when using Passport.js
   * @type {any}
   */
  user?: any;

  /**
   * Session object when using express-session
   * @type {Express.Session}
   */
  session?: any;

  /**
   * Session ID when using express-session
   * @type {string}
   */
  sessionID?: string;

  /**
   * Authentication context when using multiple strategies
   * @type {any}
   */
  authInfo?: any;

  /**
   * Nonce for Content Security Policy when using helmet
   * @type {string}
   */
  cspNonce?: string;
}

// ==================== SUPPORTING INTERFACES ====================

/**
 * Interface for Express application
 */
interface Express {
  /**
   * Settings for the application
   */
  settings: any;

  /**
   * Middleware stack
   */
  _router: any;

  /**
   * Event emitter methods
   */
  on: (event: string, listener: Function) => Express;
  emit: (event: string, ...args: any[]) => boolean;
}

/**
 * Interface for Multer file object
 */
declare namespace Express {
  namespace Multer {
    interface File {
      /** Field name specified in the form */
      fieldname: string;
      /** Name of the file on the user's computer */
      originalname: string;
      /** Encoding type of the file */
      encoding: string;
      /** Mime type of the file */
      mimetype: string;
      /** Size of the file in bytes */
      size: number;
      /** The folder to which the file has been saved */
      destination: string;
      /** The name of the file within the destination */
      filename: string;
      /** Location of the uploaded file */
      path: string;
      /** A Buffer of the entire file */
      buffer: Buffer;
    }
  }
}

/**
 * Interface for Express Session
 */
declare namespace Express {
  interface Session {
    id: string;
    cookie: any;
    [key: string]: any;
  }
}

export type { Response } from 'express';
