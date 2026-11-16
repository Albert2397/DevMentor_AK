# MikroORM w Next: nie trzymaj instancji ORM w `globalThis`

Objaw: na produkcyjnym buildzie strona rzuca `MetadataError: Metadata for entity h not found` (nazwa klasy po minifikacji). Działa natomiast, gdy pierwszym żądaniem po starcie była ta sama strona.

Przyczyna: Next ładuje workspace'owy pakiet `@devmentor/db` osobno w każdej warstwie bundla (Route Handlers, render stron). Każda warstwa ma własną klasę encji (`UserProfileEntity`). ORM zapisany w `globalThis` przez pierwszą warstwę, np. `/api/health`, zna tylko klasy tej warstwy. `em.findOne(UserProfileEntity)` z innej warstwy podaje więc klasę, której metadane nie istnieją.

Reguła: instancja MikroORM jest per moduł (`let orm` w `packages/db/src/orm.ts`), czyli per warstwa bundla. Pula ma `min: 0` i `idleTimeoutMillis`, więc kilka instancji nie trzyma połączeń. `globalThis` nadaje się do zasobów bez tożsamości klas, np. instancji Better Auth z pulą `pg`. Błąd wychodzi dopiero w E2E na `next start`, nie w testach integracyjnych, więc każdą zmianę cyklu życia ORM weryfikuj testem E2E.
