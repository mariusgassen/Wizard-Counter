import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as store from "./store.js";
import * as game from "./game.js";
import { HttpError } from "./game.js";
import { subscribe, unsubscribe, broadcast } from "./events.js";
import { buildManifest } from "./manifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = process.env.PORT ?? 3000;

const app = express();
app.use(express.json());

function loadGameOr404(shareCode) {
  const state = store.loadState(shareCode);
  if (!state) throw new HttpError(404, "Spiel nicht gefunden.");
  return state;
}

function persistAndBroadcast(shareCode, state) {
  store.saveState(shareCode, state);
  broadcast(shareCode, game.toPublicState(state));
}

function getActor(req, shareCode) {
  const adminSecret = req.header("x-admin-secret");
  if (adminSecret && store.verifyAdmin(shareCode, adminSecret)) {
    return { isAdmin: true };
  }
  return { isAdmin: false, playerToken: req.header("x-player-token") };
}

function requireAdmin(req, shareCode) {
  const adminSecret = req.header("x-admin-secret");
  if (!store.verifyAdmin(shareCode, adminSecret)) {
    throw new HttpError(403, "Nur der Admin darf das.");
  }
}

const asyncRoute = (fn) => (req, res, next) => {
  try {
    fn(req, res);
  } catch (err) {
    next(err);
  }
};

app.get("/api/health", (req, res) => {
  if (store.isHealthy()) {
    res.json({ status: "ok" });
  } else {
    res.status(503).json({ status: "error" });
  }
});

app.get("/manifest/:code.webmanifest", (req, res) => {
  res.type("application/manifest+json").json(buildManifest(`/g/${req.params.code}`));
});

app.post(
  "/api/games",
  asyncRoute((req, res) => {
    const state = game.createGameState(req.body?.playerNames);
    const { shareCode, adminSecret } = store.insertGame(state);
    res.status(201).json({ shareCode, adminSecret });
  }),
);

app.get(
  "/api/games/:code",
  asyncRoute((req, res) => {
    const state = loadGameOr404(req.params.code);
    res.json(game.toPublicState(state));
  }),
);

app.get("/api/games/:code/events", (req, res) => {
  const { code } = req.params;
  const state = store.loadState(code);
  if (!state) {
    res.status(404).end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`data: ${JSON.stringify(game.toPublicState(state))}\n\n`);

  subscribe(code, res);
  const heartbeat = setInterval(() => res.write(":\n\n"), 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe(code, res);
  });
});

app.post(
  "/api/games/:code/players",
  asyncRoute((req, res) => {
    const { code } = req.params;
    requireAdmin(req, code);
    const state = loadGameOr404(code);
    game.addPlayer(state, req.body?.name);
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

app.delete(
  "/api/games/:code/players/:playerId",
  asyncRoute((req, res) => {
    const { code, playerId } = req.params;
    requireAdmin(req, code);
    const state = loadGameOr404(code);
    game.removePlayer(state, playerId);
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

app.post(
  "/api/games/:code/players/:playerId/reset",
  asyncRoute((req, res) => {
    const { code, playerId } = req.params;
    requireAdmin(req, code);
    const state = loadGameOr404(code);
    game.resetPlayerClaim(state, playerId);
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

app.post(
  "/api/games/:code/claim",
  asyncRoute((req, res) => {
    const { code } = req.params;
    const state = loadGameOr404(code);
    const { token } = game.claimPlayer(state, req.body?.playerId);
    persistAndBroadcast(code, state);
    res.json({ playerToken: token, playerId: req.body?.playerId, state: game.toPublicState(state) });
  }),
);

app.post(
  "/api/games/:code/start",
  asyncRoute((req, res) => {
    const { code } = req.params;
    requireAdmin(req, code);
    const state = loadGameOr404(code);
    game.startGame(state);
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

app.post(
  "/api/games/:code/advance",
  asyncRoute((req, res) => {
    const { code } = req.params;
    requireAdmin(req, code);
    const state = loadGameOr404(code);
    game.advancePhase(state);
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

app.post(
  "/api/games/:code/cancel",
  asyncRoute((req, res) => {
    const { code } = req.params;
    requireAdmin(req, code);
    const state = loadGameOr404(code);
    game.cancelGame(state);
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

app.put(
  "/api/games/:code/entry",
  asyncRoute((req, res) => {
    const { code } = req.params;
    const state = loadGameOr404(code);
    const actor = getActor(req, code);

    let playerId;
    if (actor.isAdmin) {
      playerId = req.body?.playerId;
      if (!playerId) throw new HttpError(400, "playerId erforderlich.");
    } else {
      const player = game.findPlayerByToken(state, actor.playerToken);
      if (!player) throw new HttpError(403, "Ungültiger Spieler-Token.");
      playerId = player.id;
    }

    game.setEntry(state, {
      playerId,
      field: req.body?.field,
      value: req.body?.value,
      roundIndex: actor.isAdmin ? req.body?.roundIndex : undefined,
      isAdmin: actor.isAdmin,
    });
    persistAndBroadcast(code, state);
    res.json(game.toPublicState(state));
  }),
);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Interner Fehler." });
});

app.use(express.static(DIST_DIR));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Wizard-Counter server listening on port ${PORT}`);
});
