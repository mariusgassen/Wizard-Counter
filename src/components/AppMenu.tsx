import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GameState, Role } from "../types";
import { cancelGame } from "../api";
import { clearRole } from "../roleStorage";
import { ShareBox } from "./ShareBox";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  shareCode: string;
  role: Role;
  game: GameState;
}

type DialogKind = "new-game" | "cancel-game" | null;

const ACTIVE_STATUSES = new Set(["setup", "playing"]);

export function AppMenu({ shareCode, role, game }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameIsActive = ACTIVE_STATUSES.has(game.status);

  function handleNewGameClick() {
    if (gameIsActive) {
      setDialog("new-game");
    } else {
      navigate("/");
    }
  }

  function confirmNewGame() {
    navigate("/");
  }

  async function confirmCancelGame() {
    setBusy(true);
    setError(null);
    try {
      await cancelGame(shareCode, role);
      clearRole(shareCode);
      setDialog(null);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spiel konnte nicht abgebrochen werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-menu">
      <div className="app-menu-bar">
        <span className="app-menu-code">Code: {shareCode}</span>
        <button
          type="button"
          className="icon-button app-menu-toggle"
          aria-label="Menü öffnen"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ⋮
        </button>
      </div>

      {open && (
        <div className="dialog-overlay" onClick={() => setOpen(false)}>
          <div className="dialog-box card menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="menu-panel-header">
              <h2>Menü</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Menü schließen"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <h3 className="menu-section-title">Einladen</h3>
            <ShareBox shareCode={shareCode} role={role} />

            {error && <p className="warning">{error}</p>}

            <div className="menu-actions">
              <button type="button" className="secondary" onClick={handleNewGameClick}>
                Neues Spiel
              </button>
              {role.kind === "admin" && gameIsActive && (
                <button type="button" className="danger" onClick={() => setDialog("cancel-game")}>
                  Spiel abbrechen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {dialog === "new-game" && (
        <ConfirmDialog
          title="Neues Spiel starten?"
          message="Du verlässt das aktuelle Spiel auf diesem Gerät. Andere Mitspieler können weiterspielen – deine Rolle hier geht aber verloren, falls du den Link nicht gespeichert hast."
          confirmLabel="Verlassen"
          onConfirm={confirmNewGame}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === "cancel-game" && (
        <ConfirmDialog
          title="Spiel abbrechen?"
          message="Dies beendet das Spiel unwiderruflich für alle Mitspieler. Der bisherige Punktestand geht verloren."
          confirmLabel="Spiel abbrechen"
          danger
          busy={busy}
          onConfirm={confirmCancelGame}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
