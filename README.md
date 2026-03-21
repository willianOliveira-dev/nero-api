<div align="center">
  <img src="https://raw.githubusercontent.com/willianOliveira-dev/nero-api/main/public/static/logo.png" 
       alt="Nero API" width="200" />
  
  <h1>Nero API</h1>
  <p>Backend RESTful de e-commerce de moda — construído com performance e escalabilidade</p>

  <!-- Badges de tecnologia -->
  ![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=nodedotjs)
  ![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
  ![Drizzle](https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?style=flat-square)
  ![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)
  ![Cloudinary](https://img.shields.io/badge/Cloudinary-Storage-3448C5?style=flat-square&logo=cloudinary)
  ![Better Auth](https://img.shields.io/badge/Better_Auth-Sessions-FF6B6B?style=flat-square)
</div>

---

### 2. Visão Geral

A **Nero API** é o motor backend e-commerce completo projetado para gerenciar o catálogo, estoque, autenticação via sessões, carrinho, pagamentos seguros em compliance com PCI e logística de pedidos. Serve principalmente como infraestrutura core unificada para aplicação mobile `nero-mobile`, focado inteiramente em tempo real e em otimização I/O.
<br/>
[🔗 Acessar Swagger UI / API Reference Locais (http://localhost:8000/api-docs)](http://localhost:8000/api-docs)

---

### 3. Decisões Técnicas

- **Por que Fastify e não Express ou NestJS?**
  **Escolha:** Fastify v5 combinado com `@fastify/type-provider-zod`.
  **Motivo:** Express é lento no processamento JSON e largamente abandonado. Fastify oferece a maior velocidade (throughput) e suporta schema-based validation nativamente, gerando descritores Swagger sem dor de cabeça de duplicação.
  **Descartado:** Express e NestJS. NestJS engessa a regra de negócios com muitos decorators de Classes e Injeção de Dependências excessiva, aumentando demais o footprint. O tradeoff foi utilizar rotas e plugins standalone no Fastify para maior velocidade, abdicando do "opinionismo" em arquiteturas empresariais puras de OOP orientados ao framework.

- **Por que Drizzle ORM e não Prisma?**
  **Escolha:** Drizzle ORM sobre `pg` (PostgreSQL) com suporte Neon Serverless.
  **Motivo:** Prisma adiciona o Prisma Engine Binário que consome mais memória, introduz cold starts no Serverless e o Prisma Client traz consultas SQL mais "presas" ao estilo GraphQL. Drizzle é puramente SQL "Edge-Ready" e type-safe que possibilita criar joins e tipar sem a necessidade de instanciar grandes pools.

- **Por que Better Auth e não NextAuth ou JWT manual?**
  **Escolha:** Better Auth (`better-auth`) com PostgreSQL integrado.
  **Motivo:** JWT puro exige implementação braçal de invalidar sessão (Revocation Lists) e re-verificar OAuth providers. NextAuth hoje trava forte o backend e foca Next.js server actions. Better Auth abstrai toda infra de Sessão (Tokens stateful), Google OAuth (`providerId`) num sistema framework-agnostic modular compatível com `request`/`response` globais.

- **Por que Stripe com SetupIntent + webhook e não cobrança direta?**
  **Escolha:** Criação de `SetupIntent` para salvar métodos de pagamento (Cardholder) seguidos por requisições de cobrança com Webhooks (via Stripe SDK).
  **Motivo:** Evita o PCI Compliance Level 1 mantendo cartões restalvos fora da base local. Com o modelo assíncrono do Webhook de Webhooks recebemos se a fatura foi aprovada ou requer 3D Secure evitando interrupção de pagamento devido à timeout nos clients.

- **Por que Cloudinary para storage e não S3?**
  **Escolha:** Cloudinary presigned URLs (direto do frontend usando assinatura gerada pelo backend).
  **Motivo:** No formato de E-Commerce Móvel/Web o S3 não suporta transformação on-the-fly flexível como crop de rosto para Avatar e compressões de fotos dinâmicas de Reviews de forma fácil. O Cloudinary lida com compressão, CND, transformações (Width, Height, quality auto) via URL e corta pesados fluxos pass-through de arquivos pelo Node.js.

- **Por que arquitetura de módulos e não MVC tradicional?**
  **Escolha:** Separação vertical por Features (e.g. `src/modules/orders/handlers`, `validations`, `routes`).
  **Motivo:** O projeto é colossal (Autenticação, Wishlist, Ordens, SetupIntent, Categorias, Reviews). MVC clássico amontoa gigantes `controllers/` globais, enquanto essa estrutura permite escalonamento de equipes isoladas, sendo mais coeso em SRP (Single Responsibility Principle).

- **Por que Zod integrado ao Fastify via Type Provider?**
  **Escolha:** `fastify-type-provider-zod`.
  **Motivo:** Acaba de uma vez por todas com a necessidade de escrever TypeScript Types genéricos *e* Validation Schemas que nunca combinam perfeitamente. Zod converte JSON do Body direto em TS inferred com `FastifyRequest<{ Body: CreateProductBody }>`, garantindo Typesafe de End-To-End.

---

### 4. Arquitetura

```text
src/
├── app.ts                 # Bootstrap / Global Handlers do Fastify
├── server.ts              # Inicia o servidor Web
├── config/                # Environment e Tokens (env.ts)
├── lib/                   
│   ├── auth/              # Adapters e instâncias Better Auth
│   └── db/                # Drizzle ORM Instâncias e Schemas de Tabelas Customizados
├── plugins/               # Fastify plugins (rate limit, cors, helmet, swagger)
└── modules/               # Verticais de Negócio da Aplicação
    ├── auth               # Gerência dos Proxies de Login
    ├── products           # Gerência de Catálogo/Pesquisa e SKUs
    ├── orders             # Carrinho de compras -> Checkout -> Pedido Físico
    └── ...                # Demais
```

**Fluxo End-to-end de uma requisição API:**
1. **Request** → Chega via protocolo HTTP e interceptada pelos globais como Rate Limit/CORS/Helmet. O hook `preHandler: [app.authenticate]` avalia Cookies/Bearer do BetterAuth.
2. **Route** → `fastify-type-provider-zod` valida os params/body perante o Schema Zod local.
3. **Handler** → Controladores de infra que extraem variáveis do Request.
4. **Service (Opcional)** / **Repository** → Abstrações Drizzle executando os selects do PG (Postgres).
5. **DB** → Drizzle ORM -> Neon PostgreSQL com retorno Typesafe das instâncias de tabelas.

**Arquitetura Pagamento Stripe:**
1. App emite solicitação de compra para `payments/intent`.
2. Servidor bate no Stripe, acopla Cliente e PaymentMethod guardado na base emitindo um Pagamento Assíncrono com ID gerado (`pi_xxxx...`).
3. O Backend retorna `{ clientSecret }` e processa como Pedido "Pendente".
4. App (via Stripe Elements/SDK) confirma o Intent interagindo com banco.
5. O Stripe Webhook pinga `POST /api/v1/webhooks/stripe`. Assinatura verificada. Status do Pedido de "Pending" para "Paid" e aciona Logística interna.

**Fluxo Upload de Imagens no Cloudinary:**
1. O App mobile envia Request ao `POST /me/avatar/presign`.
2. O Backend gera um HASH contendo Auth assinado criptográficamente, enviando timestamp válido.
3. O App acessa a API Edge do Cloudinary enviando a Imagem crua (bypassando uso CPU do Node.js).
4. O App dispara o `PATCH /me/avatar/confirm` contendo a URL de sucesso no retorno do frontend, oficializando as fotos no Perfil/Revisões/Products.

---

### 5. Módulos da API

*(Prefixo Global: `/api/v1`)*

#### Módulo: Auth
Gerenciamento de vida da Sessão delegados ao BetterAuth.
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| ALL | `/auth/*` | ❌ | Proxys customizados para SignUp, SignIn, Sessão via Google/Email, e Refresh |

#### Módulo: Products
**Prefixo:** `/products` e `/admin/products`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/products/search` | ❌ | Pesquisa produtos via FTS5 e filtros estruturados/categorias |
| GET | `/products/slug/:slug` | ❌ | Resgatar metadados inteiros do produto em PDP com variações dinâmicas |
| POST | `/admin/products` | ✅ | Cadastra itens base ao catálogo |
| PATCH | `/admin/products/:id/skus/:skuId` | ✅ | Edita inventário de variação de SKU |
| POST | `/admin/products/:id/images/presign`| ✅ | Criar token seguro com liberação de Cloudinary de imagens |

#### Módulo: Users
**Prefixo:** `/me`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/me` | ✅ | Retorna o Perfil consolidado (telefone, gênero favorito) do usuário logado |
| PATCH | `/me` | ✅ | Atualiza informações em `user_profiles` |
| POST | `/me/avatar/presign` | ✅ | Pre-assina request Cloudinary restrito ao diretório `avatars` |
| PATCH | `/me/avatar/confirm`| ✅ | Consagra URL limpa da Cloudinary para avatar oficial |

#### Módulo: Addresses
**Prefixo:** `/me/addresses`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/me/addresses` | ✅ | Traz lista de endereços atrelados para Checkout |
| GET | `/me/addresses/default` | ✅ | Resgata moradia favoritada |
| POST | `/me/addresses` | ✅ | Adiciona `user_addresses` (cep, logradouro, complemento) |
| DELETE| `/me/addresses/:id` | ✅ | Remove endereço salvado |

#### Módulo: Cart
**Prefixo:** `/cart`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/cart` | ✅ | Mostra estado momentâneo, com totais (Subtotal, Tax, Frete calculados live) da Drizzle |
| POST | `/cart/items` | ✅ | Insere SKU/Produto validando limites e OutOfStock |
| PATCH | `/cart/items/:itemId` | ✅ | Incremento/Decremento Quantity de item |
| POST | `/cart/coupon` | ✅ | Acopla Validador de Cupom atrelado com total |

#### Módulo: Orders
**Prefixo:** `/orders` e `/admin/orders`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/orders` | ✅ | Listar histórico do app do próprio Usuário |
| GET | `/orders/:id` | ✅ | Ver rastreio físico e lista dos snapshots em JSONB (nome imutável da época) |
| POST | `/orders/:id/cancel` | ✅ | Regra abortar order de compras |
| PATCH | `/admin/orders/:id/status`| ✅ | Lojistas setando `shipped`, `delivered` no Tracker |

#### Módulo: Payments & Webhooks
**Prefixo:** `/me/payment-methods`, `/payments` e `/webhooks`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/me/payment-methods/setup-intent`| ✅ | Recebe o ClientSecret de Setup (Cartão da Billetera local do Auth stripe) |
| PATCH | `/me/payment-methods/:id/default`| ✅ | Ajusta o Cartão Eleito pra Transação 1-Click |
| POST | `/payments/intent` | ✅ | Finaliza Checkout, cria Order Pending, e gera Stripe Payment Intent com base em `cartId` |
| POST | `/webhooks/stripe` | ❌ | Assinado. Dispara aprovação (`charge.succeeded` etc) modificando o Order para Confirmado e abatendo estoque. |

#### Módulo: Wishlist
**Prefixo:** `/wishlist`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/wishlist` | ✅ | Paginação das listas fixadas pelo logado com metadados do preço / avaliação |
| POST | `/wishlist/:productId` | ✅ | Toggle para pinar like na Vitrine |

#### Módulo: Reviews
**Prefixo:** `/reviews`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/reviews` | ❌ | Histórico dos depoimentos público num `ProductId` com métricas e paginador |
| POST | `/reviews` | ✅ | Preencher notas, ReviewText, Media Arrays, marcando `isVerified=(Usuário comprou O produto)` |
| POST | `/reviews/:id/like` | ✅ | Upvotes para comentários úteis |

#### Múltiplos Módulos Auxiliares: Home/Brands/Categories
- **Home**: (`GET /home` e `/admin/home`) Estrutura customizável de "Sections" injetados via banco dinâmico JSONB, para reodenação visual da UX (Top Vendas, New In, Categorias).
- **Brands/Categories**: GETters puros para taxinomia. Sem auth. Admin gerencia criação.

---

### 6. Schema do Banco de Dados

`Drizzle ORM via PostgreSQL Dialect`

#### `products`
O Core central. Entidade independente para itens Genéricos (Single) ou Variantes(HasVariations). Suporte a PostgreSQL TSVECTOR text-search natively configurado no Drizzle para match de index full text.
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text (uuidv7) | Primary key cronológica para otimização de cache |
| slug | varchar | Slug-url única em `/vestido-x` |
| compareAtPrice | integer | Old price "From" |
| searchVector | tsvector | Vetor consolidado de busca Index GIN global |

#### `product_skus` (Variações Filhas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text | PK |
| productId | text | Responde à Pai `products` (1:N) |
| optionIds | jsonb | Array de string referindo o schema `variation_options` |
| stock | integer | Abatimento central de quantidade logísitica |

#### `orders` 
Coração financeiro imutável.
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| subtotalAmount | numeric | Decimal de 10,2 |
| stripePaymentIntentId | text | Relacionador único perante Webhook |
| shippingAddress | jsonb | Cópia snapshot "Cold Storage" do endereço para resguardo não sendo violado caso usuário altere conta externa |

#### `users` (Better Auth Root) / `user_profiles` (Extensão da Nero)
A tabela `users` foi injetada pelo BetterAuth mas estendida a force com schema `user_profiles`.

```ascii
     +-------------+ 1      1 +----------------+
     |   users     |----------| user_profiles  |
     |-------------|          |----------------|
     | id          |          | genderPref     |
     | email       |          | stripeCustId   |
     +-------------+          +----------------+
            | 1
            |
            | N
   +------------------+
   |      orders      | (Contém ID do Setup Intent para abater Stripe)
   |------------------|
   +------------------+
            | 1
            |
            | N
   +------------------+
   |   order_items    | (Grava "Snapshots JSONB" com os precos de data específica e a Imagem do Sku)
   +------------------+
```

---

### 7. Variáveis de Ambiente

As variáveis da infraestrutura podem ser achadas sob `src/config/env.ts`, criadas pelo ZOD como TypeGuard.

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `NODE_ENV` | ❌ | Define "dev" ou "production" | `dev` |
| `BASE_URL` | ❌ | URL Raíz pro Email Magic Link e Auth | `http://localhost:8000` |
| `DATABASE_URL` | ✅ | Connection URI do Neon ou PG Serverless | `postgresql://user:pass@host/db` |
| `STRIPE_SECRET_KEY` | ✅ | Chave Servidor em Pagamentos (Live Mode ou test_) | `sk_test_123` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Assinador Sig para evitar Spoof Webhook | `whsec_abc` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Dashboard id Name da CDN | `dx5ggmd...` |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary Access | `1231...` |
| `CLOUDINARY_API_SECRET` | ✅ | Segredo Admin dos Pre-signs | `lqrPJ..` |
| `BETTER_AUTH_SECRET` | ✅ | Hash random de 32 bytes para Cripto de Cookies de sessão. | `G3hr5IA...` |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_HOST` | ✅ | Servidor MailTrapp/GMAIL para Forget Passwds | `smtp.gmail.com` |

---

### 8. Como Rodar Localmente

#### Pré-requisitos
- Node.js 24+
- pnpm 10+
- PostgreSQL local ou Neon DB
- Stripe CLI (para habilitar dev loop de webhooks locais, escutando Stripe API externa)

#### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/willianOliveira-dev/nero-api.git
cd nero-api

# 2. Instale as dependências com pnpm cache rápido
pnpm install

# 3. Configure as variáveis de ambiente baseando-se no Template Completo gerado
cp .env.example .env
# [!] Preencha meticulosamente suas credenciais válidas do PostgreSQL Neon e Stripe no `.env`

# 4. Execute as migrations Schema p/ PostgreSQL (criando os relacionamentos)
pnpm run drizzle:migrate

# 5. Execute o seed automático (Prepara Perfis Admin e os Produtos Dummies base do App)
pnpm db:seed

# 6. Inicie o servidor (Hot Reload)
pnpm dev

# 7. (Opcional - Stripe Webhook) Em outro terminal para habilitar os fluxos End-to-End Testes:
pnpm stripe:listen
```

---

### 9. Como Rodar em Produção (Docker)

Esta api conta com um `Dockerfile` e um `docker-compose.yml` otimizados de **Multi-Stage Build**, limitando o container rodado a Node puramente para `dist/` ignorando ferramentas como compiladores, arquivos ts de testes desnecessários ou configs IDEs não performáticos. A `.dockerignore` está blindada nativamente contra leaks com `node_modules` locais.

```bash
# Subir todo o servidor backend com injeção segura de segredos:
docker compose up -d --build
```
> O comando do Compose vai sugar automaticamente sua flag local de `.env` da branch server-side e montá-las de modo memory-safe dentro do `node dist/server.js`, sem que o arquivo chumbado vaze nas camadas da imagem.

---

### 10. Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Usa instâncias nativas ES com o `tsx --watch` c/ flags custom Node Environment |
| `pnpm build` | Faz transpilação `.ts`, conserta imports ESM via `tsc-alias` e copia imagens pro Dist. |
| `pnpm dev:start` | Executa a versão compilada ESM de produção `node --env-file=.env dist/server.js` |
| `pnpm drizzle:migrate` | Lê as mudanças TypeScript em Drizzle e injeta Migrate p/ DB |
| `pnpm stripe:listen` | Forwarding do evento global cloud pra localhost 8000 via Tunneling Stripe |
| `pnpm test` | Executa o runner nativo Node.js Core com `node --test` em `tests/` e gera covertura em C8. |

---

### 11. Testes com cURL

#### Verificar Produto Listagem Search (Sem Auth)
```bash
curl -X GET "http://localhost:8000/api/v1/products/search?priceMax=9099&limit=10"
```

#### Fazer Login (Gerar Token / Cookie Session do App Client)
```bash
curl -X POST http://localhost:8000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"ana.silva@email.com","password":"Senha123!"}' \
  -c cookies.txt
```

#### Criar Assinatura SetupIntent para Salvar um Novo Cartão de Crédito Físico
```bash
curl -X POST http://localhost:8000/api/v1/me/payment-methods/setup-intent \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{}"
```

#### Finalizar o Checkout Carrinho Emitindo o Pagamento Intent real
```bash
curl -X POST http://localhost:8000/api/v1/payments/intent \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"paymentMethodId":"pm_validcardexample1xyz","cartId":"d3f9abf7-876a-495t-a8s..."}'
```

---

### 12. Credenciais de Teste

| Usuário | Email | Senha | Perfil |
|---------|-------|-------|--------|
| Ana Silva | ana.silva@email.com | Senha123! | Feminino |
| João Santos | joao.santos@email.com | Senha123! | Masculino |
| Administrador Base | admin@nero.com | Admin123! | Administrador Master Access |

**Cartões de teste Stripe:**
Mantenha seus testes utilizando Gateway Test-Mode habilitado nas envs Stripes locais:
| Cenário | Número do Cartão Fake (Teste) | Validade Qualquer | CVV / CVC |
|---------|--------|----------|-----|
| Aprovado Universalmente | 4242 4242 4242 4242 | 12/34 | 123 |
| Recusado Bank Denied | 4000 0000 0000 0002 | 12/34 | 123 |
| Processamento exigindo Regra de 3D Secure / OTP | 4000 0025 0000 3155 | 12/34 | 123 |

---

### 13. Licença e Autor

## Autor

**Willian Oliveira**
[![GitHub](https://img.shields.io/badge/GitHub-willianOliveira--dev-181717?style=flat-square&logo=github)](https://github.com/willianOliveira-dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Willian_Oliveira-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/willian-oliveira)
