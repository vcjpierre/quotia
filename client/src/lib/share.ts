/**
 * Public share links live outside the authenticated app: the token is the only
 * credential, so the URL must be stable and point at the read-only page.
 */
export function buildShareUrl(token: string): string {
  return `${window.location.origin}/s/${token}`;
}

/**
 * Copies the share URL to the clipboard. Returns false when the browser denies
 * clipboard access (non-HTTPS, permissions, embedded webviews) so callers can
 * fall back to showing the URL instead of claiming it was copied.
 */
export async function copyShareUrl(token: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildShareUrl(token));
    return true;
  } catch {
    return false;
  }
}
