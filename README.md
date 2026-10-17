# Schwedenrätsel

Eine deutschsprachige, statische Schwedenrätsel-App – konsequent im ruhigen, modernen Design der Sudoku-App von Bilgery Solutions. Für iPhone, iPad und Desktop.

## Spielen

- **Leicht, Mittel, Schwer** auswählen und auf **+ Neu** tippen, um ein neues Rätsel generieren zu lassen.
- Graue Hinweisfelder mit Pfeilen stehen direkt im Raster. Antippen wählt das Wort.
- Tippe in ein weißes Feld und gib einen Buchstaben über die Geräte-Tastatur ein. An einer Kreuzung erneut tippen, um die Schreibrichtung zu wechseln.
- Die aktive Frage erscheint gut lesbar **oberhalb** des Rasters; mit dem Pfeil wechselst du zum nächsten Begriff.
- **Löschen**, **Prüfen**, **Hinweis**, **Zurücksetzen** als Werkzeuge unter dem Raster.
- Optionaler **Timer**, der erst startet, wenn du auf *Timer starten* tippst; erneut tippen pausiert ihn.
- Die Rasteransicht ist auf kleinen Bildschirmen horizontal und vertikal scrollbar, inklusive Zoom **− / +**.
- Die nummerierten Buchstaben ergeben das **Lösungswort**.
- Über **••• → Letzte Rätsel anzeigen** kannst du frühere Ausgaben wieder öffnen.

Spielstand und Timer werden pro Rätsel automatisch in `localStorage` gespeichert. Keine Registrierung, kein Backend.

## Aufbau

- `index.html` – übersichtliche Spieloberfläche
- `style.css` – modernes Layout mit iPhone-/iPad-Breakpoints
- `main.js` – Spiellogik, Touch-/Tastaturbedienung, Prüfung, Timer, Verlauf und Spielstände
- `raetsel.js` – die drei handgeprüften Starträtsel
- `wordbank.js` und `generator.js` – kuratierter Wortschatz und Generator für neue Rätsel
- `favicon.svg` – passendes Icon

Der Generator erzeugt neue Kombinationen eines endlichen Wortschatzes; einzelne Begriffe können sich mit der Zeit wiederholen.

## Veröffentlichung mit GitHub Pages

`Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)`

https://bilgery-solutions.github.io/kreuzwortraetsel/

Es ist kein Build oder Server nötig; die App ist vollständig statisch.