# DevMentor — CI dla pull requestów, testy integracyjne na Testcontainers i 100% pokrycia

Data: 2026-11-16
Status: in-progress (całość zaimplementowana i zweryfikowana lokalnie. Do potwierdzenia pierwszy przebieg CI na GitHubie ze ścieżką Testcontainers, bo sandbox nie ma Dockera)
Dziennik: [.ai/runs/2026-11-16-ci-testing.md](../runs/2026-11-16-ci-testing.md)
Powiązane: [standardy inżynieryjne](implemented/2026-11-16-devmentor-engineering-standards.md) (ta specyfikacja zmienia ich sekcje 8 i 9)

## Cel (od użytkownika)

Dla każdego pull requesta:

1. sprawdzenie builda,
2. sprawdzenie lintowania,
3. framework testów jednostkowych dla TypeScriptu,
4. framework testów integracyjnych z PostgreSQL uruchamianym przez Testcontainers, który stawia tymczasową instancję aplikacji testowaną przez `agent-browser`.

Do tego wiążąca zasada w `AGENTS.md`: każda nowa funkcja ma 100% pokrycia testami jednostkowymi. Istniejący kod dostaje testy jednostkowe do 100%.

## Decyzje

- **Testy jednostkowe:** Vitest (już jest) z `@vitest/coverage-v8`.
  - Progi `100` dla statements, branches, functions i lines są liczone **dla każdego pliku** (`perFile`). Za ich przekroczenie odpowiada CI.
  - Zakres: `packages/*/src/**/*.{ts,tsx}`. Wykluczone są tylko pliki testów, `*.d.ts`, wygenerowane migracje (`packages/db/src/migrations/**`) i harness testowy (`packages/*/src/testing/**`, `packages/app/integration/**`), który sprawdzają testy integracyjne.
  - Pliki poza `src` (konfiguracje narzędzi, skrypty CLI) nie mogą zawierać logiki. Ich logika trafia do `src`, a zostaje tylko cienki punkt wejścia.
- **Adaptery MikroORM w testach jednostkowych:** fake `EntityManager` sprawdza wyłącznie delegację (jakie wywołanie z jakimi argumentami). Zachowanie zapisu, ograniczenia i zapytania sprawdzają testy integracyjne na prawdziwym PostgreSQL. To zawęża wcześniejszy „zakaz mockowania ORM” ze standardów.
- **Testcontainers:** `@testcontainers/postgresql` (obraz `postgres:17-alpine`) w harnessie `packages/db/src/testing/`, eksportowanym jako `@devmentor/db/testing`. Ten import dopuszcza lint tylko w kodzie testów integracyjnych.
  - Bez Dockera, np. w sandboxie agenta, harness przyjmuje `INTEGRATION_DATABASE_URL`. Tworzy wtedy na wskazanym serwerze tymczasową bazę z losową nazwą i usuwa ją po testach. Izolacja jest taka sama jak przy kontenerze.
- **Testy integracyjne aplikacji:**
  - Projekt Vitest `app-int` (`packages/app/integration/**/*.int.test.ts`).
  - Globalny setup stawia Postgresa, wykonuje migracje MikroORM i Better Auth, buduje aplikację i uruchamia `next start` na wolnym porcie.
  - Testy sterują przeglądarką przez CLI `agent-browser` (`--session`, `--json`), a dostępność sprawdzają przez `agent-browser a11y`.
- **Tymczasowa instancja dla agentów:** `npm run app:ephemeral` stawia to samo środowisko, wypisuje URL i działa do Ctrl+C. Agent testuje ją ręcznie przez `agent-browser`.
- **Playwright E2E jest usuwany:** jego 8 scenariuszy przechodzi do `app-int` na `agent-browser`. Dwa frameworki przeglądarkowe do tego samego to duplikacja. `agent-browser` to natywny CLI z własnym Chrome for Testing, więc Playwright nie jest już potrzebny.
- **CI** (`.github/workflows/ci.yml`, `pull_request` + `push` na `main`) ma 4 równoległe joby:
  - `lint`: format, lint, typecheck i audit runtime;
  - `unit`: testy z pokryciem 100%;
  - `build`;
  - `integration`: Docker/Testcontainers, `test:int` i `test:integration`.

## Plan

### Faza 1: pokrycie i zasada w AGENTS.md

Status: done (2026-11-16)

- `@vitest/coverage-v8`, progi `perFile` 100%, `npm run test:coverage`.
- Zasada 100% w `AGENTS.md` i aktualizacja sekcji 8 standardów.

### Faza 2: framework testów integracyjnych

Status: done (2026-11-16)

- Harness Postgresa (Testcontainers i tryb `INTEGRATION_DATABASE_URL`) w `@devmentor/db/testing`. Testy `db-int` przechodzą na harness.
- Harness aplikacji, helper `AgentBrowser`, globalny setup `app-int`, `npm run app:ephemeral`.
- Migracja 8 scenariuszy z Playwright, usunięcie Playwright.

Kryteria ukończenia: `npm run test:int` i `npm run test:integration` przechodzą lokalnie w trybie `INTEGRATION_DATABASE_URL`.

### Faza 3: CI

Status: done lokalnie (2026-11-16). Czeka na pierwszy przebieg na GitHubie

- Workflow z jobami `lint`, `unit`, `build` i `integration`.

Kryteria ukończenia: poprawny YAML. Kroki każdego joba przechodzą lokalnie. Ścieżkę z Testcontainers sprawdzi pierwszy przebieg na GitHubie, bo sandbox nie ma Dockera.

### Faza 4: 100% pokrycia istniejącego kodu

Status: done (2026-11-16)

- Testy jednostkowe `core`, `db`, `ui` i `app` (strony, akcje, formularze, sesja, proxy, env, kontener).
- Logika z `next.config.ts` i skryptów CLI przeniesiona do `src`.

Kryteria ukończenia: `npm run test:coverage` przechodzi z progami 100% per plik.

## Wynik (2026-11-16)

- **Pokrycie testami jednostkowymi:** 46 plików testów, 162 testy, 64 mierzone pliki. Lines 435/435, statements 458/458, functions 139/139, branches 156/156, czyli 100%. Brak komentarzy `ignore`. Próg sprawdzony: niepokryty plik kończy `test:coverage` kodem 1.
- **Testy integracyjne:** `db-int` ma 7 testów, w tym nowy test „migracje = encje”, który zastępuje `migration:check` i wykrywa brakującą migrację. `app-int` ma 9 testów na `agent-browser`, w tym 2 audyty axe.
- **Symulacja CI na czystej kopii:** joby `lint`, `unit`, `build` i `integration` przeszły. Job `integration` działał w trybie `INTEGRATION_DATABASE_URL`.
- **Zmiana kodu produkcyjnego:** tylko `Backdrop.tsx`. Usunięta gałąź była nieosiągalna, bo wiersz zerowy z overscanu nigdy nie trafia na ekran. Różnica pikseli strony głównej wobec zrzutu sprzed zmiany: 0 z 1 024 000.
- **Do zrobienia przez właściciela repo:** w ochronie gałęzi `main` oznaczyć joby `Lint`, `Unit tests (100% coverage)`, `Build` i `Integration tests (Testcontainers + agent-browser)` jako wymagane.
