# Sistem Bibliotekash — Library API

Projekt per kursin **SPDD (Ueb Sherbime & Ueb API)** — Prof.ass.Dr.sc. Liridon Hoti.

REST API ne **Node.js + Express** me **PostgreSQL + Prisma ORM** per menaxhimin e nje biblioteke (libra, autore, kategori, anetare, huazime). Ploteson kerkesat e specifikuara ne dokumentin teknik te kursit.

---

## Permbajtja

- [Karakteristikat](#karakteristikat)
- [Stack teknologjik](#stack-teknologjik)
- [Struktura e projektit](#struktura-e-projektit)
- [Instalimi & ekzekutimi](#instalimi--ekzekutimi)
- [Skripte npm](#skripte-npm)
- [Endpoints kryesore](#endpoints-kryesore)
- [Rolet & autorizimi](#rolet--autorizimi)
- [Testimi](#testimi)
- [Docker & deployment](#docker--deployment)
- [CI/CD](#cicd)
- [Mapping me kerkesat e kursit](#mapping-me-kerkesat-e-kursit)

---

## Karakteristikat

- REST API i versionuar (`/api/v1`)
- Autentifikim me **JWT** (access + refresh tokens, me endpoint `/auth/refresh`)
- **MFA (TOTP)** opsionale per perdorues — setup/enable/disable/verify me Google Authenticator
- **RBAC** me 3 role: `ADMIN`, `LIBRARIAN`, `MEMBER`
- Validim i input-it me `express-validator`
- Sigurim me `helmet`, `cors`, **rate limiting**
- **Caching me Redis** per endpoint-et e listave (books/authors/categories) me invalidim automatik
- Dokumentacion interaktiv me **Swagger UI** ne `/api/docs`
- Logim qendror me **Winston** (file + console)
- Logjike biznesi per huazim/kthim me **transaksione** Prisma
- Paginim & filtrim per liste-endpointet
- **Docker** + **docker-compose** per Postgres + Redis + API
- **GitHub Actions** CI per test + build

## Stack teknologjik

| Shtresa     | Teknologjia                              |
|-------------|------------------------------------------|
| Runtime     | Node.js 20+                              |
| Framework   | Express 5                                |
| Databaza    | PostgreSQL 16                            |
| ORM         | Prisma 6                                 |
| Auth        | JSON Web Tokens (jsonwebtoken) + bcryptjs|
| MFA         | speakeasy (TOTP) + qrcode                |
| Caching     | Redis (ioredis)                          |
| Validim     | express-validator                        |
| Logim       | Winston + morgan                         |
| Dokumentim  | swagger-jsdoc + swagger-ui-express       |
| Teste       | Jest + Supertest                         |
| Kontejner   | Docker + docker-compose                  |
| CI/CD       | GitHub Actions                           |

## Struktura e projektit

```
library-api/
├── prisma/
│   ├── schema.prisma          # Modelet e DB-se
│   ├── seed.js                # Te dhena fillestare
│   └── migrations/            # Auto-generuar nga Prisma
├── src/
│   ├── config/                # env, logger, prisma, swagger
│   ├── controllers/           # Lidhin route → service
│   ├── middleware/            # auth, RBAC, validate, error
│   ├── routes/v1/             # Endpoints REST te versionuar
│   ├── services/              # Logjika e biznesit
│   ├── utils/                 # ApiError, asyncHandler, jwt
│   ├── validators/            # Rregulla validimi
│   ├── app.js                 # Konfigurimi i Express
│   └── server.js              # Pika hyrese
├── tests/
│   ├── unit/                  # Teste njesie
│   └── integration/           # Teste integrimi (Supertest)
├── .github/workflows/ci.yml   # GitHub Actions
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Instalimi & ekzekutimi

### Parakushtet
- Node.js 20+
- Docker & Docker Compose
- Porti `4000` (API), `5434` (Postgres) dhe `6379` (Redis) duhet te jene te lire

### Variabla shtese mjedisi (opsionale)

```
REDIS_URL=redis://localhost:6379   # nese mungon, caching shkyçet automatikisht (graceful fallback)
```

Pas ndryshimeve ne `prisma/schema.prisma` (fushat `mfaEnabled`/`mfaSecret`), duhet te krijohet nje migrim i ri:
```bash
npx prisma migrate dev --name add_mfa_fields
```

### Hera e pare (3 komanda)

```bash
cd library-api
npm install
npm run setup     # starton Postgres + apliko migrimet + mbush me te dhena
```

### Cdo here qe punon ne projekt

```bash
npm run dev       # starton API ne port 4000 me auto-reload
```

Pastaj hap ne shfletues:
- **API:** http://localhost:4000
- **Swagger UI:** http://localhost:4000/api/docs
- **Health:** http://localhost:4000/api/v1/health

### Komanda te dobishme

| Komanda            | Cka ben                                              |
|--------------------|------------------------------------------------------|
| `npm run dev`      | Starton API-n (auto-reload)                          |
| `npm start`        | Starton API-n ne production mode                     |
| `npm test`         | Ekzekuton 24 testet (Jest)                          |
| `npm run setup`    | Setup i plote: Postgres + migrime + seed             |
| `npm run db:up`    | Vetem starton Postgres ne Docker                     |
| `npm run db:down`  | Ndal Postgres                                        |
| `npm run db:seed`  | Ri-mbush DB-n me te dhena fillestare                 |
| `npm run db:reset` | **Fshi krejt te dhenat** dhe rifillo nga zeroja      |
| `npm run prisma:studio` | Hap GUI per te shfletuar DB-n                   |

### Nese ndalon kompjuteri ose ribooton

Postgres-i mund te jete i ndalur. Vetem:
```bash
npm run db:up
npm run dev
```

### Perdorues default (nga seed)
| Email                    | Fjalekalimi   | Roli      |
|--------------------------|---------------|-----------|
| admin@library.com        | admin123      | ADMIN     |
| librarian@library.com    | librarian123  | LIBRARIAN |
| member@library.com       | member123     | MEMBER    |

## Skripte npm

| Komanda                | Pershkrimi                              |
|------------------------|-----------------------------------------|
| `npm run dev`          | Starton ne dev mode me nodemon          |
| `npm start`            | Starton ne production mode              |
| `npm test`             | Ekzekuton krejt testet me Jest          |
| `npm run test:watch`   | Watch mode per teste                    |
| `npm run prisma:migrate` | Krijon nje migrim te ri               |
| `npm run prisma:studio`  | Hap Prisma Studio (DB GUI)            |
| `npm run db:seed`      | Mbush DB-n me te dhena fillestare       |

## Endpoints kryesore

### Auth (`/api/v1/auth`)
| Metoda | Path        | Pershkrimi                  | Auth |
|--------|-------------|-----------------------------|------|
| POST   | `/register` | Regjistro nje anetar te ri  | —    |
| POST   | `/login`    | Login + merr JWT (ose `requiresMfa: true`) | —    |
| POST   | `/refresh`  | Merr access token te ri me refresh token | —    |
| GET    | `/me`       | Merr perdoruesin aktual     | JWT  |

### MFA (`/api/v1/mfa`)
| Metoda | Path       | Pershkrimi                                          | Auth |
|--------|------------|------------------------------------------------------|------|
| POST   | `/setup`   | Gjeneron TOTP secret + QR code                       | JWT  |
| POST   | `/enable`  | Konfirmon kodin TOTP dhe aktivizon MFA                | JWT  |
| POST   | `/disable` | Ckaktivizon MFA (kerkon kod TOTP)                     | JWT  |
| POST   | `/verify`  | Perfundon login-in me kodin TOTP (perdor `mfaToken`)  | —    |

**Login flow me MFA:**
1. `POST /auth/login` → nese `mfaEnabled = true`, kthen `{ requiresMfa: true, mfaToken }` (pa access/refresh tokens)
2. `POST /mfa/verify` me `{ mfaToken, code }` → kthen `{ user, accessToken, refreshToken }`

### Books (`/api/v1/books`)
| Metoda | Path         | Pershkrimi              | Roli           |
|--------|--------------|-------------------------|----------------|
| GET    | `/`          | Lista librash + paginim | Publik         |
| GET    | `/:id`       | Detaje libri            | Publik         |
| POST   | `/`          | Krijo liber             | ADMIN/LIBRARIAN|
| PUT    | `/:id`       | Perditeso liber         | ADMIN/LIBRARIAN|
| DELETE | `/:id`       | Fshi liber              | ADMIN          |

### Loans (`/api/v1/loans`)
| Metoda | Path                | Pershkrimi             | Roli            |
|--------|---------------------|------------------------|-----------------|
| GET    | `/me`               | Huazimet e mia         | I autentifikuar |
| GET    | `/`                 | Te gjitha huazimet     | ADMIN/LIBRARIAN |
| POST   | `/borrow`           | Huazo liber            | I autentifikuar |
| POST   | `/:id/return`       | Kthe liber             | I autentifikuar |
| POST   | `/mark-overdue`     | Sweep te skadueshmit   | ADMIN/LIBRARIAN |

Krejt endpoints e tjera (authors, categories, members) jane te dokumentuara ne **Swagger UI**.

## Rolet & autorizimi

| Veprimi             | ADMIN | LIBRARIAN | MEMBER |
|---------------------|:-----:|:---------:|:------:|
| Lexo libra/autore   |   ✓   |     ✓     |   ✓    |
| Krijo/perditeso libra|  ✓   |     ✓     |   —    |
| Fshi libra          |   ✓   |     —     |   —    |
| Liste anetare       |   ✓   |     ✓     |   —    |
| Huazimet personale  |   ✓   |     ✓     |   ✓    |
| Te gjitha huazimet  |   ✓   |     ✓     |   —    |
| Huazo per veten     |   ✓   |     ✓     |   ✓    |
| Huazo per tjeter kend| ✓    |     ✓     |   —    |
| Mark overdue        |   ✓   |     ✓     |   —    |

## Testimi

```bash
# Krijo databazen e testit (njehere)
docker exec library-postgres psql -U library -d library_db -c "CREATE DATABASE library_test_db OWNER library;"
DATABASE_URL="postgresql://library:library@localhost:5434/library_test_db?schema=public" npx prisma migrate deploy

# Ekzekuto testet
npm test
```

Ka 4 test suite (24 teste): 2 njesie + 2 integrimi (auth + loans).

## Docker & deployment

```bash
# Starto krejt stack-un (postgres + api)
JWT_SECRET="your-very-long-secret" docker compose up -d --build

# Ndal
docker compose down

# Me cleanup volumesh
docker compose down -v
```

## CI/CD

Workflow ne `.github/workflows/ci.yml`:
1. Postgres si service container
2. `npm ci` per dependencat
3. `prisma migrate deploy`
4. `npm test`
5. Docker build (pa push)

Triggers: `push` & `pull_request` ne `main` ose `develop`.

## Mapping me kerkesat e kursit

| Seksioni i kerkesave           | Implementimi ne kete projekt                    |
|---------------------------------|--------------------------------------------------|
| 1. Arkitektura (REST, stateless)| Express + JWT (stateless), `/api/v1` versionim   |
| 2. Siguria (JWT, RBAC, helmet, MFA) | `auth.middleware.js`, `helmet`, rate limit, CORS, MFA (TOTP) |
| 3. Performanca (caching)        | Redis caching per liste, paginim, indekse Prisma, rate limit |
| 4. Dokumentimi (OpenAPI)        | Swagger UI ne `/api/docs` (OAS 3.0.3)            |
| 5. Versionimi                   | URL prefix `/api/v1`                             |
| 6. Logim & monitoring           | Winston + morgan, logs/ folder                   |
| 7. Integrimi DB                 | Prisma ORM + PostgreSQL                          |
| 8. Standardet (SOLID, teste)    | Layered (routes/controllers/services), Jest     |
| 9. Platformat                   | Node.js + Express + PostgreSQL + Redis           |
| 10. DevOps (Docker, CI/CD)      | Dockerfile, docker-compose, GitHub Actions       |

## Licenca

MIT
