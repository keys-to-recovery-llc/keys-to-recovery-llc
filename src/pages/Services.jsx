import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Home, Users, Shield, Car, Briefcase,
  BookOpen, Coffee, Wifi, Tv, Utensils, ArrowRight, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServicesPage() {
  const housingFeatures = [
    { icon: Home, title: "Private & Shared Rooms", description: "Comfortable living spaces tailored to your needs" },
    { icon: Wifi, title: "WiFi & Utilities", description: "All utilities included in your stay" },
    { icon: Utensils, title: "Full Kitchen Access", description: "Prepare your own healthy meals" },
    { icon: Tv, title: "Common Areas", description: "Comfortable spaces for community connection" },
    { icon: Coffee, title: "Furnished Spaces", description: "Move-in ready accommodations" },
    { icon: Shield, title: "Safe Environment", description: "24/7 staff and security measures" }
  ];

  const supportServices = [
    {
      icon: Users,
      title: "Peer Support Groups",
      description: "Regular house meetings and group sessions to build community and share experiences.",
      features: ["Weekly house meetings", "Peer mentorship", "Community network access"]
    },
    {
      icon: Briefcase,
      title: "Employment Assistance",
      description: "Help finding and maintaining employment to support your independence.",
      features: ["Resume building", "Job search support", "Interview preparation"]
    },
    {
      icon: BookOpen,
      title: "Life Skills Training",
      description: "Practical skills for independent living and personal development.",
      features: ["Financial literacy", "Time management", "Healthy living habits"]
    },
    {
      icon: Car,
      title: "Transportation Support",
      description: "Assistance getting to work, meetings, and appointments.",
      features: ["Local transportation help", "Ride coordination", "Bus pass assistance"]
    }
  ];

  const programStructure = [
    { phase: "Phase 1", title: "Stabilization", duration: "Weeks 1–4", description: "Settle in, establish routines, and connect with resources." },
    { phase: "Phase 2", title: "Growth", duration: "Weeks 5–12", description: "Focus on employment, life skills, and building healthy habits." },
    { phase: "Phase 3", title: "Independence", duration: "Months 4+", description: "Prepare for transition to independent living with ongoing support." }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Our Services</span>
            <h1 className="text-4xl md:text-6xl font-light text-white mt-4 mb-6">
              Comprehensive <span className="font-semibold text-[#d4a574]">Support</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              More than just housing — we provide the tools, community, and support
              you need to build a successful life in recovery.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Housing Features */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Housing</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              Safe & <span className="font-semibold text-[#d4a574]">Comfortable Living</span>
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">
              Our recovery housing provides everything you need to focus on what matters most — your recovery.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {housingFeatures.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#d4a574]/20 bg-[#0d0d00] hover:border-[#d4a574]/50 transition-all duration-300">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#d4a574]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-[#d4a574]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-white/60 text-sm">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section className="py-24 px-6 bg-[#0d0d00]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Support Services</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              Beyond <span className="font-semibold text-[#d4a574]">Housing</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {supportServices.map((service, index) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#d4a574]/20 bg-black hover:border-[#d4a574]/50 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <service.icon className="h-7 w-7 text-[#d4a574]" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                        <p className="text-white/60 mt-2">{service.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-white/70">
                          <CheckCircle className="h-4 w-4 text-[#d4a574] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section className="py-24 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Program Structure</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              Your Path to <span className="font-semibold text-[#d4a574]">Independence</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {programStructure.map((phase, index) => (
              <motion.div key={phase.phase} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }} className="relative">
                <Card className="h-full border border-[#d4a574]/20 bg-black">
                  <CardContent className="p-8">
                    <div className="inline-flex items-center gap-2 bg-[#d4a574] px-3 py-1 rounded-full mb-4">
                      <span className="text-black text-sm font-bold">{phase.phase}</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-2">{phase.title}</h3>
                    <p className="text-[#d4a574] text-sm font-medium mb-4">{phase.duration}</p>
                    <p className="text-white/60 leading-relaxed">{phase.description}</p>
                  </CardContent>
                </Card>
                {index < programStructure.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-[#d4a574]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* House Rules */}
      <section className="py-24 px-6 bg-[#0d0d00]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Expectations</span>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-4">
              House <span className="font-semibold text-[#d4a574]">Guidelines</span>
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">
              Our guidelines create a safe, supportive environment for everyone in the house.
            </p>
          </motion.div>

          <Card className="border border-[#d4a574]/20 bg-black shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "Maintain sobriety at all times",
                  "90 meetings in 90 days",
                  "Attend weekly house meetings",
                  "Participate in chores and upkeep",
                  "Respect curfew guidelines",
                  "No violence or threatening behavior",
                  "Random drug testing compliance",
                  "Pay rent on time",
                  "Treat others with respect"
                ].map((rule, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#d4a574]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-[#d4a574]" />
                    </div>
                    <span className="text-white/80">{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#d4a574] to-[#c49464]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-light text-black mb-6">
              Ready to Get <span className="font-semibold">Started?</span>
            </h2>
            <p className="text-black/70 text-xl mb-10 max-w-2xl mx-auto">
              Contact us today to learn about availability and how to apply for our recovery housing program.
            </p>
            <Link to={createPageUrl('Apply')}>
              <Button className="bg-black hover:bg-[#111] text-[#d4a574] font-semibold px-8 py-6 text-lg rounded-full">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}