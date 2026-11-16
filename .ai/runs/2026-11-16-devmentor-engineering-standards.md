# DevMentor — wdrożenie standardów inżynieryjnych

Cele:
- Wdrożyć stack, wzorce i standardy ze specyfikacji: bezpieczeństwo zależności, tooling jakości, MikroORM 7, Tailwind v4 + shadcn + Cache Components, Better Auth, E2E, hooki i CI.
- Zachować działanie istniejącej strony startowej.

Specyfikacja: [.ai/specs/implemented/2026-11-16-devmentor-engineering-standards.md](../specs/implemented/2026-11-16-devmentor-engineering-standards.md)

Status: done

---

## 2026-11-16: fazy 0–5 (całe wdrożenie, jeden commit)
- Zawiera: Next 16.4.6 (krytyczna podatność), strict tsconfig, Prettier, typed lint i `env.ts`, Vitest (16 testów jednostkowych), `db` na MikroORM 7 z migracją i testami integracyjnymi (6), porty, `UserProfileService`, `/api/health`, grupy tras `(frontend)`/`(backend)` z Tailwind v4 i shadcn, Cache Components, Better Auth z rolami, `/account`, panel, Playwright (8 testów E2E z axe), husky + lint-staged, CI.
- Decyzje użytkownika: Cache Components włączone, Better Auth, GitHub Actions, wdrożenie nieustalone.
- Pułapki: ORM w `globalThis` psuł metadane między warstwami bundla, wyszło dopiero w E2E (lekcja). `serverExternalPackages` okazało się zbędne. Root layout musi być w grupie. Negacja gitignore nie przywraca ścieżek, więc w lincie jest regex. `pkill -f` zabijał powłokę (lekcja). `CardTitle` to `div`, więc tytuły dostały `<h2>`.
- Weryfikacja: pełny pipeline CI na czystej kopii i nowej bazie przeszedł (format, lint, typecheck, test, migracje, test:int, build, test:e2e, audit). Zrzuty ekranu potwierdzają, że strona startowa wygląda jak przed zmianami.
- Dalej: funkcje produktu, miejsce wdrożenia (`BETTER_AUTH_URL`), pełne CSP z nonce, Renovate/Dependabot, sprawdzenie logowania przez podgląd sandboxa.
