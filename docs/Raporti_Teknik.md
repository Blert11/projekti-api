<!--
SHENIM PER STUDENTIN:
Ky raport eshte nje draft i plote, gati per t'u kthyer ne .docx dhe dorezuar ne Moodle.
Para se ta dorezosh:
  1) Plotesoji fushat [SHENO: ...] me te dhenat e tua (universiteti, grupi, anetaret, data).
  2) Hap docs/Raporti_Teknik.html ne Word ("File > Open" -> zgjidh .html) dhe bej "Save As" -> .docx.
  3) Shto ekran-pamje (screenshots) reale nga Swagger UI dhe nga aplikacioni frontend ne Shtojce (9.5).
  4) Lexoje deklaraten e origjinalitetit dhe nenshkruaje (emer + date).
  5) Riemerto file-in .docx dhe .zip sipas konvencionit te kerkuar nga lenda
     (p.sh. GrupiX_Projekti_SPDD.docx / EmriMbiemri_Projekti_SPDD.zip).
-->

# Raporti Teknik i Projektit

**Tema:** Sistem per Menaxhimin e Bibliotekes — REST API & Aplikacion Web
**Lenda:** Sherbime Web dhe API-Web (SPDD)
**Profesori:** Prof.ass.Dr.sc. Liridon Hoti
---

## Deklarata e origjinalitetit

Une/ne, i/e nenshkruari/i nenshkruari me poshte, deklaroj/deklarojme se ky projekt dhe ky raport jane
punuar nga vete une/ne, ne kuader te lendes **Sherbime Web dhe API-Web (SPDD)**. Krejt kodi burimor,
dizajni i sistemit dhe ky dokument jane rezultat i punes sime/tone, perpos pjeseve te shenuara
shprehimisht si te marra nga burime te jashtme (libraritë/paketat e perdorura, te listuara ne
Kapitullin 8 — Referencat). Jam/jemi te vetedijshem se cdo shkelje e ketij parimi (plagjiature)
trajtohet sipas rregullores se Universitetit.

---

## Permbajtja

1. Abstrakt
2. Objektivat
3. Analiza e kerkesave funksionale dhe jo-funksionale
4. Dizajni i sistemit
5. Pershkrimi i implementimit
6. Testimi dhe rezultatet
7. Konkluzione
8. Referencat
9. Shtojca

---

## 1. Abstrakt

Ky projekt implementon nje **sistem per menaxhimin e nje biblioteke**, i ndertuar si nje **REST API**
e versionuar (`/api/v1`) ne **Node.js + Express 5**, me **PostgreSQL** si databaze relacionale dhe
**Prisma ORM** per qasje ne te dhena, te shoqeruar nga nje **aplikacion web (frontend)** i ndertuar
me **React + Vite** qe konsumon kete API.

Sistemi mundeson regjistrimin dhe identifikimin e perdoruesve me **JWT** (access + refresh tokens),
**autentifikim me dy faktore (MFA/TOTP)** opsional, dhe **kontroll te aksesit te bazuar ne role**
(RBAC) per tre role: `ADMIN`, `LIBRARIAN` dhe `MEMBER`. Mbeshtet operacione CRUD per libra, autore,
kategori dhe anetare, si dhe logjiken e biznesit per **huazim/kthim librash** (me transaksione
databaze qe garantojne konsistence).

Per performance, listat (libra/autore/kategori) cache-ohen me **Redis** dhe invalidohen automatikisht
pas cdo modifikimi. Per siguri, perdoren `helmet`, `cors`, **rate limiting**, validim i rrepte i
input-it (`express-validator`), dhe nje **audit log** i dedikuar (`logs/audit.log`) qe regjistron
veprimet e ndjeshme (login, MFA, CRUD mbi resurse) per qellime sigurie dhe gjurmueshmerie.

Projekti perfshin **dokumentim interaktiv OpenAPI/Swagger**, nje **suite testesh automatike** prej
**116 testesh** (njesi + integrim) me Jest/Supertest, **ESLint + Prettier** per standarde kodimi,
dhe eshte i **konteinerizuar** me Docker/Docker Compose, me nje **pipeline CI/CD** ne GitHub Actions
qe ekzekuton lint, migrime, teste dhe build-in e imazhit Docker ne cdo push/PR.

---

## 2. Objektivat

### 2.1 Objektivi i pergjithshem

Te dizajnohet, implementohet dhe testohet nje **Web API RESTful e plote dhe e sigurte**, sipas
kerkesave teknike te lendes "Sherbime Web dhe API-Web", per nje domen real (menaxhimi i nje
biblioteke), e shoqeruar nga nje aplikacion web qe e konsumon ate API.

### 2.2 Objektivat specifike

- Te projektohet nje **arkitekture e shtresuar** (routes → controllers → services → ORM/DB), e
  ndare sipas parimeve **SOLID** dhe me pergjegjesi te qarta per cdo shtrese.
- Te implementohet **autentifikim dhe autorizim** i sigurte: JWT (access/refresh), hashing i
  fjalekalimeve me bcrypt, RBAC me tre role, dhe **MFA (TOTP)** opsionale.
- Te zbatohen **masat e sigurise** te rekomanduara (helmet, CORS, rate limiting, validim input-i,
  audit logging per veprime te ndjeshme).
- Te optimizohet **performanca** permes **cache-imit me Redis**, paginimit dhe indekseve ne
  databaze.
- Te dokumentohet API-ja sipas standardit **OpenAPI 3.0** (Swagger UI).
- Te versionohet API-ja (`/api/v1`) per te lejuar evolim te ardhshem pa thyer klientet ekzistues.
- Te implementohet **logim qendror** (Winston) per debug/monitorim dhe **audit log** i vecante
  per siguri.
