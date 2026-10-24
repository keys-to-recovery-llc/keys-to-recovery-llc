import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

// "Download the App" — installs the site as a PWA.
// Uses the browser's native install prompt when available; otherwise
// shows short per-platform instructions. Renders nothing when the app
// is already installed (launched in standalone mode).
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true);
      return undefined;
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    } else {
      setShowHelp((v) => !v);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 border border-[#d4a574]/60 text-[#d4a574] rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#d4a574] hover:text-black transition-colors"
      >
        <Download className="h-4 w-4" />
        Download the App
      </button>
      {showHelp && (
        <div className="mt-4 max-w-md rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 leading-relaxed">
          <div className="flex items-start justify-between gap-3">
            <p className="text-white font-medium">Install Keys to Recovery on your device</p>
            <button type="button" onClick={() => setShowHelp(false)} aria-label="Close install help" className="text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            <li><span className="text-[#d4a574]">Android (Chrome):</span> tap the ⋮ menu, then “Install app” or “Add to Home screen.”</li>
            <li><span className="text-[#d4a574]">iPhone / iPad (Safari):</span> tap Share, then “Add to Home Screen.”</li>
            <li><span className="text-[#d4a574]">Desktop (Chrome / Edge):</span> click the install icon at the right of the address bar.</li>
          </ul>
          <p className="mt-2 text-white/50">No app store needed — it installs in seconds and takes up almost no space.</p>
        </div>
      )}
    </div>
  );
}
