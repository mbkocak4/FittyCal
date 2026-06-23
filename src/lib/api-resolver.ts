/**
 * Resolves relative API paths to absolute URLs targeting the real backend container
 * if relative URLs are misrouted or blocked in the editor's sandboxed iframe context.
 */
export function resolveApiUrl(path: string): string {
  // If we are in a server or non-browser environment, return relative path
  if (typeof window === "undefined") {
    return path;
  }

  const currentOrigin = window.location.origin;

  // If currentOrigin exists, matches a safe origin, and is not inside a sandbox like "null"
  if (
    currentOrigin && 
    currentOrigin !== "null" && 
    !currentOrigin.includes("googleusercontent") && 
    !currentOrigin.includes("aistudio-preview")
  ) {
    return `${currentOrigin}${path}`;
  }

  // Detect which environment (development vs preview/shared) we are in.
  // We can look at the current page URL, referrer, or document URI.
  const hrefStr = window.location.href || "";
  const referrerStr = typeof document !== "undefined" ? document.referrer : "";
  const docUrl = typeof document !== "undefined" ? document.URL : "";

  // Helper to extract a valid .run.app or localhost URL from a string
  const extractOrigin = (str: string): string | null => {
    if (!str) return null;
    const match = str.match(/https?:\/\/[^/]+/);
    if (match) {
      const originCandidate = match[0];
      if (
        (originCandidate.includes(".run.app") || originCandidate.includes("localhost") || originCandidate.includes("127.0.0.1")) &&
        !originCandidate.includes("googleusercontent")
      ) {
        return originCandidate;
      }
    }
    return null;
  };

  const detectedOrigin = extractOrigin(hrefStr) || extractOrigin(docUrl) || extractOrigin(referrerStr);
  if (detectedOrigin) {
    return `${detectedOrigin}${path}`;
  }

  const isPre = hrefStr.includes("-pre-") || 
                referrerStr.includes("-pre-") || 
                docUrl.includes("-pre-") ||
                currentOrigin.includes("-pre-");

  const targetHost = isPre
    ? "https://ais-pre-lwqe4a3b6kprvkmaf3cf6h-453330298779.europe-west3.run.app"
    : "https://ais-dev-lwqe4a3b6kprvkmaf3cf6h-453330298779.europe-west3.run.app";

  return `${targetHost}${path}`;
}
