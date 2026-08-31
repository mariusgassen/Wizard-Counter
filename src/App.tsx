import { useState } from "react";
import { Setup } from "./components/Setup";
import { RoundEntry } from "./components/RoundEntry";
import { Scoreboard } from "./components/Scoreboard";
import { GameOver } from "./components/GameOver";
import { useLocalStorage } from "./useLocalStorage";
import type { GameState, Player, RoundEntry as RoundEntryT } from "./types";
import { totalRoundsFor } from "./wizardRules";

const STORAGE_KEY = "wizard-counter-game";

export default function App() {
  const [game, setGame] = useLocalStorage<GameState | null>(STORAGE_KEY, null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function startGame(players: Player[]) {
    setGame({
      players,
      rounds: [],
      currentRound: 0,
      totalRounds: totalRoundsFor(players.length),
      startedAt: Date.now(),
    });
  }

  function submitRound(result: Record<string, RoundEntryT>) {
    if (!game) return;
    setGame({
      ...game,
      rounds: [...game.rounds, result],
      currentRound: game.currentRound + 1,
    });
  }

  function newGame() {
    setGame(null);
    setConfirmingReset(false);
  }

  const isGameOver = game !== null && game.currentRound >= game.totalRounds;

  return (
    <div className="app">
      {!game && <Setup onStart={startGame} />}

      {game && !isGameOver && (
        <>
          <RoundEntry
            players={game.players}
            roundIndex={game.currentRound}
            totalRounds={game.totalRounds}
            onSubmit={submitRound}
          />
          <Scoreboard players={game.players} rounds={game.rounds} />

          <div className="reset-area">
            {confirmingReset ? (
              <>
                <span>Aktuelles Spiel wirklich beenden?</span>
                <button type="button" className="danger" onClick={newGame}>
                  Ja, neues Spiel
                </button>
                <button type="button" className="secondary" onClick={() => setConfirmingReset(false)}>
                  Abbrechen
                </button>
              </>
            ) : (
              <button type="button" className="link" onClick={() => setConfirmingReset(true)}>
                Neues Spiel starten
              </button>
            )}
          </div>
        </>
      )}

      {game && isGameOver && (
        <>
          <GameOver players={game.players} rounds={game.rounds} onNewGame={newGame} />
          <Scoreboard players={game.players} rounds={game.rounds} />
        </>
      )}
    </div>
  );
}
