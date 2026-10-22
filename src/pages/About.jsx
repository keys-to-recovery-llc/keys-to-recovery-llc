import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Heart, Target, Eye, Users, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Compassion",
      description: "We treat every individual with dignity, respect, and understanding, recognizing the courage it takes to pursue recovery."
    },
    {
      icon: Target,
      title: "Accountability",
      description: "We foster personal responsibility while providing the structure and support needed for lasting change."
    },
    {
      icon: Users,
      title: "Community",
      description: "We believe in the power of connection and peer support in the recovery process."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We maintain the highest standards in our facilities, programs, and the care we provide."
    }
  ];

  const milestones = [
    { number: "2026", label: "Year Founded" },
    { number: "24/7", label: "Planned Support Model" },
    { number: "93%", label: "Industry Occupancy Avg." },
    { number: "Pre-Launch", label: "Building Toward Operations" }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">About Us</span>
            <h1 className="text-4xl md:text-6xl font-light text-white mt-4 mb-6">
              Building <span className="font-semibold text-[#d4a574]">Foundations</span> for Recovery
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Keys to Recovery LLC is dedicated to providing safe, supportive housing
              for individuals on their journey to lasting sobriety.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-light text-white mt-4 mb-6">
                Founded on <span className="font-semibold text-[#d4a574]">Hope & Purpose</span>
              </h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  Keys to Recovery LLC was founded in 2026 with a clear and honest mission: to create safe, affordable, structured recovery housing for individuals committed to their sobriety. We are currently in our pre-revenue, pre-operational phase — building the groundwork needed to serve our first residents.
                </p>
                <p>
                  We believe recovery is about more than abstinence — it's about rebuilding a life worth living. Our planned program is designed around community, accountability, and compassionate structure.
                </p>
                <p>
                  We are actively seeking property acquisitions, capital partners, and community support to bring this vision to life. Everything we present on this site reflects our intended model — not claims of past performance.
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#d4a574]/10 to-[#d4a574]/5 rounded-3xl border border-[#d4a574]/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#d4a574]/30">
                    <Heart className="h-10 w-10 text-[#d4a574]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Our Promise</h3>
                  <p className="text-white/60">
                    To be your partner in recovery, providing the keys to unlock your potential.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 px-6 bg-[#0d0d00]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="h-full border border-[#d4a574]/20 bg-black shadow-xl">
                <CardContent className="p-10">
                  <div className="w-14 h-14 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center mb-6">
                    <Target className="h-7 w-7 text-[#d4a574]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Our Mission</h3>
                  <p className="text-white/70 leading-relaxed">
                    To provide safe, affordable, and supportive housing for individuals in recovery,
                    empowering them with the resources, community, and structure needed to achieve
                    lasting sobriety and build fulfilling lives.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Card className="h-full border border-[#d4a574]/20 bg-black shadow-xl">
                <CardContent className="p-10">
                  <div className="w-14 h-14 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center mb-6">
                    <Eye className="h-7 w-7 text-[#d4a574]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Our Vision</h3>
                  <p className="text-white/70 leading-relaxed">
                    A community where every person in recovery has access to quality housing and
                    support services, breaking the cycle of addiction and creating pathways to
                    successful, independent living.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#d4a574] to-[#c49464]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {milestones.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
                <div className="text-4xl md:text-5xl font-light text-black mb-2">{stat.number}</div>
                <div className="text-black/70 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Our Values</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              What We <span className="font-semibold text-[#d4a574]">Stand For</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div key={value.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#d4a574]/20 bg-[#0d0d00] hover:border-[#d4a574]/50 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <value.icon className="h-8 w-8 text-[#d4a574]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                    <p className="text-white/60 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#0d0d00] border-t border-[#d4a574]/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
              Join Our <span className="font-semibold text-[#d4a574]">Community</span>
            </h2>
            <p className="text-white/70 text-xl mb-10 max-w-2xl mx-auto">
              Take the first step towards a new beginning. We're here to support you every step of the way.
            </p>
            <Link to={createPageUrl('Contact')}>
              <Button className="bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold px-8 py-6 text-lg rounded-full">
                Contact Us Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}