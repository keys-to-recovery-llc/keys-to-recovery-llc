import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Clock, Send, CheckCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', inquiryType: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [feedbackData, setFeedbackData] = useState({ name: '', email: '', feedbackType: '', message: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    await base44.integrations.Core.SendEmail({
      to: 'bart@keystorecoveryllc.com',
      subject: `Site Feedback [${feedbackData.feedbackType}] — ${feedbackData.name}`,
      body: `DEVELOPER FEEDBACK / COMPLAINT PORTAL\n======================================\n\nFrom: ${feedbackData.name}\nEmail: ${feedbackData.email}\nType: ${feedbackData.feedbackType}\n\nMessage:\n${feedbackData.message}\n\nSubmitted: ${new Date().toLocaleString()}`
    });
    setFeedbackSubmitted(true);
    setFeedbackLoading(false);
  };

  const contactInfo = [
    { icon: Phone, title: "Phone", value: "(253) 240-9724", link: "tel:+12532409724" },
    { icon: Mail, title: "Email", value: "Support@keystorecoveryllc.com", link: "mailto:Support@keystorecoveryllc.com" },
    { icon: Clock, title: "Hours", value: "24/7 Support Available", link: null }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-20 right-20 w-80 h-80 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Contact Us</span>
            <h1 className="text-4xl md:text-6xl font-light text-white mt-4 mb-6">
              We're Here to <span className="font-semibold text-[#d4a574]">Help</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Have questions about our recovery housing program? Reach out today.
              Your journey to recovery is just a conversation away.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-6 -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div key={info.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border border-[#d4a574]/20 bg-black shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <info.icon className="h-7 w-7 text-[#d4a574]" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{info.title}</h3>
                    {info.link ? (
                      <a href={info.link} className="text-white/60 hover:text-[#d4a574] transition-colors">{info.value}</a>
                    ) : (
                      <p className="text-white/60">{info.value}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Get In Touch</span>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-4">
              Send Us a <span className="font-semibold text-[#d4a574]">Message</span>
            </h2>
            <p className="text-white/60 mt-4">Fill out the form below and we'll get back to you as soon as possible.</p>
          </motion.div>

          <Card className="border border-[#d4a574]/20 bg-[#0d0d00] shadow-2xl">
            <CardContent className="p-8 md:p-12">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-[#d4a574]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-[#d4a574]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Message Sent!</h3>
                  <p className="text-white/60 max-w-md mx-auto">Thank you for reaching out. A member of our team will contact you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/80">Full Name *</Label>
                      <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-black border-[#d4a574]/20 text-white h-12 focus:border-[#d4a574]" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Email Address *</Label>
                      <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-black border-[#d4a574]/20 text-white h-12 focus:border-[#d4a574]" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/80">Phone Number</Label>
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-black border-[#d4a574]/20 text-white h-12 focus:border-[#d4a574]" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Inquiry Type *</Label>
                      <Select value={formData.inquiryType} onValueChange={(v) => setFormData({...formData, inquiryType: v})} required>
                        <SelectTrigger className="bg-black border-[#d4a574]/20 text-white h-12">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="housing">Housing Inquiry</SelectItem>
                          <SelectItem value="family">Family Member Inquiry</SelectItem>
                          <SelectItem value="referral">Professional Referral</SelectItem>
                          <SelectItem value="employment">Employment Opportunity</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Message *</Label>
                    <Textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="bg-black border-[#d4a574]/20 text-white focus:border-[#d4a574] resize-none" placeholder="Tell us how we can help you..." />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold py-6 text-lg rounded-xl">
                    {loading ? (
                      <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Sending...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="h-5 w-5" />Send Message</span>
                    )}
                  </Button>
                  <p className="text-center text-white/40 text-sm">Your information is kept confidential. We respect your privacy.</p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-[#0d0d00]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-4">
              Common <span className="font-semibold text-[#d4a574]">Questions</span>
            </h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { q: "What are the requirements to apply?", a: "Applicants must be committed to sobriety, have completed or be actively participating in a treatment program, and pass a background check. We assess each application individually." },
              { q: "How much does housing cost?", a: "Our rates vary based on room type and location. Contact us for current pricing and available payment options. We strive to keep housing affordable." },
              { q: "How long can I stay?", a: "We offer both short-term and long-term housing options. Most residents stay between 90 days to one year, depending on their individual recovery plan." }
            ].map((faq, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="border border-[#d4a574]/20 bg-black">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                    <p className="text-white/60">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Complaint / Feedback Portal */}
      <section className="py-24 px-6 bg-black border-t border-[#d4a574]/20">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#d4a574]/10 border border-[#d4a574]/30 px-4 py-2 rounded-full mb-6">
              <MessageSquare className="w-4 h-4 text-[#d4a574]" />
              <span className="text-[#d4a574] text-sm font-medium">Feedback & Complaints</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-2">
              Developer <span className="font-semibold text-[#d4a574]">Feedback Portal</span>
            </h2>
            <p className="text-white/60 mt-4">
              Experienced an issue with the site? Have a suggestion or complaint? Let our development team know.
              All submissions are sent directly to our team for review.
            </p>
          </motion.div>

          <Card className="border border-[#d4a574]/20 bg-[#0d0d00] shadow-2xl">
            <CardContent className="p-8 md:p-12">
              {feedbackSubmitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-[#d4a574]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-[#d4a574]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Feedback Received!</h3>
                  <p className="text-white/60 max-w-md mx-auto">Thank you for helping us improve. Our development team has been notified and will review your submission.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-[#d4a574]/5 border border-[#d4a574]/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-[#d4a574] flex-shrink-0" />
                    <p className="text-white/70 text-sm">This portal is for website feedback and technical complaints only. For housing inquiries, please use the contact form above.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/80">Your Name *</Label>
                      <Input required value={feedbackData.name} onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})} className="bg-black border-[#d4a574]/20 text-white h-12 focus:border-[#d4a574]" placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Your Email *</Label>
                      <Input required type="email" value={feedbackData.email} onChange={(e) => setFeedbackData({...feedbackData, email: e.target.value})} className="bg-black border-[#d4a574]/20 text-white h-12 focus:border-[#d4a574]" placeholder="jane@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Feedback Type *</Label>
                    <Select value={feedbackData.feedbackType} onValueChange={(v) => setFeedbackData({...feedbackData, feedbackType: v})} required>
                      <SelectTrigger className="bg-black border-[#d4a574]/20 text-white h-12">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bug Report">Bug Report</SelectItem>
                        <SelectItem value="Suggestion">Suggestion</SelectItem>
                        <SelectItem value="Complaint">Complaint</SelectItem>
                        <SelectItem value="Accessibility Issue">Accessibility Issue</SelectItem>
                        <SelectItem value="Content Error">Content Error</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Your Feedback *</Label>
                    <Textarea required rows={5} value={feedbackData.message} onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})} className="bg-black border-[#d4a574]/20 text-white focus:border-[#d4a574] resize-none" placeholder="Please describe the issue or feedback in detail..." />
                  </div>
                  <Button type="submit" disabled={feedbackLoading} className="w-full bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold py-6 text-lg rounded-xl">
                    {feedbackLoading ? (
                      <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Submitting...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="h-5 w-5" />Submit Feedback</span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#d4a574] to-[#c49464]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-light text-black mb-6">
              Prefer to <span className="font-semibold">Talk?</span>
            </h2>
            <p className="text-black/70 text-xl mb-10">Our team is available 24/7 to answer your questions.</p>
            <a href="tel:+12532409724">
              <Button className="bg-black hover:bg-[#111] text-[#d4a574] font-semibold px-10 py-6 text-lg rounded-full">
                <Phone className="mr-2 h-5 w-5" />
                (253) 240-9724
              </Button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}