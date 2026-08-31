import { useState } from "react";
import type { Player } from "../types";
import { MAX_PLAYERS, MIN_PLAYERS, totalRoundsFor } from "../wizardRules";

interface Props {
  onStart: (players: Player[]) => void;
}

export function Setup({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(["", "", ""]);

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

  function handleStart() {
    if (!canStart) return;
    const players: Player[] = names.map((name, i) => ({
      id: `${Date.now()}-${i}`,
      name: name.trim(),
    }));
    onStart(players);
  }

  return (
    <div className="card setup">
      <h1>🧙 Wizard Punktezähler</h1>
      <p className="subtitle">
        Spieler eintragen und loslegen. Mit {names.length} Spieler
        {names.length === 1 ? "" : "n"} werden{" "}
        <strong>{totalRoundsFor(names.length)}</strong> Runden gespielt.
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
                if (e.key === "Enter" && canStart) handleStart();
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

      <button type="button" className="primary" onClick={handleStart} disabled={!canStart}>
        Spiel starten
      </button>
    </div>
  );
}
