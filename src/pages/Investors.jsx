import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, Users, Shield, Calendar, CheckCircle, ArrowRight, Send, Loader2, DollarSign, Award, Target, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MobileSelect from '@/components/MobileSelect';
import { post } from '@/api/client';

const investorTypes = [
  {
    icon: Building2,
    title: "Private Money Investors (PMI)",
    description: "You've built capital and you want it working harder — in assets that matter. As a Private Money Investor, you deploy equity directly into recovery housing properties that generate stable, recurring rental income. You're not just earning a return; you're financing a solution to one of the most persistent crises in our communities.",
    benefits: ["Steady rental income", "Low vacancy risk", "Community impact ROI"]
  },
  {
    icon: DollarSign,
    title: "Private Money Lenders (PML)",
    description: "You prefer the security of a note over equity exposure. As a Private Money Lender, you provide short or long-term capital for property acquisition backed by real estate collateral. You set the rate, define the terms, and receive repayment on a structured schedule — while we do the operational heavy lifting.",
    benefits: ["Secured by real estate", "Competitive interest rates", "Flexible terms available"]
  },
  {
    icon: Award,
    title: "Private Money Partners (PMP)",
    description: "You want more than a loan — you want a seat at the table. As a Private Money Partner, you participate in the equity upside of each property, sharing in cash flow, appreciation, and the long-term growth of Keys to Recovery LLC. Active or passive, your role is defined by what works best for you.",
    benefits: ["Equity participation", "Shared appreciation", "Active or passive roles"]
  },
  {
    icon: Handshake,
    title: "Mission-Based Investors",
    description: "Your capital has always been about more than returns. As a Mission-Based Investor, you align your portfolio with measurable social outcomes — reducing recidivism, expanding access to sober housing, and supporting long-term recovery. ESG-aligned, impact-driven, and financially sound.",
    benefits: ["ESG-aligned investment", "Measurable social impact", "Tax advantage opportunities"]
  },
  {
    icon: Target,
    title: "Mission-Based Lenders (MBL)",
    description: "You believe capital deployed for good should still be capital protected. As a Mission-Based Lender, you provide financing with a conscience — offering competitive lending terms to mission-driven operators like Keys to Recovery LLC, ensuring access to credit while anchoring your portfolio in purposeful, community-centered real estate.",
    benefits: ["Purposeful capital deployment", "Secured lending with impact", "Community reinvestment credit"]
  }
];

const whyInvest = [
  { icon: Shield, title: "Low-Risk Demand", description: "Recovery housing demand consistently outpaces supply — occupancy rates remain high across all economic cycles." },
  { icon: TrendingUp, title: "Scalable Model", description: "Our proven operational model is designed for rapid replication across additional properties and markets." },
  { icon: Users, title: "Community Need", description: "Every property added directly increases placement capacity for individuals seeking recovery housing." },
  { icon: Target, title: "Mission Alignment", description: "Join a venture where financial returns and social impact reinforce each other — not compete." },
];

