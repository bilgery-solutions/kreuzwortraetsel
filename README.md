# Die Rätselseite – Schwedenrätsel

Eine statische Webapp für iPhone, iPad und Desktop. Die Hinweise stehen wie in einem Zeitschriften-Schwedenrätsel **direkt im Raster**; die Lösungsbuchstaben stehen darunter. Keine Anmeldung, kein Backend, keine externe Laufzeitabhängigkeit.

## Spielen

- **+ Neues Rätsel** oben: Auf Knopfdruck wird ein neues Schwedenrätsel für den aktuell gewählten Schwierigkeitsgrad generiert.
- **••• → Leicht / Mittel / Schwer**: Schwierigkeit wechseln. Die zuletzt gespielte Ausgabe pro Schwierigkeit öffnet sich automatisch.
- **••• → Letzte Ausgaben**: Zu früheren Spielen zurückkehren, ohne einen angefangenen Spielstand zu verlieren. Die 15 jüngsten generierten Rätsel **je Schwierigkeitsgrad** werden auf diesem Gerät aufbewahrt, außerdem die ursprüngliche Ausgabe 01.
- Weißes Feld antippen und Buchstaben eingeben. Kreuzung erneut antippen, um die Richtung zu wechseln.
- Graues Hinweisfeld antippen, um das zugehörige Wort auszuwählen.
- Die nummerierten Felder ergeben das **Lösungswort** unter dem Rätsel.
- Auf dem iPhone das Raster seitlich verschieben und bei Bedarf mit **−**/**+** zoomen.
- Im Menü kann man die Einträge prüfen, einen Buchstaben aufdecken oder das aktuelle Rätsel leeren.
- Spielstände und erzeugte Rätsel werden lokal im Browser per `localStorage` gespeichert. Sie sind nicht zwischen Geräten synchronisiert und gehen beim Löschen der Browserdaten verloren.

## Neue Rätsel – ohne Server

`wordbank.js` enthält **549 kuratierte deutsche Begriffe mit Hinweisen**. `generator.js` erstellt daraus jedes Mal mithilfe eines zufällig ausgewählten 32-Bit-Seeds ein anderes 16×16- bzw. 17×17-Schwedenrätsel. Es prüft dabei die Buchstaben an Kreuzungen, eindeutige Hinweispositionen und das Lösungswort. Leichte Rätsel verwenden den einfacheren Wortbestand; schwere Rätsel bevorzugen anspruchsvollere Begriffe.

Die Kombinationen sind so zahlreich, dass immer wieder neue Ausgaben möglich sind. Es handelt sich aber **nicht um tatsächlich unendlich viele verschiedene Fragen**: Der Wortschatz ist endlich, einzelne Hinweise wiederholen sich deshalb gelegentlich in anderen Kombinationen.

### Datenmodell und Speicherung

- Die drei bisherigen, handgeprüften Rätsel bleiben als **Ausgabe 01** in `raetsel.js` erhalten.
- Neue Ausgaben erhalten je Schwierigkeitsgrad laufende Nummern (`02`, `03` usw.) und eine eigene ID.
- Das generierte Raster wird zusammen mit seinem Lösungswort gespeichert, damit ein späterer App- oder Wortlistenstand bereits begonnene Rätsel nicht verändert.
- Um den lokalen Speicher zu begrenzen, werden pro Schwierigkeitsgrad die 15 zuletzt generierten Ausgaben archiviert. Ältere generierte Ausgaben werden automatisch entfernt; **Ausgabe 01** bleibt zugänglich.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Oberfläche |
| `style.css` | Zeitschriften-Layout und responsives Design |
| `main.js` | Spiellogik, neue Ausgabe, Navigation, Prüfung, Zoom und Speicherstände |
| `raetsel.js` | Drei handgeprüfte Ausgangsrätsel |
| `wordbank.js` | Deutscher Wort- und Hinweiskatalog |
| `generator.js` | Prozeduraler Schwedenrätsel-Generator |
| `favicon.svg` | Raster-Icon |

Zum Hinzufügen neuer Wörter in `wordbank.js` eine Zeile `LOESUNG|Hinweis|0` (allgemein) oder `LOESUNG|Hinweis|1` (anspruchsvoller Begriff) ergänzen. Umlaute werden als `AE`, `OE`, `UE`, `SS` geschrieben.

## GitHub Pages

`Settings → Pages → Deploy from a branch → main → /(root)`.

Voraussichtliche Adresse nach Aktivierung: <https://bilgery-solutions.github.io/kreuzwortraetsel/>. Falls die Organisation das Repository privat belässt, benötigt sie für Pages einen GitHub-Plan, der Pages aus privaten Repositories unterstützt.

Zum lokalen Testen kann `index.html` direkt im Browser geöffnet werden. Ein Build-Schritt ist nicht nötig.