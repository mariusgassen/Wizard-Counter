const DEFAULT_MANIFEST = "/manifest.webmanifest";

export function setManifestHref(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (link) link.href = href;
}

export function resetManifestHref() {
  setManifestHref(DEFAULT_MANIFEST);
}
