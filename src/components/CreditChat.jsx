import React, { useRef, useState } from 'react';
import { post } from '@/api/client';

// KTR Credit Repair Advocate — the site home of Bart's ChatGPT GPT of the
// same name (see workspace/keys-to-recovery-llc/credit-advocate/).
// The Advocate's instructions live SERVER-SIDE in the worker (secret
// CREDIT_ADVOCATE_INSTRUCTIONS); this component only sends messages and
// renders replies. Nothing here contains doctrine or credentials.
//
// Like Ask Lexi on the Amanda portal, this is a chat bar: the browser holds
// the thread and sends the recent turns with each message; the worker
// stores no message content (only a hashed per-IP daily usage count).
// Visitors are warned in the UI never to paste SSNs, dates of birth, or
// full account numbers — the doctrine's own privacy rule.

const STARTERS = [
  'Upload my credit report and build a dispute strategy.',
  'Create a 90-day credit recovery plan for housing approval.',
  'Draft bureau disputes for inaccurate collections.',
  'Audit this charge-off for reporting errors.',
  'Build a client intake checklist for Keys to Recovery credit support.',
];

const FRIENDLY_ERRORS = {
  daily_limit_reached: 'You have reached the daily message limit for the Credit Repair Advocate. Please try again tomorrow.',
  credit_chat_not_configured: 'The Credit Repair Advocate is not enabled yet. Please try again later.',
  provider_rate_limited: 'The Advocate is busy right now. Please wait a moment and try again.',
  provider_auth_error: 'The Advocate is temporarily unavailable. Please try again later.',
  provider_error: 'The Advocate could not answer just now. Please try again.',
  invalid_request: 'That message could not be sent. Please shorten it and try again.',
};

export default function CreditChat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attachedName, setAttachedName] = useState('');
  const fileRef = useRef(null);

  async function send(event, preset) {
    event?.preventDefault();
    const message = (preset ?? text).trim();
    if (!message || busy) return;
    setBusy(true);
    setError('');
    const next = [...messages, { role: 'user', content: message }];
    setMessages(next);
    setText('');
    setAttachedName('');
    try {
      const result = await post('/api/credit-chat', {
        message,
        history: next.slice(-12),
      });
      setMessages([...next, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.message] || 'The Advocate could not answer just now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function attachFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 100_000) {
      setError('That file is over the 100 KB text limit. Paste the relevant section instead.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '').slice(0, 3500);
      setText((current) => `${current ? `${current}\n\n` : ''}Report text from ${file.name}:\n${content}`);
      setAttachedName(file.name);
    };
    reader.onerror = () => setError('That file could not be read. Paste the relevant text instead.');
    reader.readAsText(file);
  }

  return (
    <section className="px-6 py-12 border-b border-[#d4a574]/10">
      <div className="max-w-4xl mx-auto">
        <span className="text-[#d4a574] font-medium tracking-widest text-xs uppercase">AI Chat · Credit Repair</span>
        <h2 className="text-3xl md:text-4xl font-light text-white mt-3 mb-4">
          Credit Repair <span className="font-semibold text-[#d4a574]">Advocate</span>
        </h2>
        <p className="text-white/60 leading-relaxed max-w-3xl mb-2">
          Credit education, dispute-document preparation, and financial recovery support for Keys to Recovery clients.
          Understand your credit reports, challenge inaccurate reporting, rebuild safely, and prepare for housing, banking,
          and lending readiness.
        </p>
        <p className="text-white/40 text-sm leading-relaxed max-w-3xl mb-6">
          Educational support only — not legal advice, and never a promise of a score increase, deletion, or approval.
          Please do not share Social Security numbers, dates of birth, or full account numbers here.
        </p>

        {messages.length > 0 && (
          <div className="space-y-3 mb-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`rounded-xl p-4 border ${m.role === 'user' ? 'bg-white/5 border-white/10 ml-8' : 'bg-[#0d0d00] border-[#d4a574]/20 mr-8'}`}>
                <p className="text-[#d4a574] text-xs font-semibold uppercase tracking-widest mb-1.5">
                  {m.role === 'user' ? 'You' : 'Credit Repair Advocate'}
                </p>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => send(e, s)}
              disabled={busy}
              className="px-3 py-1.5 rounded-full text-sm border border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => send(e)} className="border border-[#d4a574]/20 rounded-xl bg-[#0d0d00] p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
            rows={3}
            placeholder="Ask about a report, a collection, a charge-off, or a rebuild plan…"
            className="w-full bg-transparent text-white placeholder:text-white/30 text-sm leading-relaxed outline-none resize-y"
          />
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-3">
              <input ref={fileRef} hidden type="file" accept=".txt,.md,.csv,text/plain" onChange={attachFile} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="text-[#d4a574] text-sm hover:underline disabled:opacity-50"
              >
                Attach report text
              </button>
              {attachedName && <span className="text-white/40 text-xs">{attachedName} attached</span>}
            </div>
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="px-4 py-2 rounded-lg bg-[#d4a574] text-black text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'Advocate is working…' : 'Send'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-400/90 text-sm mt-3" role="alert">{error}</p>}
      </div>
    </section>
  );
}
