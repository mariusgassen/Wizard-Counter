export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
const DECK_SIZE = 60;

export function totalRoundsFor(numPlayers) {
  return Math.floor(DECK_SIZE / numPlayers);
}

export function cardsInRound(roundIndex) {
  return roundIndex + 1;
}

export function dealerIndex(roundIndex, numPlayers) {
  return roundIndex % numPlayers;
}

/** Bidding/playing order for a round, starting left of the dealer. */
export function biddingOrder(roundIndex, players) {
  const dealer = dealerIndex(roundIndex, players.length);
  const order = [];
  for (let i = 1; i <= players.length; i++) {
    order.push(players[(dealer + i) % players.length]);
  }
  return order;
}

export function scoreForEntry(bid, tricks) {
  if (bid === tricks) return 20 + 10 * tricks;
  return -10 * Math.abs(bid - tricks);
}
