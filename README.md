# DevMentor

Aplikacja webowa zbudowana jako monorepo na Next.js 16 (App Router), React 19 i TypeScript.

## Stack

| Obszar | Technologia |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript (`strict`) |
| Baza danych | PostgreSQL |
| ORM | MikroORM: encje, migracje, pula połączeń |
| Dependency Injection | Awilix |
| UI: strony frontendowe | Tailwind CSS |
| UI: strony backendowe (panel) | shadcn-ui |
| Monorepo | npm workspaces |

## Architektura

```
devmentor/
├── packages/
│   ├── app/    @devmentor/app   aplikacja Next.js
│   ├── core/   @devmentor/core  logika i typy wielokrotnego użytku
│   ├── db/     @devmentor/db    MikroORM: konfiguracja, encje, migracje
│   └── ui/     @devmentor/ui    komponenty UI (shadcn-ui)
├── tsconfig.base.json           wspólna konfiguracja TypeScript
└── package.json                 definicja workspaces i skrypty
```

### Pakiety

- **`app`**: aplikacja Next.js. Zawiera routing, strony, Server Actions i Route Handlers. Tu jest composition root, który buduje kontener Awilix i łączy pozostałe pakiety. Strony publiczne leżą w `src/app/(frontend)/` (Tailwind), a panel w `src/app/backend/` (shadcn-ui).
- **`core`**: kod niezależny od frameworka i bazy danych: typy domenowe, logika biznesowa, kontrakty serwisów i narzędzia DI.
- **`db`**: warstwa danych. Konfiguracja MikroORM, encje, migracje i repozytoria. Schemat zmienia się wyłącznie migracjami.
- **`ui`**: komponenty prezentacyjne wielokrotnego użytku, w tym komponenty shadcn-ui. Nie mają dostępu do danych, wszystko dostają przez propsy.

### Zależności między pakietami

```
        app
      ↙  ↓  ↘
    ui   db   │
      ↘  ↓  ↙
       core
```

`core` nie zależy od żadnego pakietu, a `ui` nie importuje `db`. Pakiety importuje się tylko przez ich publiczny punkt wejścia (`@devmentor/<pakiet>`). Pakiety eksportują źródła TypeScript, które Next.js (Turbopack) transpiluje bez osobnego kroku budowania.

### Przepływ żądania

1. Strona, Server Action lub Route Handler w `app` tworzy zasięg (scope) kontenera Awilix dla żądania.
2. Z tego zasięgu pobiera serwis. Serwis dostaje zależności przez konstruktor, w tym `EntityManager` sforkowany dla żądania.
3. Serwis wykonuje logikę z `core` i korzysta z encji i repozytoriów z `db`. Instancja MikroORM z pulą połączeń jest wspólna dla całego procesu (singleton).
4. Wynik trafia do komponentów z `ui`, które go renderują.

## Uruchamianie

Wymagania: Node.js 24 i npm 11.

```bash
npm install          # instaluje zależności i linkuje pakiety workspace
npm run dev          # serwer deweloperski: http://localhost:3000
npm run build        # build produkcyjny
npm run lint         # ESLint we wszystkich pakietach
npm run typecheck    # TypeScript we wszystkich pakietach
```

Zależności instaluje się w pakiecie, który ich używa, np. `npm install awilix -w @devmentor/core`.

## Praca z agentami AI

Zasady dla agentów kodujących są w [`AGENTS.md`](AGENTS.md), a `CLAUDE.md` go importuje. Specyfikacje, dzienniki zadań i wnioski leżą w katalogu [`.ai/`](.ai/).
