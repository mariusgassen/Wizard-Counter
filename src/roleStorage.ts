import type { Role } from "./types";

function key(shareCode: string) {
  return `wizard-role-${shareCode}`;
}

export function loadRole(shareCode: string): Role | null {
  try {
    const raw = window.localStorage.getItem(key(shareCode));
    return raw ? (JSON.parse(raw) as Role) : null;
  } catch {
    return null;
  }
}

export function saveRole(shareCode: string, role: Role) {
  try {
    window.localStorage.setItem(key(shareCode), JSON.stringify(role));
  } catch {
    // storage unavailable — role just won't survive a reload
  }
}

export function clearRole(shareCode: string) {
  try {
    window.localStorage.removeItem(key(shareCode));
  } catch {
    // ignore
  }
}
