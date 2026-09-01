import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { Bell, Wallet, Globe, Download, Shield, Mail, Moon, Sun } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { hapticFeedback } from '../lib/haptics';

export const Navbar: React.FC = () => {
  const {
    appLogo,
    language,
    setLanguage,
    setActiveTab,
    unreadNotifsCount,
    setNotifDrawerOpen,
    setAuthModalOpen,
    setWithdrawModalOpen,
    user,
    profile,
    isAdmin,
    isDarkMode,
    toggleTheme,
  } = useApp();

  const t = translations[language];
  const { isInstallable, promptInstall } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-900 text-white shadow-md border-b border-indigo-500/20 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Brand & Compact Sleek Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-1.5 sm:gap-2 text-left group transition-transform active:scale-95 shrink-0"
        >
          {/* Logo Badge */}
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 via-indigo-500 to-purple-600 p-[1.5px] shadow-sm shrink-0">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {appLogo ? (
                <img
                  src={appLogo}
                  alt="Mail Factory"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Mail className="w-3.5 h-3.5 text-amber-300" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
          </div>

          {/* Compact Typography */}
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-0.5">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">Mail</span>
              <span className="text-xs sm:text-sm font-black text-amber-300">Factory</span>
            </div>
            <span className="text-[7.5px] sm:text-[8.5px] font-bold tracking-wider text-indigo-200 uppercase">
              {language === 'bn' ? 'বিশ্বস্ত এক্সচেঞ্জ' : 'Official Hub'}
            </span>
          </div>
        </button>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Install App Button (PWA) */}
          {isInstallable && (
            <button
              onClick={() => {
                hapticFeedback.medium();
                promptInstall();
              }}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0"
              title="Install Mail Factory App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {/* Admin Panel Button (Strictly only visible to authenticated admin email) */}
          {isAdmin && (
            <button
              onClick={() => {
                hapticFeedback.medium();
                setActiveTab('admin');
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] sm:text-xs font-black shadow transition-all shrink-0"
              title="Admin Console"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Admin</span>
            </button>
          )}

          {/* Quick Balance Pill or Login */}
          {user && profile ? (
            <button
              onClick={() => setWithdrawModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] sm:text-xs font-black text-white transition-all shrink-0 font-mono"
              title="Wallet Balance / Deposit / Withdraw"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>৳{(Number(profile.balance) || 0).toFixed(0)}</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white text-indigo-800 text-xs font-black shadow hover:bg-indigo-50 active:scale-95 transition-all shrink-0"
            >
              {t.login}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-black flex items-center gap-1 transition-all shrink-0"
            title="Toggle language (বাংলা / English)"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-200" />
            <span className="uppercase text-[10px]">{language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Dark / Night Mode Toggle */}
          <button
            onClick={() => {
              hapticFeedback.light();
              toggleTheme();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all active:scale-95 flex items-center justify-center text-white shrink-0"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-100" />
            )}
            <span className="sr-only">Toggle Theme</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setNotifDrawerOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 relative transition-all text-white shrink-0"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-100" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-indigo-800 animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

