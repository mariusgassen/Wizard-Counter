import { useEffect, useState } from "react";
import type { Player, RoundEntry as RoundEntryT } from "../types";
import { biddingOrder, cardsInRound, dealerIndex } from "../wizardRules";

interface Props {
  players: Player[];
  roundIndex: number;
  totalRounds: number;
  onSubmit: (result: Record<string, RoundEntryT>) => void;
}

export function RoundEntry({ players, roundIndex, totalRounds, onSubmit }: Props) {
  const cards = cardsInRound(roundIndex);
  const order = biddingOrder(roundIndex, players);
  const dealer = players[dealerIndex(roundIndex, players.length)];

  const [bids, setBids] = useState<Record<string, string>>({});
  const [tricks, setTricks] = useState<Record<string, string>>({});

  useEffect(() => {
    setBids({});
    setTricks({});
  }, [roundIndex]);

  const bidValues = order.map((p) => bids[p.id]);
  const trickValues = order.map((p) => tricks[p.id]);
  const allBidsFilled = bidValues.every((v) => v !== undefined && v !== "");
  const allTricksFilled = trickValues.every((v) => v !== undefined && v !== "");
  const trickSum = trickValues.reduce((sum, v) => sum + (Number(v) || 0), 0);
  const tricksValid = allTricksFilled && trickSum === cards;
  const canSubmit = allBidsFilled && tricksValid;

  function handleSubmit() {
    if (!canSubmit) return;
    const result: Record<string, RoundEntryT> = {};
    for (const p of order) {
      result[p.id] = { bid: Number(bids[p.id]), tricks: Number(tricks[p.id]) };
    }
    onSubmit(result);
  }

  return (
    <div className="card round-entry">
      <div className="round-header">
        <h2>
          Runde {roundIndex + 1} / {totalRounds}
        </h2>
        <span className="badge">
          {cards} Karte{cards === 1 ? "" : "n"}
        </span>
      </div>
      <p className="subtitle">Geber: {dealer.name}</p>

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
              <td>
                <select
                  value={bids[p.id] ?? ""}
                  onChange={(e) => setBids((prev) => ({ ...prev, [p.id]: e.target.value }))}
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
              </td>
              <td>
                <select
                  value={tricks[p.id] ?? ""}
                  onChange={(e) => setTricks((prev) => ({ ...prev, [p.id]: e.target.value }))}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {allTricksFilled && !tricksValid && (
        <p className="warning">
          Die Stiche ergeben zusammen {trickSum}, müssen aber genau {cards} sein.
        </p>
      )}

      <button type="button" className="primary" onClick={handleSubmit} disabled={!canSubmit}>
        Runde abschließen
      </button>
    </div>
  );
}
