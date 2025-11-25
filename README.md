# Fastay Documentation
<p align="center">
  <img src="./fastay.png" width="200" />
</p>
Fastay is a modern backend framework built on **Express.js**, designed to create APIs quickly, predictably, and in a developer-friendly way.

It is **TypeScript-first**, file-based, auto-discovers routes and middlewares, and offers a clean development experience.

## Quick Navigation

- [Fastay Philosophy](#fastay-philosophy)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Main Configuration](#main-configuration)
- [Routing System](#routing-system)
- [Middleware System](#middleware-system)
- [Comparison with Other Frameworks](#comparison-with-other-frameworks)

## Fastay Philosophy

### The Art of Intentional Simplicity

Fastay is born from an obsession with simplicity and speed, representing a minimalist approach to modern backend development. Our philosophy is based on principles that value efficiency without sacrificing power.

### Fundamental Principles

#### 1. Less is More
- We eliminate unnecessary layers that don't add real value
- Focus on what's essential to build robust APIs
- Zero architectural bureaucracy that drains time and energy

#### 2. Freedom with Structure
- We provide a solid foundation without imposing limitations
- You maintain full control over how your project evolves
- Flexibility to scale according to your specific needs

#### 3. Fluid Development
- Intuitive and frictionless development experience
- Minimal configuration, maximum results
- Focus on business logic, not complex configurations

### Who Fastay Was Created For

**Ideal for:**
- Developers who value simplicity and efficiency
- Teams that need development speed
- Projects requiring long-term maintainability
- Those who prefer explicit code over complex magic

**Perfect Use Cases:**
- Small to medium-sized RESTful APIs
- Quick prototypes and MVPs
- Lightweight microservices
- Projects where development speed is crucial

### The Perfect Balance

Fastay finds the sweet spot between:

**Express.js (too minimalist) ← FASTAY → NestJS (too structured)**

**Developer freedom ← FASTAY → Smart conventions**

**Total flexibility ← FASTAY → Maximum productivity**

### Technical Manifesto

"We believe that frameworks should facilitate and not complicate. That complexity should be added by choice, not imposed by default. That developers deserve tools that respect their time and intelligence."

Fastay is not just a framework - it's a statement of principles: that it's possible to have power without complexity, structure without rigidity, and conventions without dictatorship.

[⬆ Back to Top](#fastay-documentation)

## Quick Start

### 1. Create a New Project

```bash
npx fastay create-app my-app
```

Example CLI interaction:

```
Fastay — Create a modern backend project
✔ Use TypeScript? › Yes
✔ Choose an ORM: › None
```

### Navigate to the Project

```bash
cd my-app
```

### Start Development Server

```bash
npm run dev
```

### Watch Mode with Hot Reload

```bash
npm run dev:watch
```

[⬆ Back to Top](#fastay-documentation)

## Project Structure

```
my-app/
│
├── dist/           # Compiled production code
├── src/
│   ├── api/        # API routes (auto-loaded)
│   │   ├── hello/
│   │   │   └── route.ts
│   │   ├── users/
│   │   │   └── route.ts
│   │   └── products/
│   │       └── route.ts
│   │
│   ├── middlewares/ # Fastay middlewares
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── middleware.ts
│   │
│   ├── services/   # Business logic (recommended)
│   │   ├── user-service.ts
│   │   └── product-service.ts
│   │
│   ├── utils/      # Helper functions
│   │   └── formatters.ts
│   │
│   └── index.ts    # Application entry point
│
├── fastay.config.json # Global framework configuration
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

### Main Directories Description

- **src/api** - Each folder represents a route group. Every route.ts is automatically registered
- **src/middlewares** - Custom middlewares, automatically loaded
- **src/services** - Keeps business logic separate from routes
- **src/utils** - Helpers and utility functions
- **src/index.ts** - Main application bootstrap
- **dist/** - Compiled production code
- **fastay.config.json** - Build and compiler configuration

[⬆ Back to Top](#fastay-documentation)

## Main Configuration

### src/index.ts File

```typescript
import { createApp } from '@syntay/fastay';

const port = 5555;

void (async () => {
  await createApp({
    apiDir: './src/api',
    baseRoute: '/api',
    port: port
  });
})();
```

### createApp Configuration

The createApp method is the heart of Fastay, responsible for initializing and configuring the entire application. It accepts a flexible configuration object that allows customization from routes to global middlewares.

### Configuration Parameters

#### Basic Parameters

```typescript
void (async () => {
  await createApp({
    // Server port (optional) - default: 5000
    port: 5000,
    // Routes directory (optional) - default: './src/api'
    apiDir: './src/api',
    // Base route (optional) - default: '/api'
    baseRoute: '/api',
    // Fastay middlewares (optional)
    middlewares: {
      '/api/hello': [home]
    }
  });
})();
```

#### Complete Practical Example

```typescript
import { createApp } from '@syntay/fastay';
import { home } from './middlewares/home';

void (async () => {
  await createApp({
    port: 5000,
    apiDir: './src/api',
    baseRoute: '/api',
    middlewares: {
      '/api/hello': [home] // Middleware applied only to /api/hello route
    },
    expressOptions: {
      // Express configurations...
    }
  });
})();
```

### Express Configurations (expressOptions)

Since Fastay is built on Express, you can leverage all Express functionalities through the expressOptions object.

#### Global Middlewares

```typescript
expressOptions: {
  middlewares: [
    cors(),
    helmet(),
    (req, res, next) => {
      res.setHeader('X-Powered-By', 'Fastay.js');
      console.log("Global middleware executed");
      next();
    },
  ],
}
```

#### Body Parsers Configuration

```typescript
expressOptions: {
  jsonOptions: {
    limit: '10mb', // Size limit for JSON
    strict: true   // Only objects and arrays
  },
  urlencodedOptions: {
    extended: true, // Allows complex objects
    limit: '10mb'   // Size limit
  },
}
```

#### Serve Static Files

```typescript
expressOptions: {
  static: {
    path: "public", // Static files directory
    options: {
      maxAge: "1d", // 1 day cache
      etag: true    // Enable ETag
    }
  },
}
```

#### Template Engine Configuration

```typescript
expressOptions: {
  views: {
    engine: "pug", // Template engine (Pug, EJS, etc.)
    dir: "views"   // Views directory
  },
}
```

#### Global Local Variables

```typescript
expressOptions: {
  locals: {
    appName: "My Fastay App",
    version: "1.0.0",
    author: "Your Team"
  },
}
```

#### Reverse Proxy Configuration

```typescript
expressOptions: {
  trustProxy: true, // Important for Nginx, Cloudflare, etc.
}
```

#### Custom Error Handler

```typescript
expressOptions: {
  errorHandler: (err, req, res, next) => {
    console.error('Error captured:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({
        error: err.message,
        code: err.code
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  },
}
```

### CORS Configuration

Fastay offers a simplified and powerful CORS configuration:

#### Complete CORS Example

```typescript
expressOptions: {
  enableCors: {
    // Allow requests from any origin (be careful in production)
    allowAnyOrigin: true,
    // Specific URLs that can send cookies
    cookieOrigins: [
      'https://mysite.com',
      'https://app.mysite.com',
      'http://localhost:3000'
    ],
    // Enable cross-origin cookie sending
    credentials: true,
    // Allowed HTTP methods
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD',
    // Allowed request headers
    headers: 'Content-Type, Authorization, X-Requested-With, X-Custom-Header',
    // Headers exposed to client
    exposedHeaders: 'X-Custom-Header, X-Total-Count',
    // Preflight request cache time (24 hours)
    maxAge: 86400,
  },
}
```

#### Secure Production Configuration

```typescript
expressOptions: {
  enableCors: {
    allowAnyOrigin: false,
    cookieOrigins: [
      'https://mydomain.com',
      'https://api.mydomain.com'
    ],
    credentials: true,
    methods: 'GET,POST,PUT,DELETE',
    headers: 'Content-Type, Authorization',
    maxAge: 3600, // 1 hour
  },
}
```

#### Development Configuration

```typescript
expressOptions: {
  enableCors: {
    allowAnyOrigin: true, // Allow any origin in development
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    headers: '*', // Allow all headers
    maxAge: 86400,
  },
}
```

### Complete Configuration Example

```typescript
import { createApp } from '@syntay/fastay';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middlewares/auth';
import { loggerMiddleware } from './middlewares/logger';

void (async () => {
  await createApp({
    // Basic configurations
    port: process.env.PORT || 5000,
    apiDir: './src/api',
    baseRoute: '/api/v1',

    // Fastay middlewares
    middlewares: {
      '/api/v1/admin': [authMiddleware, loggerMiddleware],
      '/api/v1/users': [authMiddleware],
    },

    // Express configurations
    expressOptions: {
      // Global middlewares
      middlewares: [
        helmet(),
        (req, res, next) => {
          console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
          next();
        }
      ],

      // CORS configuration
      enableCors: {
        allowAnyOrigin: process.env.NODE_ENV === 'development',
        cookieOrigins: [
          'https://mysite.com',
          'https://app.mysite.com'
        ],
        credentials: true,
        methods: 'GET,POST,PUT,DELETE,OPTIONS',
        headers: 'Content-Type, Authorization, X-API-Key',
        maxAge: 86400,
      },

      // Body parsers
      jsonOptions: {
        limit: '10mb'
      },
      urlencodedOptions: {
        extended: true
      },

      // Static files
      static: {
        path: "public",
        options: {
          maxAge: 3600000
        }
      },

      // Template engine
      views: {
        engine: "ejs",
        dir: "src/views"
      },

      // Local variables
      locals: {
        appName: "My API",
        environment: process.env.NODE_ENV || 'development'
      },

      // Reverse proxy
      trustProxy: true,

      // Custom error handler
      errorHandler: (err, req, res, next) => {
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(err.status || 500).json({
          error: isProduction ? 'Something went wrong' : err.message,
          ...(!isProduction && { stack: err.stack })
        });
      }
    }
  });
})();
```

### Important Tips

#### Middleware Order

```typescript
// Order matters! Following the flow:
expressOptions: {
  middlewares: [
    helmet(),           // 1. Security first
    cors(),            // 2. CORS before body parsers
    express.json(),    // 3. Body parsers
    express.urlencoded(),
    logger,            // 4. Logging
    auth               // 5. Authentication
  ],
}
```

#### Environment-based Configuration

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

await createApp({
  port: process.env.PORT || 5000,
  expressOptions: {
    enableCors: {
      allowAnyOrigin: isDevelopment, // Only allowed in development
      credentials: !isDevelopment,   // Cookies only in production
    },
    trustProxy: !isDevelopment,      // Proxy only in production
  }
});
```

#### Specific vs Global Middlewares

```typescript
await createApp({
  // Specific route middlewares (Fastay)
  middlewares: {
    '/api/admin': [adminAuth, adminLogger], // Only for /api/admin
    '/api/public': [rateLimit],             // Only for /api/public
  },
  expressOptions: {
    // Global middlewares (Express)
    middlewares: [
      cors(),   // For all routes
      helmet(), // For all routes
    ],
  }
});
```

### Security Considerations

- **CORS in Production**: Never use `allowAnyOrigin: true` in production
- **Body Parser Limits**: Set reasonable limits to prevent attacks
- **Helmet**: Always include Helmet for basic security
- **Trust Proxy**: Configure correctly to avoid IP issues

[⬆ Back to Top](#fastay-documentation)

## Routing System

Fastay uses a file-based routing system that combines simplicity with power. Routes are self-discoverable and intuitively organized.

### API Folder Structure

In Fastay.js, API routes are placed inside the directory defined in apiDir (default: './src/api'). Each subfolder represents an API endpoint.

```
src/
├── api/
│   ├── hello/
│   │   └── route.ts      # → /api/hello
│   ├── users/
│   │   └── route.ts      # → /api/users
│   └── products/
│       └── route.ts      # → /api/products
```

### Basic Route Definition

#### Clean and Intuitive Syntax

```typescript
import { Request } from '@syntay/fastay';

// GET /api/hello
export async function GET() {
  return "Hello World";
}

// POST /api/hello
export async function POST(req: Request) {
  return { message: 'Hello World' };
}
```

**Routing System Characteristics:**
- ✅ Each HTTP method is exported as a function
- ✅ Automatically registered by Fastay
- ✅ Fully typed and TypeScript compatible
- ✅ Supports native Express middlewares

### Supported HTTP Methods

You can handle all main HTTP methods in the same route file:

```typescript
// api/users/route.ts
import { Request } from '@syntay/fastay';

// GET /api/users
export async function GET() {
  const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Mary' }
  ];
  return users;
}

// POST /api/users
export async function POST(req: Request) {
  const userData = await req.body;
  // Save user to database
  return { message: 'User created successfully', user: userData };
}

// PUT /api/users
export async function PUT(req: Request) {
  const userData = await req.body;
  // Update user
  return { message: 'User updated', user: userData };
}

// DELETE /api/users
export async function DELETE(req: Request) {
  // Delete user
  return { message: 'User deleted' };
}

// PATCH /api/users
export async function PATCH(req: Request) {
  const updates = await req.body;
  // Partial update
  return { message: 'User partially updated', updates };
}
```

### Advanced Response System

Fastay offers a flexible system for building HTTP responses with different content types.

#### JSON Response (Default)

```typescript
export async function GET() {
  return {
    success: true,
    data: { id: 1, name: 'John' }
  };
}
```

#### STRING Response

```typescript
export async function GET() {
  return 'John Doe'
}
```

#### NUMBER Response

```typescript
export async function GET() {
  return 1975
}
```

#### Response with Custom Status Code

```typescript
export async function POST(req: Request) {
  const data = await req.body;
  return {
    status: 201, // Created
    body: {
      message: 'Resource created successfully',
      data
    }
  };
}
```

#### Response with Cookies

```typescript
export async function POST(req: Request) {
  const token = 'jwt_token_here';
  const cookies = {
    user_token: {
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'yoursite.com' : 'localhost',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    },
  };

  return {
    cookies,
    status: 200,
    body: {
      message: "User registered successfully"
    }
  };
}
```

#### Response with Custom Headers

```typescript
export async function GET() {
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'custom-value',
      'Cache-Control': 'no-cache'
    },
    body: {
      data: 'content'
    }
  };
}
```

#### Redirection

```typescript
export async function GET() {
  // Temporary redirection (302)
  return {
    redirect: '/new-route',
    status: 302
  };
}

export async function POST() {
  // Permanent redirection (301)
  return {
    redirect: 'https://example.com',
    status: 301
  };
}
```

#### File Download

```typescript
export async function GET() {
  return {
    file: {
      path: '/path/to/report.pdf',
      downloadName: 'monthly-report.pdf'
    }
  };
}
```

#### Data Stream

```typescript
import fs from 'fs';

export async function GET() {
  return {
    stream: fs.createReadStream('/videos/movie.mp4'),
    headers: {
      'Content-Type': 'video/mp4'
    }
  };
}
```

#### Raw Response (Buffer/String)

```typescript
export async function GET() {
  return {
    raw: Buffer.from('Hello World in plain text'),
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}
```

### Dynamic Routes

#### URL Parameters

```typescript
// api/users/[id]/route.ts
import { Request } from '@syntay/fastay';

export async function GET(req: Request) {
  const { id } = req.params;
  // Find user by ID
  return {
    message: `User details with ID: ${id}`,
    user: { id, name: `User ${id}` }
  };
}
```

**Access:** `GET /api/users/123` → `{ id: '123' }`

#### Query Parameters

```typescript
// api/users/route.ts
import { Request } from '@syntay/fastay';

interface UserQuery {
  name?: string;
  email?: string;
  page?: number;
}

export async function GET(req: Request) {
  const query: UserQuery = req.query;
  const { name, email, page = 1 } = query;

  // Find users with filters
  return {
    users: [
      { id: 1, name, email },
      { id: 2, name: 'Mary', email: 'mary@email.com' }
    ],
    pagination: {
      page,
      totalPages: 5
    }
  };
}
```

**Access:** `GET /api/users?name=John&email=john@email.com&page=2`

#### Combining Parameters and Query

```typescript
// api/users/[id]/posts/route.ts
import { Request } from '@syntay/fastay';

export async function GET(req: Request) {
  const { id } = req.params; // User ID
  const { category, limit = 10 } = req.query; // Filters

  return {
    userId: id,
    posts: [
      { id: 1, title: 'Post 1', category },
      { id: 2, title: 'Post 2', category }
    ],
    filters: { category, limit }
  };
}
```

### Working with FormData

#### File Uploads and Forms

```typescript
// api/upload/route.ts
import { Request } from '@syntay/fastay';

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const image = formData.get('image') as File;

  // Process image upload
  console.log('File received:', image.name, image.size);

  return {
    message: 'Upload completed successfully',
    data: { id, name, fileName: image.name }
  };
}
```

### Working with Cookies

#### Reading Cookies

```typescript
export async function GET(req: Request) {
  // Check if cookie exists
  if (req.cookies.has('user_token')) {
    // Get cookie value
    const token = req.cookies.get('user_token');
    return {
      authenticated: true,
      user: { token }
    };
  }

  return { authenticated: false };
}
```

#### Available Cookie Methods

```typescript
export async function GET(req: Request) {
  // Check existence
  const hasToken = req.cookies.has('user_token');
  // Get value
  const token = req.cookies.get('user_token');
  // Get all cookies
  const allCookies = req.cookies.all();

  return {
    cookieInfo: {
      hasToken,
      token,
      allCookies
    }
  };
}
```

### Error Handling

#### Try/Catch Block

```typescript
export async function GET() {
  try {
    const data = await fetchExternalData();
    return { data };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: 'Internal server error',
        message: error.message
      }
    };
  }
}
```

#### Errors with Specific Status Codes

```typescript
export async function GET(req: Request) {
  const { id } = req.params;
  const user = await findUserById(id);

  if (!user) {
    return {
      status: 404,
      body: { error: 'User not found' }
    };
  }

  if (!user.active) {
    return {
      status: 403,
      body: { error: 'User inactive' }
    };
  }

  return { user };
}
```

#### Data Validation

```typescript
export async function POST(req: Request) {
  const userData = await req.body;

  // Simple validation
  if (!userData.name || !userData.email) {
    return {
      status: 400,
      body: {
        error: 'Invalid data',
        required: ['name', 'email']
      }
    };
  }

  // Process valid data
  return {
    status: 201,
    body: {
      message: 'User created',
      user: userData
    }
  };
}
```

### Complete Practical Examples

#### Complete Blog API

```typescript
// api/posts/route.ts
import { Request } from '@syntay/fastay';

// GET /api/posts - List posts with pagination
export async function GET(req: Request) {
  const { page = 1, limit = 10, category } = req.query;
  const posts = await findPosts({
    page: parseInt(page),
    limit: parseInt(limit),
    category
  });

  return {
    posts,
    pagination: {
      page,
      limit,
      total: posts.length
    }
  };
}

// POST /api/posts - Create new post
export async function POST(req: Request) {
  const postData = await req.body;

  // Validation
  if (!postData.title || !postData.content) {
    return {
      status: 400,
      body: { error: 'Title and content are required' }
    };
  }

  const newPost = await createPost(postData);
  return {
    status: 201,
    body: {
      message: 'Post created successfully',
      post: newPost
    }
  };
}
```

#### Authentication API

```typescript
// api/auth/login/route.ts
import { Request } from '@syntay/fastay';

export async function POST(req: Request) {
  const { email, password } = await req.body;

  // Verify credentials
  const user = await verifyCredentials(email, password);
  if (!user) {
    return {
      status: 401,
      body: { error: 'Invalid credentials' }
    };
  }

  // Generate token
  const token = generateJWTToken(user);

  const cookies = {
    auth_token: {
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      }
    }
  };

  return {
    cookies,
    body: {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name
      }
    }
  };
}
```

### Best Practices Tips

#### Route Organization

```
src/api/
├── users/
│   ├── route.ts          # Basic operations
│   ├── [id]/
│   │   └── route.ts      # Operations by ID
│   └── auth/
│       └── route.ts      # Authentication
├── posts/
│   ├── route.ts
│   └── [id]/
│       └── comments/
│           └── route.ts  # Post comments
```

#### Consistent Validation

```typescript
// utils/validation.ts
export function validateUser(data: any) {
  const errors = [];
  if (!data.name) errors.push('Name is required');
  if (!data.email) errors.push('Email is required');
  if (!validateEmail(data.email)) errors.push('Invalid email');
  return errors;
}

// api/users/route.ts
export async function POST(req: Request) {
  const userData = await req.body;
  const errors = validateUser(userData);

  if (errors.length > 0) {
    return {
      status: 400,
      body: { errors: errors }
    };
  }

  // Process valid data...
}
```

#### Standardized Responses

```typescript
// utils/response.ts
export function success(data: any, message = 'Success') {
  return {
    status: 'success',
    message,
    data
  };
}

export function error(message: string, code = 'ERROR') {
  return {
    status: 'error',
    message,
    code
  };
}

// Usage in routes
export async function GET() {
  try {
    const users = await findUsers();
    return success(users, 'Users listed successfully');
  } catch (err) {
    return error('Error fetching users');
  }
}
```

[⬆ Back to Top](#fastay-documentation)

## Middleware System

### Auto-loaded Middlewares

```typescript
import { Request, Response, Next } from '@syntay/fastay';

export async function auth(req: Request, _res: Response, next: Next) {
  // Authentication logic
  next();
}
```

### Middleware Configuration in Fastay.js

In Fastay.js, middlewares are used to intercept and process requests before they reach the defined routes. They work as "intermediate functions" that can perform actions like authentication, data validation, logging, among others, and are executed in the defined sequence until the request reaches the final route.

#### Execution Flow

```
Request → Middleware 1 → Middleware 2 → ... → Final Route → Response
```

### Basic Structure

#### Recommended File Structure

```
src/
├── middlewares/
│   ├── auth.ts          # Authentication middleware
│   ├── validation.ts    # Validation middleware
│   ├── logger.ts        # Logging middleware
│   └── middleware.ts    # Main configuration
```

### Configuration

#### createMiddleware Method

The createMiddleware method allows associating middlewares with specific routes:

```typescript
export const middleware = createMiddleware({
  // Syntax: [route]: [array-of-middlewares]
  '/api/specific-route': [middleware1, middleware2],
  // Multiple routes
  '/api/users': [auth],
  '/api/posts': [auth, logger],
  '/api/public': [logger],
});
```

### Defining Middlewares in Fastay.js

Middlewares in Fastay.js are defined by convention in a directory called middlewares. Inside this directory, you create a middleware.ts (or middleware.js) file, where you can associate each middleware with a specific route.

#### middleware.ts File Example

The middleware.ts file is responsible for loading and applying middlewares to specific routes.

```typescript
// src/middlewares/middleware.ts
import { createMiddleware } from '@syntay/fastay';
import { user } from './user';
import { home } from './home';

// Here, you define the routes and middlewares that will be executed before each route
export const middleware = createMiddleware({
  '/api/users': [user],  // User middleware will be applied to /api/users route
  '/api/hello': [home],  // Home middleware will be applied to /api/hello route
});
```

- **Route (/api/users)**: The specific route where the middleware will be executed. This allows you to associate middlewares with specific routes.
- **Array of Middlewares ([user])**: An array of middlewares that will be executed before the route execution. There can be multiple middlewares in an array, and they will be executed in the order they are defined.

### Middleware Structure

A middleware in Fastay.js is basically an asynchronous function that receives three parameters: request, response, and next. The next() is used to indicate that the middleware has finished its execution and that the request can continue to the next middleware or to the target route.

#### user.ts Middleware Example

```typescript
// src/middlewares/user.ts
import { Next, Request, Response } from '@syntay/fastay';

export async function user(request: Request, _response: Response, next: Next) {
  console.log('User middleware executed');
  // Middleware logic, such as authentication or validation
  // Call the next middleware or route
  next();
}
```

- **request**: The request object containing the request data.
- **response**: The response object, which allows manipulating the response before sending it to the client.
- **next()**: Calls the next function in the middleware chain or the target route. If you don't call next(), the request will be "stuck" and won't proceed to the next middleware or route.

### Middleware Behavior

- **Sequential Execution**: Middlewares are executed sequentially. If you have multiple middlewares for the same route, they will be called in the order they are defined in the array.
- **Execution Interruption**: If any middleware doesn't call next() or returns a response, the execution will be interrupted and the request won't proceed to the next middleware or route.

#### Execution Order

```typescript
export const middleware = createMiddleware({
  '/api/protected': [
    middleware1, // Executed first
    middleware2, // Executed second
    middleware3  // Executed third
  ],
});
```

#### Validation Middleware Example

```typescript
// src/middlewares/validate.ts
import { Next, Request, Response } from '@syntay/fastay';

export async function validate(request: Request, response: Response, next: Next) {
  if (!request.headers['authorization']) {
    response.status(400).json({ error: 'Missing authorization header' });
  } else {
    next(); // If validation passes, call next middleware or route
  }
}
```

### Caution with Heavy Processing

It's important to remember that middlewares should not be used for heavy tasks, such as processing large file uploads, database interactions, or complex calculations. The purpose of middlewares is to be lightweight and fast, with tasks like authentication, validation, or logging, and not for high computational cost operations.

### Complete Middleware Example in Fastay.js

#### Directory Structure

```
src/
  middlewares/
    home.ts
    user.ts
    middleware.ts
```

#### middleware.ts

```typescript
import { createMiddleware } from '@syntay/fastay';
import { user } from './user';
import { home } from './home';

export const middleware = createMiddleware({
  '/api/users': [user],  // User middleware for /api/users
  '/api/hello': [home],  // Home middleware for /api/hello
});
```

#### user.ts (Authentication Middleware)

```typescript
import { Next, Request, Response } from '@syntay/fastay';

export async function user(request: Request, _response: Response, next: Next) {
  console.log('User middleware executed');
  
  // Simulated authentication token validation
  if (!request.headers['authorization']) {
    return _response.status(401).json({ error: 'Unauthorized' });
  }
  
  // If everything is correct, call next middleware or route
  next();
}
```

#### home.ts (Logging Middleware)

```typescript
import { Next, Request, Response } from '@syntay/fastay';

export async function home(request: Request, _response: Response, next: Next) {
  console.log('Home middleware executed');
  // Add logging logic here
  // Call next middleware or route
  next();
}
```

This example provides a complete explanation of how to configure and use middlewares in Fastay.js, with ready-to-copy code examples to apply in your project.

[⬆ Back to Top](#fastay-documentation)

## Comparison with Other Frameworks

### Pure Express.js

```typescript
import express from 'express';
const app = express();

// GET
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

// POST
app.post('/api/hello', (req, res) => {
  res.json({ message: 'Hello POST World' });
});

app.listen(5000, () => console.log('Server running on port 5000'));
```

**Disadvantages of pure Express:**
- ❌ Manual registration of each route
- ❌ Middleware and routes mixed together
- ❌ Complicated scalability in large projects

### NestJS

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('api/hello')
export class HelloController {
  @Get()
  getHello() {
    return { message: 'Hello World' };
  }

  @Post()
  postHello(@Body() body: any) {
    return { message: 'Hello POST World', body };
  }
}
```

**NestJS Characteristics:**
- ✅ Based on decorators and classes
- ✅ Module organization
- ✅ Type-safe and TypeScript
- ⚠️ Learning curve with decorators and DI

### Fastay.js

```typescript
import { Request } from '@syntay/fastay';

// GET /api/hello
export async function GET() {
  return { message: 'Hello World' };
}

// POST /api/hello
export async function POST(req: Request) {
  return { message: 'Hello POST World' };
}
```

**Fastay Advantages:**
- ✅ File-based - each HTTP method is exported
- ✅ Auto-discovered routes - no manual registration
- ✅ Separate and organized middleware
- ✅ Type-safe, clean and simple

### Request Flow

```
Client → Fastay Route → Middleware → Route Handler → Service → Response
```

## Contribution

Contributions are welcome! Follow the steps:

1. Fork the project
2. Create a branch (`git checkout -b my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin my-feature`)
5. Open a Pull Request

## License

MIT © Syntay Team

[⬆ Back to Top](#fastay-documentation)
