# Wizard-Counter 🧙

Eine einfache Web-App zum Punktezählen beim Kartenspiel **Wizard**.

- 3–6 Spieler eintragen, die App berechnet automatisch die Rundenanzahl (`60 / Spieleranzahl`).
- Pro Runde: Ansage & gestochene Stiche je Spieler eintragen — die Punkte werden nach den offiziellen Wizard-Regeln berechnet:
  - Ansage exakt getroffen: `20 + 10 × Stiche`
  - Ansage verfehlt: `-10 × |Ansage − Stiche|`
- Laufender Punktestand + Rundenverlauf, Endergebnis am Spielende.
- Der Spielstand wird im `localStorage` des Browsers gespeichert, ein Reload verliert also nichts.
- Kein Backend, keine Datenbank — reine statische Web-App.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Produktions-Build

```bash
npm run build   # baut nach dist/
npm run preview # dist/ lokal testen
```

## Deployment mit Coolify

Das Repository enthält ein `Dockerfile`, das die App baut (Node/Vite) und über `nginx` ausliefert.

1. In Coolify eine neue **Application** anlegen und dieses Git-Repository verbinden.
2. Als Build-Pack **Dockerfile** wählen (wird automatisch erkannt).
3. Port **80** freigeben (im Dockerfile per `EXPOSE 80` gesetzt, in Coolify als Ports-Mapping bei Bedarf anpassen).
4. Deploy auslösen — Coolify baut das Image und startet den Container.

Keine Umgebungsvariablen oder externe Dienste nötig; die App läuft komplett client-seitig.
