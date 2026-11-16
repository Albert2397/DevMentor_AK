# DevMentor

Aplikacja webowa zbudowana jako monorepo na Next.js 16 (App Router), React 19 i TypeScript.

## Stack

| Obszar                 | Technologia                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| Framework              | Next.js 16 (Turbopack, Cache Components), React 19, TypeScript 5.9     |
| Baza danych            | PostgreSQL                                                             |
| ORM                    | MikroORM 7 (`defineEntity`, migracje, pula połączeń)                   |
| Dependency Injection   | Awilix (tryb PROXY, `strict`)                                          |
| Auth                   | Better Auth (email + hasło, role `user`/`admin`)                       |
| Walidacja              | Zod (formularze, Server Actions, zmienne środowiskowe)                 |
| UI: strony frontendowe | Tailwind CSS v4                                                        |
| UI: strony backendowe  | shadcn-ui (Base UI), React Hook Form                                   |
| Testy                  | Vitest (100% pokrycia), Testing Library, Testcontainers, agent-browser |
| Jakość                 | ESLint (typescript-eslint z typami), Prettier, husky + lint-staged     |
| Monorepo i CI          | npm workspaces, GitHub Actions                                         |

Pełne standardy (wzorce, coding standards, Definition of Done) opisuje
[`.ai/specs/implemented/2026-11-16-devmentor-engineering-standards.md`](.ai/specs/implemented/2026-11-16-devmentor-engineering-standards.md).

## Architektura

```
devmentor/
├── packages/
│   ├── app/    @devmentor/app   Next.js: trasy, Server Actions, auth, composition root DI
│   ├── core/   @devmentor/core  domena: serwisy, porty, schematy Zod, błędy, DI
│   ├── db/     @devmentor/db    MikroORM: encje, adaptery portów, migracje
│   └── ui/     @devmentor/ui    komponenty shadcn-ui, tokeny, Backdrop
├── eslint.config.mjs            lint z granicami pakietów
├── vitest.config.mts            projekty testów: core, db, ui, app, db-int
└── tsconfig.base.json           wspólna, ścisła konfiguracja TypeScript
```

### Zależności między pakietami

```
        app
      ↙  ↓  ↘
    ui   db   │
      ↘  ↓  ↙
       core
```

`core` nie zależy od żadnego pakietu, a `ui` nie importuje `db`. Granice wymusza ESLint. Pakiety
eksportują źródła TypeScript, które Next.js transpiluje bez osobnego kroku budowania.

`core` definiuje porty (np. `UserProfileRepository`, `UnitOfWork`), a `db` dostarcza ich
implementacje na MikroORM. Dzięki temu logikę domenową testuje się bez bazy.

### Przepływ żądania

1. Strona, Server Action lub Route Handler w `app` pobiera zasięg kontenera dla żądania
   (`getRequestScope()`), a sesję zamienia na domenowy `Actor` (`getActor()`).
2. Z zasięgu pobiera serwis z `core`. Serwis dostaje porty przez konstruktor, w tym repozytorium z
   `EntityManager` sforkowanym dla żądania.
3. Serwis sprawdza uprawnienia, wykonuje przypadek użycia i zapisuje zmiany jednym `commit()`, a do
   warstwy prezentacji zwraca DTO.
4. Komponenty z `ui` renderują wynik.

### Trasy

| Trasa                  | Grupa        | Opis                                |
| ---------------------- | ------------ | ----------------------------------- |
| `/`                    | `(frontend)` | strona publiczna (Tailwind)         |
| `/sign-in`, `/sign-up` | `(backend)`  | logowanie i rejestracja             |
| `/account`             | `(backend)`  | profil zalogowanego użytkownika     |
| `/backend`             | `(backend)`  | panel administratora (rola `admin`) |
| `/api/auth/*`          | API          | endpointy Better Auth               |
| `/api/health`          | API          | stan aplikacji i bazy (200 lub 503) |

## Uruchamianie

Wymagania: Node.js 24, npm 11, PostgreSQL.

```bash
npm install
cp .env.example packages/app/.env.local   # uzupełnij DATABASE_URL i BETTER_AUTH_SECRET
npm run db:create && npm run db:migrate   # schemat MikroORM
npm run auth:migrate                      # tabele Better Auth
npm run dev                               # http://localhost:3000
```

Pierwszego administratora nadajesz po rejestracji:
`npm run auth:make-admin -w @devmentor/app -- <email>`.

### Zmienne środowiskowe

