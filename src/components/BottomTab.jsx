import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Layers, FileText } from 'lucide-react';

const scrollPositions = {};

const tabs = [
  { name: 'Home', page: 'Home', icon: Home },
  { name: 'Services', page: 'Services', icon: Layers },
  { name: 'Apply', page: 'Apply', icon: FileText },
];

export default function BottomTab() {
  const location = useLocation();
  const currentKey = location.pathname;

  const handleTabClick = () => {
    scrollPositions[currentKey] = window.scrollY;
  };

  const isActive = (page) => {
    const current = location.pathname.split('/').pop() || 'Home';
    return current.toLowerCase() === page.toLowerCase();
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#d4a574]/20 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ name, page, icon: Icon }) => (
        <Link
          key={page}
          to={createPageUrl(page)}
          onClick={handleTabClick}
          replace={isActive(page)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors select-none ${
            isActive(page) ? 'text-[#d4a574]' : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{name}</span>
        </Link>
      ))}
    </nav>
  );
}