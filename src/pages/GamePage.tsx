import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGameEvents } from "../hooks/useGameEvents";
import { loadRole, saveRole } from "../roleStorage";
import type { Role } from "../types";
import { ShareBox } from "../components/ShareBox";
import { PlayerManager } from "../components/PlayerManager";
import { ClaimPanel } from "../components/ClaimPanel";
import { RoundEntry } from "../components/RoundEntry";
import { Scoreboard } from "../components/Scoreboard";
import { GameOver } from "../components/GameOver";
import { setManifestHref } from "../manifestLink";

export default function GamePage() {
  const { shareCode = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { game, error } = useGameEvents(shareCode);

  const [role, setRole] = useState<Role>(() => loadRole(shareCode) ?? { kind: "spectator" });

  useEffect(() => {
    setManifestHref(`/manifest/${shareCode}.webmanifest`);
  }, [shareCode]);

  useEffect(() => {
    const adminSecret = searchParams.get("admin");
    if (adminSecret) {
      const nextRole: Role = { kind: "admin", adminSecret };
      saveRole(shareCode, nextRole);
      setRole(nextRole);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("admin");
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode]);

  function handleClaimed(nextRole: Role) {
    saveRole(shareCode, nextRole);
    setRole(nextRole);
  }

  if (error) {
    return (
      <div className="card">
        <h1>Spiel nicht gefunden</h1>
        <p className="subtitle">{error}</p>
        <button type="button" className="primary" onClick={() => navigate("/")}>
          Neues Spiel erstellen
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="card">
        <p className="subtitle">Lade Spiel…</p>
      </div>
    );
  }

  const myPlayerId = role.kind === "player" ? role.playerId : null;
  const iAmClaimed = myPlayerId !== null && game.players.some((p) => p.id === myPlayerId);
  const showClaimPanel = game.status !== "finished" && role.kind !== "admin" && !iAmClaimed;

  return (
    <>
      <ShareBox shareCode={shareCode} role={role} />

      {game.status === "setup" && role.kind === "admin" && (
        <PlayerManager shareCode={shareCode} role={role} players={game.players} />
      )}

      {game.status === "setup" && role.kind !== "admin" && (
        <div className="card">
          <h2>Warten auf Spielstart</h2>
          <p className="subtitle">Der Admin richtet gerade die Spieler ein.</p>
        </div>
      )}

      {showClaimPanel && <ClaimPanel shareCode={shareCode} players={game.players} onClaimed={handleClaimed} />}

      {game.status === "playing" && (
        <>
          <RoundEntry shareCode={shareCode} role={role} game={game} />
          <Scoreboard players={game.players} rounds={game.rounds} />
        </>
      )}

      {game.status === "finished" && (
        <>
          <GameOver players={game.players} rounds={game.rounds} onNewGame={() => navigate("/")} />
          <Scoreboard players={game.players} rounds={game.rounds} />
        </>
      )}
    </>
  );
}
