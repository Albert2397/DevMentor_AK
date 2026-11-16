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
- Tailwind dla stron frontendowych (publicznych), shadcn-ui dla stron backendowych (panelu).
- npm workspaces (monorepo).

Stan integracji (co już jest zainstalowane, a co nie) opisuje `.ai/specs/2026-11-16-devmentor-monorepo.md`. Sprawdź go, zanim założysz, że dana biblioteka jest skonfigurowana.

Wersje, wzorce projektowe, coding standards, testy i Definition of Done opisuje `.ai/specs/2026-11-16-devmentor-engineering-standards.md`. Stosuj je przy każdej zmianie kodu. Dopóki ma status `proposed`, decyzje z jego sekcji „Otwarte pytania” nie są przesądzone: nie wdrażaj ich bez potwierdzenia użytkownika.

## Monorepo — `packages/`

| Pakiet | Nazwa | Odpowiedzialność |
| --- | --- | --- |
| `packages/app` | `@devmentor/app` | Aplikacja Next.js: routing, strony, Server Actions, Route Handlers, composition root kontenera DI. |
| `packages/core` | `@devmentor/core` | Kod wielokrotnego użytku niezależny od frameworka: typy domenowe, logika, kontrakty serwisów, narzędzia DI. |
| `packages/db` | `@devmentor/db` | Wszystko, co dotyczy danych: konfiguracja MikroORM, encje, migracje, repozytoria. |
| `packages/ui` | `@devmentor/ui` | Komponenty UI wielokrotnego użytku, w tym komponenty shadcn-ui. |

Zasady:

- Dozwolony kierunek zależności: `app` → `ui`, `db`, `core`; `db` → `core`; `ui` → `core`. `core` nie zależy od żadnego innego pakietu. Bez cykli. `ui` nigdy nie importuje `db`. Te granice wymusza `eslint.config.mjs` w katalogu głównym; nie wyłączaj tej reguły, tylko popraw import.
- Między pakietami importuj tylko przez publiczny punkt wejścia `@devmentor/<pakiet>` (`src/index.ts`). Nie używaj ścieżek względnych do innych pakietów ani głębokich importów.
- Pakiety wewnętrzne eksportują źródła TS (`"exports": { ".": "./src/index.ts" }`). Next/Turbopack transpiluje je sam, więc nie dodawaj kroku budowania ani `transpilePackages`.
- Nowy pakiet: `packages/<nazwa>`, nazwa `@devmentor/<nazwa>`, `tsconfig.json` rozszerzający `../../tsconfig.base.json`. Przed dodaniem nowego pakietu zapytaj użytkownika.
- Zależność instaluj w pakiecie, który jej używa: `npm install <dep> -w @devmentor/<pakiet>`. W głównym `package.json` trzymaj tylko narzędzia wspólne.
- Polecenia uruchamiaj z katalogu głównego: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`.

## Dane — MikroORM (`packages/db`)

- Konfiguracja ORM, encje, migracje i repozytoria trafiają wyłącznie do `packages/db`.
- Schemat zmieniaj tylko migracjami MikroORM. Migrację generuj i commituj razem ze zmianą encji. Nie edytuj migracji, które zostały już zastosowane. Nie używaj synchronizacji schematu (`schema:update`) zamiast migracji.
- Jedna instancja MikroORM (z pulą połączeń) na proces. Dla każdego żądania używaj osobnego kontekstu (`em.fork()` / `RequestContext`), nigdy globalnego `EntityManager`.
- Z bazy korzystaj tylko po stronie serwera (Server Components, Server Actions, Route Handlers), nigdy w komponentach klienckich ani w `packages/ui`.
- Dane połączenia czytaj ze zmiennych środowiskowych. Nie commituj sekretów.

## Dependency Injection — Awilix

- Composition root to `packages/app/src/server/container.ts` (oznaczony `server-only`). Tylko tam rejestrujesz zależności. Kontener twórz przez `createDiContainer()` z `@devmentor/core` (tryb PROXY, `strict: true`), a nie przez bezpośredni import `awilix` w `app`.
- Pakiety eksportują klasy lub fabryki i funkcję `register<Pakiet>(container, config)` (np. `registerCore`) oraz typ swojego cradle (np. `CoreCradle`). `AppCradle` w `app` je łączy. Nie eksportują gotowych singletonów.
- Serwisy przyjmują jeden obiekt z zależnościami w konstruktorze (`constructor({ appConfig }: { appConfig: AppConfig })`). Nie importują bezpośrednio implementacji swoich zależności.
- `resolve` wywołuj tylko na brzegach aplikacji (strona, layout, `generateMetadata`, Server Action, Route Handler) i zawsze przez `getRequestScope()`. Nie rozwiązuj zależności z `getContainer()`, bo Awilix pozwala wtedy pobrać zależność `scoped` z kontenera głównego i staje się ona współdzielona między żądaniami. Nie wywołuj `resolve` w logice domenowej; kontener nie może służyć za service locator.
- Zasięgi: `singleton` dla ORM i konfiguracji, `scoped` (per żądanie) dla `EntityManager` i serwisów, które z niego korzystają.

## UI — Tailwind i shadcn-ui

- Strony frontendowe (publiczne) budujesz na Tailwind, w grupie tras `packages/app/src/app/(frontend)/`.
- Strony backendowe (panel) budujesz z komponentów shadcn-ui, pod `packages/app/src/app/backend/`.
- Komponenty shadcn-ui i inne współdzielone komponenty trzymaj w `packages/ui`. W `app` tylko komponuj z nich strony.
- Komponenty w `packages/ui` nie zawierają logiki biznesowej ani dostępu do danych. Dane dostają przez propsy.

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
- **Weryfikuj zmiany przed commitem.** Uruchom `npm run lint` i `npm run build`, a dla zmian w UI sprawdź działanie w przeglądarce (`npm run dev`). Przejrzyj diff. Wynik weryfikacji odnotuj we wpisie w `.ai/runs/`. Bez przejścia tych kroków nie ustawiaj `Status: done`.
- **Naprawiaj błędy samodzielnie.** Mając zgłoszenie błędu, log lub wynik nieudanego builda, sam znajdź i usuń przyczynę źródłową, bez obchodzenia problemu. Po naprawie zapisz lekcję (patrz sekcja o `.ai/lessons/`).
- **Szukaj eleganckiego rozwiązania.** Jeśli poprawka wychodzi połowiczna lub zawiła, odrzuć ją i zaimplementuj czystsze rozwiązanie, wykorzystując wiedzę zdobytą przy pierwszej próbie.
- **Używaj subagentów** do szerokiego przeszukiwania kodu i researchu, żeby nie zaśmiecać głównego kontekstu.
- **Powtarzalne czynności zamieniaj w skille** w `.claude/skills/` i commituj je do repo.
