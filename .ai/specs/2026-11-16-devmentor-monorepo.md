# DevMentor — szkielet monorepo i założenia architektury

Data: 2026-11-16

## Cel

Przekształcić jednopakietowy projekt Next.js w monorepo aplikacji DevMentor i spisać założenia architektury tak, żeby agenci kodujący się ich trzymali.

## Założenia (od użytkownika)

- Next.js (najnowszy, obecnie 16.x), TypeScript, React.
- PostgreSQL + MikroORM (migracje, pula połączeń).
- Awilix jako kontener DI.
- Tailwind dla stron frontendowych, shadcn-ui dla stron backendowych (panelu).
- Monorepo, pakiety w `packages/`: `app`, `core`, `db`, `ui`.

## Zakres tego zadania

1. npm workspaces w głównym `package.json` (`packages/*`), skrypty `dev`/`build`/`lint`/`start` delegowane do `@devmentor/app` (sandbox uruchamia `npm run dev` w katalogu głównym).
2. Przeniesienie obecnej aplikacji Next.js (`src`, `public`, konfiguracje) do `packages/app`.
3. Szkielety `packages/core`, `packages/db`, `packages/ui`: `package.json` (`@devmentor/<nazwa>`, eksport ze źródeł TS), `tsconfig.json`, `src/index.ts`.
4. Wspólny `tsconfig.base.json`.
5. Sekcja architektury w `AGENTS.md` i opis architektury w `README.md`.

## Poza zakresem (kolejne zadania)

- Instalacja i konfiguracja MikroORM + PostgreSQL (konfiguracja, pierwsza encja, migracje, docker-compose / usługa w `om-sandbox.toml`).
- Instalacja Awilix i composition root.
- Instalacja Tailwind w `app` oraz inicjalizacja shadcn-ui w `ui`.

## Decyzje

- Pakiety wewnętrzne eksportują źródła TS (`exports: "./src/index.ts"`), bez osobnego kroku budowania — Turbopack transpiluje pakiety workspace automatycznie (docs: `transpilePackages.md`).
- Kierunek zależności: `app` → `ui`, `db`, `core`; `db` → `core`; `ui` → `core`; `core` nie zależy od innych pakietów.

## Kryteria akceptacji

- `npm run lint` i `npm run build` przechodzą z katalogu głównego.
- `npm run dev` z katalogu głównego serwuje aplikację na porcie 3000.
- `app` importuje coś z `@devmentor/core` (rozwiązywanie pakietów działa).
