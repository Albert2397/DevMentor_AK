# Lessons

Indeks wniosków i ustaleń zapisanych przez LLM-y pracujące w tym repo. Każdy wpis w tym pliku to jedna linia odsyłająca do szczegółowej notatki w katalogu `.ai/lessons/`.

Zasady:

- Każda lekcja to osobny plik w `.ai/lessons/<slug>.md` (krótki, opisowy slug, bez daty w nazwie — lekcje nie są chronologiczne, są tematyczne).
- Tu, w `lessons.md`, dodawaj tylko jedną linię na lekcję: `- [Tytuł](lessons/<slug>.md) — jednolinijkowy opis, czego to dotyczy.`
- Zapisuj lekcję, gdy: naprawiono nietrywialny błąd, odkryto pułapkę w kodzie/infrastrukturze, znaleziono rozwiązanie, które warto zapamiętać na przyszłość, albo gdy coś zaskakującego okazało się prawdą/nieprawdą.
- Zanim zaczniesz nowe zadanie, przeszukaj ten plik i `.ai/lessons/`, żeby nie powtarzać już rozwiązanych problemów.
- Nie duplikuj tu wiedzy, którą łatwo odtworzyć z kodu, historii git albo dokumentacji — lekcja ma być czymś, czego nie da się łatwo wywnioskować ponownie.

## Spis lekcji

- [`next build` pada przy `NODE_ENV=development`](lessons/next-build-node-env.md): błąd `useContext` na `null` przy prerenderowaniu, który nie wynika z dwóch kopii Reacta.
