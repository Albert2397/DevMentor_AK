# DevMentor — tech stack, standardy inżynieryjne i wzorce projektowe

Data: 2026-11-16
Status: proposed (wymaga akceptacji decyzji z sekcji „Otwarte pytania”)
Powiązane: [2026-11-16-devmentor-monorepo.md](2026-11-16-devmentor-monorepo.md) (plan migracji, fazy 1–2 ukończone)

## 1. Kontekst i założenia

Stack bazowy wybrał użytkownik: Next.js, TypeScript, React, PostgreSQL + MikroORM, Awilix, Tailwind (frontend), shadcn-ui (backend), monorepo `app`/`core`/`db`/`ui`. Ta specyfikacja go nie zmienia. Dobiera brakujące elementy i ustala, jak z tego stacku korzystać.

Funkcje produktu nie zostały jeszcze opisane. Przyjęte założenia robocze (do potwierdzenia):
- aplikacja ma kont użytkowników (logowanie) i role, co najmniej `user` i `admin`;
- część publiczna (frontend) i panel (backend) to jedna aplikacja Next.js;
- dane domenowe są relacyjne i trzymane w PostgreSQL; brak wymagań real-time i multi-tenant.

Źródła researchu (2026-11-16): lokalna dokumentacja `node_modules/next/dist/docs/`, mikro-orm.io (`define-entity`, `usage-with-nextjs`, `migrations`, `configuration`, `identity-map`, `upgrading-v6-to-v7`), tailwindcss.com (Next.js guide, detecting classes), ui.shadcn.com (`monorepo`, `installation/manual`, `forms`, `dark-mode/next`), `npm view` i `npm audit`.

## 2. Tech stack

### 2.1 Wersje docelowe

| Obszar | Wybór | Wersja (npm, 2026-11-16) | Uwagi |
| --- | --- | --- | --- |
| Runtime | Node.js | 24 LTS | MikroORM 7 wymaga ≥ 22.17 |
| Framework | Next.js (App Router, Turbopack) | **16.4.6** | **Pilne:** zainstalowane 16.3.4 ma krytyczną podatność (RCE w `next/og`, wyciek Draft Mode przez `use cache`). Aktualizacja `next` i `eslint-config-next` do ≥ 16.4.6. |
| UI runtime | React / React DOM | 19.x (zgodnie z peer deps Next) | |
| Język | TypeScript | 5.9 | TS 7.0 jest już wydany, ale nie potwierdziłem jego obsługi przez typescript-eslint i Next. Migrację odkładamy do potwierdzenia. |
| Monorepo | npm workspaces | npm 11 | Turborepo odrzucone na teraz (patrz 10). |
| ORM | MikroORM **7** (`@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/migrations`, `@mikro-orm/cli`) | 7.2.10 | v7 zastąpiło knex przez Kysely (`@mikro-orm/sql`), jest natywnie ESM i nie ma `initSync`. |
| Baza | PostgreSQL | usługa `postgres` sandboxa (`DATABASE_URL`) | |
| DI | Awilix | 13.0.7 | Już wdrożone (faza 2). |
| Walidacja | Zod | 4.x | Jeden schemat dla formularza, Server Action i env. |
| Env | `@t3-oss/env-nextjs` + Zod | 0.13.x | Walidacja przy starcie, podział server/client. |
| CSS | Tailwind CSS v4 (`@tailwindcss/postcss`) | 4.3.5 | Konfiguracja w CSS (`@theme`), bez `tailwind.config`. |
| Komponenty panelu | shadcn-ui (CLI `shadcn`), styl domyślny CLI | 4.23.0 | Zależności: `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css`. |
| Motyw | `next-themes` | 0.4.x | Tylko dla panelu. |
| Formularze | React Hook Form + `@hookform/resolvers/zod` | 7.x / 7.x | Wzorzec `Field` z shadcn. |
| Auth | Better Auth | 1.7.x | Patrz 2.2. |
| Logowanie | pino | 10.x | JSON, poziom z env. |
| Telemetria | `instrumentation.ts` + OpenTelemetry (opcjonalnie) | | Włączyć przy pierwszym wdrożeniu produkcyjnym. |
| Testy jednostkowe/integracyjne | Vitest + Testing Library + jsdom | 5.x / 16.x | |
| Testy E2E | Playwright | 1.65.x | Na `next build` + `next start`. |
| Testy bazy | Prawdziwy PostgreSQL (baza `_test`), w CI `@testcontainers/postgresql` | 12.x | Bez mocków ORM. |
| Formatowanie | Prettier | 3.x | |
| Lint | ESLint 9 flat config + `eslint-config-next` + `typescript-eslint` | 8.73+ | Granice pakietów już wymuszone. |
| Git hooks | husky + lint-staged | 9.x / 17.x | pre-commit: format i lint zmienionych plików. |
| TS w skryptach | tsx | 4.x | CLI MikroORM i skrypty w `db`. |

