import React from 'react';

export default function Header({
  lang,
  setLang,
  t,
  currentView,
  setCurrentView,
  highContrast,
  setHighContrast,
  onResetDemo
}) {
  return (
    <header className={`w-full border-b transition-colors duration-200 ${
      highContrast 
        ? 'bg-black text-white border-yellow-400' 
        : 'bg-slate-900 text-white border-slate-800'
    }`}>
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl shadow-md ${
            highContrast ? 'bg-yellow-400 text-black border-2 border-white' : 'bg-amber-400 text-slate-950'
          }`}>
            FS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5">
                FairShift
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  highContrast ? 'bg-yellow-400 text-black' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                }`}>
                  Hackathon
                </span>
              </h1>
            </div>
            <p className={`text-xs hidden sm:block ${highContrast ? 'text-yellow-300 font-semibold' : 'text-slate-400'}`}>
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Accessibility & Inclusivity Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Language Toggle (English / Hindi) */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md border transition-all flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400 focus:outline-none ${
              highContrast
                ? 'bg-yellow-400 text-black border-white hover:bg-yellow-300 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
            }`}
            title="Toggle Language / भाषा बदलें"
            aria-label="Toggle between English and Hindi"
          >
            <span className="text-base">🌐</span>
            <span>{t.langToggle}</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md border transition-all flex items-center gap-1.5 focus:ring-2 focus:ring-yellow-400 focus:outline-none ${
              highContrast
                ? 'bg-white text-black border-2 border-yellow-400 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-400/50'
            }`}
            title="Toggle WCAG AAA High-Contrast Mode"
            aria-label="Toggle High-Contrast Accessibility Mode"
          >
            <span>{highContrast ? '⚡' : '👁️'}</span>
            <span className="hidden md:inline">{highContrast ? t.highContrastOn : t.highContrastOff}</span>
            <span className="md:hidden">{highContrast ? 'AAA ON' : 'Contrast'}</span>
          </button>

          {/* Demo Seed Data Reset */}
          <button
            type="button"
            onClick={onResetDemo}
            className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
              highContrast
                ? 'bg-black text-yellow-300 border-yellow-400 hover:bg-neutral-900 font-bold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Reset to fresh demo sample data"
          >
            🔄 {t.btnSeedData}
          </button>
        </div>
      </div>

      {/* Persona Switcher Navigation Bar */}
      <div className={`w-full px-4 sm:px-6 py-2 border-t ${
        highContrast ? 'bg-neutral-950 border-yellow-500' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-2" role="tablist" aria-label="Persona Navigation">
            <button
              role="tab"
              aria-selected={currentView === 'worker'}
              onClick={() => setCurrentView('worker')}
              className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${
                currentView === 'worker'
                  ? highContrast
                    ? 'bg-yellow-400 text-black border-2 border-white shadow-lg scale-105'
                    : 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : highContrast
                    ? 'text-yellow-300 hover:bg-neutral-900 border border-yellow-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>👷</span>
              <span>{t.navWorker}</span>
            </button>

            <button
              role="tab"
              aria-selected={currentView === 'admin'}
              onClick={() => setCurrentView('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${
                currentView === 'admin'
                  ? highContrast
                    ? 'bg-yellow-400 text-black border-2 border-white shadow-lg scale-105'
                    : 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : highContrast
                    ? 'text-yellow-300 hover:bg-neutral-900 border border-yellow-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📊</span>
              <span>{t.navAdmin}</span>
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className={`text-xs font-semibold ${highContrast ? 'text-yellow-300' : 'text-slate-400'}`}>
              Google Cloud Run Ready
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
