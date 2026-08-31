import type { Player, RoundResult } from "../types";
import { scoreForEntry, totalScore } from "../wizardRules";

interface Props {
  players: Player[];
  rounds: RoundResult[];
}

export function Scoreboard({ players, rounds }: Props) {
  const standings = players
    .map((p) => ({ player: p, score: totalScore(rounds, p.id) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="card scoreboard">
      <h2>Punktestand</h2>
      <ol className="standings">
        {standings.map(({ player, score }, i) => (
          <li key={player.id} className={i === 0 && score > 0 ? "leader" : ""}>
            <span className="rank">{i + 1}.</span>
            <span className="name">{player.name}</span>
            <span className="score">{score}</span>
          </li>
        ))}
      </ol>

      {rounds.length > 0 && (
        <div className="history-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Runde</th>
                {players.map((p) => (
                  <th key={p.id}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rounds.map((round, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {players.map((p) => {
                    const entry = round[p.id];
                    if (!entry) return <td key={p.id}>–</td>;
                    const pts = scoreForEntry(entry.bid, entry.tricks);
                    return (
                      <td key={p.id} className={pts >= 0 ? "pos" : "neg"}>
                        {entry.bid}/{entry.tricks} ({pts > 0 ? "+" : ""}
                        {pts})
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
