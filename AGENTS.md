<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DevMentor — architektura (obowiązkowa)

Poniższe założenia są wiążące dla każdego agenta. Nie wprowadzaj alternatyw (inny ORM, kontener DI, biblioteka CSS lub komponentów, menedżer pakietów) bez wyraźnej zgody użytkownika.

## Stack

- Next.js 16 (App Router), React 19, TypeScript w trybie `strict`.
- PostgreSQL + MikroORM (encje, migracje, pula połączeń).
- Awilix jako kontener Dependency Injection.
- Tailwind v4 dla stron frontendowych (publicznych), shadcn-ui (Base UI) dla stron backendowych.
- Better Auth (email + hasło, role `user`/`admin`), Zod, React Hook Form.
- Vitest (pokrycie v8, 100% per plik), Testcontainers, agent-browser, Prettier, ESLint (typescript-eslint z typami), husky + lint-staged.
- npm workspaces (monorepo).

Wersje, wzorce projektowe, coding standards, testy i Definition of Done opisuje `.ai/specs/implemented/2026-11-16-devmentor-engineering-standards.md`. Stosuj je przy każdej zmianie kodu.

## Monorepo — `packages/`

| Pakiet | Nazwa | Odpowiedzialność |
| --- | --- | --- |
| `packages/app` | `@devmentor/app` | Aplikacja Next.js: routing, strony, Server Actions, Route Handlers, composition root kontenera DI. |
| `packages/core` | `@devmentor/core` | Kod wielokrotnego użytku niezależny od frameworka: typy domenowe, logika, kontrakty serwisów, narzędzia DI. |
| `packages/db` | `@devmentor/db` | Wszystko, co dotyczy danych: konfiguracja MikroORM, encje, migracje, repozytoria. |
| `packages/ui` | `@devmentor/ui` | Komponenty UI wielokrotnego użytku, w tym komponenty shadcn-ui. |

Zasady:

- Dozwolony kierunek zależności: `app` → `ui`, `db`, `core`; `db` → `core`; `ui` → `core`. `core` nie zależy od żadnego innego pakietu. Bez cykli. `ui` nigdy nie importuje `db`. Te granice wymusza `eslint.config.mjs` w katalogu głównym; nie wyłączaj tej reguły, tylko popraw import.
- Między pakietami importuj tylko przez publiczny punkt wejścia `@devmentor/<pakiet>` (`src/index.ts`). Nie używaj ścieżek względnych do innych pakietów ani głębokich importów. Jedyny wyjątek: `@devmentor/ui/components/*`, `@devmentor/ui/lib/*`, `@devmentor/ui/hooks/*` i `@devmentor/ui/globals.css`, których wymaga CLI shadcn.
- Pakiety wewnętrzne eksportują źródła TS (`"exports": { ".": "./src/index.ts" }`). Next/Turbopack transpiluje je sam, więc nie dodawaj kroku budowania ani `transpilePackages`.
- Nowy pakiet: `packages/<nazwa>`, nazwa `@devmentor/<nazwa>`, `tsconfig.json` rozszerzający `../../tsconfig.base.json`. Przed dodaniem nowego pakietu zapytaj użytkownika.
- Zależność instaluj w pakiecie, który jej używa: `npm install <dep> -w @devmentor/<pakiet>`. W głównym `package.json` trzymaj tylko narzędzia wspólne.
- Polecenia uruchamiaj z katalogu głównego: `dev`, `build`, `start`, `lint`, `typecheck`, `format`/`format:check`, `test`, `test:coverage`, `test:int`, `test:integration`, `app:ephemeral`, `db:create`, `db:migrate`, `db:migration:create`, `db:migration:check`, `auth:migrate` (każde przez `npm run`).

## Dane — MikroORM (`packages/db`)