- Te shkruhen **teste automatike** (njesi + integrim) qe mbulojne logjiken kryesore te biznesit
  dhe endpoint-et publike.
- Te konteinerizohet aplikacioni (Docker/Docker Compose) dhe te ngrihet nje **pipeline CI/CD**
  (GitHub Actions) per integrim te vazhdueshem.
- Te ndertohet nje **klient web (React)** funksional qe demonstron perdorimin e plote te API-se
  (autentifikim, CRUD, huazime, MFA, role te ndryshme).

---

## 3. Analiza e kerkesave funksionale dhe jo-funksionale

### 3.1 Kerkesat funksionale

| ID    | Kerkesa                                                                 | Aktoret             |
|-------|--------------------------------------------------------------------------|---------------------|
| RF-01 | Regjistrimi i nje perdoruesi te ri (rol automatik `MEMBER`)               | Vizitor             |
| RF-02 | Identifikimi (login) me email/fjalekalim, kthim i JWT (access+refresh)    | Te gjithe           |
| RF-03 | Identifikim me dy faktore (MFA/TOTP): setup, enable, disable, verify      | Perdoruesi i loguar |
| RF-04 | Rifreskimi i access token-it permes refresh token-it                      | Te gjithe           |
| RF-05 | Shikimi i te dhenave te llogarise vetjake (`/auth/me`, `/members/me`)     | Perdoruesi i loguar |
| RF-06 | CRUD per **Libra** (krijim/perditesim nga ADMIN/LIBRARIAN, fshirje vetem ADMIN, lexim publik) | ADMIN, LIBRARIAN, te gjithe |
| RF-07 | CRUD per **Autore** (krijim/perditesim ADMIN/LIBRARIAN, fshirje ADMIN, lexim publik)          | ADMIN, LIBRARIAN, te gjithe |
| RF-08 | CRUD per **Kategori** (njesoj si autoret, me emer unik)                  | ADMIN, LIBRARIAN, te gjithe |
| RF-09 | Menaxhimi i **Anetareve**: liste/kerkim (ADMIN/LIBRARIAN), shikim/perditesim profili vetjak ose nga ADMIN/LIBRARIAN, fshirje (ADMIN) | ADMIN, LIBRARIAN, MEMBER |
| RF-10 | **Huazimi** i nje libri nga nje anetar (ose ne emer te tij nga ADMIN/LIBRARIAN), me kontroll te kopjeve te disponueshme | MEMBER, ADMIN, LIBRARIAN |
| RF-11 | **Kthimi** i nje libri te huazuar, me rivendosje te kopjeve te disponueshme | Pronari i huazimit, ADMIN, LIBRARIAN |
| RF-12 | Shenimi automatik i huazimeve te skaduara si `OVERDUE` (`/loans/mark-overdue`) | ADMIN, LIBRARIAN |
| RF-13 | Paginim, kerkim dhe filtrim per listat (libra, anetare, huazime)          | Te gjithe |
| RF-14 | Pengimi i fshirjes se nje autori/kategorie/libri/anetari qe ka regjistrime te lidhura aktive (libra, huazime aktive) | ADMIN |
| RF-15 | Audit log per veprimet e ndjeshme (login, MFA, CRUD mbi books/authors/categories/members/loans) | Sistemi |

### 3.2 Kerkesat jo-funksionale

| Kategoria        | Kerkesa dhe implementimi |
|-------------------|---------------------------|
| **Siguria**       | Hashing fjalekalimesh me `bcryptjs`; token-a JWT te nenshkruar (HS256) me kohe skadence te ndara per access/refresh/MFA-pending; RBAC me middleware `authorize(...roles)`; `helmet` per HTTP headers te sigurt; `cors`; **rate limiting** (max kerkesa/15min); validim i rrepte i input-it me `express-validator`; **audit log** i izoluar (`logs/audit.log`, format JSON) qe nuk perzihet me log-un e aplikacionit. |
| **Performanca**   | **Redis cache** per endpoint-et e listave/detajeve te librave, autoreve, kategorive (TTL 120-300s), me invalidim automatik ne cdo `create/update/delete`; paginim (`page`, `limit`) per te gjitha listat; indekse ne Prisma schema (`@@index`) per fushat me kerkim te shpeshte (`title`, `authorId`, `memberId`, `bookId`, `status`). |
| **Skalabiliteti / Mirembajtja** | Arkitekture e shtresuar (routes/controllers/services), kod i organizuar sipas pergjegjesise se vetme (SOLID-SRP); `asyncHandler` per trajtim uniform te gabimeve async; Prisma migrations per evolimin e skemes pa humbje te dhenash. |
| **Disponueshmeria / Qendrueshmeria** | `Dockerfile` me `HEALTHCHECK`; `docker-compose.yml` me healthcheck per Postgres/Redis dhe `depends_on: condition: service_healthy`; trajtim global i gabimeve (`error.middleware.js`) me kode HTTP standarde dhe pergjigje JSON konsistente. |
| **Dokumentueshmeria** | OpenAPI 3.0.3 i gjeneruar nga `swagger-jsdoc`, i shfaqur ne `/api/docs` me Swagger UI; README dhe udhezues hap-pas-hapi (`UDHEZUES.md`) per instalim/ekzekutim. |
| **Testueshmeria** | 116 teste automatike (Jest + Supertest): teste njesie per util-e dhe shtresen e sherbimeve (me mock te Prisma), dhe teste integrimi qe ekzekutojne API-ne e plote kunder nje databaze reale PostgreSQL te dedikuar per teste. |
| **Portabiliteti / Versionimi** | API e versionuar (`/api/v1`) per kompatibilitet prapavajtes; aplikacion i konteinerizuar (Docker), i ekzekutueshem ne cdo OS qe mbeshtet Docker; konfigurim permes variablave te mjedisit (`.env`). |
| **Auditueshmeria** | Cdo veprim i ndjeshem (login i suksesshem/i deshtuar, refresh, setup/enable/disable/verify MFA, krijim/perditesim/fshirje per books/authors/categories/members/loans, huazim/kthim/mark-overdue) regjistrohet me: `userId`, `email`, `role`, `ip`, `action`, `outcome`, `resource`, `resourceId`, `meta`/`reason`. |

