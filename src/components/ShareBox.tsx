import { useState } from "react";
import type { Role } from "../types";

interface Props {
  shareCode: string;
  role: Role;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — user can still select the text manually
    }
  }

  return (
    <div className="copy-row">
      <div className="copy-row-text">
        <span className="copy-row-label">{label}</span>
        <code>{value}</code>
      </div>
      <button type="button" className="secondary" onClick={copy}>
        {copied ? "Kopiert!" : "Kopieren"}
      </button>
    </div>
  );
}

export function ShareBox({ shareCode, role }: Props) {
  const origin = window.location.origin;
  const shareLink = `${origin}/g/${shareCode}`;

  return (
    <div className="share-box">
      <p className="subtitle">
        Spiel-Code an die Mitspieler durchsagen oder den Link schicken. Jeder kann sich damit als einer
        der angelegten Spieler eintragen und seine eigenen Ansagen &amp; Stiche live eingeben.
      </p>
      <CopyRow label="Spiel-Code" value={shareCode} />
      <CopyRow label="Spiel-Link" value={shareLink} />
      {role.kind === "admin" && (
        <>
          <p className="subtitle admin-note">
            Dieser Link gibt volle Kontrolle (Spieler verwalten, Runden freigeben). Nur für dich –
            speichere ihn, um von einem anderen Gerät als Admin zurückzukehren.
          </p>
          <CopyRow label="Admin-Link" value={`${shareLink}?admin=${role.adminSecret}`} />
        </>
      )}
    </div>
  );
}
