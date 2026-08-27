# Mykonos — Marketplace

Marketplace multi-vendedor. Los compradores navegan el catálogo, arman un carrito y
hacen checkout; la orden se divide automáticamente en **subórdenes por vendedor**, cada
una con su propio estado (`PAID` → `SHIPPED` / `CANCELLED`). Los vendedores publican
productos con imágenes y gestionan su stock y sus subórdenes.

El precio que se muestra de cada producto **no está almacenado**: se calcula en cada
lectura a partir del precio base, el nivel de inventario y la demanda reciente. La
fórmula está documentada en [`backend/README.md`](backend/README.md#dynamic-pricing-formula).

## Stack

| | |
|---|---|
| **Backend** | Express + TypeScript, Prisma ORM, PostgreSQL, JWT (access/refresh), Zod, Multer (subida de imágenes) |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, TanStack Query |
| **Tests** | Vitest (backend con Supertest, frontend con Testing Library) |

## Estructura

```
mykonos/
├── backend/
│   ├── prisma/            # schema, migraciones, seed
│   └── src/
│       ├── modules/       # auth, products, cart, orders, pricing
│       └── shared/        # cliente Prisma, middleware de auth, manejo de errores
└── frontend/
    └── src/
        ├── api/           # cliente HTTP y funciones por recurso
        ├── modules/       # auth, products, cart, checkout, orders, seller
        └── ui/            # componentes de presentación (Button, Card, ...)
```

## Requisitos

- Node.js 20+
- Docker (para la base de datos PostgreSQL)

## Puesta en marcha

### 1. Backend

Desde `backend/`:

```bash
docker compose up -d                                    # levanta Postgres en el puerto 5433
docker exec -it $(docker compose ps -q postgres) \
  createdb -U marketplace marketplace_test              # una sola vez: base de datos de test
cp .env.example .env
npm install
npx prisma migrate dev                                  # migra marketplace_dev
DATABASE_URL="postgresql://marketplace:marketplace@localhost:5433/marketplace_test" \
  npx prisma migrate deploy                             # migra marketplace_test (necesario para npm test)
npm run dev                                             # API en http://localhost:4000
```

### 2. Frontend

Desde `frontend/`:

```bash
npm install
cp .env.example .env        # VITE_API_URL vacío => Vite hace proxy de /api y /uploads a :4000
npm run dev                 # app en http://localhost:5173
```

### 3. Datos de prueba (opcional)

Desde `backend/`, con la base ya migrada:

```bash
npx tsx prisma/seed.ts
```

Crea usuarios, productos e historial de ejemplo. La contraseña de todas las cuentas es `Test1234!`:

| Rol | Email | Notas |
|---|---|---|
| SELLER | `seller1@test.com` | Elena Torres — Ropa / Accesorios |
| SELLER | `seller2@test.com` | Carlos Ruiz — Electrónica / Accesorios |
| SELLER | `vendedor.prueba@example.com` | Vendedor Prueba — varias categorías |
| BUYER | `buyer1@test.com` | Ana Gómez — con ítems en el carrito |
| BUYER | `buyer2@test.com` | Luis Fernández — con una orden en el historial |

## Scripts

### Backend (`backend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | API en modo watch (tsx) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la build de `dist/` |
| `npm test` | Suite de Vitest contra `marketplace_test` |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:generate` | Regenera el cliente de Prisma |

### Frontend (`frontend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Type-check + build de producción |
| `npm run preview` | Sirve la build de producción |
| `npm test` | Suite de Vitest |

## Documentación adicional

- [`backend/README.md`](backend/README.md) — referencia completa de endpoints y la fórmula de precios dinámicos.
