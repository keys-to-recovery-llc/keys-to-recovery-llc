import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { resourceArticles, articleMeta } from '@/data/resourceArticles';

function Section({ section }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-light text-white mb-5">
        {section.heading}
      </h2>
      <div className="space-y-4 text-white/70 leading-relaxed">
        {section.paragraphs?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {section.bullets && (
        <ul className="mt-5 space-y-3">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-white/70 leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-[#d4a574] flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ResourceArticle() {
  const { resourceId } = useParams();
  const article = resourceArticles[resourceId];
  const meta = articleMeta[resourceId];

  if (!article || !meta) {
    return (
      <div className="min-h-screen bg-black">
        <section className="py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-light text-white mb-4">Article not found</h1>
            <p className="text-white/60 mb-8">
              We couldn't find that resource. It may have moved — the full library is one click away.
            </p>
            <Link to="/Resources" className="inline-flex items-center gap-2 text-[#d4a574] font-medium hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to all resources
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link to="/Resources" className="inline-flex items-center gap-2 text-[#d4a574] text-sm font-medium hover:underline mb-8">
              <ArrowLeft className="h-4 w-4" /> All resources
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Resource Library</span>
              <span className="text-white/30 text-sm">·</span>
              <span className="text-white/50 text-sm">{meta.category}</span>
              <span className="text-white/30 text-sm">·</span>
              <span className="text-white/50 text-sm">{meta.difficulty}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight">{meta.title}</h1>
            <p className="text-lg text-white/70 leading-relaxed">{article.lede}</p>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {article.sections?.map((s, i) => (
            <Section key={i} section={s} />
          ))}

          {article.steps && (
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-light text-white mb-6">The twelve steps</h2>
              <div className="space-y-6">
                {article.steps.map((step, i) => (
                  <div key={i} className="border border-[#d4a574]/20 bg-[#0d0d00] rounded-2xl p-6 md:p-8">
                    <span className="text-[#d4a574] font-medium tracking-widest text-xs uppercase">{step.title}</span>
                    <p className="text-white text-lg leading-relaxed mt-3 mb-4 italic">“{step.text}”</p>
                    <div className="space-y-4 text-white/70 leading-relaxed">
                      {step.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {article.postSections?.map((s, i) => (
            <Section key={`post-${i}`} section={s} />
          ))}

          {article.closingNote && (
            <div className="border border-[#d4a574]/30 bg-[#d4a574]/5 rounded-2xl p-6 md:p-8 mb-12">
              <span className="text-[#d4a574] font-medium tracking-widest text-xs uppercase">Please note</span>
              <p className="text-white/70 leading-relaxed mt-3">{article.closingNote}</p>
            </div>
          )}

          <div className="border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <Link to="/Resources" className="inline-flex items-center gap-2 text-[#d4a574] font-medium hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to all resources
            </Link>
            <Link to="/Apply" className="inline-flex items-center gap-2 text-[#d4a574] font-medium hover:underline">
              Apply for housing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
