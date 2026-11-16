# DevMentor — migracja do monorepo

Cele:
- Przenieść aplikację Next.js do monorepo `packages/{app,core,db,ui}` z zachowaniem działania.
- Wdrożyć stack z `AGENTS.md`: Awilix, PostgreSQL + MikroORM, Tailwind, shadcn-ui (fazy 2–4).

Specyfikacja: [.ai/specs/2026-11-16-devmentor-monorepo.md](../specs/2026-11-16-devmentor-monorepo.md)

Status: in-progress

---

## 2026-11-16: faza 1 (struktura monorepo i wydzielenie kodu)
- Workspaces i przeniesienie aplikacji zrobione wcześniej w `b73f116` (bez wpisu w dzienniku). Ten commit wydziela `Backdrop` do `@devmentor/ui` (CSS Module, selektor treści jako props), usuwa nieużywany `page.module.css` i przenosi ESLint do jednej konfiguracji w katalogu głównym z granicami pakietów (`no-restricted-imports`).
- Pułapka: ESLint nie łączy `no-restricted-imports` między blokami, więc każdy pakiet ma dokładnie jeden blok. `react` jest w `ui` zależnością peer, żeby nie było drugiej kopii.
- Weryfikacja: lint, typecheck i build przechodzą. Testowe niedozwolone importy (4 przypadki) są odrzucane. Serwis `next` zwraca 200, a znaczniki strony są takie jak przed migracją. Wyglądu nie sprawdziłem w przeglądarce, bo w środowisku jej nie ma.
- Dalej: faza 2, Awilix i composition root w `app`.

## 2026-11-16: faza 2 (Awilix)
- `awilix` jest w `@devmentor/core` (`createDiContainer`: PROXY i strict), razem z `AppInfoService`, `registerCore` i `CoreCradle`. Composition root to `packages/app/src/server/container.ts` z `server-only` i `getRequestScope()` przez `cache()`. Layout pobiera metadane z kontenera.
- Pułapka: strict mode odrzuca singleton zależny od zależności scoped, ale nie blokuje pobrania zależności scoped z kontenera głównego. Dlatego w `AGENTS.md` jest reguła, że resolve idzie zawsze przez `getRequestScope()`. Kontener celowo nie trafia do `globalThis`, żeby HMR wczytywał nowe rejestracje.
- Weryfikacja: typecheck, lint i build przechodzą (`/` nadal statyczna). Testy tymczasowe potwierdziły odrzucenie wycieku zasięgu i błąd builda przy imporcie kontenera w komponencie klienckim. Dev i build zwracają ten sam tytuł i opis.
- Dalej: faza 3, MikroORM i PostgreSQL w `db`.
