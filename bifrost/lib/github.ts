// Shown when the GitHub API is rate-limited, slow, down, or returns
// something unexpected. Roughly the real count as of Oct 2026.
export const FALLBACK_GITHUB_STARS = 6000;

export async function getGithubStars(): Promise<number> {
  try {
    const res = await fetch("https://api.github.com/repos/helicone/helicone", {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return FALLBACK_GITHUB_STARS;
    }
    const data: unknown = await res.json();
    const stars =
      typeof data === "object" && data !== null
        ? (data as { stargazers_count?: unknown }).stargazers_count
        : undefined;
    return typeof stars === "number" && Number.isFinite(stars) && stars > 0
      ? stars
      : FALLBACK_GITHUB_STARS;
  } catch {
    return FALLBACK_GITHUB_STARS;
  }
}
