# `next build` pada przy `NODE_ENV=development`

Sandbox ustawia globalnie `NODE_ENV=development`. Przy tej wartości `next build` kończy się błędem prerenderowania `/_global-error` z komunikatem `TypeError: Cannot read properties of null (reading 'useContext')`. Komunikat wygląda jak problem z dwiema kopiami Reacta, ale to nie jest przyczyna: `npm ls react` pokazuje jedną kopię.

Reguła: skrypt `build` w `packages/app/package.json` wymusza `NODE_ENV=production next build`. Nie usuwaj tego. Jeśli build pada z tym błędem, najpierw sprawdź `echo $NODE_ENV`.
