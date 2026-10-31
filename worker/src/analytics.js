// Anonymous, first-party usage analytics for keystorecoveryllc.com.
// Privacy contract (docs/ANALYTICS.md, Privacy page):
// - No cookies, no identifiers, no IP addresses, no user-agent strings,
//   no third parties, no cross-site tracking.
// - Each row is one anonymous count: an event name, a page key, an
//   optional short detail (directory state, category tag, outbound
//   hostname, or referrer domain), a device class, and a timestamp.
// - Application, contact, and feedback contents are NEVER written here.
// - Raw rows are pruned after 90 days by the scheduled handler.

export const ANALYTICS_EVENTS = new Set([
  'pageview',
  'directory_state',
  'directory_tag',
  'resource_category',
  'resource_outbound',
  'donate_click',
]);

// Page keys from src/pages.config.js, plus the admin Analytics page.
export const ANALYTICS_PAGES = new Set([
  'Home',
  'About',
  'Services',
  'Contact',
  'Apply',
  'Donate',
  'Investors',
  'Privacy',
  'DeleteAccount',
  'Resources',
  'Directory',
  'Account',
  'Analytics',
]);

const MAX_DETAIL = 120;
export const ANALYTICS_RETENTION_DAYS = 90;

// Validate an inbound payload. Returns a cleaned record or null.
// Invalid input is dropped silently by the caller (never an error to
// the client — analytics must never break the site).
export function cleanAnalyticsPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const event = typeof payload.event === 'string' ? payload.event : '';
  if (!ANALYTICS_EVENTS.has(event)) return null;
  let page = '';
  if (typeof payload.page === 'string' && ANALYTICS_PAGES.has(payload.page)) {
    page = payload.page;
  }
  if (event === 'pageview' && !page) return null;
  const detail = typeof payload.detail === 'string' ? payload.detail.slice(0, MAX_DETAIL) : '';
  const device =
    payload.device === 'mobile' || payload.device === 'desktop' ? payload.device : 'unknown';
  const referrer =
    typeof payload.referrer === 'string' ? payload.referrer.slice(0, MAX_DETAIL) : '';
  return { event, page, detail, device, referrer };
}

export async function recordAnalyticsEvent(db, cleaned) {
  await db
    .prepare(
      'INSERT INTO analytics_events (event, page, detail, device, referrer, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(
      cleaned.event,
      cleaned.page,
      cleaned.detail,
      cleaned.device,
      cleaned.referrer,
      new Date().toISOString(),
    )
    .run();
}

// Delete raw rows older than the retention window. Returns rows removed.
export async function pruneAnalyticsEvents(db, days = ANALYTICS_RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const res = await db
    .prepare('DELETE FROM analytics_events WHERE created_at < ?')
    .bind(cutoff)
    .run();
  return res?.meta?.changes ?? 0;
}

// Aggregate counts only — never row-level data, never submission content.
// Windows: 7d, 30d, and all-time (bounded by the 90-day retention).
export async function analyticsSummary(db) {
  const q = async (sql, ...params) => {
    const res = await db.prepare(sql).bind(...params).all();
    return res.results ?? [];
  };
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const byPage = async (since) => {
    const rows = await q(
      `SELECT page, COUNT(*) AS n FROM analytics_events
       WHERE event = 'pageview' AND (? = '' OR created_at >= ?)
       GROUP BY page ORDER BY n DESC`,
      since,
      since,
    );
    return rows.map((r) => ({ page: r.page, views: r.n }));
  };
  const byEventDetail = async (event, since, limit = 25) => {
    const rows = await q(
      `SELECT detail, COUNT(*) AS n FROM analytics_events
       WHERE event = ? AND created_at >= ?
       GROUP BY detail ORDER BY n DESC LIMIT ?`,
      event,
      since,
      limit,
    );
    return rows.map((r) => ({ detail: r.detail, count: r.n }));
  };
  const eventCount = async (event, since) => {
    const rows = await q(
      `SELECT COUNT(*) AS n FROM analytics_events WHERE event = ? AND created_at >= ?`,
      event,
      since,
    );
    return rows[0]?.n ?? 0;
  };
  const submissionsByKind = await q(
    'SELECT kind, COUNT(*) AS n FROM submissions GROUP BY kind ORDER BY n DESC',
  );
  const users = await q('SELECT COUNT(*) AS n FROM users');
  const chat = await q('SELECT COALESCE(SUM(count), 0) AS n FROM credit_chat_usage');

  const applyViews = (await byPage('')).find((r) => r.page === 'Apply')?.views ?? 0;
  const contactViews = (await byPage('')).find((r) => r.page === 'Contact')?.views ?? 0;
  const donateViews = (await byPage('')).find((r) => r.page === 'Donate')?.views ?? 0;
  const resourcesViews = (await byPage('')).find((r) => r.page === 'Resources')?.views ?? 0;
  const applySubs = submissionsByKind.find((r) => r.kind === 'apply')?.n ?? 0;
  const contactSubs = submissionsByKind.find((r) => r.kind === 'contact')?.n ?? 0;
  const donateClicks = await eventCount('donate_click', '0000-01-01T00:00:00Z');

  return {
    generatedAt: new Date().toISOString(),
    retentionDays: ANALYTICS_RETENTION_DAYS,
    pageviews: { all: await byPage(''), last30: await byPage(since30), last7: await byPage(since7) },
    directoryStates: { last30: await byEventDetail('directory_state', since30) },
    directoryTags: { last30: await byEventDetail('directory_tag', since30) },
    resourceCategories: { last30: await byEventDetail('resource_category', since30) },
    resourceOutbound: { last30: await byEventDetail('resource_outbound', since30, 10) },
    referrers: {
      last30: (
        await q(
          `SELECT referrer, COUNT(*) AS n FROM analytics_events
           WHERE event = 'pageview' AND created_at >= ? AND referrer != ''
           GROUP BY referrer ORDER BY n DESC LIMIT 10`,
          since30,
        )
      ).map((r) => ({ detail: r.referrer, count: r.n })),
    },
    devices: {
      last30: (
        await q(
          `SELECT device, COUNT(*) AS n FROM analytics_events
           WHERE event = 'pageview' AND created_at >= ?
           GROUP BY device ORDER BY n DESC`,
          since30,
        )
      ).map((r) => ({ detail: r.device, count: r.n })),
    },
    funnel: {
      apply: { pageViews: applyViews, submissions: applySubs },
      contact: { pageViews: contactViews, submissions: contactSubs },
      donate: { pageViews: donateViews, clicks: donateClicks },
      creditChat: { resourcesPageViews: resourcesViews, messages: chat[0]?.n ?? 0 },
    },
    totals: {
      users: users[0]?.n ?? 0,
      submissionsByKind: submissionsByKind.map((r) => ({ kind: r.kind, count: r.n })),
    },
  };
}
