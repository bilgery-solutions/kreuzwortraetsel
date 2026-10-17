# Die Rätselseite – Schwedenrätsel

Eine neu aufgebaute, statische Schwedenrätsel-Webapp für iPhone, iPad und Desktop – wie eine Rätselseite aus der Zeitung. Hinweise und Pfeile stehen **direkt in den grauen Rasterfeldern**, nicht in einer separaten Hinweisliste.

## Spielen

- Weißes Feld antippen: Buchstabe eingeben. An Kreuzungen erneut tippen, um die Richtung zu wechseln.
- Graues Hinweisfeld antippen: passenden Begriff auswählen.
- Der ganze Begriff wird markiert; der vollständige Hinweis steht zusätzlich über dem Raster.
- Die kleinen Nummern in Buchstabenfeldern verweisen auf das **Lösungswort** am Seitenende. Dieses füllt sich von selbst.
- Auf dem iPhone das Raster **seitlich verschieben**, damit die kleinen Hinweistexte lesbar bleiben. Mit **−** und **+** lässt sich die Größe zusätzlich verändern.
- Über das unauffällige **•••**-Menü oben rechts zwischen Leicht, Mittel und Schwer wechseln, Einträge prüfen, einen Buchstaben aufdecken oder ein Rätsel zurücksetzen.
- Fortschritt wird je Rätsel im Browser (`localStorage`) gespeichert. Keine Anmeldung, kein Backend.

## Bereitgestellte Rätsel

| Schwierigkeitsgrad | Ausgabe | Begriffe | Raster |
| --- | --- | ---: | --- |
| Leicht | 01 | 39 | 16 × 16 |
| Mittel | 01 | 40 | 16 × 16 |
| Schwer | 01 | 39 | 17 × 17 |

## Aufbau

- `index.html`: komplette Oberfläche
- `style.css`: klassischer Magazin-/Zeitungsstil und responsives Layout
- `main.js`: Spiellogik, Eingabe, Prüfung, Zoom und Speicherung
- `raetsel.js`: Rätseldaten mit Hinweis-, Buchstaben- und Lösungsfeldern
- `favicon.svg`: Pfeilrätsel-Icon

Die frühere Kreuzworträtsel-App wurde **vollständig ersetzt**. Keine ihrer Spiellogik-Dateien wird mehr benötigt.

### Weitere Ausgaben ergänzen

Ein weiteres Objekt in `window.SCHWEDENRAETSEL` in `raetsel.js` ergänzen, mit einzigartiger `id`, `level` (`leicht`, `mittel` oder `schwer`), `title`, `size`, `number`, `entries` und `solution`. Jedes Rätselwort enthält:

```javascript
{
  answer: "KATZE",        // Großbuchstaben, Umlaute AE/OE/UE
  clue: "Schnurrendes Tier",
  row: 4, col: 3,         // Buchstabenstart (nullbasiert)
  direction: "right",    // "right" oder "down"
  clueRow: 4, clueCol: 2  // Graues Hinweisfeld direkt links bzw. darüber
}
```

Die `solution` enthält ein `answer` und ein `cells`-Array mit `[zeile, spalte]` für jeden Buchstaben des Lösungsworts (jeweils ein eindeutiges Buchstabenfeld). Die App prüft beim Laden sämtliche Kreuzungen und die Lösungsfelder. Mehrere Ausgaben pro Stufe sind im Datenmodell möglich; derzeit zeigt die UI die erste Ausgabe pro Stufe.

## Hosting auf GitHub Pages

`Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)`.

Projekt-URL nach Aktivierung: <https://bilgery-solutions.github.io/kreuzwortraetsel/>.

Das Repository ist derzeit privat. Für GitHub Pages aus einem privaten Organisations-Repository ist ein geeigneter GitHub-Plan nötig; andernfalls kann es für eine öffentliche GitHub-Pages-Seite öffentlich gestellt werden. Die veröffentlichte Seite ist öffentlich zugänglich, auch wenn das Repository privat sein kann.

Es gibt keinen Build-Schritt und keine externen Laufzeitabhängigkeiten. Für lokale Tests `index.html` öffnen oder einen einfachen statischen Webserver nutzen.