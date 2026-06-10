# Udhezues per ekzekutimin e projektit

Ky dokument shpjegon hap pas hapi qysh me e xhiru projektin **Library API** ne kompjuterin tend, edhe per Windows edhe per macOS. Asht per anetaret e grupit qe s'kane gje te instalume.

---

## Pjesa 1 — Cka duhet me instalu (1 here)

### Windows

#### 1.1 Node.js (versioni 20 ose me i ri)
- Shko ne https://nodejs.org
- Shkarko **LTS** (20 ose 22) — file `.msi`
- Hap installer-in → **Next, Next, Next** → **Install**
- Pas instalimit, hap **Command Prompt** ose **PowerShell** edhe verifiko:
```
node --version
npm --version
```
Duhet te dale `v20.x.x` (ose me i ri) edhe `10.x` (ose me i ri).

#### 1.2 Docker Desktop
- Shko ne https://www.docker.com/products/docker-desktop
- Shkarko **Docker Desktop for Windows**
- Instalo. Gjate instalimit kerkon **WSL 2** — pranoji.
- Pas instalimit, **rinis kompjuterin** nese te kerkon.
- Hap **Docker Desktop** nga Start Menu — prit derisa ne kendin e poshtem te dale "Engine running".
- Verifiko ne CMD/PowerShell:
```
docker --version
docker compose version
```

#### 1.3 Git
- Shko ne https://git-scm.com/download/win → shkarko → instalo me opsionet default.
- Verifiko:
```
git --version
```

#### 1.4 (Opsionale por shume e dobishme) Editor kodi
- **VS Code**: https://code.visualstudio.com → instalo
- **Postman** (per testim API-sh): https://www.postman.com/downloads → instalo

---

### macOS

#### 1.1 Node.js
**Opsioni A — Homebrew** (rekomandohet):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

**Opsioni B — Installer**:
- Shko ne https://nodejs.org → shkarko **LTS macOS Installer (.pkg)** → instalo
- Verifiko:
```bash
node --version
npm --version
```

#### 1.2 Docker Desktop
- Shko ne https://www.docker.com/products/docker-desktop
- Shkarko per Mac:
  - **Apple Silicon (M1/M2/M3/M4)** nese ke Mac te ri
  - **Intel** nese ke Mac te vjeter
- Instalo (drag ne Applications) → hap → prit derisa ne menubar te shfaqet balena.
- Verifiko:
```bash
docker --version
docker compose version
```

#### 1.3 Git
- Eshte zakonisht i instalume. Verifiko:
```bash
git --version
```
Nese del dialog "command line developer tools", kliko **Install** edhe prit te perfundoje.

#### 1.4 (Opsionale)
- **VS Code**: https://code.visualstudio.com
- **Postman**: https://www.postman.com/downloads

---

## Pjesa 2 — Marrja e projektit

Pranoji file-at e projektit (zip ose git) prej anetarit qe e ka. Vendoseni ne nje folder qe e gjen lehte, p.sh.:

- **Windows:** `C:\Users\EmriYt\Desktop\library-api`
- **macOS:** `/Users/EmriYt/Desktop/library-api`

### Hap terminalin ne folderin e projektit

**Windows:**
- Hap folderin ne Explorer → kliko ne shiritin e adreses → shkruaj `cmd` → Enter
- ose ne PowerShell: `cd C:\Users\EmriYt\Desktop\library-api`

**macOS:**
- Hap Terminal → `cd ~/Desktop/library-api`
- ose ne Finder: kliko me te djathten ne folder → **Services → New Terminal at Folder**

---

## Pjesa 3 — Instalimi i projektit (1-here)

Brenda folderit te projektit, ekzekuto:

```bash
npm install
```

Kjo merr krejt paketat (rreth 200) ne folderin `node_modules/`. Zgjat **2-3 minuta**.

Pastaj:

```bash
npm run setup
```