### 2.2 Uwierzytelnianie

Rekomendacja: **Better Auth**. Jest aktywnie rozwijany, a Next 16 wymienia go w dokumentacji `authentication.md`. Auth.js v5 nadal ma na npm tylko wersję beta.

- Adapter: wbudowany adapter Better Auth dla Postgresa (pula `pg`) na tej samej bazie. Tabele auth są zarządzane migracjami Better Auth i pozostają w `packages/db` jako osobny moduł.
- Społecznościowy `better-auth-mikro-orm` (0.5.0) wymaga MikroORM 6, więc go nie używamy.
- Encje domenowe odwołują się do użytkownika przez `userId`, bez relacji ORM do tabel auth.
- Sesja jest weryfikowana w warstwie dostępu do danych (patrz 4.3). `proxy.ts` służy tylko do optymistycznych przekierowań.

## 3. Architektura i wzorce projektowe

### 3.1 Warstwy (hexagonal-lite)

| Warstwa | Pakiet | Zawiera | Nie zawiera |
| --- | --- | --- | --- |
| Domena + przypadki użycia | `core` | encje domenowe jako typy TS, serwisy aplikacyjne (use cases), **porty** (interfejsy repozytoriów i usług zewnętrznych), błędy domenowe, schematy Zod wejść | Next, React, MikroORM, `process.env` |
| Adaptery danych | `db` | encje MikroORM (`defineEntity`), implementacje portów z `core`, migracje, konfiguracja ORM, `registerDb` | logika biznesowa, React |
| Prezentacja | `ui` | komponenty prezentacyjne, shadcn, tokeny, `cn` | dostęp do danych, Server Actions |
| Dostarczanie | `app` | trasy, Server Components, Server Actions, Route Handlers, composition root, env, auth | logika biznesowa (deleguje do `core`) |

Dozwolony kierunek zależności `db` → `core` pozwala na **odwrócenie zależności**: `core` definiuje `interface MentorRepository`, a `db` dostarcza `MikroOrmMentorRepository`. Serwisy w `core` testuje się więc bez bazy, a w testach integracyjnych `db` z prawdziwą bazą.

### 3.2 Obowiązkowe wzorce

