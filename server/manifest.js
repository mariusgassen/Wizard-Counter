const ICONS = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
];

export function buildManifest(startUrl) {
  return {
    name: "Wizard Punktezähler",
    short_name: "Wizard",
    description: "Punkte zählen beim Kartenspiel Wizard – gemeinsam mit allen Mitspielern live.",
    id: startUrl,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#17111f",
    theme_color: "#241b3a",
    orientation: "portrait",
    icons: ICONS,
  };
}
