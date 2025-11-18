# 🚀 Fastay.js

Fastay é um framework moderno para backend construído sobre o **Express.js**, projetado para criar APIs de forma rápida, previsível e amigável para desenvolvedores.

Ele é **TypeScript-first**, baseado em arquivos, auto-descobre rotas e middlewares, e oferece uma experiência limpa de desenvolvimento.

---

## Por que Fastay?

Fastay foi criado para resolver problemas comuns no desenvolvimento backend com Node.js:

- **Descoberta automática de rotas** — basta criar um `route.ts` dentro de `src/api`.
- **Gerenciamento de middlewares** — carrega middlewares Fastay ou Express automaticamente.
- **Suporte total ao TypeScript** — requests, responses e middlewares totalmente tipados.
- **Menos boilerplate** — não é necessário registrar manualmente as rotas.
- **Tratamento de erros** — mensagens claras de erro em runtime e boot no modo dev e production.
- **Extensível** — fácil de adicionar autenticação, logging ou qualquer biblioteca do Express.

O maior ponto forte é **rapidez e simplicidade**, ideal para projetos de backend de pequeno a médio porte ou protótipos.

---

## 🚀 Começando

### 1. Criar um novo projeto

```bash
npx fastay create-app minha-app
```

Exemplo do CLI:
```bash
🚀 Fastay — Create a modern backend project
✔ Usar TypeScript? › Sim
✔ Escolha um ORM: › Nenhum
````
2. Entrar no projeto
```bash
cd minha-app
```
3. Iniciar servidor em desenvolvimento
```bash
npm run dev 
```
4. Modo watch com reload automático
```bash
npm run dev:watch 
```


---

Estrutura do Projeto
```bash
minha-app/
│
├── dist/                     # Código compilado para produção
│
├── src/
│   ├── api/                  # Rotas da API (auto-carregadas)
│   │   ├── hello/
│   │   │   └── route.ts
│   │   ├── users/
│   │   │   └── route.ts
│   │   └── products/
│   │       └── route.ts
│   │
│   ├── middlewares/          # Middlewares Fastay
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── middleware.ts
│   │
│   ├── services/             # Lógica de negócio (opcional)
│   │   ├── user-service.ts
│   │   └── product-service.ts
│   │
│   ├── utils/                # Funções auxiliares
│   │   └── formatters.ts
│   │
│   └── index.ts              # Entry point da app
│
├── fastay.config.json        # Configuração global do framework
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

**Explicação das pastas principais:**

`src/api` — Cada pasta representa um grupo de rotas. Todo route.ts dentro é registrado automaticamente.

`src/middlewares` — Middlewares personalizados, carregados automaticamente ou usados via createMiddleware.

`src/services` — Mantém a lógica de negócio separada das rotas (Opcional porém recomendado).

`src/utils` — Helpers genéricos.

`src/index.ts` — Bootstrap principal da aplicação com createApp.

`dist/` — Código compilado para produção.

`fastay.config.json` — Configuração do build, compilador e rotas.



---

⚡ `src/index.ts`
```bash
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

---

**Opções do `createApp`**

createApp recebe um único objeto para configurar totalmente a aplicação Fastay.

```bash
  apiDir?: string;               // Diretório contendo as rotas da API
(default: 'src/api')
  baseRoute?: string;            // Caminho base para todas as rotas (default: '/api')
  port?: number;                 // Porta do servidor (default: 5000)

  middlewares?: MiddlewareMap;   // Mapa de middlewares Fastay
  expressOptions: {
      middlewares?: express.RequestHandler[];           // Middlewares globais do Express
      jsonOptions?: Parameters<typeof express.json>[0]; // Opções para express.json()
      urlencodedOptions?: Parameters<typeof express.urlencoded>[0]; // Opções para express.urlencoded()
      errorHandler?: express.ErrorRequestHandler;       // Handler de erro customizado
      static?: { path: string; options?: ServeStaticOptions }; // Servir arquivos estáticos
      views?: { engine: string; dir: string };          // Configuração de template engine
      trustProxy?: boolean;                             // Considerar headers de proxy reverso
      locals?: Record<string, any>;                     // Variáveis globais para res.locals
}
```

Exemplos:

**Aplicar middlewares globais**

```bash
expressOptions: {
  middlewares: [cors(), helmet()],
}
```

**Configurar body parsers**

```bash
expressOptions: {
  jsonOptions: { limit: '10mb' },
  urlencodedOptions: { extended: true    },
}
```

**Servir arquivos estáticos**

```bash
expressOptions: {
  static: { path: 'public', options: { maxAge: 3600000 } }
}
```

**Configurar views e locals**

```bash
expressOptions: {
  views: { engine: 'pug', dir: 'views' },
  locals: { siteName: 'Fastay' }
}
```

**Handler de erro customizado**

```bash
expressOptions: {
  errorHandler: (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Algo deu errado!' });
  }
}
```


---

`fastay.config.json`

```bash
{
  "entry": "src/index.ts",
  "outDir": "dist",
  "routesDir": "src/routes",
  "compiler": {
    "minify": false,
    "target": "es2020"
  }
}
```

`entry` — Arquivo principal da aplicação.

`outDir` — Diretório de saída do código compilado.

`routesDir` — Diretório opcional para rotas (default src/api).

`compiler` — Opções para compilação TypeScript/ESBuild.



---

**Rotas da API**

Roteamento baseado em arquivos com sintaxe limpa:

```bash
import { Request } from '@syntay/fastay';

