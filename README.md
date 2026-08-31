# Wizard-Counter 🧙

Eine Web-App zum gemeinsamen Punktezählen beim Kartenspiel **Wizard** — mit
Admin-Rolle, Share-Link zum Beitreten und Live-Updates für alle Mitspieler.

## Ablauf

1. Ein **Admin** legt auf der Startseite die Spielernamen an (3–6 Spieler) und
   erstellt das Spiel. Er bekommt einen **Spiel-Link** und einen geheimen
   **Admin-Link**.
2. Der Admin schickt den Spiel-Link an alle Mitspieler (z. B. per Chat). Jeder
   Mitspieler öffnet den Link und wählt dort **"Ich bin \<Name\>"** — damit
   kann er ab sofort selbst seine eigenen Ansagen und Stiche eintragen.
3. Sobald der Admin auf **"Spiel starten"** klickt, beginnt Runde 1 in der
   **Ansage-Phase**: jeder Spieler trägt seine eigene Ansage ein (der Admin
   kann das auch für jeden übernehmen).
4. Der Admin klickt **"Stiche öffnen"** → jeder trägt seine gestochenen
   Stiche ein → der Admin klickt **"Runde abschließen"**. Punkte werden nach
   den offiziellen Wizard-Regeln berechnet:
   - Ansage exakt getroffen: `20 + 10 × Stiche`
   - Ansage verfehlt: `-10 × |Ansage − Stiche|`
5. Alle Geräte sehen Änderungen sofort (Server-Sent Events, kein Reload
   nötig). Nach der letzten Runde gibt's die Endabrechnung.

Der Admin-Link ist der geheime "Vollzugriff"-Schlüssel (Spieler verwalten,
Runden freigeben) und sollte nicht öffentlich geteilt werden — der normale
Spiel-Link reicht für alle Mitspieler.

## Architektur

- **Frontend:** React + Vite + TypeScript (`src/`), Routing mit
  `react-router-dom` (`/` = neues Spiel, `/g/:shareCode` = Spielseite).
- **Backend:** Node + Express (`server/`), Spielstand in **SQLite**
  (`better-sqlite3`), Echtzeit-Updates über **Server-Sent Events**.
- Beides läuft in **einem** Node-Prozess/Container: Express liefert sowohl
  die REST-/SSE-API unter `/api/...` als auch die gebaute Frontend-App aus.
- Kein separates Auth-System: Der **Share-Code** in der URL ist der
  Zugangs-Schlüssel zum Spiel, der **Admin-Secret** (im Admin-Link) schaltet
  Verwaltungsrechte frei, ein **Spieler-Token** (beim Beitreten vergeben,
  im Browser gespeichert) berechtigt zur Eingabe der eigenen Werte. Passend
  für ein privates Party-Spiel, nicht für sensible Daten gedacht.

## Lokale Entwicklung

Frontend (Vite, Port 5173, proxyt `/api` zum Backend) und Backend (Port 3000)
getrennt starten:

```bash
npm install
npm run dev:server   # Backend auf Port 3000
npm run dev          # Frontend auf Port 5173
```

## Produktions-Build

```bash
npm run build   # baut das Frontend nach dist/
npm start        # startet den Express-Server (liefert dist/ + API)
```

## Deployment mit Coolify (Docker Compose)

Das Repository enthält ein `docker-compose.yml` + `Dockerfile` für Coolify.

1. In Coolify eine neue **Application** vom Typ **Docker Compose** anlegen
   und dieses Repository verbinden (Compose-Datei: `docker-compose.yml`).
2. Unter den Service-Einstellungen des `app`-Service eine **Domain**
   setzen (z. B. `wizard.deine-domain.de`) — Coolify kümmert sich um
   Reverse-Proxy und TLS-Zertifikat. Diese Basis-Domain wird automatisch für
   alle Share-Links verwendet (die App baut sie clientseitig aus der
   aktuellen URL).
3. Deploy auslösen.

**Persistenz:** Der Container schreibt seine SQLite-Datenbank nach
`/app/data`. Das `docker-compose.yml` bindet dafür bereits ein benanntes
Volume (`wizard_data`) ein, damit Spielstände ein Redeploy überleben.

Keine externen Dienste oder zusätzlichen Umgebungsvariablen nötig.
