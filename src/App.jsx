import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkerUI from './components/WorkerUI';
import AdminUI from './components/AdminUI';
import { translations } from './translations/i18n';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('fs_lang') || 'en');
  const [currentView, setCurrentView] = useState('worker'); // 'worker' | 'admin'
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('fs_contrast') === 'true');
  const [globalNotice, setGlobalNotice] = useState(null);

  // Sync language with localStorage & html tag
  useEffect(() => {
    localStorage.setItem('fs_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync contrast mode
  useEffect(() => {
    localStorage.setItem('fs_contrast', highContrast.toString());
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const t = translations[lang] || translations.en;

  // Handle Demo Reset
  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setGlobalNotice({
          type: 'success',
          text: lang === 'hi' ? 'डेमो डेटा सफलतापूर्वक रीसेट किया गया!' : 'Fresh demo sample data reseeded successfully!'
        });
        setTimeout(() => setGlobalNotice(null), 4000);
      }
    } catch (err) {
      console.error('Reset failed', err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      highContrast ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Accessible Header */}
      <Header
        lang={lang}
        setLang={setLang}
        t={t}
        currentView={currentView}
        setCurrentView={setCurrentView}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        onResetDemo={handleResetDemo}
      />

      {/* Global Notification Alert */}
      {globalNotice && (
        <div className={`w-full py-2.5 px-4 text-center text-sm font-bold border-b transition-all ${
          highContrast ? 'bg-yellow-400 text-black border-white' : 'bg-amber-500 text-slate-950 border-amber-600'
        }`}>
          {globalNotice.text}
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full pb-16">
        {currentView === 'worker' ? (
          <WorkerUI
            lang={lang}
            t={t}
            highContrast={highContrast}
            onCheckinChange={() => {}}
          />
        ) : (
          <AdminUI
            t={t}
            highContrast={highContrast}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Accessible Footer */}
      <footer className={`w-full py-4 px-4 text-center text-xs border-t ${
        highContrast ? 'bg-black text-yellow-300 border-yellow-400 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>FairShift</strong> • Hackathon Frontline Worker Platform (Bilingual & High-Contrast)
          </div>
          <div className="flex items-center gap-3">
            <span>WCAG AAA Accessible</span>
            <span>•</span>
            <span>Google Cloud Run Ready (Port 8080)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
