# Konfiguracja pipeline'u agentów (om-setup-agent-pipeline)

Cele:
- Skonfigurować `.ai/agentic.config.json` dla skilli `om-*` (tracker GitHub, przeglądarka agent-browser, bramka QA włączona).
- Wygenerować brakujące dokumenty: `SDLC.md`, `CODE_REVIEW.md`, `BACKWARD_COMPATIBILITY.md` (`AGENTS.md` istnieje i nie był zmieniany).

Specyfikacja: brak (konfiguracja)

Status: done

---

## 2026-11-17: konfiguracja pipeline'u
- **Zawiera:** config, deskryptory `.ai/trackers/github.md` i `.ai/browsers/agent-browser.md`, `.gitkeep` w `.ai/{analysis,scripts,qa}`, trzy dokumenty procesu, wpisy w `.gitignore` dla stanu QA.
- **Decyzje:** bramka walidacji = kroki z `ci.yml` bez testów integracyjnych (`format:check`, `lint`, `typecheck`, `test:coverage`, `build`). Do GitHuba dodano 32 brakujące etykiety (istniejące `bug`, `documentation` bez zmian).
- **Weryfikacja:** brak zmian w kodzie aplikacji; `format:check` dla nowych dokumentów przez prettier. Testy nie uruchamiane.