- Konfiguracja ORM, encje, migracje i repozytoria trafiają wyłącznie do `packages/db`.
- Schemat zmieniaj tylko migracjami MikroORM. Migrację generuj i commituj razem ze zmianą encji. Nie edytuj migracji, które zostały już zastosowane. Nie używaj synchronizacji schematu (`schema:update`) zamiast migracji.
- Encje definiuj przez `defineEntity` + `p` z jawnym `tableName` (bez dekoratorów). Repozytoria to adaptery portów z `core` (`MikroOrm<Nazwa>Repository`), a zapis robi `UnitOfWork.commit()` wywołany w serwisie.
- Instancja MikroORM jest per moduł (`packages/db/src/orm.ts`). **Nie przenoś jej do `globalThis`**: każda warstwa bundla Next ma własne klasy encji (lekcja `mikroorm-orm-per-bundle-layer`). `EntityManager` jest `scoped` (`orm.em.fork()`) i pobierasz go tylko z kontenera. Nigdy nie używaj globalnego `EntityManager`.
- Z bazy korzystaj tylko po stronie serwera (Server Components, Server Actions, Route Handlers), nigdy w komponentach klienckich ani w `packages/ui`.
- Konfiguracja pochodzi wyłącznie z `packages/app/src/env.ts` (walidacja Zod, wymuszona lintem `no-restricted-properties`). Pakiety dostają ją przez `register<Pakiet>(container, config)`. Wyjątki to konfiguracja CLI (`packages/db/mikro-orm.config.ts`) i katalogi `testing/`. Nie commituj sekretów; lokalnie trzymaj je w `packages/app/.env.local` (wzór w `.env.example`).

## Dependency Injection — Awilix

- Composition root to `packages/app/src/server/container.ts` (oznaczony `server-only`). Tylko tam rejestrujesz zależności. Kontener twórz przez `createDiContainer()` z `@devmentor/core` (tryb PROXY, `strict: true`), a nie przez bezpośredni import `awilix` w `app`.
- Pakiety eksportują klasy lub fabryki i funkcję `register<Pakiet>(container, config)` (np. `registerCore`) oraz typ swojego cradle (np. `CoreCradle`). `AppCradle` w `app` je łączy. Nie eksportują gotowych singletonów.
- Serwisy przyjmują jeden obiekt z zależnościami w konstruktorze (`constructor({ appConfig }: { appConfig: AppConfig })`). Nie importują bezpośrednio implementacji swoich zależności.
- `resolve` wywołuj tylko na brzegach aplikacji (strona, layout, `generateMetadata`, Server Action, Route Handler) i zawsze przez `getRequestScope()`. Nie rozwiązuj zależności z `getContainer()`, bo Awilix pozwala wtedy pobrać zależność `scoped` z kontenera głównego i staje się ona współdzielona między żądaniami. Nie wywołuj `resolve` w logice domenowej; kontener nie może służyć za service locator.
- Zasięgi: `singleton` dla ORM i konfiguracji, `scoped` (per żądanie) dla `EntityManager` i serwisów, które z niego korzystają.

## UI — Tailwind i shadcn-ui

- Strony frontendowe (publiczne) budujesz na Tailwind, w grupie tras `packages/app/src/app/(frontend)/` (root layout i `frontend.css`).
- Strony backendowe budujesz z komponentów shadcn-ui w grupie `packages/app/src/app/(backend)/` (root layout i `backend.css` z tokenami `@devmentor/ui/globals.css`). Należą do niej logowanie, rejestracja, `/account` i panel administratora `/backend`. Przejście między grupami przeładowuje stronę.
- Nie ma głównego `app/layout.tsx`. 404 dla nieznanych tras obsługuje `app/global-not-found.tsx`, a błędy root layoutu `app/global-error.tsx`.
- Cache Components są włączone: odczyt danych per żądanie (sesja, baza) musi być w komponencie wewnątrz `<Suspense>`, a dane współdzielone cache'ujesz jawnie przez `"use cache"`.
- Formularze: React Hook Form + `zodResolver` ze schematem z `@devmentor/core` i komponenty `Field` z shadcn. Ten sam schemat parsuje Server Action. `CardTitle` renderuje `<div>`, więc tytuły sekcji opakowuj w nagłówek (`<h2>`).
- Komponenty shadcn-ui i inne współdzielone komponenty trzymaj w `packages/ui`. W `app` tylko komponuj z nich strony.
- Komponenty w `packages/ui` nie zawierają logiki biznesowej ani dostępu do danych. Dane dostają przez propsy.

## Auth — Better Auth

- Instancja: `packages/app/src/server/auth/` (`options.ts` jest wspólne z `scripts/auth-migrate.mts`). Tabele auth tworzy `npm run auth:migrate`, a nie migracje MikroORM.
- `getActor()` / `requireActor()` z `server/auth/session.ts` zamieniają sesję na domenowy `Actor`. Autoryzacja (właściciel, rola) jest w serwisach `core`. `proxy.ts` tylko optymistycznie przekierowuje bez ciasteczka sesji.
- Każda Server Action: `safeParse` → `getActor()` → serwis z `getRequestScope()` → `revalidatePath`. Zwraca `{ ok, fieldErrors | formError }` i nie rzuca błędów domenowych do klienta.
- Pierwszego administratora nadajesz przez `npm run auth:make-admin -w @devmentor/app -- <email>`.

