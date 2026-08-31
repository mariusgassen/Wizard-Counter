import { useState } from "react";
import type { Player, Role } from "../types";
import { addPlayer, removePlayer, resetPlayerClaim, startGame } from "../api";
import { MAX_PLAYERS, MIN_PLAYERS } from "../wizardRules";

interface Props {
  shareCode: string;
  role: Role;
  players: Player[];
}

export function PlayerManager({ shareCode, role, players }: Props) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = players.length < MAX_PLAYERS;
  const canStart = players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name || !canAdd) return;
    run(() => addPlayer(shareCode, role, name)).then(() => setNewName(""));
  }

  return (
    <div className="card player-manager">
      <h2>Spieler verwalten</h2>
      <div className="player-list">
        {players.map((p) => (
          <div className="player-row" key={p.id}>
            <span className={`badge ${p.claimed ? "badge-claimed" : "badge-open"}`}>
              {p.claimed ? "vergeben" : "frei"}
            </span>
            <span className="player-name-flex">{p.name}</span>
            {p.claimed && (
              <button
                type="button"
                className="icon-button"
                disabled={busy}
                onClick={() => run(() => resetPlayerClaim(shareCode, role, p.id))}
              >
                zurücksetzen
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label="Spieler entfernen"
              disabled={busy}
              onClick={() => run(() => removePlayer(shareCode, role, p.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="player-row">
        <input
          type="text"
          placeholder="Neuer Spieler"
          maxLength={20}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={!canAdd || busy}
        />
        <button type="button" className="secondary" onClick={handleAdd} disabled={!canAdd || busy}>
          + Hinzufügen
        </button>
      </div>

      {error && <p className="warning">{error}</p>}

      <button
        type="button"
        className="primary"
        disabled={!canStart || busy}
        onClick={() => run(() => startGame(shareCode, role))}
      >
        Spiel starten
      </button>
    </div>
  );
}
