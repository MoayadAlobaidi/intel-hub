export type TabKey = "worldmonitor" | "deltaintel";
export type TabStatus = "checking" | "online" | "offline";

export type StatusSetter = (
  updater: (prev: Record<TabKey, TabStatus>) => Record<TabKey, TabStatus>
) => void;

export interface CheckOneOptions {
  key: TabKey;
  url: string;
  setStatus: StatusSetter;
  fetchFn?: typeof fetch;
}

/**
 * Checks the status of a tab by making an API call to the ping endpoint.
 * Updates the status to "checking" initially, then to "online" or "offline"
 * based on the API response.
 *
 * @param options - The options for checking the tab status
 * @param options.key - The tab key to check
 * @param options.url - The URL to check status for
 * @param options.setStatus - A state setter function to update the status
 * @param options.fetchFn - Optional fetch function for dependency injection (useful for testing)
 */
export async function checkOne({
  key,
  url,
  setStatus,
  fetchFn = fetch,
}: CheckOneOptions): Promise<void> {
  setStatus((s) => ({ ...s, [key]: "checking" }));
  try {
    const r = await fetchFn(`/api/ping?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setStatus((s) => ({ ...s, [key]: j.ok ? "online" : "offline" }));
  } catch {
    setStatus((s) => ({ ...s, [key]: "offline" }));
  }
}