## Testy

**Zasada bezwzględna: każda nowa funkcja (i każda zmiana istniejącego kodu) musi mieć 100% pokrycia testami jednostkowymi: statements, branches, functions i lines, liczone osobno dla każdego zmienionego pliku.**

- Wymusza to `npm run test:coverage` (progi `thresholds: { 100: true, perFile: true }` w `vitest.config.mts`), a CI blokuje PR poniżej 100%.
- Nie obniżaj progów, nie dopisuj plików do `coverage.exclude` i nie używaj komentarzy `/* v8 ignore */` ani `/* istanbul ignore */` bez wyraźnej zgody użytkownika.
- Logika nie może leżeć poza `src` (konfiguracje narzędzi, skrypty CLI), gdzie pokrycie nie jest mierzone. Przenieś ją do `src` i zostaw tylko cienki punkt wejścia.
- Pokrycie liczy się wyłącznie z testów jednostkowych. Testy integracyjne go nie zastępują.

Poziomy testów:

- **Jednostkowe** (`npm test`, `npm run test:coverage`): `*.test.ts(x)` obok kodu, Vitest.
  - Logika domenowa testowana na fake'ach portów.
  - Adaptery MikroORM na fake `EntityManager`, który sprawdza tylko delegację. Zachowanie bazy należy do testów integracyjnych.
  - Komponenty przez Testing Library. Asynchroniczne Server Components wywołuje się jak funkcje, z zamockowanymi `@/server/*` i API Next.
- **Integracyjne bazy** (`npm run test:int`): `packages/db/src/**/*.int.test.ts` na PostgreSQL z Testcontainers.
- **Integracyjne aplikacji** (`npm run test:integration`): `packages/app/integration/**/*.int.test.ts`.
  - Harness stawia PostgreSQL (Testcontainers), wykonuje migracje, buduje aplikację i uruchamia `next start`.
  - Testy sterują przeglądarką przez `agent-browser` (helper `AgentBrowser`) i sprawdzają dostępność przez `agent-browser a11y`.
- **Bez Dockera** (np. sandbox agenta) ustaw `INTEGRATION_DATABASE_URL` na dostępny serwer PostgreSQL. Harness utworzy tam tymczasową bazę i po testach ją usunie.
- **Ręczne testy przez agenta:** `npm run app:ephemeral` uruchamia tymczasową instancję aplikacji na świeżej bazie i wypisuje jej URL. Przed pierwszym użyciem `agent-browser` uruchom `npx agent-browser skills get core` i postępuj według tej instrukcji. Testuj przez `npx agent-browser --session <nazwa> open <URL>`, `snapshot -i` i `click`/`fill` na referencjach.
- Zmiana stron, auth, cyklu życia ORM albo konfiguracji Next wymaga przejścia `npm run test:integration`.

# Struktura `.ai/` — specyfikacje, dzienniki zadań i lekcje

Ten projekt używa katalogu `.ai/` jako jedynego źródła prawdy dla Spec-Driven Development (SDD), dzienników pracy z AI i długoterminowej pamięci LLM-ów. **Każdy agent pracujący w tym repo musi stosować się do poniższych zasad bez wyjątku.**

## `.ai/specs/` — specyfikacje (SDD)

- Specyfikacje zadań/funkcjonalności trzymamy w `.ai/specs/`.
- Nazwa pliku specyfikacji: `YYYY-MM-DD-slug.md`, gdzie data to dzień utworzenia specyfikacji.
- `.ai/specs/implemented/` — specyfikacje, których implementacja została zakończona (przenieś plik tutaj po zakończeniu zadania).
- `.ai/specs/archive/` — specyfikacje odrzucone, zastąpione lub nieaktualne.
- Przed podjęciem nietrywialnego zadania sprawdź, czy istnieje dla niego specyfikacja w `.ai/specs/`. Jeśli nie istnieje a zadanie jest nietrywialne, zaproponuj jej utworzenie przed implementacją.

## `.ai/runs/` — dzienniki zadań wykonywanych z AI