---

## 4. Dizajni i sistemit

### 4.1 Arkitektura e pergjithshme

```
┌──────────────────────┐        HTTPS/JSON        ┌────────────────────────────────────────────┐
│   Frontend (SPA)      │ ────────────────────────▶ │              Backend API (Node)              │
│   React + Vite         │                           │            Express 5  —  /api/v1             │
│   - Login/Register      │                          │                                              │
│   - Books/Authors/      │ ◀──────────────────────  │  ┌─────────┐   ┌─────────────┐   ┌─────────┐ │
│     Categories/Members  │                          │  │ Routes  │──▶│ Controllers │──▶│ Services│ │
│   - Loans / Profile     │                          │  └─────────┘   └─────────────┘   └────┬────┘ │
│   - Dashboard            │                         │                                          │      │
└──────────────────────┘                            │  Middleware: helmet, cors, rate-limit,   │      │
                                                       │  JWT auth (authenticate/authorize),      │      │
                                                       │  express-validator, cache, audit log     │      │
                                                       └───────────────────┬───────────────────┘
                                                                            │
                              ┌─────────────────────────────┬──────────────┴───────────────┬───────────────────────┐
                              ▼                             ▼                              ▼
                     ┌──────────────────┐          ┌──────────────────┐          ┌────────────────────────┐
                     │   PostgreSQL 16    │          │     Redis 7        │          │   logs/ (Winston)       │
                     │   (Prisma ORM)     │          │  (cache i listave)  │          │  app + error + audit    │
                     └──────────────────┘          └──────────────────┘          └────────────────────────┘
```

### 4.2 Modeli i te dhenave (ER — entitet/relacione)

```
 ┌────────────┐  1      1  ┌────────────┐
 │   User      │───────────│   Member    │
 │ id          │           │ id          │
 │ email (uniq)│           │ userId (FK) │
 │ password    │           │ phone       │
 │ name        │           │ address     │
 │ role        │           │ membershipDt│
 │ mfaEnabled  │           └─────┬──────┘
 │ mfaSecret   │                 │ 1
 └────────────┘                 │
                                  │ N
                           ┌─────┴──────┐        N        1  ┌────────────┐
                           │    Loan     │──────────────────▶│    Book     │
                           │ id          │                    │ id          │
                           │ bookId (FK) │                    │ title       │
                           │ memberId(FK)│                    │ isbn (uniq) │
                           │ loanDate    │                    │ totalCopies │
                           │ dueDate     │                    │ availableCop│
                           │ returnDate  │                    │ authorId(FK)│
                           │ status      │                    │ categoryId  │
                           └────────────┘                    └──────┬─────┘
                                                                      │ N        1
                                                          ┌───────────┴──┐  ┌─────────────┐
                                                          │    Author     │  │  Category    │
                                                          │ id            │  │ id           │
                                                          │ name          │  │ name (uniq)  │
                                                          │ bio           │  └─────────────┘
                                                          └──────────────┘
```

Relacionet kryesore (te perkufizuara ne `prisma/schema.prisma`):

- **User 1—1 Member**: cdo perdorues me rol `MEMBER` ka nje profil `Member` (telefon, adrese, data e
  anetaresimit). Fshirja e `User` shkakton `onDelete: Cascade` te `Member`.
- **Author 1—N Book**, **Category 1—N Book** (categoria opsionale: `categoryId Int?`).
- **Member 1—N Loan**, **Book 1—N Loan**.
- `LoanStatus` enum: `ACTIVE | RETURNED | OVERDUE`.
- `Role` enum: `ADMIN | LIBRARIAN | MEMBER`.

### 4.3 Rrjedha e identifikimit (sequence — Login + MFA)

```
Klienti                     API (Express)                    DB (Postgres)
   │  POST /api/v1/auth/login                                       │
   │ ───────────────────────────▶                                    │
   │                              │  user = findUnique({email})       │
   │                              │ ──────────────────────────────────▶
   │                              │ ◀──────────────────────────────────
   │                              │  bcrypt.compare(pass, user.password)
   │                              │  nese user.mfaEnabled == true:
   │                              │    mfaToken = sign({sub,type:'mfa_pending'})
   │ ◀───────────────────────────  { requiresMfa: true, mfaToken }
   │                                                                  │
   │  POST /api/v1/mfa/verify {mfaToken, code}                       │
   │ ───────────────────────────▶                                    │
   │                              │  verify(mfaToken) -> payload      │
   │                              │  user = findUnique({id:payload.sub})
   │                              │ ──────────────────────────────────▶
   │                              │ ◀──────────────────────────────────
   │                              │  speakeasy.totp.verify(secret, code)
   │                              │  accessToken = sign(...), refreshToken = sign(...)
   │                              │  logAudit('mfa.verify_login', success)
   │ ◀───────────────────────────  { user, accessToken, refreshToken }
```

