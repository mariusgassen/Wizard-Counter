export interface Player {
  id: string;
  name: string;
  claimed: boolean;
}

export interface RoundEntry {
  bid?: number;
  tricks?: number;
}

/** One finalized round: entries keyed by player id. */
export type RoundResult = Record<string, { bid: number; tricks: number }>;

export type GameStatus = "setup" | "playing" | "finished" | "cancelled";
export type Phase = "bidding" | "tricks" | null;

export interface GameState {
  status: GameStatus;
  players: Player[];
  totalRounds: number | null;
  currentRoundIndex: number;
  phase: Phase;
  currentEntries: Record<string, RoundEntry>;
  rounds: RoundResult[];
  createdAt: number;
}

export type Role =
  | { kind: "admin"; adminSecret: string }
  | { kind: "player"; playerId: string; playerToken: string }
  | { kind: "spectator" };
