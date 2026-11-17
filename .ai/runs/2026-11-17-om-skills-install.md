# Instalacja skilli open-mercato/skills

Cele:
- Zainstalować skille `om-*` z `open-mercato/skills` (`npx skills add open-mercato/skills --skill '*'`).

Specyfikacja: brak (zadanie trywialne)

Status: done

---

## 2026-11-17: instalacja skilli
- **Zawiera:** skille w `.agents/skills/om-*`, symlinki w `.claude/skills/` i `skills-lock.json`.
- **Uwaga:** skille `om-auto-create-pr` / `om-open-pr` mają własny workflow PR; w repo nadal obowiązują reguły z `AGENTS.md` (dziennik `.ai/runs/`, 100% pokrycia). `om-setup-agent-pipeline` może nadpisać `AGENTS.md` — uruchamiać świadomie.
- **Weryfikacja:** brak zmian w kodzie aplikacji, więc testy nie były uruchamiane.
- **Pułapka:** hook pre-commit (lint-staged → eslint) lintował zewnętrzne skrypty w `.agents/` i padał na błędzie parsowania. Dodano `**/.agents/**` i `**/.claude/**` do `globalIgnores` w `eslint.config.mjs` (analogicznie do `.prettierignore`).
