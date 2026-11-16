# `pkill -f` / `pgrep -f` zabija własną powłokę narzędzia

Narzędzie Bash uruchamia polecenie jako `bash -c '<całe polecenie>'`. Wzorzec `pkill -f "next start --port 3020"` pasuje więc także do tej powłoki. Powłoka ginie (exit 144), a kolejne kroki tego samego polecenia, np. przywrócenie pliku z kopii, się nie wykonują. Serwery uruchomione w tle zostają przy tym osierocone.

Reguła: nie zabijaj procesów wzorcem obecnym w treści polecenia. Zapisz PID przy starcie (`cmd & echo $! > /tmp/x.pid`) i zabij `kill "$(cat /tmp/x.pid)"`. Kroki sprzątające (przywracanie plików) uruchamiaj osobnym poleceniem. Nie zatrzymuj serwisu sandboxa: jego `next dev` ma za rodzica proces PM2 (`workspace-agent-cli`).
