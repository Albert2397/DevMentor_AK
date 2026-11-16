# DevMentor — CI dla PR, testy integracyjne (Testcontainers + agent-browser), 100% pokrycia

Cele:
- CI dla każdego PR: build, lint, testy jednostkowe i integracyjne z PostgreSQL z Testcontainers oraz tymczasową instancją aplikacji testowaną przez `agent-browser`.
- Zasada 100% pokrycia testami jednostkowymi w `AGENTS.md` i testy do 100% dla istniejącego kodu.

Specyfikacja: [.ai/specs/2026-11-16-ci-testing.md](../specs/2026-11-16-ci-testing.md)

Status: in-progress

---

## 2026-11-16: fazy 1–4 (jeden commit)
- **Zawiera:**
  - progi pokrycia v8 100% per plik (`test:coverage`) i zasada w `AGENTS.md`;
  - `@devmentor/db/testing` (Testcontainers albo tymczasowa baza z `INTEGRATION_DATABASE_URL`);
  - harness aplikacji, `AgentBrowser`, projekt `app-int` (9 testów) i `npm run app:ephemeral`;
  - test „migracje = encje”;
  - usunięcie Playwright;
  - workflow z jobami `lint`, `unit`, `build` i `integration`;
  - 162 testy jednostkowe, 100% na 64 plikach.
- **Decyzje:**
  - Adaptery ORM w testach jednostkowych używają fake `EntityManager`, który sprawdza tylko delegację.
  - Logika ze skryptów i `next.config.ts` przeszła do `src`.
  - `@devmentor/db/testing` jest dozwolone w lincie tylko w `integration/` i `scripts/`.
- **Pułapki (lekcja `integration-harness-pitfalls`):**
  - treść z `<Suspense>` pojawia się po `wait --url`;
  - `npx next start` zostawia osierocony serwer, więc trzeba zabijać grupę procesów;
  - wzorzec `packages/*/src` w `coverage.include` nie działa z `root` projektów, trzeba użyć `**/src`.
- **Weryfikacja:** symulacja wszystkich jobów CI na czystej kopii przeszła. Testy integracyjne działały w trybie bez Dockera. Pixel diff strony głównej: 0.
- **Dalej:** pierwszy przebieg CI na GitHubie, który potwierdzi ścieżkę Testcontainers. Potem `Status: done` i przeniesienie specyfikacji do `implemented/`. Wymagane checki w ochronie `main`.
