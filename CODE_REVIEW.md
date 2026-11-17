# Code review

Reguły review dla DevMentor. `om-code-review` (i `om-auto-review-pr`) stosuje ten plik automatycznie. Uzupełnia on `AGENTS.md` i `.ai/specs/implemented/2026-11-16-devmentor-engineering-standards.md`; przy konflikcie wygrywa `AGENTS.md`.

## Priorytety

1. **Poprawność** — logika domenowa, obsługa błędów, przypadki brzegowe.
2. **Bezpieczeństwo** — auth, autoryzacja, walidacja wejścia, sekrety.
3. **Kontrakty** — publiczne API pakietów, trasy, schemat bazy (zob. `BACKWARD_COMPATIBILITY.md`).
4. **Testy** — 100% pokrycia per plik (statements, branches, functions, lines).
5. **Czytelność i spójność** z istniejącym kodem.

## Sprawdzenia specyficzne dla repo

- **Granice pakietów:** `app` → `ui`, `db`, `core`; `db` → `core`; `ui` → `core`; `core` bez zależności. Importy tylko przez `@devmentor/<pakiet>` (wyjątek: `@devmentor/ui/components|lib|hooks/*`, `globals.css`). Wyłączenie reguły ESLint zamiast poprawy importu to **blocker**.
- **Brak alternatyw stacku:** inny ORM, kontener DI, biblioteka CSS/komponentów lub menedżer pakietów bez zgody użytkownika to **blocker**.
- **Konfiguracja:** odczyt wyłącznie z `packages/app/src/env.ts` (Zod) i przekazanie przez `register<Pakiet>(container, config)`. Bezpośrednie `process.env` poza wyjątkami to **blocker**. Sekrety w repo to **blocker**.
- **DI (Awilix):** rejestracja tylko w `packages/app/src/server/container.ts`; `resolve` tylko na brzegach i przez `getRequestScope()`, nigdy z `getContainer()` ani w logice domenowej. Kontener przez `createDiContainer()`. Serwisy przyjmują jeden obiekt zależności.
- **MikroORM:** encje przez `defineEntity` + `p` z jawnym `tableName`; zmiana encji idzie z wygenerowaną migracją; zastosowanych migracji się nie edytuje; brak `schema:update`; brak globalnego `EntityManager` i przenoszenia ORM do `globalThis`; baza tylko po stronie serwera, nigdy w `packages/ui`.
- **Server Actions:** `safeParse` → `getActor()` → serwis z `getRequestScope()` → `revalidatePath`; wynik `{ ok, fieldErrors | formError }`, bez rzucania błędów domenowych do klienta. Autoryzacja (właściciel, rola) w serwisach `core`, nie w komponentach.
- **Formularze:** React Hook Form + `zodResolver` ze schematem z `@devmentor/core`; ten sam schemat parsuje Server Action.
- **UI:** strony publiczne na Tailwind w `(frontend)`, backendowe na shadcn-ui w `(backend)`; współdzielone komponenty w `packages/ui` bez logiki biznesowej i dostępu do danych. Odczyt per żądanie wewnątrz `<Suspense>`; dane współdzielone przez `"use cache"`.
- **Next.js 16:** zmiany zgodne z dokumentacją w `node_modules/next/dist/docs/`, nie z wiedzą o starszych wersjach.
- **Testy:** brak `/* v8 ignore */`, `/* istanbul ignore */`, obniżonych progów i wpisów w `coverage.exclude` bez zgody użytkownika. Logika nie leży poza `src`. Zmiana stron, auth, ORM lub konfiguracji Next wymaga przejścia `npm run test:integration`.
- **Dziennik i lekcje:** PR ma wpis w `.ai/runs/` w tym samym commicie; nietrywialne zadanie ma specyfikację w `.ai/specs/`.

## Bramka walidacji

`npm run format:check`, `lint`, `typecheck`, `test:coverage`, `build` (lista w `.ai/agentic.config.json`). Zmiany danych: także `test:int` i `db:migration:check`.

## Poziomy ważności

- **Blocker** — błąd poprawności, luka bezpieczeństwa, złamanie granic pakietów, brak migracji, złamanie kontraktu, pokrycie < 100%.
- **Major** — brak testów ścieżki błędu, naruszenie wzorców DI/ORM/Server Action bez skutku natychmiastowego.
- **Minor** — nazewnictwo, drobne uproszczenia, styl nieobjęty lintem.
- **Nit** — preferencje; nie blokują merge'a.
