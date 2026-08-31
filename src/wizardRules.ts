import type { Player, RoundResult } from "./types";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
const DECK_SIZE = 60;

/** Number of rounds for a game: as many rounds as fit a full round of cards per player. */
export function totalRoundsFor(numPlayers: number): number {
  return Math.floor(DECK_SIZE / numPlayers);
}

/** How many cards are dealt to each player in the given round (0-based index). */
export function cardsInRound(roundIndex: number): number {
  return roundIndex + 1;
}

/** Index (into players[]) of the dealer for the given round. */
export function dealerIndex(roundIndex: number, numPlayers: number): number {
  return roundIndex % numPlayers;
}

/** Bidding/playing order for a round, starting left of the dealer. */
export function biddingOrder(roundIndex: number, players: Player[]): Player[] {
  const dealer = dealerIndex(roundIndex, players.length);
  const order: Player[] = [];
  for (let i = 1; i <= players.length; i++) {
    order.push(players[(dealer + i) % players.length]);
  }
  return order;
}

/** Wizard scoring: exact bid pays a bonus, a miss costs per-trick difference. */
export function scoreForEntry(bid: number, tricks: number): number {
  if (bid === tricks) {
    return 20 + 10 * tricks;
  }
  return -10 * Math.abs(bid - tricks);
}

export function totalScore(rounds: RoundResult[], playerId: string): number {
  return rounds.reduce((sum, round) => {
    const entry = round[playerId];
    if (!entry) return sum;
    return sum + scoreForEntry(entry.bid, entry.tricks);
  }, 0);
}

export function sumBids(round: RoundResult): number {
  return Object.values(round).reduce((sum, e) => sum + e.bid, 0);
}

export function sumTricks(round: RoundResult): number {
  return Object.values(round).reduce((sum, e) => sum + e.tricks, 0);
}
