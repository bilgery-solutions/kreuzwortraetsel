/*
 * Rätsel-Datenbank.
 * Neue Rätsel können einfach als weitere Objekte ergänzt werden.
 * Eintrag: [Lösung, Hinweis, Zeile (0-basiert), Spalte (0-basiert), "across" | "down"].
 * Lösungen werden ohne Leerzeichen, Umlaute ausgeschrieben (Ä=AE) gespeichert.
 */
window.CROSSWORD_PUZZLES = [
  {
    id: "leicht-001",
    difficulty: "leicht",
    number: "01",
    title: "Der kleine Zeitvertreib",
    description: "Alltagswissen und vertraute Begriffe.",
    size: 11,
    entries: [
      ["BUCH", "Besteht aus vielen Seiten", 6, 0, "across"],
      ["FISCH", "Tier mit Kiemen", 2, 3, "down"],
      ["MAUS", "Kleines Nagetier", 4, 0, "across"],
      ["APFEL", "Runde Frucht am Baum", 2, 1, "across"],
      ["BLUME", "Wächst im Blumenbeet", 1, 5, "down"],
      ["BAUM", "Hat Stamm und Krone", 1, 5, "across"],
      ["ZUG", "Fährt auf Schienen", 0, 7, "down"],
      ["UHR", "Zeigt die Zeit", 6, 1, "down"],
      ["EIS", "Gefrorenes Wasser", 5, 5, "across"],
      ["SOMMER", "Wärmste Jahreszeit", 5, 7, "down"],
      ["MOND", "Begleiter der Erde", 8, 7, "across"],
      ["WASSER", "Es fällt auch als Regen", 10, 2, "across"],
      ["REGEN", "Niederschlag aus Wolken", 8, 1, "across"],
      ["SONNE", "Sie scheint am Himmel", 6, 9, "down"]
    ]
  },
  {
    id: "mittel-001",
    difficulty: "mittel",
    number: "01",
    title: "Wissen & Kultur",
    description: "Ein Streifzug durch Natur, Kunst und Wissenschaft.",
    size: 13,
    entries: [
      ["SINFONIE", "Orchesterwerk in mehreren Sätzen", 5, 2, "across"],
      ["THEATER", "Bühne für Schauspielkunst", 3, 9, "down"],
      ["RESONANZ", "Mitschwingen durch äußere Anregung", 2, 6, "down"],
      ["PLANET", "Himmelskörper auf einer Bahn um einen Stern", 7, 4, "across"],
      ["EXPEDITION", "Forschungsreise", 3, 3, "across"],
      ["KONTINENT", "Große zusammenhängende Landmasse", 1, 12, "down"],
      ["ORBIT", "Umlaufbahn eines Himmelskörpers", 9, 8, "across"],
      ["GALERIE", "Ausstellungsort für Kunst", 0, 3, "down"],
      ["STATIK", "Lehre vom Gleichgewicht der Kräfte", 1, 7, "across"],
      ["MOSAIK", "Bild aus vielen kleinen Steinchen", 1, 0, "across"],
      ["MUSEUM", "Sammelt und zeigt Kulturgüter", 1, 0, "down"],
      ["PAPIER", "Werkstoff aus Zellstoff", 7, 4, "down"],
      ["ARCHIV", "Ort für dauerhaft verwahrte Dokumente", 12, 3, "across"],
      ["FOSSIL", "Versteinerter Rest früheren Lebens", 10, 0, "across"]
    ]
  },
  {
    id: "schwer-001",
    difficulty: "schwer",
    number: "01",
    title: "Für Kenner",
    description: "Knifflige Begriffe aus Sprache und Wissenschaft.",
    size: 14,
    entries: [
      ["PALINDROM", "Wort oder Satz, der rückwärts gleich lautet", 12, 2, "across"],
      ["SYNTAX", "Satzbau einer Sprache", 8, 3, "down"],
      ["PARADOX", "Scheinbar widersprüchliche Aussage", 7, 9, "down"],
      ["ETYMOLOGIE", "Lehre von der Herkunft der Wörter", 4, 5, "down"],
      ["OSMOSE", "Wasserwanderung durch eine halbdurchlässige Membran", 8, 2, "across"],
      ["EPIGRAMM", "Kurzes, pointiertes Sinngedicht", 4, 5, "across"],
      ["MERIDIAN", "Gedachte Linie von Pol zu Pol", 4, 12, "down"],
      ["FRAKTAL", "Struktur mit selbstähnlichen Mustern", 10, 7, "across"],
      ["APORIE", "Gedankliche Schwierigkeit ohne klaren Ausweg", 7, 8, "across"],
      ["KATALYSE", "Beschleunigung einer chemischen Reaktion durch einen Hilfsstoff", 6, 0, "across"],
      ["MATRIZE", "Form zum Prägen oder Vervielfältigen", 0, 7, "down"],
      ["OXYMORON", "Verbindung widersprüchlicher Begriffe", 0, 4, "across"],
      ["ZEITGEIST", "Prägende Denkweise einer Epoche", 2, 4, "across"],
      ["DIALEKTIK", "Denken in Gegensätzen und ihrer Vermittlung", 1, 0, "down"],
      ["ZENIT", "Punkt am Himmel senkrecht über dem Beobachter", 2, 2, "down"]
    ]
  }
];