- Jeden plik na zadanie: `.ai/runs/YYYY-MM-DD-slug.md`.
- Plik twórz **przy pierwszym commicie danego zadania**. Data w nazwie to dzień rozpoczęcia zadania — **nie zmieniaj nazwy pliku i nie twórz nowego pliku** w kolejnych sesjach, nawet jeśli praca nad zadaniem trwa kilka dni.
- Nagłówek pliku (stały, aktualizowany w miejscu) musi zawierać:
  - cel/cele zadania,
  - link do specyfikacji w `.ai/specs/` (jeśli istnieje),
  - linię `Status: in-progress` lub `Status: done`.
  - Aktualizuj cele i status w nagłówku na bieżąco; `Status: done` ustawiasz dopiero po faktycznym zakończeniu zadania.
- Przy **każdym** commicie dopisz na końcu tego samego pliku nowy wpis (2–5 linii): data, co obejmuje ten commit, podjęte decyzje lub napotkane pułapki, co zostało do zrobienia.
  - Nie modyfikuj wcześniejszych wpisów — dopisuj tylko na końcu.
  - Wpis przygotuj **przed** commitem i dołącz go do **tego samego commita**, którego dotyczy — nie odkładaj zapisu na koniec sesji.
- Wznawiając zadanie (także po przejęciu go od innego agenta/osoby) najpierw przeczytaj istniejący plik dziennika i kontynuuj pracę w tym samym pliku.

## `.ai/lessons.md` i `.ai/lessons/` — pamięć długoterminowa LLM

- `.ai/lessons.md` to indeks: jedna linia na lekcję, odsyłająca do pliku w `.ai/lessons/`.
- Każda lekcja to osobny plik `.ai/lessons/<slug>.md`.
- Zapisuj lekcję od razu (nie na koniec sesji) m.in. po korekcie podejścia przez użytkownika, po naprawieniu nietrywialnego błędu, po odkryciu pułapki w kodzie/infrastrukturze lub gdy warto zachować ustalenie na przyszłość. Formułuj ją jako regułę, która zapobiegnie powtórzeniu błędu.
- Przed rozpoczęciem zadania przeszukaj `.ai/lessons.md` i `.ai/lessons/`, aby nie powtarzać już rozwiązanych problemów.

## Wymagania dla agentów AI

1. Dla nietrywialnych zadań zawsze pracuj w kontekście specyfikacji z `.ai/specs/` i dziennika z `.ai/runs/` — twórz/aktualizuj je zgodnie z zasadami powyżej.
2. Nigdy nie zmieniaj nazwy istniejącego pliku w `.ai/runs/` i nie twórz duplikatu dla trwającego zadania.
3. Wpis w dzienniku zadania musi trafić do tego samego commita, co opisywane zmiany kodu.
4. Przed startem nowego zadania sprawdź `.ai/lessons.md` pod kątem istniejących ustaleń.

## Dobre praktyki pracy z Claude Code

Zasady na podstawie wskazówek Borisa Cherny'ego, dopasowane do struktury `.ai/` opisanej wyżej.

- **Planuj złożone zadania.** Zaczynaj w plan mode i dopracuj plan tak, by implementacja poszła za jednym podejściem. Zatwierdzony plan to specyfikacja w `.ai/specs/`. Gdy realizacja się sypie, przerwij, wróć do planu i zaktualizuj specyfikację zamiast forsować poprawki.
- **Weryfikuj zmiany przed commitem.** Uruchom `npm run format:check`, `lint`, `typecheck`, `test:coverage` (100%) i `build`, przy zmianach danych także `test:int` i `db:migration:check`, a przy zmianach stron, auth lub konfiguracji `test:integration`. Zmiany UI sprawdź w przeglądarce (`npm run app:ephemeral` + `agent-browser`, np. `screenshot`). Przejrzyj diff. Wynik weryfikacji odnotuj we wpisie w `.ai/runs/`. Bez przejścia tych kroków nie ustawiaj `Status: done`.
- **Naprawiaj błędy samodzielnie.** Mając zgłoszenie błędu, log lub wynik nieudanego builda, sam znajdź i usuń przyczynę źródłową, bez obchodzenia problemu. Po naprawie zapisz lekcję (patrz sekcja o `.ai/lessons/`).
- **Szukaj eleganckiego rozwiązania.** Jeśli poprawka wychodzi połowiczna lub zawiła, odrzuć ją i zaimplementuj czystsze rozwiązanie, wykorzystując wiedzę zdobytą przy pierwszej próbie.
- **Używaj subagentów** do szerokiego przeszukiwania kodu i researchu, żeby nie zaśmiecać głównego kontekstu.
- **Powtarzalne czynności zamieniaj w skille** w `.claude/skills/` i commituj je do repo.
