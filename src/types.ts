export interface Player {
  id: string;
  name: string;
}

export interface RoundEntry {
  bid: number;
  tricks: number;
}

/** One completed round: entries keyed by player id. */
export type RoundResult = Record<string, RoundEntry>;

export interface GameState {
  players: Player[];
  rounds: RoundResult[];
  /** Index of the round currently being entered (0-based). */
  currentRound: number;
  totalRounds: number;
  startedAt: number;
}