Kjo komande:
1. Starton container-in e Postgres ne Docker (porti 5434)
2. Apliko skemen e DB-se
3. Mbush DB-n me te dhena fillestare (admin, librarian, member, libra, autore)

> **Nese del error:** sigurohu qe **Docker Desktop po xhiron** (balena ne menubar/system tray duhet me qene aktive).

---

## Pjesa 4 — Si me e xhiruar API-n

```bash
npm run dev
```

Pas 1-2 sekondash duhet me dale:

```
20:01:23 [info] Library API running on http://localhost:4000 (development)
```

**Le terminalin hapur** — API-ja po degjon. Nese e mbyll terminalin, ndal API-ja.

### Cka me hap ne browser

- **http://localhost:4000** → marka e API-se
- **http://localhost:4000/api/docs** → **Swagger UI** — ketu mund t'i provosh krejt endpoint-et me klikim
- **http://localhost:4000/api/v1/health** → kontrolli i shendetit

---

## Pjesa 5 — Si me testu API-n

### Opsioni A — Swagger UI (me e lehta)

1. Hap **http://localhost:4000/api/docs**
2. Per endpoint-et qe kerkojne login (gjithcka pervec `/auth/login`, `/auth/register`, `/health`, GET `/books`):
   - Klikoji **POST `/api/v1/auth/login`** → **Try it out**
   - Vendos:
     ```json
     {
       "email": "admin@library.com",
       "password": "admin123"
     }
     ```
   - **Execute** → kopjo **`accessToken`** prej response-it.
3. Lart djathtas → kliko **Authorize** → ngjite token-in → **Authorize** → **Close**.
4. Tash mund te provosh cdo endpoint tjeter.

### Opsioni B — Postman

1. Hap Postman → krijo Collection te re "Library API"
2. Krijoji request-in e pare:
   - **Method:** POST
   - **URL:** `http://localhost:4000/api/v1/auth/login`
   - **Body** → **raw** → **JSON**:
     ```json
     { "email": "admin@library.com", "password": "admin123" }
     ```
   - Send → kopjo `accessToken`
3. Per request-et e tjera:
   - **Headers:** `Authorization: Bearer <token-i-yt>`
4. Provo p.sh:
   - GET `http://localhost:4000/api/v1/books`
   - POST `http://localhost:4000/api/v1/loans/borrow` me body `{"bookId": 1}`

### Opsioni C — cURL (terminal)

```bash
# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@library.com\",\"password\":\"admin123\"}"

# Lista librave
curl http://localhost:4000/api/v1/books

# Krijim libri (vendos token-in tend)
curl -X POST http://localhost:4000/api/v1/books \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Liber Test\",\"isbn\":\"TEST-001\",\"authorId\":1,\"totalCopies\":2}"
```

> **Windows CMD:** perdor thonjeza dyshe te jashtme dhe `\"` brenda. Ne PowerShell perdor `'...'`.

### Opsioni D — Teste automatike (Jest)

```bash
npm test
```

Kjo ekzekuton **116 teste** (njesi + integrim). Te gjitha duhet te dalin **PASS**.

---

## Perdorues default (per testim)

| Email | Fjalekalim | Roli | Cka mund me bo |
|---|---|---|---|
| `admin@library.com` | `admin123` | ADMIN | gjithcka, perfshire fshirje |
| `librarian@library.com` | `librarian123` | LIBRARIAN | shton/perditeson libra & autore |
| `member@library.com` | `member123` | MEMBER | huazon libra per veten |

---

## Pjesa 6 — Komanda te dobishme

| Komanda | Cka ben |
|---|---|
| `npm run dev` | Starton API-n me auto-reload |
| `npm test` | Ekzekuton testet |
| `npm run setup` | Setup i plote (Postgres + migrime + seed) |
| `npm run db:up` | Vetem starton Postgres |
| `npm run db:down` | Ndal Postgres |
| `npm run db:seed` | Ri-mbush DB-n me te dhena fillestare |
| `npm run db:reset` | **Fshi krejt DB-n** dhe rifillo nga zeroja |
| `npm run prisma:studio` | Hap GUI per shfletim DB-je ne browser |

