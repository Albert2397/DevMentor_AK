# DevMentor — migracja do monorepo i fundament architektury

Data: 2026-11-16
Dziennik: [.ai/runs/2026-11-16-devmentor-monorepo.md](../runs/2026-11-16-devmentor-monorepo.md)

## Cel

Przekształcić jednopakietowy projekt Next.js w monorepo aplikacji DevMentor zgodne z architekturą z `AGENTS.md` i `README.md`, zachowując dotychczasowe działanie aplikacji.

## Założenia (od użytkownika)

- Next.js (najnowszy, obecnie 16.x), TypeScript, React.
- PostgreSQL + MikroORM (migracje, pula połączeń).
- Awilix jako kontener DI.
- Tailwind dla stron frontendowych, shadcn-ui dla stron backendowych (panelu).
- Monorepo, pakiety w `packages/`: `app`, `core`, `db`, `ui`.

## Decyzje

- Pakiety wewnętrzne eksportują źródła TS (`exports: "./src/index.ts"`), bez kroku budowania. Turbopack transpiluje pakiety workspace sam (docs: `transpilePackages.md`).
- Kierunek zależności: `app` → `ui`, `db`, `core`; `db` → `core`; `ui` → `core`; `core` nie zależy od innych pakietów. Wymusza go ESLint (`no-restricted-imports`) w jednej, głównej konfiguracji.
- Narzędzia wspólne (ESLint, TypeScript) są w głównym `package.json`, a zależności runtime w pakietach, które ich używają.
- `react` jest w `ui` zależnością typu peer, żeby w drzewie była jedna kopia Reacta (tę dostarcza `app`).

## Plan

Fazy 3–4 wymagają korekty według [standardów inżynieryjnych](2026-11-16-devmentor-engineering-standards.md) (sekcja 11): przed fazą 3 aktualizacja Next do ≥ 16.4.6 (podatność krytyczna) i MikroORM 7 zamiast 6. Do tego dochodzą nowe fazy 5 (jakość) i 6 (auth). Korektę naniesiemy po decyzjach z sekcji 12 standardów.

### Faza 1: struktura monorepo i wydzielenie istniejącego kodu

Status: done (2026-11-16)

- [x] npm workspaces (`packages/*`), skrypty `dev`/`build`/`start`/`lint`/`typecheck` w katalogu głównym, delegowane do pakietów.
- [x] Aplikacja Next.js przeniesiona do `packages/app` (`b73f116`).
- [x] Pakiety `core`, `db`, `ui` z `package.json`, `tsconfig.json` (rozszerza `tsconfig.base.json`) i `src/index.ts`.
- [x] `core`: stałe aplikacji (`APP_NAME`) używane przez `app`.
- [x] `ui`: komponent `Backdrop` i jego style (CSS Module) przeniesione z `app`. Selektor treści, którą omija znak, jest propsem, a nie zaszytą klasą strony.
- [x] Usunięty nieużywany `page.module.css`.
- [x] Jedna konfiguracja ESLint w katalogu głównym, obejmująca wszystkie pakiety i wymuszająca granice zależności oraz zakaz głębokich importów.

Kryteria ukończenia:
- `npm run lint`, `npm run typecheck` i `npm run build` przechodzą z katalogu głównego.
- `npm run dev` (serwis sandboxa) serwuje stronę startową z tym samym wyglądem i treścią co przed migracją.
- Import niezgodny z kierunkiem zależności (np. `@devmentor/db` w `ui`) jest błędem lintu.

### Faza 2: Dependency Injection (Awilix)

Status: done (2026-11-16)

- [x] `awilix` w `core`: `createDiContainer()` (PROXY, `strict: true`) i reeksport `asClass`/`asValue`/`asFunction`/`Lifetime`, dzięki czemu `app` nie zależy bezpośrednio od `awilix`.
- [x] Pierwszy serwis `AppInfoService` w `core` z `registerCore(container, config)` i typem `CoreCradle`.
- [x] Composition root `packages/app/src/server/container.ts` (`server-only`): leniwy kontener na moduł i `getRequestScope()` (scope per żądanie przez `cache()` z Reacta).
- [x] `generateMetadata` w `layout.tsx` pobiera `appInfo` z zasięgu żądania. Tytuł i opis strony są bez zmian.

Kryteria ukończenia (spełnione): serwis z `core` jest pobierany z kontenera w `app` bez importu implementacji w miejscu użycia. Lint, typecheck i build przechodzą, a `/` nadal jest prerenderowana statycznie.

Decyzja: kontener nie trafia do `globalThis`, bo jest tani w budowie, a przy HMR ma się odtwarzać z nowymi rejestracjami. W `globalThis` przechowujemy tylko kosztowne zasoby, czyli instancję MikroORM z pulą połączeń w fazie 3.

### Faza 3: Dane (PostgreSQL + MikroORM)

Status: todo

- `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/migrations` w `db`; konfiguracja z `DATABASE_URL`, ustawienia puli połączeń.
- Pierwsza encja i migracja, skrypty `db:migrate` / `db:migration:create`.
- Rejestracja `MikroORM` (singleton, instancja trzymana w `globalThis`, żeby HMR i osobne warstwy bundla Next nie tworzyły kolejnych pul) i `EntityManager` (scoped, `em.fork()`) w kontenerze przez `registerDb`.
- Połączenie z usługą `postgres` sandboxa. Sprawdzić, czy MikroORM wymaga `serverExternalPackages` w Next 16.

Kryteria ukończenia: migracja wykonuje się na bazie sandboxa, a strona serwerowa odczytuje dane przez serwis z kontenera. Lint, typecheck i build przechodzą.

### Faza 4: UI (Tailwind + shadcn-ui)

Status: todo

- Tailwind w `app` dla stron frontendowych (`src/app/(frontend)/`); strona startowa przeniesiona do tej grupy tras.
- shadcn-ui zainicjalizowane w `ui` (komponenty, `cn`, tokeny), układ panelu `src/app/backend/`.

Kryteria ukończenia: strona frontendowa ostylowana Tailwindem i strona `/backend` z komponentem shadcn-ui z `@devmentor/ui`. Lint, typecheck i build przechodzą.