### 4.4 Struktura e projektit

```
projekti-api/
├── prisma/
│   ├── schema.prisma          # Modelet: User, Member, Author, Category, Book, Loan
│   ├── seed.js                # Te dhena fillestare (admin/librarian/member, libra demo)
│   └── migrations/            # Historiku i migrimeve te DB-se
├── src/
│   ├── config/                # env, logger, audit-logger, prisma, redis, swagger
│   ├── controllers/           # auth, mfa, books, authors, categories, members, loans
│   ├── middleware/             # auth (JWT/RBAC), validate, cache, error
│   ├── routes/v1/              # Endpoint-et REST te versionuara
│   ├── services/                # Logjika e biznesit (Prisma queries, validime biznesi)
│   ├── utils/                   # ApiError, asyncHandler, jwt, audit
│   ├── validators/               # Rregulla validimi (express-validator)
│   ├── app.js                    # Konfigurimi i Express (middleware, routes, error handler)
│   └── server.js                 # Pika hyrese (http listen)
├── tests/
│   ├── unit/                     # 6 suite — ApiError, jwt, audit, *.service
│   ├── integration/              # 7 suite — auth, mfa, loans, books, authors, categories, members
│   └── helpers/db.js             # resetDatabase/disconnect per teste
├── frontend/                       # Aplikacioni React + Vite
│   ├── src/
│   │   ├── api/                    # klient axios/fetch per cdo resurse (auth, books, loans, ...)
│   │   ├── components/             # Layout, Modal, Pagination, ProtectedRoute, Spinner, ...
│   │   ├── context/                 # AuthContext (token, user, role)
│   │   └── pages/                   # Login, Register, Dashboard, Books, Authors, Categories,
│   │                                 #   Members, MemberDetail, Loans, Profile, NotFound
│   └── vite.config.js
├── .github/workflows/ci.yml        # CI: lint/migrate/test + docker build
├── Dockerfile
├── docker-compose.yml               # postgres + redis + api
└── package.json
```

---

## 5. Pershkrimi i implementimit

### 5.1 Stack teknologjik

