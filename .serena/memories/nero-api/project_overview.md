# Nero API - Project Overview

## Purpose
E-commerce fashion API for the Nero mobile app. Manages products, categories, brands, home sections, cart, orders, reviews, users, and auth.

## Tech Stack
- **Runtime**: Node.js 24
- **Framework**: Fastify 5 with Zod type provider
- **ORM**: Drizzle ORM with PostgreSQL (Neon serverless)
- **Validation**: Zod v4
- **Auth**: better-auth
- **Storage**: Cloudinary
- **Linting/Formatting**: Biome
- **Language**: TypeScript 5.9

## Project Structure
```
src/
  app.ts           # Bootstrap
  server.ts        # Entry point
  config/          # Configuration
  lib/             # DB connection, schemas
  modules/         # Feature modules (each has handlers/, repositories/, routes/, services/, validations/)
    home/
    products/
    categories/
    brands/
    reviews/
    cart/
    orders/
    users/
    auth/
    storage/
    swagger/
  plugins/         # Fastify plugins
  routes/          # Root routes registration
  shared/          # Shared errors, utils (Price util)
  types/           # Handler types
  scripts/         # Seed scripts
```

## Key Commands
- `npm run dev` — Start dev server (tsx --watch)
- `npm run build` — Build TypeScript
- `npm run drizzle:migrate` — Generate and run DB migrations
- `npm run db:seed` — Seed database

## Code Style
- Module-based architecture: handlers → services → repositories
- Zod schemas for validation and response typing
- Serializers for transforming DB data to API responses
- FastifyPluginAsyncZod for route definitions
- All routes use operationId for Swagger/Orval generation

## Key Data Contracts
### ProductCard (Home sections items)
```
{ id, name, slug, status, thumbnailUrl, hasVariations,
  pricing: { displayPriceMin: {cents, value, formatted}, priceRange, hasPriceVariation } | null,
  brand: { name, slug } | null,
  rating: { average, count, sold },
  freeShipping }
```

### Search Products Response (Cursor-based pagination)
```
{ items: ProductCard[], total, nextCursor: string | null, hasMore: boolean }
```
Query params: q, gender, sort, deals, priceMin, priceMax, categoryId, limit (default 20), cursor (uuid v7)