- **Composition Root** (`packages/app/src/server/container.ts`): jedyne miejsce, gdzie łączy się implementacje. Każdy pakiet udostępnia `register<Pakiet>()` i typ swojego cradle.
- **Constructor Injection** w trybie PROXY: konstruktor przyjmuje jeden obiekt `{ dep1, dep2 }`.
- **Use case / Application Service**: jedna klasa na spójny obszar (np. `MentorshipService`) z metodami odpowiadającymi przypadkom użycia. Metoda przyjmuje dane już zwalidowane (typ z Zod) i kontekst aktora (`actor: { userId, role }`), a zwraca DTO.
- **Repository (port + adapter)**: interfejs w `core` opisuje operacje domenowe (`findActiveByMentor`), a nie generyczne CRUD. Implementacja w `db` korzysta z `EntityManager`.
- **Unit of Work**: MikroORM `EntityManager` (scoped, `em.fork()` na żądanie). Jeden `flush()` lub `em.transactional()` na przypadek użycia, wywoływany przez serwis, nie przez repozytorium.
- **DTO na granicach**: komponenty klienckie i odpowiedzi API dostają zwykłe obiekty. Nigdy nie przekazuje się do nich encji ORM ani obiektów z referencjami do `EntityManager`.
- **Błędy domenowe**: klasy dziedziczące po `DomainError` z polem `code` (`NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `VALIDATION`). Na brzegu (`app`) są mapowane na `notFound()`, kody HTTP lub stan formularza. Wyjątki zostają dla sytuacji wyjątkowych. Akcje formularzy zwracają `{ ok: false, fieldErrors }` zamiast rzucać błąd.
- **Data Access Layer** (Next `data-security.md`): każdy odczyt danych w Server Component idzie przez serwis z `getRequestScope()`, który sprawdza uprawnienia i zwraca minimalne DTO.

### 3.3 Antywzorce (zakazane)

- Service locator: `resolve` w logice domenowej i `getContainer().resolve()` zamiast `getRequestScope()`.
- Globalny `EntityManager` i `allowGlobalContext` poza testami.
- Active Record (logika w encjach ORM, które same się zapisują).
- Generyczne `BaseRepository<T>` z pełnym CRUD wystawionym do warstwy `app`.
- Logika biznesowa w komponentach, Server Actions lub Route Handlers (te tylko parsują, autoryzują i delegują).
- Wywołania `fetch` do własnych Route Handlerów z Server Components (zamiast tego wywołanie serwisu).
- Barrel files wewnątrz pakietu, poza publicznym `src/index.ts`.

## 4. Standardy Next.js 16

### 4.1 Komponenty

- Domyślnie Server Components. `"use client"` dawać tylko w liściach drzewa, które potrzebują stanu, efektów lub API przeglądarki.
- Moduły serwerowe (kontener, serwisy z sekretami, `db`) zaczynają się od `import "server-only"`.
- Każdy segment z danymi ma `loading.tsx` lub `<Suspense>`, a każdy segment, który może zawieść, ma `error.tsx`.
- `global-error.tsx` renderuje własne `<html>`/`<body>` i style. Przy obsłudze błędu w boundary używać `retry()` zamiast `reset()`.

### 4.2 Server Actions

Każda akcja to publiczny endpoint POST, więc w każdej akcji obowiązuje kolejność:

1. `parse` wejścia schematem Zod z `core`, przy czym ten sam schemat waliduje formularz klienta;
2. odczyt sesji i autoryzacja (z sesji, nigdy z danych klienta);
3. wywołanie serwisu z `getRequestScope()`;
4. `revalidatePath`/`updateTag` i zwrot wyniku albo `redirect`.

Akcje leżą w `actions.ts` obok trasy, z `"use server"` na początku pliku, bez logiki biznesowej.

### 4.3 Uwierzytelnianie i autoryzacja

- Sprawdzenie w `proxy.ts` (w Next 16 następca `middleware.ts`) to tylko optymistyczne przekierowanie. Granicą bezpieczeństwa są serwisy i akcje.
- Autoryzacja na poziomie zasobu (właściciel lub rola) jest w serwisach `core`, testowana jednostkowo.

### 4.4 Cache

Decyzja do podjęcia na starcie (patrz otwarte pytania). Rekomendacja: **włączyć `cacheComponents: true` teraz**, gdy aplikacja jest mała. Późniejsze włączenie zamienia każdy niezcache'owany odczyt poza `<Suspense>` w błąd builda. Konsekwencje:
- dane per-użytkownik są dynamiczne (w `<Suspense>`);
- dane współdzielone są cache'owane jawnie przez `"use cache"` + `cacheLife` + `cacheTag`;
- inwalidacja odbywa się przez `updateTag`/`revalidateTag(tag, profil)`, bo w 16 forma jednoargumentowa jest przestarzała.

### 4.5 Konfiguracja

- `typedRoutes: true` (stabilne w 16).
- `serverExternalPackages` dla `@mikro-orm/sql`, `@mikro-orm/postgresql`, `@mikro-orm/migrations` (wbudowana lista Next obejmuje tylko pakiety MikroORM 6). Do zweryfikowania buildem w fazie 3.
- Zmienne środowiskowe: jeden moduł `packages/app/src/env.ts` (`@t3-oss/env-nextjs`). `process.env` czyta się tylko tam.
  - `NEXT_PUBLIC_*` są wstawiane w czasie builda, więc nie trzymamy w nich niczego, co zmienia się między środowiskami.
  - Pakiety dostają konfigurację przez `register<Pakiet>(container, config)`, a nie z `process.env`.
- Nagłówki bezpieczeństwa (CSP, `X-Content-Type-Options`, `Referrer-Policy`) ustawia `next.config.ts` w `headers()`.

## 5. Standardy danych (MikroORM 7)

- **Encje:** wyłącznie `defineEntity` + `p` (bez dekoratorów i `reflect-metadata`). Zawsze z jawnym `tableName`, bo minifikacja zmienia nazwy klas. Jeden plik na encję w `packages/db/src/entities/`. `Schema.setClass()` wywołać przed inicjalizacją ORM.
  Przykład poglądowy (nazwy metod `p.*` zweryfikować z typami w fazie 3):
  ```ts
  export const MentorSchema = defineEntity({
    name: "Mentor",
    tableName: "mentor",
    properties: { id: p.uuid().primary(), email: p.string().unique(), createdAt: p.datetime().onCreate(() => new Date()) },
  });
  export class Mentor extends MentorSchema.class {}
  MentorSchema.setClass(Mentor);
  ```
- **Konwencje schematu:**
  - tabele i kolumny w `snake_case` (domyślny `UnderscoreNamingStrategy`);
  - klucze `uuid` (v7) zamiast autoincrement;
  - `created_at`/`updated_at` w każdej tabeli, czasy w UTC (domyślne w v7);
  - pieniądze jako `numeric` lub liczba groszy, nigdy `float`.
- **Konfiguracja:** jeden plik `packages/db/src/mikro-orm.config.ts` (`defineConfig`) dla runtime'u i CLI.
  - `clientUrl` pochodzi z konfiguracji przekazanej do `registerDb` (w CLI z `DATABASE_URL`).
  - `extensions: [Migrator]` są rejestrowane jawnie.
  - Pula: `pool: { min: 0, max: 10, idleTimeoutMillis: 30_000 }`, nadpisywalna z env.
- **Cykl życia:** jedna instancja `MikroORM` na proces, trzymana w `globalThis` (HMR i osobne warstwy bundla Next). Rejestracja w kontenerze:
  - `orm`: `asValue`, singleton;
  - `em`: `asFunction(({ orm }) => orm.em.fork()).scoped()`;
  - repozytoria: `scoped`.
- **Migracje:**
  - tylko przez `migration:create`, commitowane razem ze zmianą encji, razem ze snapshotem;
  - zakaz edycji migracji już zastosowanych i zakaz `schema:update`;
  - wymagane migracje odwracalne (`down`), chyba że są jawnie opisane jako nieodwracalne;
  - migracje uruchamia skrypt (`npm run db:migrate`) lub krok wdrożenia, nigdy start aplikacji;
  - CI sprawdza `migration:check`, który wykrywa encje zmienione bez migracji.
- **Zapytania:** API `em.find` z `populate` i `fields` dla kontroli N+1. Dla raportów QueryBuilder (w v7 wymaga `.execute()`) lub Kysely. Zakaz sklejania SQL ze stringów.
- **Transakcje:** `em.transactional()` w serwisie, gdy przypadek użycia zmienia więcej niż jeden agregat.

## 6. Standardy UI

- **Tailwind v4:** konfiguracja w CSS. Tokeny shadcn (OKLCH, `:root`/`.dark`, `@theme inline`) leżą w `packages/ui/src/styles/globals.css`. Każdy arkusz deklaruje `@source` dla `packages/ui/src`, bo pakiet jest symlinkiem w `node_modules`, którego Tailwind nie skanuje. Klasy muszą być pełnymi stringami (bez `bg-${color}`). Do warunkowych klas służy `cn()`.
- **Dwa root layouty przez grupy tras:**
  - `app/(frontend)/layout.tsx` ma własny arkusz z Tailwindem i własnym `@theme` marki;
  - `app/(backend)/backend/layout.tsx` importuje `@devmentor/ui/globals.css` i `ThemeProvider` (`next-themes`, `attribute="class"`).
  - Oba arkusze z `source(none)` i jawnymi `@source`, żeby tokeny się nie mieszały.
  - Bez głównego `app/layout.tsx`, a `/` jest zdefiniowane w `(frontend)`. Przejście między frontendem a panelem przeładowuje całą stronę (Next `route-groups.md`). To akceptowalne, bo są to osobne obszary.
- **shadcn w monorepo:**
  - `components.json` są i w `app`, i w `ui`, ze zgodnymi `style`/`baseColor`/`iconLibrary` i `tailwind.config: ""`;
  - prymitywy idą do `packages/ui/src/components/`, bloki (formularze stron) do `app`;
  - `shadcn add` uruchamia się z `packages/app`.
- **Wyjątek od reguły jednego punktu wejścia:** `@devmentor/ui` udostępnia w `exports` również `./components/*`, `./lib/*`, `./hooks/*`, `./globals.css`, bo tego wymaga CLI shadcn i tree-shaking. Reguła lintu `@devmentor/*/*` dopuszcza dokładnie te ścieżki dla `ui`. Dla `core` i `db` zostaje bez zmian.
- **Formularze:** React Hook Form + `zodResolver` + komponenty `Field`/`FieldLabel`/`FieldError` z shadcn. Schemat z `core` jest współdzielony z Server Action. Natywna walidacja przeglądarki zostaje włączona.
- **Dostępność:** cel WCAG 2.2 AA:
  - każda kontrolka ma etykietę;
  - `aria-invalid` przy błędzie;
  - pełna obsługa klawiaturą i widoczny focus;
  - kontrast sprawdzany dla obu motywów;
  - `lang` na `<html>`.

## 7. Coding standards

### 7.1 TypeScript

- `strict: true` + `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`. Wszystko w `tsconfig.base.json`.
- Zakaz `any`: dane spoza systemu (formularze, env, HTTP, JSON) trafiają do kodu jako `unknown` i są parsowane Zodem. Nie używać `as` do „uciszania” typów. `!` (non-null) tylko z komentarzem, dlaczego jest bezpieczne.
- `type` dla kształtów danych, `interface` dla portów (kontraktów implementowanych przez klasy).
- Importy typów przez `import type`.
- Funkcje publiczne pakietów mają jawne typy zwracane.
- Unie dyskryminowane zamiast flag boolowskich dla stanów (`{ status: "loading" } | { status: "ready"; data }`).

### 7.2 Nazewnictwo i pliki

| Element | Konwencja | Przykład |
| --- | --- | --- |
| Komponenty React, klasy | `PascalCase`, plik o tej samej nazwie | `Backdrop.tsx`, `AppInfoService.ts` |
| Funkcje, zmienne, pliki modułów | `camelCase` | `container.ts`, `getRequestScope` |
| Pliki specjalne Next | konwencja Next | `page.tsx`, `layout.tsx`, `actions.ts` |
| Stałe modułu | `SCREAMING_SNAKE_CASE` | `APP_NAME` |
| Porty / implementacje | `XxxRepository` / `MikroOrmXxxRepository` | |
| Schematy Zod | `xxxSchema`, typ `Xxx = z.infer<typeof xxxSchema>` | `createMentorSchema` |
| Klucze w kontenerze | `camelCase`, rzeczownik | `appInfo`, `mentorRepository` |

- Eksporty nazwane wszędzie poza plikami specjalnymi Next, które wymagają `default`.
- Organizacja według funkcji (feature-first): `core/src/mentorship/{MentorshipService.ts, MentorRepository.ts, schemas.ts}`.

### 7.3 Styl

- Prettier ustala formatowanie (bez dyskusji w review). ESLint `typescript-eslint` `strict-type-checked` dla `core` i `db`, a `recommended-type-checked` dla `app` i `ui`.
- Funkcje mają jedną odpowiedzialność, a zagnieżdżenia są płytkie (wczesny `return`).
- Komentarze tylko tam, gdzie powód jest nieoczywisty. Żadnego zakomentowanego kodu.
- Bez `console.*` w kodzie serwerowym, zamiast tego logger pino z kontenera. Logi strukturalne bez danych osobowych i sekretów.

## 8. Testy

| Poziom | Narzędzie | Zakres | Gdzie |
| --- | --- | --- | --- |
| Jednostkowe | Vitest (`node`) | serwisy i reguły w `core` z fake'ami portów, autoryzacja, schematy | `packages/core/src/**/*.test.ts` |
| Integracyjne bazy | Vitest (`node`) + prawdziwy PostgreSQL | repozytoria, migracje (`up` na czystej bazie), zapytania | `packages/db/src/**/*.int.test.ts` |
| Komponenty | Vitest (`jsdom`) + Testing Library | komponenty `ui`, synchroniczne Server Components i Client Components | `packages/ui`, `packages/app` |
| E2E | Playwright na `npm run build` + `next start` | krytyczne ścieżki użytkownika (logowanie, główne przypadki użycia, panel), dostępność (`@axe-core/playwright`) | `packages/app/e2e/` |

- Jedna konfiguracja `vitest.config.ts` w katalogu głównym z `projects` dla pakietów. Skrypty `npm test` (unit + komponenty), `npm run test:int`, `npm run test:e2e`.
- Asynchronicznych Server Components Vitest nie obsługuje, więc testuje się je E2E, a logikę wyciąga do serwisów.
- Zakaz mockowania ORM. Repozytoria testuje się na bazie `<db>_test` (`orm.schema.refresh()` w global setup), a w CI na Testcontainers.
- Testy w kodzie z błędem: najpierw test, który go odtwarza, potem poprawka.
- Nie ustalamy procentowego progu pokrycia. Wymóg: każdy publiczny przypadek użycia i każda reguła autoryzacji mają test.

## 9. Proces inżynieryjny

- **SDD:**
  1. specyfikacja w `.ai/specs/` (cel, zakres, decyzje, kryteria akceptacji);
  2. plan faz;
  3. implementacja fazami;
  4. dziennik w `.ai/runs/`;
  5. po ukończeniu specyfikacja trafia do `.ai/specs/implemented/`.
  Zasady z `AGENTS.md` obowiązują bez zmian.
- **Git:** krótko żyjące gałęzie od `main`, Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), jeden logiczny krok na commit, razem z wpisem w dzienniku.
- **Definition of Done:**
  - `npm run lint`, `npm run typecheck`, `npm test` i `npm run build` przechodzą;
  - nowe zachowanie ma testy;
  - migracje są wygenerowane, a `migration:check` czysty;
  - zmiany UI zostały sprawdzone w przeglądarce;
  - dziennik i specyfikacja są zaktualizowane;
  - wnioski z poprawek trafiły do `.ai/lessons/`.
- **CI** (GitHub Actions, do dodania) uruchamia `npm ci` → lint → typecheck → test → test:int (Testcontainers) → build → test:e2e → `npm audit --audit-level=high`.
- **Zależności:** aktualizacje co tydzień (Renovate lub Dependabot), wersje Next i `eslint-config-next` zawsze zgodne, `npm audit` w CI blokuje poziom high i critical.
- **Hooki:** husky + lint-staged (Prettier + ESLint na zmienionych plikach) w pre-commit, bez `--no-verify`.

## 10. Rozważone i odrzucone

| Opcja | Powód odrzucenia |
| --- | --- |
| Turborepo | Przy 4 pakietach z eksportem źródeł TS i jednym buildzie (`app`) zysk jest mały. Wrócić, gdy CI będzie wolne lub pojawi się drugi deployowalny artefakt. |
| Dekoratory MikroORM | Wymagają `reflect-metadata` lub `@mikro-orm/reflection` i konfiguracji SWC/Turbopack. `defineEntity` daje typy bez tych kosztów. |
| `RequestContext.create` (AsyncLocalStorage) | Awilix scoped `em.fork()` przez `getRequestScope()` daje to samo, jawnie i bez opakowywania handlerów. |
| Auth.js v5 | Na npm nadal tylko beta. |
| `better-auth-mikro-orm` | Wspiera tylko MikroORM 6. |
| MikroORM 6 | Linia utrzymaniowa. v7 jest aktualne i lepiej pasuje do ESM i Next. |
| TypeScript 7 | Brak potwierdzonej obsługi w typescript-eslint i Next. Do ponownej oceny. |
| eslint-plugin-boundaries | Obecne `no-restricted-imports` wystarcza. Wrócić, jeśli będą potrzebne reguły na poziomie typów elementów (np. warstwy w obrębie pakietu). |

## 11. Wpływ na plan migracji

Zmiany do naniesienia w [2026-11-16-devmentor-monorepo.md](2026-11-16-devmentor-monorepo.md):

- **Przed fazą 3 (pilne):** aktualizacja `next` i `eslint-config-next` do 16.4.6 (podatność krytyczna) oraz decyzja o `cacheComponents`.
- **Faza 3:** MikroORM 7 (`defineEntity`, `serverExternalPackages`, `globalThis`, `registerDb`, `tsx` dla CLI), baza `_test`, pierwsze testy integracyjne.
- **Faza 4:** wyjątek w `exports` i lincie dla `@devmentor/ui/components/*` itd., dwa root layouty, `@source`.
- **Nowa faza 5, jakość:** Vitest (projects), Playwright, Prettier, husky + lint-staged, `env.ts`, ostrzejsze opcje `tsconfig`, `typescript-eslint` type-checked, CI.
- **Nowa faza 6, auth:** Better Auth, role, `proxy.ts`, autoryzacja w serwisach.

## 12. Otwarte pytania (do decyzji użytkownika)

1. Czy założenia z sekcji 1 (konta, role `user`/`admin`, jedna aplikacja z panelem) są poprawne? Jakie są główne funkcje DevMentor?
2. `cacheComponents`: włączyć teraz (rekomendacja) czy zostać przy modelu bez Cache Components?
3. Auth: Better Auth (rekomendacja) czy inne rozwiązanie, np. zewnętrzny dostawca?
4. Gdzie aplikacja będzie wdrażana (Vercel, kontener, VPS)? Od tego zależą sposób uruchamiania migracji, obsługa env w obrazie i telemetria.
5. Czy CI ma być na GitHub Actions?
