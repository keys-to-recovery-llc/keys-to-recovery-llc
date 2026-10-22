import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ExternalLink, DollarSign, Users, Home, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DonatePage() {
  const impacts = [
    { icon: Home, title: "Housing Stability", description: "Your donation helps cover housing costs for residents transitioning into recovery." },
    { icon: Users, title: "Community Support", description: "Funds peer support groups, life skills training, and community building activities." },
    { icon: TrendingUp, title: "Job Placement", description: "Resources to help residents secure employment and rebuild financial independence." },
    { icon: Heart, title: "Compassionate Care", description: "24/7 staff support, counseling resources, and wraparound services." },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-black via-[#1a1200] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#f5c518] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#f5c518] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 px-4 py-2 rounded-full mb-6">
              <Heart className="w-4 h-4 text-[#f5c518]" />
              <span className="text-[#f5c518] text-sm font-medium">Support Recovery</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
              Make a <span className="font-bold text-[#f5c518]">Difference</span> Today
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Every dollar you donate goes directly toward providing safe housing and support services 
              for individuals committed to their recovery journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CashApp Donation Card */}
      <section className="py-20 px-6 -mt-10 relative z-20">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-[#f5c518]/40 bg-[#0d0d00] shadow-2xl shadow-[#f5c518]/10">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-[#00c853] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#00c853]/30">
                  <DollarSign className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Donate via Cash App</h2>
                <p className="text-white/60 mb-6">Fast, secure, and direct — 100% goes to Keys to Recovery LLC</p>

                <div className="bg-black border border-[#f5c518]/20 rounded-2xl p-6 mb-8">
                  <p className="text-white/50 text-sm mb-2 tracking-widest uppercase">Cash App Cashtag</p>
                  <p className="text-4xl font-bold text-[#f5c518] tracking-wide">$KEYSTORECOVERY</p>
                </div>

                <a href="https://cash.app/$KEYSTORECOVERY" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-[#00c853] hover:bg-[#00b347] text-white font-bold py-6 text-xl rounded-2xl shadow-lg shadow-[#00c853]/30 transition-all duration-300 hover:shadow-[#00c853]/50 hover:scale-105">
                    <DollarSign className="mr-2 h-6 w-6" />
                    Open Cash App & Donate
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                </a>

                <p className="mt-4 text-white/40 text-sm">
                  Tapping the button will open Cash App. Search <span className="text-[#f5c518]">$KEYSTORECOVERY</span> to donate.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#f5c518] font-medium tracking-widest text-sm uppercase">Your Impact</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              Where Your <span className="font-bold text-[#f5c518]">Donation Goes</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {impacts.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#f5c518]/20 bg-[#0d0d00] hover:border-[#f5c518]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#f5c518]/10">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 bg-[#f5c518]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <item.icon className="h-7 w-7 text-[#f5c518]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Thank You Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0d0d00] to-black border-t border-[#f5c518]/20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Heart className="h-12 w-12 text-[#f5c518] mx-auto mb-6" />
            <h2 className="text-3xl font-light text-white mb-4">
              Thank You for Your <span className="font-bold text-[#f5c518]">Generosity</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              Your support enables us to open more doors for individuals seeking a second chance. 
              Every contribution — no matter the size — helps someone reclaim their life.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}