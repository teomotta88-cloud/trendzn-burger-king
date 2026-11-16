import { createFileRoute } from "@tanstack/react-router";
import trendsData from "@/data/trends.json";

const GITHUB_REPO = "teomotta88-cloud/trendzn-burger-king";
const TRENDS_PATH = "src/data/trends.json";
const REF = "main";
const CACHE_TTL_MS = 60_000;

// Il feed deve mostrare subito i post scritti dal sync (GitHub Action) senza
// aspettare un nuovo deploy: leggiamo trends.json da GitHub a runtime, con una
// cache breve in memoria. Se GitHub non risponde (rate limit, token mancante o
// scaduto, repo non raggiungibile) si ricade sul file incluso nella build.
let cache: { at: number; data: unknown } | null = null;

async function fetchFromGitHub(): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "trendzn-bot",
  };
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${TRENDS_PATH}?ref=${REF}`,
    { headers, signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

export const Route = createFileRoute("/api/public/hooks/trends-json")({
  server: {
    handlers: {
      GET: async () => {
        const now = Date.now();
        if (cache && now - cache.at < CACHE_TTL_MS) {
          return Response.json(cache.data, {
            headers: { "Cache-Control": "public, max-age=60", "X-Trends-Source": "github-cache" },
          });
        }

        try {
          const data = await fetchFromGitHub();
          cache = { at: now, data };
          return Response.json(data, {
            headers: { "Cache-Control": "public, max-age=60", "X-Trends-Source": "github" },
          });
        } catch (err) {
          console.error("trends-json: lettura da GitHub fallita, uso il file della build:", String(err));
          // Se abbiamo una copia precedente da GitHub, è più fresca del file di build.
          return Response.json(cache?.data ?? trendsData, {
            headers: {
              "Cache-Control": "public, max-age=30",
              "X-Trends-Source": cache ? "github-stale" : "bundled",
            },
          });
        }
      },
    },
  },
});
