import { useEffect, useRef, useState } from "react";
import type { GameState } from "../types";
import { fetchGame } from "../api";

interface Result {
  game: GameState | null;
  error: string | null;
  connected: boolean;
}

export function useGameEvents(shareCode: string): Result {
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGame(null);
    setError(null);
    setConnected(false);

    // Fetch once up front so the page has data even if SSE is briefly delayed.
    fetchGame(shareCode)
      .then((g) => !cancelled && setGame(g))
      .catch((e) => !cancelled && setError(e.message ?? "Spiel nicht gefunden."));

    const source = new EventSource(`/api/games/${shareCode}/events`);
    sourceRef.current = source;

    source.onopen = () => !cancelled && setConnected(true);
    source.onmessage = (evt) => {
      if (cancelled) return;
      try {
        setGame(JSON.parse(evt.data) as GameState);
        setError(null);
      } catch {
        // ignore malformed frame
      }
    };
    source.onerror = () => {
      if (!cancelled) setConnected(false);
      // EventSource retries automatically; nothing else to do here.
    };

    return () => {
      cancelled = true;
      source.close();
    };
  }, [shareCode]);

  return { game, error, connected };
}
