import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGame } from "../api";
import { saveRole } from "../roleStorage";
import { MAX_PLAYERS, MIN_PLAYERS, totalRoundsFor } from "../wizardRules";

export default function HomePage() {
  const navigate = useNavigate();
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const canAdd = names.length < MAX_PLAYERS;
  const canRemove = names.length > MIN_PLAYERS;
  const filled = names.map((n) => n.trim()).filter(Boolean);
  const canStart = filled.length === names.length && names.length >= MIN_PLAYERS;

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addPlayer() {
    if (canAdd) setNames((prev) => [...prev, ""]);
  }

  function removePlayer(index: number) {
    if (canRemove) setNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!canStart || creating) return;
    setCreating(true);
    setError(null);
    try {
      const { shareCode, adminSecret } = await createGame(names.map((n) => n.trim()));
      saveRole(shareCode, { kind: "admin", adminSecret });
      navigate(`/g/${shareCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spiel konnte nicht erstellt werden.");
      setCreating(false);
    }
  }

  return (
    <div className="card setup">
      <h1>🧙 Wizard Punktezähler</h1>
      <p className="subtitle">
        Spieler eintragen und ein neues Spiel erstellen. Mit {names.length} Spieler
        {names.length === 1 ? "" : "n"} werden <strong>{totalRoundsFor(names.length)}</strong> Runden
        gespielt. Danach bekommst du einen Link zum Teilen.
      </p>

      <div className="player-list">
        {names.map((name, i) => (
          <div className="player-row" key={i}>
            <span className="player-number">{i + 1}</span>
            <input
              type="text"
              value={name}
              placeholder={`Spieler ${i + 1}`}
              maxLength={20}
              onChange={(e) => updateName(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canStart) handleCreate();
              }}
            />
            {canRemove && (
              <button
                type="button"
                className="icon-button"
                aria-label="Spieler entfernen"
                onClick={() => removePlayer(i)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="secondary" onClick={addPlayer} disabled={!canAdd}>
        + Spieler hinzufügen
      </button>

      {error && <p className="warning">{error}</p>}

      <button type="button" className="primary" onClick={handleCreate} disabled={!canStart || creating}>
        {creating ? "Erstelle Spiel…" : "Spiel erstellen"}
      </button>
    </div>
  );
}
