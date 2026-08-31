const subscribers = new Map(); // shareCode -> Set<res>

export function subscribe(shareCode, res) {
  if (!subscribers.has(shareCode)) subscribers.set(shareCode, new Set());
  subscribers.get(shareCode).add(res);
}

export function unsubscribe(shareCode, res) {
  subscribers.get(shareCode)?.delete(res);
}

export function broadcast(shareCode, publicState) {
  const set = subscribers.get(shareCode);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(publicState)}\n\n`;
  for (const res of set) {
    res.write(payload);
  }
}
