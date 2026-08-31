import type { Player, RoundResult } from "../types";
import { totalScore } from "../wizardRules";

interface Props {
  players: Player[];
  rounds: RoundResult[];
  onNewGame: () => void;
}

export function GameOver({ players, rounds, onNewGame }: Props) {
  const standings = players
    .map((p) => ({ player: p, score: totalScore(rounds, p.id) }))
    .sort((a, b) => b.score - a.score);
  const winner = standings[0];

  return (
    <div className="card game-over">
      <h1>🏆 Spiel beendet!</h1>
      <p className="winner">
        {winner.player.name} gewinnt mit {winner.score} Punkten
      </p>
      <ol className="standings">
        {standings.map(({ player, score }, i) => (
          <li key={player.id} className={i === 0 ? "leader" : ""}>
            <span className="rank">{i + 1}.</span>
            <span className="name">{player.name}</span>
            <span className="score">{score}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="primary" onClick={onNewGame}>
        Neues Spiel
      </button>
    </div>
  );
}
