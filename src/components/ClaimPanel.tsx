import { useState } from "react";
import type { Player, Role } from "../types";
import { claimPlayer } from "../api";

interface Props {
  shareCode: string;
  players: Player[];
  onClaimed: (role: Role) => void;
}

export function ClaimPanel({ shareCode, players, onClaimed }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unclaimed = players.filter((p) => !p.claimed);

  async function handleClaim(playerId: string) {
    setPending(playerId);
    setError(null);
    try {
      const { playerToken } = await claimPlayer(shareCode, playerId);
      onClaimed({ kind: "player", playerId, playerToken });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konnte nicht beitreten.");
    } finally {
      setPending(null);
    }
  }

  if (players.length === 0) return null;

  return (
    <div className="card claim-panel">
      <h2>Wer bist du?</h2>
      {unclaimed.length === 0 ? (
        <p className="subtitle">Alle Spieler sind bereits vergeben. Du kannst als Zuschauer mitverfolgen.</p>
      ) : (
        <>
          <p className="subtitle">Wähle deinen Namen, um selbst Ansagen &amp; Stiche einzutragen.</p>
          <div className="claim-list">
            {unclaimed.map((p) => (
              <button
                key={p.id}
                type="button"
                className="secondary"
                disabled={pending !== null}
                onClick={() => handleClaim(p.id)}
              >
                {pending === p.id ? "…" : `Ich bin ${p.name}`}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="warning">{error}</p>}
    </div>
  );
}
