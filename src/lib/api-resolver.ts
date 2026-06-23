/**
 * Resolves relative API paths to absolute URLs targeting the real backend container
 * if relative URLs are misrouted or blocked in the editor's sandboxed iframe context.
 */
export function resolveApiUrl(path: string): string {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

  // If we are currently running directly on the development or preview domains,
  // relative URLs (same-origin fetches) are safe and work correctly.
  if (currentOrigin && currentOrigin !== "null" && currentOrigin.includes(".run.app")) {
    return path;
  }

  // Detect which environment (development vs preview/shared) we are in.
  // We can look at the current page URL, referrer, or document URI.
  const hrefStr = typeof window !== "undefined" ? window.location.href : "";
  const referrerStr = typeof window !== "undefined" ? document.referrer : "";
  const isPre = hrefStr.includes("-pre-") || referrerStr.includes("-pre-");

  const targetHost = isPre
    ? "https://ais-pre-lwqe4a3b6kprvkmaf3cf6h-453330298779.europe-west3.run.app"
    : "https://ais-dev-lwqe4a3b6kprvkmaf3cf6h-453330298779.europe-west3.run.app";

  return `${targetHost}${path}`;
}
