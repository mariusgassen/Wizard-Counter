import type { GameState, Role } from "./types";

export class ApiError extends Error {}
export class NetworkError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new NetworkError("Keine Verbindung zum Server.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Fehler ${res.status}`);
  }
  return res.json();
}

function roleHeaders(role: Role): Record<string, string> {
  if (role.kind === "admin") return { "X-Admin-Secret": role.adminSecret };
  if (role.kind === "player") return { "X-Player-Token": role.playerToken };
  return {};
}

export function createGame(playerNames: string[]) {
  return request<{ shareCode: string; adminSecret: string }>("/api/games", {
    method: "POST",
    body: JSON.stringify({ playerNames }),
  });
}

export function fetchGame(shareCode: string) {
  return request<GameState>(`/api/games/${shareCode}`);
}

export function addPlayer(shareCode: string, role: Role, name: string) {
  return request<GameState>(`/api/games/${shareCode}/players`, {
    method: "POST",
    headers: roleHeaders(role),
    body: JSON.stringify({ name }),
  });
}

export function removePlayer(shareCode: string, role: Role, playerId: string) {
  return request<GameState>(`/api/games/${shareCode}/players/${playerId}`, {
    method: "DELETE",
    headers: roleHeaders(role),
  });
}

export function reorderPlayers(shareCode: string, role: Role, playerIds: string[]) {
  return request<GameState>(`/api/games/${shareCode}/players/reorder`, {
    method: "POST",
    headers: roleHeaders(role),
    body: JSON.stringify({ playerIds }),
  });
}

export function resetPlayerClaim(shareCode: string, role: Role, playerId: string) {
  return request<GameState>(`/api/games/${shareCode}/players/${playerId}/reset`, {
    method: "POST",
    headers: roleHeaders(role),
  });
}

export function claimPlayer(shareCode: string, playerId: string) {
  return request<{ playerToken: string; playerId: string; state: GameState }>(
    `/api/games/${shareCode}/claim`,
    { method: "POST", body: JSON.stringify({ playerId }) },
  );
}

export function startGame(shareCode: string, role: Role) {
  return request<GameState>(`/api/games/${shareCode}/start`, {
    method: "POST",
    headers: roleHeaders(role),
  });
}

export function advancePhase(shareCode: string, role: Role) {
  return request<GameState>(`/api/games/${shareCode}/advance`, {
    method: "POST",
    headers: roleHeaders(role),
  });
}

export function cancelGame(shareCode: string, role: Role) {
  return request<GameState>(`/api/games/${shareCode}/cancel`, {
    method: "POST",
    headers: roleHeaders(role),
  });
}

export function setEntry(
  shareCode: string,
  role: Role,
  params: { field: "bid" | "tricks"; value: number; playerId?: string; roundIndex?: number },
) {
  return request<GameState>(`/api/games/${shareCode}/entry`, {
    method: "PUT",
    headers: roleHeaders(role),
    body: JSON.stringify(params),
  });
}
