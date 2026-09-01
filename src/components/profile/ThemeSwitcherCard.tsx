import React from 'react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../lib/haptics';
import { ThemeMode } from '../../types';
import {
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Check,
  CheckCircle2,
  Sliders,
  Palette,
} from 'lucide-react';

export const ThemeSwitcherCard: React.FC = () => {
  const { theme, setTheme, isDarkMode, language } = useApp();

  const handleSelectTheme = (mode: ThemeMode) => {
    hapticFeedback.medium();
    setTheme(mode);
  };

  const themeOptions: Array<{
    id: ThemeMode;
    titleBn: string;
    titleEn: string;
    descBn: string;
    descEn: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'light',
      titleBn: 'লাইট মোড',
      titleEn: 'Light Mode',
      descBn: 'উজ্জ্বল ও পরিচ্ছন্ন ডে-টাইম থিম',
      descEn: 'Clean, crisp daylight aesthetic',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      id: 'dark',
      titleBn: 'ডার্ক মোড',
      titleEn: 'Dark Mode',
      descBn: 'চোখের সুরক্ষায় ডার্ক অ্যাম্বিয়েন্ট থিম',
      descEn: 'Eye-friendly deep twilight palette',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      color: 'bg-indigo-950 text-indigo-200 border-indigo-800',
    },
    {
      id: 'system',
      titleBn: 'সিস্টেম অটো',
      titleEn: 'System Auto',
      descBn: 'ডিভাইসের অটো মোড অনুযায়ী সমন্বয়',
      descEn: 'Matches your OS / browser preference',
      icon: <Laptop className="w-5 h-5 text-purple-400" />,
      color: 'bg-purple-950/40 text-purple-200 border-purple-800/60',
    },
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-sm flex-shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'সিস্টেম থিম ও ডিসপ্লে মোড' : 'Theme & Display Preference'}
              </h4>
              <span className="px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-black border border-indigo-200 dark:border-indigo-800">
                {isDarkMode ? 'DARK' : 'LIGHT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'bn'
                ? 'আপনার পছন্দের লাইট/ডার্ক কালার মোড নির্বাচন করুন (স্বয়ংক্রিয় সংরক্ষিত)'
                : 'Select your preferred visual style (persisted in localStorage)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSelectTheme(isDarkMode ? 'light' : 'dark')}
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          title="Quick Theme Toggle"
          id="btn-quick-theme-toggle"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-[11px]">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Interactive Segmented Theme Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {themeOptions.map((opt) => {
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectTheme(opt.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-2 active:scale-98 ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-slate-800 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20 dark:ring-indigo-400/30'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
              }`}
              id={`btn-theme-${opt.id}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex-shrink-0">
                  {opt.icon}
                </div>

                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                )}
              </div>

              <div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? opt.titleBn : opt.titleEn}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  {language === 'bn' ? opt.descBn : opt.descEn}
                </p>
              </div>

              {opt.id === 'system' && (
                <div className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{isDarkMode ? 'Current: Dark' : 'Current: Light'}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info footer banner */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {language === 'bn'
            ? '💾 প্রেফারেন্স ব্রাউজারের LocalStorage এ স্থায়ীভাবে সংরক্ষিত থাকে।'
            : '💾 Theme choice is saved securely to your device LocalStorage.'}
        </span>
        <span className="font-mono font-bold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase">
          {theme} mode
        </span>
      </div>
    </div>
  );
};
