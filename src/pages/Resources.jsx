import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Video, FileText, Headphones, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const resources = [
  // Beginner
  { id: 1, title: "What is Recovery Housing?", category: "Housing", type: "Article", difficulty: "Beginner", description: "An introduction to sober living and what to expect in a recovery home environment.", link: "#" },
  { id: 2, title: "The 12 Steps Explained", category: "12-Step", type: "Article", difficulty: "Beginner", description: "A clear breakdown of each step in the 12-step recovery program.", link: "#" },
  { id: 3, title: "Finding Your Why in Recovery", category: "Mental Health", type: "Video", difficulty: "Beginner", description: "A short guided video on identifying personal motivation for staying sober.", link: "#" },
  { id: 4, title: "Early Recovery: What to Expect", category: "Recovery Basics", type: "Article", difficulty: "Beginner", description: "Covers the emotional, physical, and social changes in the first 90 days of recovery.", link: "#" },
  { id: 5, title: "Breathing for Calm", category: "Mental Health", type: "Audio", difficulty: "Beginner", description: "A guided breathing exercise designed for moments of high craving or anxiety.", link: "#" },
  // Intermediate
  { id: 6, title: "Building a Relapse Prevention Plan", category: "Recovery Basics", type: "Worksheet", difficulty: "Intermediate", description: "A structured template for identifying triggers and creating a personal safety plan.", link: "#" },
  { id: 7, title: "Navigating Relationships in Recovery", category: "Life Skills", type: "Article", difficulty: "Intermediate", description: "How addiction affects relationships and how to rebuild trust with loved ones.", link: "#" },
  { id: 8, title: "Financial Literacy for Beginners", category: "Life Skills", type: "Worksheet", difficulty: "Intermediate", description: "Budgeting basics and financial planning tools for people re-entering society.", link: "#" },
  { id: 9, title: "Trauma & Addiction: The Connection", category: "Mental Health", type: "Video", difficulty: "Intermediate", description: "An educational video on how unresolved trauma contributes to substance use.", link: "#" },
  { id: 10, title: "Mindfulness in Recovery", category: "Mental Health", type: "Audio", difficulty: "Intermediate", description: "A 15-minute guided mindfulness session tailored for people in recovery.", link: "#" },
  // Advanced
  { id: 11, title: "Supporting a Loved One in Recovery", category: "Family", type: "Article", difficulty: "Advanced", description: "A comprehensive guide for families and friends of people in active recovery.", link: "#" },
  { id: 12, title: "Co-occurring Disorders: Dual Diagnosis", category: "Mental Health", type: "Article", difficulty: "Advanced", description: "Understanding and managing mental health conditions alongside addiction recovery.", link: "#" },
  { id: 13, title: "SMART Recovery Workbook", category: "Recovery Basics", type: "Worksheet", difficulty: "Advanced", description: "Science-based tools for building and maintaining recovery without a 12-step framework.", link: "#" },
  { id: 14, title: "Employment After Incarceration", category: "Life Skills", type: "Article", difficulty: "Advanced", description: "Resources and strategies for re-entering the workforce with a criminal background.", link: "#" },
  { id: 15, title: "Peer Support Specialist Certification", category: "Career", type: "Article", difficulty: "Advanced", description: "How to turn your lived experience into a career as a certified peer support specialist.", link: "#" },
];

const categories = ["All", "Recovery Basics", "12-Step", "Mental Health", "Life Skills", "Housing", "Family", "Career"];
const types = ["All", "Article", "Video", "Audio", "Worksheet"];
const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

const typeIcons = { Article: FileText, Video: Video, Audio: Headphones, Worksheet: BookOpen };

const difficultyColors = {
  Beginner: "bg-green-900/40 text-green-400 border-green-500/30",
  Intermediate: "bg-yellow-900/40 text-yellow-400 border-yellow-500/30",
  Advanced: "bg-red-900/40 text-red-400 border-red-500/30",
};

const typeColors = {
  Article: "bg-blue-900/40 text-blue-400 border-blue-500/30",
  Video: "bg-purple-900/40 text-purple-400 border-purple-500/30",
  Audio: "bg-pink-900/40 text-pink-400 border-pink-500/30",
  Worksheet: "bg-[#d4a574]/10 text-[#d4a574] border-[#d4a574]/30",
};

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const filtered = useMemo(() => resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || r.category === category;
    const matchType = type === 'All' || r.type === type;
    const matchDiff = difficulty === 'All' || r.difficulty === difficulty;
    return matchSearch && matchCat && matchType && matchDiff;
  }), [search, category, type, difficulty]);

  const FilterPill = ({ value, current, onChange }) => (
    <button
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        current === value
          ? 'bg-[#d4a574] text-black'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
      }`}
    >
      {value}
    </button>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Resource Library</span>
            <h1 className="text-4xl md:text-6xl font-light text-white mt-4 mb-4">
              Recovery <span className="font-semibold text-[#d4a574]">Resources</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Articles, videos, worksheets, and audio guides to support every stage of your recovery journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-[80px] z-30 bg-black/95 backdrop-blur border-b border-[#d4a574]/10 px-6 py-4">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-[#d4a574]"
            />
          </div>

          {/* Filter rows */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Filter className="h-4 w-4 text-[#d4a574] flex-shrink-0" />
              <span className="text-white/40 text-xs flex-shrink-0">Category:</span>
              {categories.map(c => <FilterPill key={c} value={c} current={category} onChange={setCategory} />)}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-white/40 text-xs flex-shrink-0 ml-6">Type:</span>
              {types.map(t => <FilterPill key={t} value={t} current={type} onChange={setType} />)}
              <span className="text-white/40 text-xs flex-shrink-0 ml-2">Level:</span>
              {difficulties.map(d => <FilterPill key={d} value={d} current={difficulty} onChange={setDifficulty} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/40 text-sm mb-6">{filtered.length} resource{filtered.length !== 1 ? 's' : ''} found</p>

          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">No resources match your filters.</p>
              <button onClick={() => { setSearch(''); setCategory('All'); setType('All'); setDifficulty('All'); }} className="mt-4 text-[#d4a574] text-sm hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r, i) => {
                const Icon = typeIcons[r.type] || FileText;
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="h-full border border-[#d4a574]/20 bg-[#0d0d00] hover:border-[#d4a574]/50 transition-all duration-300 group">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="w-10 h-10 bg-[#d4a574]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-[#d4a574]" />
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[r.type]}`}>{r.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[r.difficulty]}`}>{r.difficulty}</span>
                          </div>
                        </div>
                        <h3 className="text-white font-semibold mb-2 leading-snug">{r.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed flex-1 mb-4">{r.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[#d4a574]/60 text-xs">{r.category}</span>
                          <a href={r.link} className="flex items-center gap-1 text-[#d4a574] text-sm font-medium hover:underline group-hover:gap-2 transition-all">
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}