| Shtresa     | Teknologjia |
|-------------|--------------|
| Runtime     | Node.js 20+ |
| Framework (BE) | Express 5 |
| Frontend    | React + Vite |
| Databaza    | PostgreSQL 16 |
| ORM         | Prisma 6 |
| Autentifikim | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` |
| MFA         | `speakeasy` (TOTP) + `qrcode` |
| Caching     | Redis (`ioredis`) |
| Validim     | `express-validator` |
| Logim       | Winston + Morgan |
| Dokumentim  | `swagger-jsdoc` + `swagger-ui-express` |
| Teste       | Jest + Supertest |
| Cilesia e kodit | ESLint (flat config) + Prettier |
| Konteinerizim | Docker + docker-compose |
| CI/CD       | GitHub Actions |

### 5.2 Arkitektura e shtresuar (backend)

Kodi i backend-it ndjek nje arkitekture klasike me shtresa te ndara qarte, me qellim respektimin e
parimeve **SOLID** (vecanerisht *Single Responsibility* dhe *Dependency direction*):

1. **Routes** (`src/routes/v1/*.js`) — perkufizojne endpoint-et HTTP, lidhin middleware-t
   (autentifikim, autorizim, validim, cache) me controller-at perkates, dhe mbajne dokumentimin
   OpenAPI (JSDoc `@openapi`).
2. **Controllers** (`src/controllers/*.js`) — pranojne `req`/`res`, thirrin shtresen e sherbimeve,
   formatojne pergjigjen JSON (`{ success, data }` ose `{ success, items, pagination }`), dhe
   regjistrojne ngjarje ne **audit log** kur eshte rasti.
3. **Services** (`src/services/*.js`) — permbajne logjiken e biznesit te pastert (rregulla si
   "nuk mund te fshish nje autor qe ka libra", "nuk mund te huazosh nje liber pa kopje te lira"),
   komunikojne me databazen permes Prisma dhe me cache-in permes `invalidatePrefix`.
4. **Prisma ORM / PostgreSQL** — shtresa e qendrueshmerise; skema e percaktuar deklarativisht ne
   `prisma/schema.prisma`, e versionuar permes migrimeve.

Gabimet trajtohen ne menyre uniforme permes klases `ApiError` (`src/utils/ApiError.js`) dhe
middleware-it global `error.middleware.js`, qe kthen gjithmone strukturen:

```json
{ "success": false, "error": { "code": 404, "message": "Book not found" } }
```

### 5.3 Autentifikimi, autorizimi dhe MFA

- **Regjistrimi/Login** (`src/services/auth.service.js`): fjalekalimet hashohen me `bcrypt`
  (`config.bcryptRounds`); login kthen `accessToken` + `refreshToken` (JWT, HS256) me payload
  `{ sub, email, role }`.
- **Refresh** (`POST /auth/refresh`): verifikon `refreshToken` (tip `refresh`) dhe leshon nje
  cift te ri token-ash.
- **MFA (TOTP)** (`src/services/mfa.service.js`):
  - `POST /mfa/setup` — gjeneron sekret TOTP (`speakeasy.generateSecret`) dhe nje QR code
    (`qrcode.toDataURL`) per Google Authenticator/Authy.
  - `POST /mfa/enable` — verifikon kodin e pare TOTP dhe aktivizon `mfaEnabled = true`.
  - Kur MFA eshte aktive, `login` nuk leshon menjehere token-a, por nje `mfaToken` (tip
    `mfa_pending`, jetegjatesi e shkurter) dhe `{ requiresMfa: true }`.
  - `POST /mfa/verify` — pranon `{ mfaToken, code }`, verifikon TOTP-in (me dritare toleranc
    `window: 1`) dhe vetem atehere leshon `accessToken`/`refreshToken` te plote.
  - `POST /mfa/disable` — kerkon nje kod TOTP te vlefshem para se te ckaktivizoje MFA-ne.
- **RBAC** (`src/middleware/auth.middleware.js`):
  - `authenticate` — verifikon `Authorization: Bearer <token>`, refuzon token-a te tipit
    `refresh`/`mfa_pending` ne endpoint-et e zakonshme.
  - `authorize(...roles)` — kontrollon `req.user.role` kunder nje liste rolesh te lejuara
    (p.sh. `authorize('ADMIN','LIBRARIAN')`), duke kthyer `403 Forbidden` ne te kundert.

### 5.4 Audit logging (siguri & gjurmueshmeri)

Per t'iu pergjigjur kerkeses per **auditim te veprimeve te perdoruesve**, eshte shtuar nje shtrese e
dedikuar audit-loggimi, e ndare nga log-u standard i aplikacionit:

- `src/config/audit-logger.js` — nje logger i vecante Winston, qe shkruan ne **`logs/audit.log`**
  ne format **JSON** (pa dalje ne konsole), me `defaultMeta: { service: 'library-api-audit' }`.
- `src/utils/audit.js` — funksioni `logAudit(req, { action, outcome, resource, resourceId,
  actorEmail, reason, meta })`, qe ndertonon nje rekord te plote: `userId`, `email`, `role`
  (te marra nga `req.user`, ose `actorEmail` per veprime te deshtuara para autentifikimit), `ip`
  (`req.ip`), `resource`, `resourceId`, dhe fusha opsionale `reason`/`meta`.
- **Veprimet e mbuluara**:
  - `auth.register`, `auth.login` (sukses **dhe** deshtim, me `reason`), `auth.refresh`
  - `mfa.setup`, `mfa.enable`, `mfa.disable`, `mfa.verify_login` (sukses/deshtim)
  - `book.create` / `book.update` / `book.delete`
  - `author.create` / `author.update` / `author.delete`
  - `category.create` / `category.update` / `category.delete`
  - `member.update` / `member.delete`
  - `loan.borrow` / `loan.return` / `loan.mark_overdue`

Shembull rekord nga `logs/audit.log`:

```json
{
  "level": "info",
  "message": "audit_event",
  "service": "library-api-audit",
  "timestamp": "2026-06-10T10:15:23.123Z",
  "action": "loan.borrow",
  "outcome": "success",
  "userId": 3,
  "email": "member@library.com",
  "role": "MEMBER",
  "ip": "::1",
  "resource": "loan",
  "resourceId": 12,
  "meta": { "bookId": 2, "memberId": 1 }
}
```

Ky log eshte i ndare nga `error.log`/`combined.log` (qe mbeten per debug/monitorim teknik), dhe
mund te perdoret ne te ardhmen per integrim me nje sistem SIEM ose dashboard auditimi.

### 5.5 Caching me Redis

Endpoint-et publike te listave/detajeve (`GET /books`, `GET /books/:id`, `GET /authors`,
`GET /authors/:id`, `GET /categories`, `GET /categories/:id`) kalojne permes
`cacheMiddleware(prefix, ttl)`:

- Nese `Redis` eshte i konfiguruar (`REDIS_URL`), kerkesa kontrollohet ne cache me celes
  `"<prefix>:<originalUrl>"`. Nese gjendet, kthehet direkt pergjigja e ruajtur (cache hit).
- Ne te kundert (cache miss), pergjigja gjenerohet normalisht dhe ruhet me `SETEX` (TTL
  120s per lista, 300s per detaje).
- Ne cdo `create`/`update`/`delete`, sherbimi perkates thret `invalidatePrefix(prefix)`, qe
  fshin te gjitha celesat me ate prefiks (p.sh. `books:*`), duke garantuar konsistence te te
  dhenave.
- Nese Redis nuk eshte i disponueshem, sistemi vazhdon te funksionoje normalisht (graceful
  fallback — `cacheMiddleware` thjesht thirret `next()`).

### 5.6 Validimi dhe trajtimi i gabimeve

- Cdo route ka rregulla validimi te percaktuara me `express-validator` (p.sh. email i vlefshem,
  fjalekalim min. 8 karaktere, ISBN max 20 karaktere, `page`/`limit` numra te plote pozitiv).
- Middleware `validate.middleware.js` mbledh gabimet e validimit dhe i kthen si `400 Bad Request`
  me `error.details` (lista fushash + mesazhe).
- Gabimet e biznesit (p.sh. "ISBN already exists", "Cannot delete author with books", "Member has
  active loans") hidhen si `ApiError` me kodin HTTP perkates (400/401/403/404/409) dhe kapen nga
  `error.middleware.js`.

### 5.7 Dokumentimi i API-se (OpenAPI/Swagger)

Cdo route eshte e dokumentuar me anotacione `@openapi` (JSDoc), te mbledhura nga `swagger-jsdoc` ne
nje specifikim **OpenAPI 3.0.3**, te shfaqur interaktivisht ne **`/api/docs`** (Swagger UI) dhe ne
format JSON ne `/api/docs.json`. Specifikimi perfshin skema per `AuthResponse`, `BookCreate`,
pergjigje te perbashketa (`Unauthorized`, `Forbidden`, `NotFound`, `ValidationError`), dhe skemen
e sigurise `bearerAuth` (JWT).

### 5.8 Frontend (React + Vite)

Aplikacioni frontend (`frontend/`) eshte nje **Single Page Application** ne React, i ndertuar me
Vite, qe konsumon API-ne REST permes nje shtrese `api/` (nje modul per cdo resurse: `auth`,
`authors`, `books`, `categories`, `loans`, `members`, `mfa`).

- **`context/`** — `AuthContext` ruan token-in JWT, te dhenat e perdoruesit dhe rolin, dhe i ben
  te disponueshem ne te gjithe aplikacionin.
- **`components/`** — `Layout` (navigim sipas rolit), `ProtectedRoute` (mbron rrugët qe kerkojne
  autentifikim/role specifike), `Modal`, `Pagination`, `Spinner`, `Alert`, `StatusBadge`.
- **`pages/`** — `Login`, `Register`, `Dashboard`, `Books`, `BookDetail`, `Authors`, `Categories`,
  `Members`, `MemberDetail`, `Loans`, `Profile`, `NotFound`.
- Flukset kryesore te mbuluara nga UI: regjistrim/login (perfshire MFA), shfletim/kerkim/paginim
  librash, huazim/kthim librash, menaxhim librash/autoresh/kategorish (ADMIN/LIBRARIAN), menaxhim
  anetaresh dhe profili personal, aktivizim/ckaktivizim MFA nga profili.

### 5.9 Konteinerizimi (Docker & docker-compose)

- **`Dockerfile`** — build me shumë faza (`base` → `deps` → `runner`), bazuar ne `node:20-alpine`;
  instalon vetem `dependencies` (jo `devDependencies`), gjeneron Prisma Client, ekzekutohet me
  perdorues jo-root, ka `HEALTHCHECK` ne `/api/v1/health`, dhe ne starup ekzekuton
  `prisma migrate deploy` para `node src/server.js`.
- **`docker-compose.yml`** — orkestron tre sherbime: `postgres` (port 5434→5432, me volum
  persistent `library_pgdata`), `redis` (port 6379), dhe `api` (port 4000), te lidhura permes
  `depends_on: condition: service_healthy`.

### 5.10 CI/CD (GitHub Actions)

Workflow `.github/workflows/ci.yml` ekzekutohet ne `push`/`pull_request` ne `main`/`develop`:

1. **Job `test`**: ngre nje container Postgres si *service*, instalon dependencat (`npm ci`),
   gjeneron Prisma Client, aplikon migrimet (`prisma migrate deploy`) dhe ekzekuton `npm test`
   (116 teste).
2. **Job `docker`** (varet nga `test`): ndertimi i imazhit Docker te aplikacionit (pa push),
   me cache te GitHub Actions per shpejtesi.

Kjo garanton qe cdo ndryshim i ri ne kod **nuk thyen** testet ekzistuese dhe se imazhi Docker
mbetet i ndertueshem.

---

## 6. Testimi dhe rezultatet

### 6.1 Strategjia e testimit

Testimi eshte i ndare ne dy nivele:

- **Teste njesie (unit)** — testojne funksione/module te izoluara (ne `tests/unit/`), duke
  *mockuar* Prisma Client dhe Redis, per te verifikuar logjiken e biznesit pa varesi nga nje
  databaze reale (p.sh. rregullat "nuk fshihet kategoria me libra", "ISBN duplikat → 409").
- **Teste integrimi** — ekzekutojne API-ne e plote (`src/app.js`) permes **Supertest**, kunder
  nje databaze **PostgreSQL reale** te dedikuar per teste (`library_test_db`), duke mbuluar
  rrjedhat e plota HTTP: autentifikim, role/leje, validim, kodet e statusit dhe formatin e
  pergjigjeve.

Te gjitha testet ekzekutohen ne menyre sekuenciale (`jest --runInBand`) per te shmangur konfliktet
mbi te njejten databaze.

### 6.2 Permbledhje e test suite-ve

| Lloji      | Test suite                              | Nr. testesh | Mbulon |
|------------|-------------------------------------------|:-----------:|--------|
| Njesi      | `tests/unit/ApiError.test.js`              | 6  | Klasa `ApiError` (400/401/403/404/409, `details`) |
| Njesi      | `tests/unit/jwt.test.js`                   | 3  | Sign/verify JWT, token i pavlefshem/i manipuluar |
| Njesi      | `tests/unit/audit.test.js`                 | 3  | `logAudit` — payload korrekt, fallback `actorEmail`, `meta`/`reason` opsionale |
| Njesi      | `tests/unit/categories.service.test.js`    | 6  | `getCategoryById`, `createCategory` (409 emer), `deleteCategory` (409 me libra) |
| Njesi      | `tests/unit/authors.service.test.js`       | 6  | `getAuthorById`, `updateAuthor` (404), `deleteAuthor` (409 me libra) |
| Njesi      | `tests/unit/books.service.test.js`         | 11 | `createBook` (409 ISBN, 400 author/category, default `availableCopies`), `updateBook` (404, 409 ISBN), `deleteBook` (404, 409 huazime aktive) |
| Integrim   | `tests/integration/auth.test.js`           | 8  | Register (201/409/400), Login (200/401), `/auth/me` (401/200) |
| Integrim   | `tests/integration/mfa.test.js`            | 12 | Setup/Enable/Disable/Verify MFA, login me `requiresMfa`, kode TOTP te sakta/te gabuara |
| Integrim   | `tests/integration/loans.test.js`          | 7  | Huazim, dyfishim (409), pa kopje (409), kthim, ri-kthim (409), liste (ADMIN/403 MEMBER) |
| Integrim   | `tests/integration/books.test.js`          | 14 | CRUD i plote, role (401/403), validim (400), ISBN duplikat (409), fshirje me huazime aktive (409) |
| Integrim   | `tests/integration/authors.test.js`        | 11 | CRUD i plote, role, validim, fshirje autori me libra (409) |
| Integrim   | `tests/integration/categories.test.js`     | 13 | CRUD i plote, role, validim, emer duplikat (409), fshirje kategorie me libra (409) |
| Integrim   | `tests/integration/members.test.js`        | 16 | `/me`, liste (403 MEMBER), qasje vetem ne profilin vetjak (403), perditesim, fshirje me huazime aktive (409) |
| **Total**  |                                             | **116** | |

### 6.3 Rezultatet e ekzekutimit

```
$ npm test

Test Suites: 13 passed, 13 total
Tests:       116 passed, 116 total
Snapshots:   0 total
Time:        ~12s
```

### 6.4 Cilesia e kodit (lint)

```
$ npm run lint
> library-api@1.0.0 lint
> eslint .

(pa gabime/warnings)
```

Konfigurimi ESLint (flat config, `eslint.config.js`) perdor `@eslint/js` (recommended),
`globals` (Node + Jest), dhe `eslint-config-prettier` (per te shmangur konfliktet me Prettier).
Rregulla kryesore: `no-unused-vars` (me `argsIgnorePattern`/`varsIgnorePattern` per parametra te
pa-perdorur te shenuar me `_`).

### 6.5 Testim manual

Perpos testeve automatike, API-ja eshte testuar manualisht permes:

- **Swagger UI** (`/api/docs`) — ekzekutim i çdo endpoint-i me `Authorize` (Bearer token), per te
  verifikuar pergjigjet reale dhe kodet e statusit per role te ndryshme (ADMIN/LIBRARIAN/MEMBER).
- **Frontend (React)** — testim i fluksit te plote nga UI: regjistrim → login → (MFA nese aktive)
  → shfletim librash → huazim/kthim → menaxhim libra/autore/kategori (per role me te drejta) →
  menaxhim profili.
- **Postman/cURL** — verifikim shtese i skenareve te gabimeve (token i skaduar/i pavlefshem,
  fjalekalim i gabuar, ISBN duplikat, etj.).

> *(Shto ketu screenshot-e konkrete nga Swagger UI dhe nga frontend-i — shih Shtojcen 9.5.)*

---

## 7. Konkluzione

Projekti arriti te implementoje nje **REST API te plote, te sigurte dhe te dokumentuar mire** per
menaxhimin e nje biblioteke, te shoqeruar nga nje **aplikacion web funksional**, duke u perputhur
me kerkesat kryesore te lendes: arkitekture e shtresuar, siguri (JWT/RBAC/MFA/audit), performance
(caching, paginim, indekse), dokumentim OpenAPI, versionim, logim/monitorim, integrim me databaze
relacionale, standarde kodimi (ESLint/Prettier) dhe teste automatike (116), si dhe konteinerizim
dhe CI/CD.

**Sfidat kryesore** te hasura dhe menyra e zgjidhjes:

- **Konfigurimi i mjedisit te testimit ne CI** — variablat e mjedisit te `.env.test` (te
  konfiguruara per Postgres lokal ne portin `5434`) e mbishkruanin `DATABASE_URL`-in e injektuar
  nga GitHub Actions (porti `5432`). Zgjidhja: heqja e flamurit `override: true` ne
  `tests/setup-env.js`, duke lejuar variablat e CI-se te kene perparesi.
- **Migrimet ne CI** — `prisma/migrations/` ishin te perjashtuara nga git (`.gitignore`), keshtu
  qe `prisma migrate deploy` ne CI nuk gjente asnje migrim per t'u aplikuar dhe tabelat (p.sh.
  `loans`) nuk ekzistonin. Zgjidhja: heqja e ketij rreshti nga `.gitignore`, ne menyre qe
  migrimet te jene pjese e repository-t.
- **Mbulimi me teste**: fillimisht vetem `auth` dhe `loans` ishin te mbuluara me teste integrimi;
  u shtuan suite te plota per `books`, `authors`, `categories`, `members`, `mfa`, si dhe teste
  njesie per shtresen e sherbimeve dhe per audit-loggimin.

**Permiresime te mundshme ne te ardhmen**:

- Integrim me nje sistem te centralizuar te logeve/monitorimit (p.sh. ELK Stack ose Grafana
  Loki) per audit log dhe metrika.
- Shtim i njoftimeve me email (p.sh. kujtesa per huazime qe afrohen drejt skadences).
- Role/leje me te detajuara (p.sh. nen-role per stafin e bibliotekes).
- "Refresh token rotation" dhe lista e zezë (blacklist) e token-ave te revokuar.
- Cache me te avancuar (invalidim selektiv ne vend te `invalidatePrefix` te plote).

---

## 8. Referencat

- Express.js — Dokumentimi zyrtar, https://expressjs.com/
- Prisma ORM — Dokumentimi zyrtar, https://www.prisma.io/docs
- PostgreSQL — Dokumentimi zyrtar, https://www.postgresql.org/docs/
- JSON Web Tokens (JWT) — https://jwt.io/introduction
- OWASP — Cheat Sheet Series (Authentication, REST Security), https://cheatsheetseries.owasp.org/
- OpenAPI Specification — https://swagger.io/specification/
- Redis — Dokumentimi zyrtar, https://redis.io/docs/
- Jest — Dokumentimi zyrtar, https://jestjs.io/docs/getting-started
- Speakeasy (TOTP/2FA) — https://www.npmjs.com/package/speakeasy
- React — Dokumentimi zyrtar, https://react.dev/
- Vite — Dokumentimi zyrtar, https://vitejs.dev/
- Docker — Dokumentimi zyrtar, https://docs.docker.com/
- GitHub Actions — Dokumentimi zyrtar, https://docs.github.com/actions
- Materialet e lendes "Sherbime Web dhe API-Web (SPDD)" — Prof.ass.Dr.sc. Liridon Hoti

---

## 9. Shtojca

### 9.1 Lista e endpoint-ve kryesore

**Auth** (`/api/v1/auth`)

| Metoda | Path | Pershkrim | Auth |
|---|---|---|---|
| POST | `/register` | Regjistrim perdoruesi i ri (rol `MEMBER`) | — |
| POST | `/login` | Login → JWT ose `requiresMfa` | — |
| POST | `/refresh` | Access token i ri nga refresh token | — |
| GET  | `/me` | Te dhenat e perdoruesit aktual | JWT |

**MFA** (`/api/v1/mfa`)

| Metoda | Path | Pershkrim | Auth |
|---|---|---|---|
| POST | `/setup` | Gjenero sekret TOTP + QR | JWT |
| POST | `/enable` | Aktivizo MFA me kod TOTP | JWT |
| POST | `/disable` | Ckativizo MFA me kod TOTP | JWT |
| POST | `/verify` | Perfundo login me `mfaToken` + kod | — |

**Books** (`/api/v1/books`)

| Metoda | Path | Pershkrim | Roli |
|---|---|---|---|
| GET | `/` | Liste librash (paginim, kerkim, filtra) | Publik |
| GET | `/:id` | Detaje libri | Publik |
| POST | `/` | Krijim libri | ADMIN/LIBRARIAN |
| PUT | `/:id` | Perditesim libri | ADMIN/LIBRARIAN |
| DELETE | `/:id` | Fshirje libri | ADMIN |

**Authors** (`/api/v1/authors`) dhe **Categories** (`/api/v1/categories`) — te njejtin model
si Books (GET publik; POST/PUT ADMIN/LIBRARIAN; DELETE ADMIN; bllokim fshirje nese ka libra te
lidhur).

**Members** (`/api/v1/members`)

| Metoda | Path | Pershkrim | Auth |
|---|---|---|---|
| GET | `/me` | Profili i anetarit aktual | JWT |
| GET | `/` | Liste anetaresh (paginim, kerkim) | ADMIN/LIBRARIAN |
| GET | `/:id` | Detaje anetari (vetjak ose ADMIN/LIBRARIAN) | JWT |
| PUT | `/:id` | Perditesim profili (vetjak ose ADMIN/LIBRARIAN) | JWT |
| DELETE | `/:id` | Fshirje anetari (vetem nese s'ka huazime aktive) | ADMIN |

**Loans** (`/api/v1/loans`)

| Metoda | Path | Pershkrim | Auth |
|---|---|---|---|
| GET | `/me` | Huazimet e mia | JWT |
| GET | `/` | Te gjitha huazimet | ADMIN/LIBRARIAN |
| POST | `/borrow` | Huazim libri | JWT |
| POST | `/:id/return` | Kthim libri | JWT (vetem pronari, ose ADMIN/LIBRARIAN) |
| POST | `/mark-overdue` | Sweep huazimesh te skaduara | ADMIN/LIBRARIAN |

### 9.2 Perdoruesit e paracaktuar (seed)

| Email | Fjalekalimi | Roli |
|---|---|---|
| admin@library.com | admin123 | ADMIN |
| librarian@library.com | librarian123 | LIBRARIAN |
| member@library.com | member123 | MEMBER |

### 9.3 Variablat kryesore te mjedisit (`.env`)

| Variabla | Pershkrim | Vlere shembull |
|---|---|---|
| `DATABASE_URL` | Lidhja me PostgreSQL | `postgresql://library:library@localhost:5434/library_db?schema=public` |
| `JWT_SECRET` | Sekreti per nenshkrimin e JWT | (i fshehte, min. 32+ karaktere ne prodhim) |
| `JWT_EXPIRES_IN` | Jetegjatesia e access token-it | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Jetegjatesia e refresh token-it | `7d` |
| `BCRYPT_ROUNDS` | Numri i raundeve bcrypt | `10` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Konfigurimi i rate-limiting | `900000` / `100` |
| `REDIS_URL` | Lidhja me Redis (opsionale) | `redis://localhost:6379` |
| `LOG_LEVEL` | Niveli i logimit (Winston) | `info` |

### 9.4 Komandat kryesore

| Komanda | Pershkrim |
|---|---|
| `npm run setup` | Postgres (Docker) + migrime + seed |
| `npm run dev` | API ne `http://localhost:4000` me auto-reload |
| `npm test` | 116 teste (Jest, `--runInBand`) |
| `npm run lint` | ESLint mbi krejt projektin |
| `docker compose up -d --build` | Ngritja e plote e stack-ut (Postgres + Redis + API) |

### 9.5 Ekran-pamje (Screenshots)

> *(Ketu shtohen ekran-pamje reale, p.sh.:)*
> - Swagger UI — `/api/docs` me endpoint-et e zgjeruara
> - Pergjigje `200 OK` per `GET /api/v1/books`
> - Frontend — faqja e Login/Register
> - Frontend — lista e librave me paginim
> - Frontend — Dashboard / Profile me opsionin e MFA
> - Rezultati i `npm test` (116/116 PASS)
> - Rezultati i `npm run lint` (pa gabime)