---

## Problemet e zakonshme & zgjidhjet

### "Error: cannot find module" pas `npm run dev`
S'ke ekzekutu `npm install`. Bej:
```bash
npm install
```

### "Error: connect ECONNREFUSED ... 5434"
Postgres s'po xhiron. Bej:
```bash
npm run db:up
```
Sigurohu qe **Docker Desktop** po xhiron.

### "Error: P1010 User was denied access"
Database password issue. Provo:
```bash
npm run db:reset
```
(do te fshije te dhenat ekzistuese)

### "Port 4000 is already in use"
Diçka tjeter po e perdor portin. Ose:
- Mbylle aplikacionin tjeter qe e ze portin
- Ose ndrysho `PORT=4000` ne `.env` ne nje port tjeter (p.sh `5000`)

### "Port 5434 is already in use" (Docker error)
Tjeter Postgres po xhiron ne kete port. Ndrysho ne `docker-compose.yml`:
```yaml
ports:
  - "5435:5432"
```
Edhe ne `.env` ndrysho `localhost:5434` → `localhost:5435`.

### Docker Desktop nuk fillon (Windows)
- Sigurohu qe **virtualization** asht e ndezur ne BIOS
- Sigurohu qe **WSL 2** asht i instalume: `wsl --install` ne PowerShell si admin

### Pas reboot-it kompjuteri, API s'po starton
Postgres-i u ndal me reboot. Bej:
```bash
npm run db:up
npm run dev
```

### `npm install` jep error me Python/build-tools (Windows)
Disa pakete kerkojne build-tools. Provo:
```
npm install --global windows-build-tools
```
ose injoroji warning-et nese `npm install` perfundon edhe pa to.

---

## Struktura e shkurter e projektit

```
library-api/
├── src/                    # Kodi i API-se
│   ├── controllers/        # Pranojne kerkesat HTTP
│   ├── services/           # Logjika e biznesit
│   ├── routes/v1/          # Endpoint-et
│   ├── middleware/         # Auth, validim, error
│   └── server.js           # Pika hyrese
├── prisma/                 # Skema DB + seed
├── tests/                  # Teste (Jest)
├── .env                    # Konfigurim (mos e shaj!)
├── docker-compose.yml      # Postgres ne Docker
└── package.json            # Dependencat & skriptet
```

---

## Ku mund me kerku ndihme

1. **Log-et e API-se** — keto dalin ne terminal kur ke `npm run dev`. Nese ka error, lexoji.
2. **Log file** — `logs/error.log` mban krejt error-et.
3. **Swagger UI** — http://localhost:4000/api/docs → tregon krejt endpoint-et me shembujt.
4. **Prisma Studio** — `npm run prisma:studio` → GUI per DB-n.

---

## Para se me dorezu projektin

1. **Mbylle API-n** (Ctrl+C ne terminal)
2. **Ndal Postgres-in:**
   ```bash
   npm run db:down
   ```
3. **Verifiko qe testet pasojne:**
   ```bash
   npm run db:up
   npm test
   npm run db:down
   ```
4. **Krijo `.zip` per dorezim** (pa `node_modules` & `logs`):

   **macOS/Linux:**
   ```bash
   cd ..
   zip -r GrupiX_Projekti_SPDD.zip library-api \
     -x "library-api/node_modules/*" \
     -x "library-api/logs/*" \
     -x "library-api/coverage/*"
   ```

   **Windows (PowerShell):**
   ```powershell
   Compress-Archive -Path library-api -DestinationPath GrupiX_Projekti_SPDD.zip -Force
   ```
   Pastaj fshi `node_modules` brenda `.zip`-it (ose perdor 7-Zip me filtra).

5. **Ngarkoji ne Moodle**: `.docx` (raporti) + `.zip` (kodi).

---

Sukses ne projekt! 🎓
