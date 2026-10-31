// Anonymous first-party analytics client (docs/ANALYTICS.md).
// Fire-and-forget: failures are swallowed, analytics never blocks
// navigation or breaks the app.
// Sends only: an event name, a page key, a short detail string, a
// device class, and the referrer's domain. No cookies, no identifiers,
// no free-text input, no IP addresses, no third parties.

function deviceClass() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      return 'mobile';
    }
  } catch {
    /* fall through */
  }
  return 'desktop';
}

function referrerDomain() {
  try {
    if (!document.referrer) return '';
    return new URL(document.referrer).hostname.slice(0, 120);
  } catch {
    return '';
  }
}

export function track(event, detail = '', page = '') {
  try {
    const body = JSON.stringify({
      event,
      detail: String(detail).slice(0, 120),
      page,
      device: deviceClass(),
      referrer: referrerDomain(),
    });
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never throw */
  }
}

export function trackPageview(page) {
  track('pageview', '', page);
}