export default function InvestorsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    investorType: '',
    capitalRange: '',
    message: '',
    preferredDate: '',
    preferredTime: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const emailBody = `
NEW INVESTOR INQUIRY — SCHEDULE A MEETING
==========================================

CONTACT INFORMATION
-------------------
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Company / Organization: ${formData.company || 'N/A'}

INVESTMENT PROFILE
------------------
Investor Type: ${formData.investorType}
Capital Range: ${formData.capitalRange}

PREFERRED MEETING TIME
-----------------------
Date: ${formData.preferredDate}
Time: ${formData.preferredTime}

MESSAGE / NOTES
---------------
${formData.message}

==========================================
Submitted: ${new Date().toLocaleString()}
      `.trim();

      await post('/api/investors', {
        fields: formData,
        to: 'Support@keystorecoveryllc.com',
        subject: `Investor Inquiry: ${formData.fullName} — ${formData.investorType}`,
        body: emailBody
      });

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again or call us at (253) 240-9724.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-96 h-96 bg-[#f5c518] rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#f5c518] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 px-4 py-2 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-[#f5c518]" />
              <span className="text-[#f5c518] text-sm font-medium">Investor Relations</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
              Invest in <span className="font-bold text-[#f5c518]">Purpose-Driven</span><br />Real Estate
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-10">
              Keys to Recovery LLC is actively seeking capital partners to acquire additional properties and 
              expand recovery housing capacity across our region. Your investment creates homes — and second chances.
            </p>
            <a href="#schedule">
              <Button className="bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold px-10 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-[#f5c518]/30">
                Schedule a Meeting with the Founder
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#f5c518] font-medium tracking-widest text-sm uppercase">The Opportunity</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              Why Invest in <span className="font-bold text-[#f5c518]">Recovery Housing</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyInvest.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#f5c518]/20 bg-[#0d0d00] hover:border-[#f5c518]/50 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-[#f5c518]/10 rounded-2xl flex items-center justify-center mb-5">
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

      {/* Investor Types */}
      <section className="py-24 px-6 bg-[#0d0d00]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[#f5c518] font-medium tracking-widest text-sm uppercase">Partner Types</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-4">
              How We Can <span className="font-bold text-[#f5c518]">Work Together</span>
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">
              Whether you're a private lender, equity investor, or mission-driven fund — there's a structure that fits your goals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {investorTypes.map((type, index) => (
              <motion.div key={type.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#f5c518]/20 bg-black hover:border-[#f5c518]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#f5c518]/10">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5 mb-5">
                      <div className="w-14 h-14 bg-[#f5c518]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <type.icon className="h-7 w-7 text-[#f5c518]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">{type.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {type.benefits.map(b => (
                        <span key={b} className="flex items-center gap-1.5 bg-[#f5c518]/10 text-[#f5c518] text-xs font-medium px-3 py-1.5 rounded-full border border-[#f5c518]/20">
                          <CheckCircle className="h-3 w-3" />
                          {b}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#f5c518] to-[#e6b800]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            {[
              { number: "93%", label: "Industry Avg. Occupancy Rate" },
              { number: "24/7", label: "Planned Staff Support Model" },
              { number: "EST 2026", label: "Mission-Driven LLC" }
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-4xl md:text-5xl font-bold text-black mb-1">{stat.number}</div>
                <div className="text-black/70 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Form */}
      <section id="schedule" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[#f5c518] font-medium tracking-widest text-sm uppercase">Connect</span>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-4">
              Schedule a Meeting with the <span className="font-bold text-[#f5c518]">Founder</span>
            </h2>
            <p className="text-white/60 mt-4">
              Ready to explore a partnership? Fill out the form below and our founder will reach out within 24 hours to confirm your appointment.
            </p>
          </motion.div>

          <Card className="border border-[#f5c518]/20 bg-[#0d0d00] shadow-2xl">
            <CardContent className="p-8 md:p-12">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-[#f5c518]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-[#f5c518]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Meeting Request Received!</h3>
                  <p className="text-white/60 max-w-md mx-auto">
                    Thank you for your interest in partnering with Keys to Recovery LLC. Our founder will contact you within 24 hours to confirm your appointment.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Contact Info */}
                  <div className="space-y-5">
                    <h3 className="text-white font-semibold text-lg border-b border-[#f5c518]/20 pb-3">Your Information</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/80">Full Name *</Label>
                        <Input required value={formData.fullName} onChange={e => update('fullName', e.target.value)} placeholder="John Smith" className="bg-black border-[#f5c518]/20 text-white h-12 focus:border-[#f5c518]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Email Address *</Label>
                        <Input required type="email" value={formData.email} onChange={e => update('email', e.target.value)} placeholder="john@company.com" className="bg-black border-[#f5c518]/20 text-white h-12 focus:border-[#f5c518]" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/80">Phone Number *</Label>
                        <Input required type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)} placeholder="(253) 555-0000" className="bg-black border-[#f5c518]/20 text-white h-12 focus:border-[#f5c518]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Company / Organization</Label>
                        <Input value={formData.company} onChange={e => update('company', e.target.value)} placeholder="Your firm or fund name" className="bg-black border-[#f5c518]/20 text-white h-12 focus:border-[#f5c518]" />
                      </div>
                    </div>
                  </div>

                  {/* Investment Profile */}
                  <div className="space-y-5">
                    <h3 className="text-white font-semibold text-lg border-b border-[#f5c518]/20 pb-3">Investment Profile</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/80">Investor Type *</Label>
                        <MobileSelect value={formData.investorType} onValueChange={v => update('investorType', v)} placeholder="Select type" triggerClassName="bg-black border-[#f5c518]/20 text-white h-12" required>
                            <SelectItem value="PMI - Private Money Investor">PMI — Private Money Investor</SelectItem>
                            <SelectItem value="PML - Private Money Lender">PML — Private Money Lender</SelectItem>
                            <SelectItem value="PMP - Private Money Partner">PMP — Private Money Partner</SelectItem>
                            <SelectItem value="Mission-Based Investor">Mission-Based Investor</SelectItem>
                            <SelectItem value="Mission-Based Lender">Mission-Based Lender (MBL)</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </MobileSelect>
                        </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Capital Range *</Label>
                        <MobileSelect value={formData.capitalRange} onValueChange={v => update('capitalRange', v)} placeholder="Select range" triggerClassName="bg-black border-[#f5c518]/20 text-white h-12" required>
                            <SelectItem value="Under $25,000">Under $25,000</SelectItem>
                            <SelectItem value="$25,000 - $50,000">$25,000 – $50,000</SelectItem>
                            <SelectItem value="$50,000 - $100,000">$50,000 – $100,000</SelectItem>
                            <SelectItem value="$100,000 - $250,000">$100,000 – $250,000</SelectItem>
                            <SelectItem value="$250,000+">$250,000+</SelectItem>
                          </MobileSelect>
                        </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-5">
                    <h3 className="text-white font-semibold text-lg border-b border-[#f5c518]/20 pb-3">Preferred Meeting Time</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/80">Preferred Date *</Label>
                        <Input required type="date" value={formData.preferredDate} onChange={e => update('preferredDate', e.target.value)} className="bg-black border-[#f5c518]/20 text-white h-12 focus:border-[#f5c518]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Preferred Time *</Label>
                        <MobileSelect value={formData.preferredTime} onValueChange={v => update('preferredTime', v)} placeholder="Select time" triggerClassName="bg-black border-[#f5c518]/20 text-white h-12" required>
                            <SelectItem value="Morning (9am - 12pm)">Morning (9am – 12pm)</SelectItem>
                            <SelectItem value="Afternoon (12pm - 3pm)">Afternoon (12pm – 3pm)</SelectItem>
                            <SelectItem value="Late Afternoon (3pm - 5pm)">Late Afternoon (3pm – 5pm)</SelectItem>
                            <SelectItem value="Evening (5pm - 7pm)">Evening (5pm – 7pm)</SelectItem>
                          </MobileSelect>
                        </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Message / Notes</Label>
                    <Textarea value={formData.message} onChange={e => update('message', e.target.value)} rows={4} placeholder="Tell us about your investment goals and any questions you have..." className="bg-black border-[#f5c518]/20 text-white focus:border-[#f5c518] resize-none" />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold py-6 text-lg rounded-xl transition-all duration-300">
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Sending Request...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Calendar className="h-5 w-5" />Schedule Meeting with Founder</span>
                    )}
                  </Button>

                  <p className="text-center text-white/40 text-sm">
                    Your inquiry is confidential. We will never share your information.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}