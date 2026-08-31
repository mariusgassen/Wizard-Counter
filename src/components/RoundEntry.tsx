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

  const missing = order.filter((p) => {
    const field = game.phase === "bidding" ? "bid" : "tricks";
    return valueOf(p.id, field) === undefined;
  });

  const isAdmin = role.kind === "admin";

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
      <p className="subtitle">
        Geber: {dealer.name} · Phase: {game.phase === "bidding" ? "Ansagen" : "Stiche"}
      </p>

      <table className="entry-table">
        <thead>
          <tr>
            <th>Spieler</th>
            <th>Ansage</th>
            <th>Stiche</th>
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
          Warten auf {game.phase === "bidding" ? "Ansage" : "Stiche"} von: {missing.map((p) => p.name).join(", ")}
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
