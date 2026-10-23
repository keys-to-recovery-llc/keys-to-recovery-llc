import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Heart, Shield, Users, Home, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const services = [
    {
      icon: Home,
      title: "Safe Housing",
      description: "Clean, comfortable, and secure living environments designed to support your recovery journey."
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join a supportive community of individuals committed to maintaining sobriety and personal growth."
    },
    {
      icon: Shield,
      title: "Structured Living",
      description: "Structured programs and house rules that promote accountability and healthy habits."
    },
    {
      icon: Heart,
      title: "Compassionate Care",
      description: "Dedicated staff who understand the recovery process and are here to help you succeed."
    }
  ];

  const features = [
    "Planned 24/7 Staff Support",
    "Drug-Free Environment",
    "Transportation Coordination",
    "Employment Assistance",
    "Life Skills Training",
    "Peer Support Groups"
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a1a] to-black" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/logo-full.png"
            alt=""
            className="w-[80%] max-w-3xl object-contain opacity-[0.06] select-none"
          />
        </div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#d4a574] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
              <div className="w-2 h-2 bg-[#d4a574] rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium tracking-wide">Recovery Housing in Your Community</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
              Your Path to
              <span className="block font-semibold text-[#d4a574]">Lasting Recovery</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-10 leading-relaxed max-w-2xl">
              Keys to Recovery LLC is a newly formed, mission-driven organization working toward opening safe, structured recovery housing in our community. We are in our pre-launch phase — building the foundation to make this a reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl('Contact')}>
                <Button className="bg-[#d4a574] hover:bg-[#c49464] text-[#1e3a5f] font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-[#d4a574]/20">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to={createPageUrl('About')}>
                <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Mission Statement */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Our Mission</span>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-4 mb-6 leading-relaxed">
              Empowering individuals in recovery with the foundation they need to 
              <span className="font-semibold text-[#d4a574]"> rebuild their lives</span>
            </h2>
            <div className="w-24 h-1 bg-[#d4a574] mx-auto rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#4a7c59] font-medium tracking-widest text-sm uppercase">What We Offer</span>
            <h2 className="text-3xl md:text-5xl font-light text-[#1e3a5f] mt-4">
              Comprehensive <span className="font-semibold">Support</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border border-[#d4a574]/20 bg-black shadow-lg hover:shadow-xl hover:shadow-[#d4a574]/20 transition-all duration-500 group">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-[#d4a574]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#d4a574] transition-colors duration-300">
                      <service.icon className="h-7 w-7 text-[#d4a574] group-hover:text-black transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                    <p className="text-white/70 leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gradient-to-br from-black to-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Why Choose Us</span>
              <h2 className="text-3xl md:text-5xl font-light text-white mt-4 mb-6">
                Everything You Need to <span className="font-semibold text-[#d4a574]">Succeed</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                We are building a program structure grounded in real recovery principles — designed to support residents from day one through long-term independence. Every service listed reflects our planned operational model.
              </p>
              <Link to={createPageUrl('Services')}>
                <Button className="bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold px-8 py-6 rounded-full">
                  Explore Our Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <div 
                  key={feature}
                  className="flex items-center gap-3 bg-[#d4a574]/10 backdrop-blur-sm p-4 rounded-xl border border-[#d4a574]/20"
                >
                  <CheckCircle className="h-5 w-5 text-[#d4a574] flex-shrink-0" />
                  <span className="text-white font-medium">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Statement Banner */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-[#d4a574]/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="h-8 w-8 text-[#d4a574]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-black leading-relaxed mb-8">
              Keys to Recovery LLC is a <span className="font-semibold text-[#d4a574]">newly established, mission-driven organization</span> committed to building safe, structured recovery housing in our community. We are currently in our pre-launch phase — actively seeking properties, partners, and the support needed to open our doors.
            </h2>
            <p className="text-gray-500 text-lg">Honest. Transparent. Purpose-built for recovery.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-black border-t border-[#d4a574]/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
              Ready to Take the <span className="font-semibold text-[#d4a574]">First Step?</span>
            </h2>
            <p className="text-white/70 text-xl mb-10 max-w-2xl mx-auto">
              Contact us today to learn more about our recovery housing program and how we can support your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+12532409724">
                <Button className="bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold px-8 py-6 text-lg rounded-full">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                </Button>
              </a>
              <Link to={createPageUrl('Contact')}>
                <Button variant="outline" className="border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574]/10 px-8 py-6 text-lg rounded-full">
                  <Mail className="mr-2 h-5 w-5" />
                  Send Message
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}