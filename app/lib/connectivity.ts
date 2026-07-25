const CONNECTIVITY_CHECK_TIMEOUT_MS = 5_000;

export async function checkBrowserConnectivity(
  fetcher: typeof fetch = fetch,
  timeoutMs = CONNECTIVITY_CHECK_TIMEOUT_MS,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetcher(`/favicon.svg?rhythm-connectivity=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
