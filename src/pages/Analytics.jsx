import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { api } from '@/api/client';

// Admin-only usage dashboard (GET /api/analytics/summary).
// Shows aggregate counts only — never row-level data, never
// submission contents. See docs/ANALYTICS.md.

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl md:text-2xl font-light text-white mt-8 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Table({ rows, first, second }) {
  if (!rows || !rows.length) return <p className="text-white/50 text-sm">No data yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-white/50 border-b border-white/10">
          <th className="py-2 pr-4 font-medium">{first}</th>
          <th className="py-2 font-medium">{second}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-white/5 text-white/80">
            <td className="py-2 pr-4">{r[0]}</td>
            <td className="py-2">{r[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api('/api/analytics/summary')
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setError(e?.status === 403 ? 'forbidden' : 'failed'); });
    return () => { live = false; };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <BarChart3 className="h-10 w-10 text-[#d4a574] mb-6" />
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">Site Analytics</h1>
          <p className="text-white/50 mb-8">
            Anonymous usage counts only — no visitors are identified, no cookies, no IP addresses.
            Raw counts are kept for {data?.retentionDays ?? 90} days. See the{' '}
            <Link to="/Privacy" className="text-[#d4a574] hover:underline">Privacy Policy</Link>.
          </p>

          {error === 'forbidden' && (
            <p className="text-white/70 leading-relaxed">
              This page is for site admins. If you run the site,{' '}
              <Link to="/Account" className="text-[#d4a574] hover:underline">sign in</Link> with
              an admin account.
            </p>
          )}
          {error === 'failed' && (
            <p className="text-white/70 leading-relaxed">Could not load analytics right now. Try again later.</p>
          )}
          {!data && !error && <p className="text-white/50">Loading…</p>}

          {data && (
            <>
              <Section title="Page views">
                <Table
                  rows={data.pageviews.all.map((r) => [r.page, `${r.views} all-time · ${data.pageviews.last30.find((x) => x.page === r.page)?.views ?? 0} last 30d · ${data.pageviews.last7.find((x) => x.page === r.page)?.views ?? 0} last 7d`])}
                  first="Page"
                  second="Views"
                />
              </Section>

              <Section title="Directory demand — states people browse (last 30 days)">
                <Table rows={data.directoryStates.last30.map((r) => [r.detail, r.count])} first="State" second="Views" />
              </Section>

              <Section title="Directory demand — categories (last 30 days)">
                <Table rows={data.directoryTags.last30.map((r) => [r.detail, r.count])} first="Category" second="Views" />
              </Section>

              <Section title="Resource categories (last 30 days)">
                <Table rows={data.resourceCategories.last30.map((r) => [r.detail, r.count])} first="Category" second="Views" />
              </Section>

              <Section title="Most-tapped outbound resource links (last 30 days)">
                <Table rows={data.resourceOutbound.last30.map((r) => [r.detail, r.count])} first="Site" second="Taps" />
              </Section>

              <Section title="How people arrive (last 30 days)">
                <Table rows={data.referrers.last30.map((r) => [r.detail, r.count])} first="Referrer" second="Page views" />
              </Section>

              <Section title="Devices (last 30 days)">
                <Table rows={data.devices.last30.map((r) => [r.detail, r.count])} first="Device" second="Page views" />
              </Section>

              <Section title="Funnels — views vs outcomes (all-time)">
                <Table
                  rows={[
                    ['Housing applications', `${data.funnel.apply.pageViews} Apply page views → ${data.funnel.apply.submissions} submitted`],
                    ['Contact messages', `${data.funnel.contact.pageViews} Contact page views → ${data.funnel.contact.submissions} submitted`],
                    ['Donations', `${data.funnel.donate.pageViews} Donate page views → ${data.funnel.donate.clicks} Cash App taps`],
                    ['Credit Repair Advocate', `${data.funnel.creditChat.resourcesPageViews} Resources page views → ${data.funnel.creditChat.messages} chat messages`],
                  ]}
                  first="Funnel"
                  second="Counts"
                />
              </Section>

              <Section title="Accounts and submissions (counts only)">
                <p className="text-white/70 leading-relaxed mb-4">
                  {data.totals.users} user accounts. Submissions by kind:{' '}
                  {data.totals.submissionsByKind.map((r) => `${r.kind} ${r.count}`).join(' · ') || 'none yet'}.
                </p>
              </Section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