export async function GET() {
  return "Hello World";
}

export async function POST(req: Request) {
  return { message: 'Hello World' };
}
```

Cada método HTTP é exportado como função.

Registrado automaticamente pelo Fastay.

Tipado e compatível com TypeScript.

Suporta middlewares Express.

**Por que é melhor que Express puro:**

Sem boilerplate: não precisa chamar `app.get(...)` ou `app.post(...)` manualmente.

Separação limpa dos arquivos de rota: cada rota fica em um arquivo route.ts dentro de api ou outro diretório.

Auto-descoberta de rotas: Fastay detecta automaticamente os arquivos de rota e registra.

Fácil manutenção de projetos grandes: sem necessidade de registrar manualmente centenas de rotas, mantendo organização clara.


1️⃣ Express.js

```bash
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

// Middleware
app.use('/api/auth', (req, res, next) => {
  console.log('Auth middleware');
  next();
});

app.listen(5000, () => console.log('Server running on port 5000'));
```

Pontos negativos do Express puro:

Muitas vezes precisa registrar manualmente cada rota.

Middleware e rotas misturados no mesmo arquivo.

Escalabilidade de grandes projetos fica complicada.



---

**1. NestJS**

```bash
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

**Características do NestJS:**

Baseado em decorators e classes.

Rotas e controllers organizados em módulos.

Tipo-safe e integrado ao TypeScript.

Exige aprendizado de decorators, módulos e injeção de dependências.



---

**2. Fastay.js**

```bash
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

**Características do Fastay:**

Baseado em arquivos, cada método HTTP é exportado.

Rotas auto-descobertas — não precisa registrar manualmente.

Middleware separado ou aplicado via createMiddleware.

Tipo-safe, clean e simples.

---



> No **Fastay** Para definir uma rota, crie um arquivo route.ts dentro do diretório api ou outro definido em createApp. Cada diretório dentro de api com route.ts é transformado em rota e detectado automaticamente.




---

**Middlewares**

Fastay permite middlewares auto-carregados e via createMiddleware:

```bash
import { Request, Response, Next } from '@syntay/fastay';

export async function auth(req: Request, _res: Response, next: Next) {
  // Lógica de autenticação
  next();
}
```

E crie um arquivo middleware.ts dentro da pasta `src/middleware` e use a função createMiddleware para configurar o seu middleware:

```bash
import { createMiddleware } from '@syntay/fastay';
import { auth } from './auth';
import { logger } from './logger';

export const middleware = createMiddleware({
  '/auth': [auth],
  '/admin': [logger],
});
```

---

**Fluxo de Request**

*Cliente → Rota Fastay → Middleware → Handler da Rota → Service → Response*


---

**Conclusão**

Fastay.js é um framework backend leve e TypeScript-first que:

Auto-carrega rotas e middlewares.

Fornece uma API limpa e previsível.

Compatível com bibliotecas Express.

Reduz boilerplate e aumenta a manutenção.


Ideal para desenvolvedores que querem estrutura sem complicação.

---

## 🔹 Contribuição

Contribuições são bem-vindas!

1. Faça um fork do projeto.
2. Crie uma branch (`git checkout -b minha-feature`).
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`).
4. Push para a branch (`git push origin minha-feature`).
5. Abra um Pull Request.

---

## 🔹 Licença

MIT © Syntay Team

---