Waliduje je `packages/app/src/env.ts`, a aplikacja nie wystartuje z błędną konfiguracją.

| Zmienna                       | Wymagana | Opis                                                    |
| ----------------------------- | -------- | ------------------------------------------------------- |
| `DATABASE_URL`                | tak      | adres PostgreSQL                                        |
| `BETTER_AUTH_SECRET`          | tak      | min. 32 znaki (`openssl rand -base64 32`)               |
| `BETTER_AUTH_URL`             | prod     | publiczny adres aplikacji                               |
| `BETTER_AUTH_ALLOWED_HOSTS`   | nie      | hosty po przecinku, gdy nie ma jednego adresu (preview) |
| `BETTER_AUTH_TRUSTED_ORIGINS` | nie      | dodatkowe zaufane originy                               |
| `DATABASE_POOL_MAX`           | nie      | rozmiar puli połączeń (domyślnie 10)                    |
| `LOG_LEVEL`                   | nie      | `debug`/`trace` włącza logowanie zapytań MikroORM       |

### Polecenia

```bash
npm run lint            # ESLint (granice pakietów, reguły z typami)
npm run typecheck       # TypeScript we wszystkich pakietach
npm run format:check    # Prettier
npm test                # testy jednostkowe (Vitest)
npm run test:coverage   # testy jednostkowe z progiem 100% pokrycia dla każdego pliku
npm run test:int        # integracyjne bazy: PostgreSQL z Testcontainers
npm run test:integration  # integracyjne aplikacji: Testcontainers + next start + agent-browser
npm run app:ephemeral   # tymczasowa instancja aplikacji na świeżej bazie (do Ctrl+C)
npm run build           # build produkcyjny
npm run db:migration:create   # nowa migracja po zmianie encji
npm run db:migration:check    # czy encje i migracje są zgodne
```

Zależności instaluje się w pakiecie, który ich używa, np. `npm install zod -w @devmentor/core`.
Komponenty shadcn dodaje się z katalogu aplikacji: `cd packages/app && npx shadcn add <komponent>`
(trafiają do `packages/ui`).

## Testy

| Poziom                 | Polecenie                  | Co sprawdza                                                                     |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| Jednostkowe            | `npm run test:coverage`    | `*.test.ts(x)` obok kodu, **100% pokrycia każdego pliku** (wymóg z `AGENTS.md`) |
| Integracyjne bazy      | `npm run test:int`         | repozytoria i migracje na prawdziwym PostgreSQL                                 |
| Integracyjne aplikacji | `npm run test:integration` | całe ścieżki użytkownika w przeglądarce (`agent-browser`) i dostępność (axe)    |

Testy integracyjne uruchamiają PostgreSQL przez [Testcontainers](https://testcontainers.com/), więc
potrzebują Dockera. Bez Dockera (np. w sandboxie agenta) wskaż serwer PostgreSQL:

```bash
INTEGRATION_DATABASE_URL=postgres://user:pass@host:5432/postgres npm run test:integration
```

Harness utworzy na nim tymczasową bazę o losowej nazwie i po testach ją usunie.

`npm run app:ephemeral` stawia tę samą tymczasową instancję (świeża baza, migracje, build,
`next start`) i wypisuje jej URL, żeby przetestować ją ręcznie albo przez agenta:

```bash
npx agent-browser skills get core              # instrukcja dla agentów (raz)
npx agent-browser --session manual open <URL>
npx agent-browser --session manual snapshot -i
```

`--no-build` pomija build, a `--verbose` pokazuje logi serwera. Ctrl+C zatrzymuje aplikację i usuwa bazę.

## CI

`.github/workflows/ci.yml` uruchamia się dla każdego pull requesta i każdego pushu na `main`. Ma
cztery równoległe joby:

| Job           | Kroki                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| `lint`        | `format:check`, `lint`, `typecheck`, `npm audit --omit=dev --audit-level=high`                |
| `unit`        | `test:coverage` (próg 100% na plik)                                                           |
| `build`       | `build`                                                                                       |
| `integration` | `agent-browser install --with-deps`, `test:int`, `test:integration` (Docker + Testcontainers) |

Żeby PR nie dało się scalić z błędami, w ustawieniach repozytorium (Branch protection dla `main`)
oznacz te cztery joby jako wymagane.

## Praca z agentami AI

Zasady dla agentów kodujących są w [`AGENTS.md`](AGENTS.md), a `CLAUDE.md` go importuje. Specyfikacje,
dzienniki zadań i wnioski leżą w katalogu [`.ai/`](.ai/).
