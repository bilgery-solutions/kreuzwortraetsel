# Kreuzworträtsel – Die Rätselstunde

Eine kleine, vollständig clientseitige Kreuzworträtsel-Webapp auf Deutsch. Klassisches Zeitschriften-Design, für **iPhone, iPad und Desktop** optimiert. Keine Frameworks, kein Backend und keine Anmeldung.

## Funktionen

- Drei Schwierigkeitsgrade: Leicht, Mittel, Schwer
- Zum Start jeweils ein spielbares Rätsel pro Schwierigkeitsgrad
- Kreuzendes Buchstabenraster mit nummerierten Hinweisen (waagerecht/senkrecht)
- Bedienung durch Tippen, Bildschirmtastatur und Hardware-Tastatur
- Feld erneut antippen oder Leertaste: an Kreuzungen Richtung wechseln
- Pfeiltasten: im Raster navigieren; Enter: nächster Hinweis; Rücktaste: Buchstaben löschen
- Buchstabenprüfung, ein Buchstabe als Hilfe und Rätsel zurücksetzen
- Automatische lokale Speicherung des Fortschritts **je Rätsel** im Browser (localStorage)
- Kein Server, keine Cookies und keine Benutzerkonten

## GitHub Pages

1. Repository unter **Settings → Pages** öffnen.
2. Unter **Build and deployment** die Quelle **Deploy from a branch** wählen.
3. Branch **main** und Ordner **/(root)** auswählen, danach speichern.
4. Die öffentliche Projekt-URL lautet nach erfolgreicher Veröffentlichung normalerweise:
   https://bilgery-solutions.github.io/kreuzwortraetsel/

**Hinweis:** Das Repository wurde als **privat** angelegt. Für GitHub Pages aus privaten Repositorys benötigt die Organisation einen entsprechenden kostenpflichtigen GitHub-Plan. Bei GitHub Free for Organizations muss das Repository zur Veröffentlichung öffentlich sein. Ein privat gespeichertes Repository bedeutet zudem nicht automatisch, dass die veröffentlichte Website privat ist.

## Aufbau

| Datei | Zweck |
|---|---|
| \`index.html\` | Struktur und Benutzeroberfläche |
| \`styles.css\` | Layout für Smartphone, Tablet und Desktop |
| \`app.js\` | Spiellogik, Eingabe, Navigation, Speicherung |
| \`puzzles.js\` | Rätseldaten – ohne Änderung der Spiellogik erweiterbar |
| \`favicon.svg\` | Kleines Raster-Symbol |

## Neue Rätsel hinzufügen

In \`puzzles.js\` ein weiteres Objekt in \`window.CROSSWORD_PUZZLES\` ergänzen:

\`\`\`javascript
{
  id: "mittel-002",
  difficulty: "mittel",
  number: "02",
  title: "Neues Rätsel",
  description: "Ein kurzer Einführungstext.",
  size: 11,
  entries: [
    // ["LOESUNG", "Deutscher Hinweis", zeile, spalte, "across" oder "down"]
    ["BAUM", "Hat Stamm und Krone", 0, 0, "across"]
  ]
}
\`\`\`

Koordinaten beginnen bei **0**. Die Antworten müssen sich an Kreuzungspunkten denselben Buchstaben teilen. Die Webapp validiert widersprüchliche Kreuzungen beim Laden.

**Ausblick:** Für mehrere Rätsel pro Schwierigkeitsgrad ist das Datenmodell bereits vorbereitet (jede Ausgabe hat eine eigene ID und einen eigenen Speicherstand). Derzeit wählt die Oberfläche das erste Rätsel je Schwierigkeitsgrad. Im nächsten Schritt kann eine zusätzliche Rätselauswahl ergänzt werden.

## Lokal testen

Die \`index.html\` direkt im Browser öffnen. Alle JavaScript- und CSS-Dateien werden über relative Pfade geladen und benötigen keinen Build-Schritt.
