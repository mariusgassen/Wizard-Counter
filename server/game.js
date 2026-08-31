import { generatePlayerId, generateSecret } from "./id.js";
import { MIN_PLAYERS, MAX_PLAYERS, totalRoundsFor, cardsInRound } from "./rules.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createGameState(playerNames) {
  if (!Array.isArray(playerNames) || playerNames.length < MIN_PLAYERS || playerNames.length > MAX_PLAYERS) {
    throw new HttpError(400, `Bitte ${MIN_PLAYERS}-${MAX_PLAYERS} Spielernamen angeben.`);
  }
  const players = playerNames.map((name) => makePlayer(name));
  return {
    status: "setup",
    players,
    totalRounds: null,
    currentRoundIndex: 0,
    phase: null,
    currentEntries: {},
    rounds: [],
    createdAt: Date.now(),
  };
}

function makePlayer(name) {
  const trimmed = String(name ?? "").trim().slice(0, 20);
  if (!trimmed) throw new HttpError(400, "Spielername darf nicht leer sein.");
  return { id: generatePlayerId(), name: trimmed, token: null, claimed: false };
}

export function addPlayer(state, name) {
  if (state.status !== "setup") throw new HttpError(400, "Spieler können nur vor Spielstart hinzugefügt werden.");
  if (state.players.length >= MAX_PLAYERS) throw new HttpError(400, `Maximal ${MAX_PLAYERS} Spieler erlaubt.`);
  state.players.push(makePlayer(name));
  return state;
}

export function removePlayer(state, playerId) {
  if (state.status !== "setup") throw new HttpError(400, "Spieler können nur vor Spielstart entfernt werden.");
  const before = state.players.length;
  state.players = state.players.filter((p) => p.id !== playerId);
  if (state.players.length === before) throw new HttpError(404, "Spieler nicht gefunden.");
  return state;
}

export function claimPlayer(state, playerId) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new HttpError(404, "Spieler nicht gefunden.");
  if (player.claimed) throw new HttpError(409, "Dieser Spieler ist bereits vergeben.");
  player.token = generateSecret();
  player.claimed = true;
  return { state, token: player.token };
}

export function resetPlayerClaim(state, playerId) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new HttpError(404, "Spieler nicht gefunden.");
  player.token = null;
  player.claimed = false;
  return state;
}

export function findPlayerByToken(state, token) {
  return state.players.find((p) => p.token && p.token === token);
}

export function startGame(state) {
  if (state.status !== "setup") throw new HttpError(400, "Spiel wurde bereits gestartet.");
  if (state.players.length < MIN_PLAYERS || state.players.length > MAX_PLAYERS) {
    throw new HttpError(400, `Es werden ${MIN_PLAYERS}-${MAX_PLAYERS} Spieler benötigt.`);
  }
  state.status = "playing";
  state.totalRounds = totalRoundsFor(state.players.length);
  state.currentRoundIndex = 0;
  state.phase = "bidding";
  state.currentEntries = {};
  state.rounds = [];
  return state;
}

export function setEntry(state, { playerId, field, value, roundIndex, isAdmin }) {
  if (state.status !== "playing") throw new HttpError(400, "Das Spiel läuft aktuell nicht.");
  if (field !== "bid" && field !== "tricks") throw new HttpError(400, "Ungültiges Feld.");
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new HttpError(404, "Spieler nicht gefunden.");

  const targetRoundIndex = roundIndex ?? state.currentRoundIndex;

  if (!isAdmin) {
    if (targetRoundIndex !== state.currentRoundIndex) {
      throw new HttpError(403, "Nur die aktuelle Runde kann bearbeitet werden.");
    }
    const expectedField = state.phase === "bidding" ? "bid" : state.phase === "tricks" ? "tricks" : null;
    if (field !== expectedField) {
      throw new HttpError(403, "Dieses Feld ist gerade nicht freigegeben.");
    }
  }

  if (targetRoundIndex < 0 || targetRoundIndex > state.currentRoundIndex) {
    throw new HttpError(400, "Ungültige Runde.");
  }

  const max = cardsInRound(targetRoundIndex);
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0 || num > max) {
    throw new HttpError(400, `Wert muss zwischen 0 und ${max} liegen.`);
  }

  if (targetRoundIndex === state.currentRoundIndex) {
    const entry = state.currentEntries[playerId] ?? {};
    entry[field] = num;
    state.currentEntries[playerId] = entry;
  } else {
    const round = state.rounds[targetRoundIndex];
    if (!round || !round[playerId]) throw new HttpError(400, "Runde nicht gefunden.");
    round[playerId][field] = num;
  }

  return state;
}

export function advancePhase(state) {
  if (state.status !== "playing") throw new HttpError(400, "Das Spiel läuft aktuell nicht.");

  if (state.phase === "bidding") {
    state.phase = "tricks";
    return state;
  }

  if (state.phase === "tricks") {
    const cards = cardsInRound(state.currentRoundIndex);
    let sum = 0;
    for (const player of state.players) {
      const entry = state.currentEntries[player.id];
      if (!entry || entry.bid === undefined || entry.tricks === undefined) {
        throw new HttpError(400, `${player.name} hat noch keine vollständige Eingabe (Ansage + Stiche).`);
      }
      sum += entry.tricks;
    }
    if (sum !== cards) {
      throw new HttpError(400, `Die Stiche ergeben zusammen ${sum}, müssen aber genau ${cards} sein.`);
    }

    const finishedRound = {};
    for (const player of state.players) {
      finishedRound[player.id] = { ...state.currentEntries[player.id] };
    }
    state.rounds[state.currentRoundIndex] = finishedRound;
    state.currentEntries = {};
    state.currentRoundIndex += 1;

    if (state.currentRoundIndex >= state.totalRounds) {
      state.status = "finished";
      state.phase = null;
    } else {
      state.phase = "bidding";
    }
    return state;
  }

  throw new HttpError(400, "Keine offene Phase zum Fortschreiten.");
}

export function toPublicState(state) {
  return {
    status: state.status,
    players: state.players.map((p) => ({ id: p.id, name: p.name, claimed: p.claimed })),
    totalRounds: state.totalRounds,
    currentRoundIndex: state.currentRoundIndex,
    phase: state.phase,
    currentEntries: state.currentEntries,
    rounds: state.rounds,
    createdAt: state.createdAt,
  };
}
