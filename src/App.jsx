import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Settings as SettingsIcon, Globe, Navigation } from 'lucide-react';
import translations from './translations';
import SettingsTab, { loadSettings, saveSettings } from './components/Settings';
import TrackerTab from './components/Tracker';
import HireCheckTab from './components/HireCheck';
import TripCostTab from './components/TripCost';

const LANG_KEY = 'rideprofit_lang_v1';

function App() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'si'; // Default to Sinhala for Sri Lankan drivers
    } catch {
      return 'si';
    }
  });

  const [activeTab, setActiveTab] = useState('tracker');
  const [settings, setSettings] = useState(loadSettings);

  const t = translations[lang] || translations.en;

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === 'en' ? 'si' : 'en'));

  const tabs = [
    { id: 'tracker', label: t.tabTracker, icon: TrendingUp },
    { id: 'hireCheck', label: t.tabHireCheck, icon: Zap },
    { id: 'tripCost', label: t.tabTripCost, icon: Navigation },
    { id: 'settings', label: t.tabSettings, icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-slate-900/60 selection:bg-emerald-500 selection:text-white">
      {/* Sleek Dark Header */}
      <header className="h-16 fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-lg">
            🚖
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                {t.appName}
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[190px] leading-tight mt-0.5">
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Bilingual Toggle Button */}
        <button
          onClick={toggleLang}
          aria-label="Toggle language"
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'en' ? 'සිංහල' : 'English'}</span>
        </button>
      </header>

      {/* Main Content Area with proper padding so titles are never clipped */}
      <main className="flex-1 px-4 pt-20 pb-28 overflow-y-auto">
        {activeTab === 'tracker' && (
          <TrackerTab t={t} settings={settings} setSettings={setSettings} />
        )}
        {activeTab === 'hireCheck' && (
          <HireCheckTab t={t} settings={settings} />
        )}
        {activeTab === 'tripCost' && (
          <TripCostTab t={t} settings={settings} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab t={t} settings={settings} setSettings={setSettings} />
        )}
      </main>

      {/* Sleek Frosted Glass Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 z-50 px-1.5 py-1.5">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-400 font-bold bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight leading-none text-center truncate max-w-[80px] ${isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

export default App;
