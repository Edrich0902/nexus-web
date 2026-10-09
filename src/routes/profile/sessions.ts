/** "Chrome on macOS" from a user-agent string; falls back to null when unrecognised. */
export function describeAgent(ua: string | null | undefined): string | null {
  if (!ua) return null
  const browser =
    (/Edg\//.test(ua) && 'Edge') ||
    (/OPR\/|Opera/.test(ua) && 'Opera') ||
    (/Firefox\//.test(ua) && 'Firefox') ||
    (/Chrome\//.test(ua) && 'Chrome') ||
    (/Safari\//.test(ua) && 'Safari') ||
    (/okhttp|Dart|CFNetwork|Expo/i.test(ua) && 'Nexus app') ||
    (/curl|PostmanRuntime|insomnia/i.test(ua) && 'API client') ||
    null
  const os =
    (/iPhone|iPad|iPod/.test(ua) && 'iOS') ||
    (/Android/.test(ua) && 'Android') ||
    (/Mac OS X|Macintosh/.test(ua) && 'macOS') ||
    (/Windows/.test(ua) && 'Windows') ||
    (/Linux/.test(ua) && 'Linux') ||
    null
  if (browser && os) return `${browser} on ${os}`
  return browser ?? os
}

export function isMobileAgent(ua: string | null | undefined): boolean {
  return Boolean(ua && /iPhone|iPad|iPod|Android|Mobile/.test(ua))
}
