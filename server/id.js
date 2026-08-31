import { customAlphabet, nanoid } from "nanoid";

// No 0/O/1/I to avoid confusion when read aloud or typed in by hand.
const shareCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoShareCode = customAlphabet(shareCodeAlphabet, 6);

export function generateShareCode() {
  return nanoShareCode();
}

export function generateSecret() {
  return nanoid(24);
}

export function generatePlayerId() {
  return nanoid(8);
}
