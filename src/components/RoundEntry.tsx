import { useState } from "react";
import type { GameState, Role } from "../types";
import { advancePhase, setEntry } from "../api";
import { biddingOrder, cardsInRound, dealerIndex } from "../wizardRules";

interface Props {
  shareCode: string;
  role: Role;
  game: GameState;
}

export function RoundEntry({ shareCode, role, game }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cards = cardsInRound(game.currentRoundIndex);
  const order = biddingOrder(game.currentRoundIndex, game.players);
  const dealer = game.players[dealerIndex(game.currentRoundIndex, game.players.length)];

  function canEdit(playerId: string, field: "bid" | "tricks") {
    if (role.kind === "admin") return true;
    if (role.kind !== "player" || role.playerId !== playerId) return false;
    return (field === "bid" && game.phase === "bidding") || (field === "tricks" && game.phase === "tricks");
  }

  function valueOf(playerId: string, field: "bid" | "tricks") {
    return game.currentEntries[playerId]?.[field];
  }

  async function handleChange(playerId: string, field: "bid" | "tricks", value: string) {
    setError(null);
    setBusy(true);
    try {
      await setEntry(shareCode, role, {
        field,
        value: Number(value),
        ...(role.kind === "admin" ? { playerId } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konnte nicht speichern.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdvance() {
    setError(null);
    setBusy(true);
    try {
      await advancePhase(shareCode, role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konnte nicht fortfahren.");
    } finally {
      setBusy(false);
    }
  }

  const activeField: "bid" | "tricks" = game.phase === "bidding" ? "bid" : "tricks";
  const missing = order.filter((p) => valueOf(p.id, activeField) === undefined);
  const submittedCount = order.length - missing.length;

  const phase =
    game.phase === "bidding"
      ? { key: "bidding", icon: "📣", label: "Ansage", verb: "angesagt" }
      : { key: "tricks", icon: "✅", label: "Stiche", verb: "eingetragen" };

  const isAdmin = role.kind === "admin";
  const myTurn =
    role.kind === "player" &&
    game.players.some((p) => p.id === role.playerId) &&
    valueOf(role.playerId, activeField) === undefined;
  const myMax = cards;

  async function submitMine(value: number) {
    if (role.kind !== "player") return;
    await handleChange(role.playerId, activeField, String(value));
  }

  return (
    <div className="card round-entry">
      <div className="round-header">
        <h2>
          Runde {game.currentRoundIndex + 1} / {game.totalRounds}
        </h2>
        <span className="badge">
          {cards} Karte{cards === 1 ? "" : "n"}
        </span>
      </div>
      <div className="phase-indicator">
        <span className={`phase-pill phase-${phase.key}`}>
          {phase.icon} {phase.label}
        </span>
        <span className="subtitle phase-indicator-text">
          Geber: {dealer.name} · {submittedCount}/{order.length} {phase.verb}
        </span>
      </div>

      {myTurn && (
        <div className={`turn-card phase-${phase.key}`}>
          <p className="turn-card-eyebrow">
            {phase.icon} {phase.label}
          </p>
          <p className="turn-card-question">
            {game.phase === "bidding"
              ? "Wie viele Stiche sagst du an, bevor die Runde gespielt wird?"
              : "Wie viele Stiche hast du in dieser Runde tatsächlich gemacht?"}
          </p>
          <div className="stepper">
            {Array.from({ length: myMax + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                className="stepper-option"
                disabled={busy}
                onClick={() => submitMine(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <table className="entry-table">
        <thead>
          <tr>
            <th>Spieler</th>
            <th className={game.phase === "bidding" ? "col-active" : undefined}>Ansage</th>
            <th className={game.phase === "tricks" ? "col-active" : undefined}>Stiche</th>
          </tr>
        </thead>
        <tbody>
          {order.map((p) => (
            <tr key={p.id}>
              <td className="player-name">{p.name}</td>
              {(["bid", "tricks"] as const).map((field) => {
                const editable = canEdit(p.id, field);
                const value = valueOf(p.id, field);
                return (
                  <td key={field}>
                    {editable ? (
                      <select
                        value={value ?? ""}
                        disabled={busy}
                        onChange={(e) => handleChange(p.id, field, e.target.value)}
                      >
                        <option value="" disabled>
                          –
                        </option>
                        {Array.from({ length: cards + 1 }, (_, n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="entry-value">{value ?? "…"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {missing.length > 0 && (
        <p className="subtitle waiting-note">
          Warten auf {phase.label} von: {missing.map((p) => p.name).join(", ")}
        </p>
      )}

      {error && <p className="warning">{error}</p>}

      {isAdmin && (
        <button type="button" className="primary" onClick={handleAdvance} disabled={busy}>
          {game.phase === "bidding" ? "Stiche öffnen" : "Runde abschließen"}
        </button>
      )}
    </div>
  );
}
