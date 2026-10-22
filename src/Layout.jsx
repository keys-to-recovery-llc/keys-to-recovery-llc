import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeProvider from '@/components/ThemeProvider';
import BottomTab from '@/components/BottomTab';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X, Phone, Mail, Facebook, Instagram, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const location = useLocation();
  const queryClient = useQueryClient();

  const PULL_THRESHOLD = 70;

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (touchStartY.current === 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullY(Math.min(delta, PULL_THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= PULL_THRESHOLD) {
      setRefreshing(true);
      await queryClient.refetchQueries();
      setTimeout(() => { setRefreshing(false); setPullY(0); setPulling(false); }, 600);
    } else {
      setPullY(0);
      setPulling(false);
    }
    touchStartY.current = 0;
  }, [pullY, queryClient]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', page: 'Home' },
    { name: 'About', page: 'About' },
    { name: 'Services', page: 'Services' },
    { name: 'Apply', page: 'Apply' },
    { name: 'Donate', page: 'Donate' },
    { name: 'Investors', page: 'Investors' },
    { name: 'Contact', page: 'Contact' },
    { name: 'Resources', page: 'Resources' }
  ];

  const isActive = (page) => {
    const currentPage = location.pathname.split('/').pop() || 'Home';
    return currentPage.toLowerCase() === page.toLowerCase();
  };

  const isRoot = location.pathname === '/';

  return (
    <>
    <ThemeProvider />
    <div className="min-h-screen flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Top Bar */}
      <div className="bg-black text-[#d4a574] py-2 px-4 text-sm hidden md:block border-b border-[#d4a574]/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="tel:+12532409724" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
              (253) 240-9724
            </a>
            <a href="mailto:Support@keystorecoveryllc.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
              Support@keystorecoveryllc.com
            </a>
          </div>
          <div className="flex items-center gap-4">
              <span className="text-[#d4a574]/70">Follow Us:</span>
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
          </div>
          </div>

          {/* Navigation */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black shadow-lg shadow-[#d4a574]/10' : 'bg-black/95 backdrop-blur-sm'
        } border-b border-[#d4a574]/20`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center">
              <img 
                src="/logo-full.png" 
                alt="Keys to Recovery LLC" 
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(link.page)
                      ? 'text-[#d4a574] bg-[#d4a574]/10'
                      : 'text-white/80 hover:text-[#d4a574] hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to={createPageUrl('Apply')}>
                <Button className="ml-2 bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold rounded-full px-6">
                  Apply Now
                </Button>
              </Link>
            </nav>

            {/* Mobile Back Button */}
            {!isRoot && (
              <button
                onClick={() => window.history.back()}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors mr-auto"
              >
                <ChevronLeft className="h-6 w-6 text-[#d4a574]" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-[#d4a574]" />
              ) : (
                <Menu className="h-6 w-6 text-[#d4a574]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black border-t border-[#d4a574]/20"
            >
              <nav className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(link.page)
                        ? 'text-[#d4a574] bg-[#d4a574]/10'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link to={createPageUrl('Apply')} className="block pt-2">
                  <Button className="w-full bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold rounded-full">
                    Apply Now
                  </Button>
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 pb-[calc(env(safe-area-inset-bottom)+56px)] md:pb-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull to Refresh Indicator */}
        {(pulling || refreshing) && (
          <div
            className="flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{ height: pullY }}
          >
            <div className={`w-7 h-7 rounded-full border-2 border-[#d4a574] border-t-transparent ${refreshing ? 'animate-spin' : ''} transition-transform`}
              style={{ transform: refreshing ? undefined : `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)` }}
            />
          </div>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomTab />

      {/* Footer */}
      <footer className="bg-black text-white border-t border-[#d4a574]/20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <img 
                src="/logo-full.png" 
                alt="Keys to Recovery LLC" 
                className="h-16 w-auto mb-6"
              />
              <p className="text-white/70 leading-relaxed max-w-md mb-6">
                Providing safe, supportive housing for individuals committed to their recovery journey. 
                Your new beginning starts here.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-[#d4a574]/10 rounded-full flex items-center justify-center hover:bg-[#d4a574] hover:text-black transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-[#d4a574]/10 rounded-full flex items-center justify-center hover:bg-[#d4a574] hover:text-black transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.page}>
                    <Link 
                      to={createPageUrl(link.page)}
                      className="text-white/70 hover:text-[#d4a574] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#d4a574]" />
                  <a href="tel:+12532409724" className="text-white/70 hover:text-[#d4a574] transition-colors">
                    (253) 240-9724
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#d4a574]" />
                  <a href="mailto:Support@keystorecoveryllc.com" className="text-white/70 hover:text-[#d4a574] transition-colors text-sm">
                    Support@keystorecoveryllc.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-[#d4a574]/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} Keys to Recovery LLC. All rights reserved.
            </p>
            <div className="flex flex-col items-end gap-1">
              <p className="text-[#d4a574]/70 text-sm font-medium">EST 2026 | NAICS Code: 531110</p>
              
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}