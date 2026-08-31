import { useEffect, useRef, useState } from "react";
import type { Player, Role } from "../types";
import { addPlayer, removePlayer, reorderPlayers, resetPlayerClaim, startGame } from "../api";
import { MAX_PLAYERS, MIN_PLAYERS } from "../wizardRules";

interface Props {
  shareCode: string;
  role: Role;
  players: Player[];
}

interface DragState {
  id: string;
  startIndex: number;
  startY: number;
  rowHeight: number;
}

export function PlayerManager({ shareCode, role, players }: Props) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<Player[]>(players);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const orderRef = useRef(order);
  const playersRef = useRef(players);
  const dragState = useRef<DragState | null>(null);
  const isDraggingRef = useRef(false);
  const pendingReorderRef = useRef(false);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    playersRef.current = players;
    if (!isDraggingRef.current && !pendingReorderRef.current) setOrder(players);
  }, [players]);

  const canAdd = order.length < MAX_PLAYERS;
  const canStart = order.length >= MIN_PLAYERS && order.length <= MAX_PLAYERS;

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

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string, index: number) {
    if (busy || order.length < 2) return;
    e.preventDefault();
    const row = e.currentTarget.closest<HTMLElement>(".player-row");
    const rowHeight = row?.getBoundingClientRect().height ?? 48;
    dragState.current = { id, startIndex: index, startY: e.clientY, rowHeight };
    isDraggingRef.current = true;
    setDraggingId(id);
    setDragOffset(0);
  }

  useEffect(() => {
    if (!draggingId) return;

    function onMove(e: PointerEvent) {
      const state = dragState.current;
      if (!state) return;
      const lastIndex = orderRef.current.length - 1;
      const maxDelta = (lastIndex - state.startIndex) * state.rowHeight;
      const minDelta = -state.startIndex * state.rowHeight;
      const deltaY = Math.max(minDelta, Math.min(maxDelta, e.clientY - state.startY));

      const targetIndex = Math.max(
        0,
        Math.min(lastIndex, state.startIndex + Math.round(deltaY / state.rowHeight)),
      );
      const currentIndex = orderRef.current.findIndex((p) => p.id === state.id);

      if (targetIndex !== currentIndex) {
        setOrder((prev) => {
          const next = [...prev];
          const [moved] = next.splice(currentIndex, 1);
          next.splice(targetIndex, 0, moved);
          return next;
        });
      }

      setDragOffset(deltaY - (targetIndex - state.startIndex) * state.rowHeight);
    }

    function onUp() {
      dragState.current = null;
      isDraggingRef.current = false;
      setDraggingId(null);
      setDragOffset(0);

      const finalOrder = orderRef.current;
      const changed =
        finalOrder.map((p) => p.id).join(",") !== playersRef.current.map((p) => p.id).join(",");
      if (changed) {
        pendingReorderRef.current = true;
        run(() => reorderPlayers(shareCode, role, finalOrder.map((p) => p.id))).finally(() => {
          pendingReorderRef.current = false;
        });
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId]);

  return (
    <div className={`card player-manager${draggingId ? " is-dragging" : ""}`}>
      <h2>Spieler verwalten</h2>
      {order.length > 1 && (
        <p className="subtitle">
          Ziehe die Spieler in die Reihenfolge, in der ihr am Tisch sitzt (im Uhrzeigersinn) – danach
          richten sich Geber und Ansage-Reihenfolge.
        </p>
      )}
      <div className="player-list">
        {order.map((p, index) => {
          const isDragging = draggingId === p.id;
          return (
            <div
              className={`player-row${isDragging ? " dragging" : ""}`}
              key={p.id}
              style={isDragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
            >
              {order.length > 1 && (
                <button
                  type="button"
                  className="drag-handle"
                  aria-label={`${p.name} in der Sitzordnung verschieben`}
                  onPointerDown={(e) => handlePointerDown(e, p.id, index)}
                >
                  ⠿
                </button>
              )}
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
          );
        })}
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
