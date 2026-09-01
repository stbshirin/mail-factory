import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../lib/haptics';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  Download,
  Share2,
  Sparkles,
  Check,
  QrCode,
  Copy,
  Layers,
  Award,
  Zap,
  ShieldCheck,
  Flame,
  ExternalLink,
  Smartphone,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface PromoPosterCardProps {
  referralCode: string;
  referralLink: string;
}

type PosterTheme = 'indigo' | 'darkgold' | 'emerald' | 'crimson';
type PosterFormat = 'story' | 'square';

export const PromoPosterCard: React.FC<PromoPosterCardProps> = ({
  referralCode,
  referralLink,
}) => {
  const { profile, user, language, currentLevel, signupBonusUser, signupBonusReferrer, commissionPercent, copyText, addNotification } = useApp();
  const posterRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<PosterTheme>('indigo');
  const [format, setFormat] = useState<PosterFormat>('story');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const username = profile?.username || user?.displayName || 'VIP Member';

  // Handle Download PNG
  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    hapticFeedback.heavy();
    setIsExporting(true);

    try {
      // Small pause for DOM rendering
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 3, // HD quality
      });

      const link = document.createElement('a');
      link.download = `MailFactory-Promo-${referralCode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      addNotification(
        'Poster Downloaded! 🎨',
        language === 'bn' ? 'এইচডি পোস্টার ডাউনলোড সম্পন্ন হয়েছে! সোশ্যাল মিডিয়ায় শেয়ার করুন।' : 'HD Poster downloaded successfully! Share it on WhatsApp & Facebook.',
        'success'
      );
    } catch (err) {
      console.error('Failed to export poster image:', err);
      alert(language === 'bn' ? 'পোস্টার ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to download poster. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Share
  const handleSharePoster = async () => {
    hapticFeedback.medium();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mail Factory - Daily Earning Opportunity',
          text: language === 'bn'
            ? `🔥 Mail Factory তে জিমেইল সেল করে প্রতিদিন টাকা আয় করুন! রেফারেল কোড [${referralCode}] ব্যবহার করলেই পাবেন ৳${signupBonusUser} বোনাস!`
            : `🔥 Join Mail Factory and earn daily cash by exchanging Gmails! Use referral code [${referralCode}] for ৳${signupBonusUser} bonus!`,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyText(referralLink, language === 'bn' ? 'রেফারেল লিংক কপি হয়েছে!' : 'Referral link copied!');
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Theme Styles
  const themeStyles = {
    indigo: {
      bg: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
      border: 'border-indigo-400/30',
      accentText: 'text-amber-300',
      badgeBg: 'bg-indigo-500/30 border-indigo-400/40 text-indigo-200',
      qrBg: 'bg-white',
      qrColor: '#312e81',
      rateBg: 'from-amber-400 to-yellow-500 text-slate-950',
    },
    darkgold: {
      bg: 'from-[#1c1917] via-[#292524] to-[#451a03]',
      border: 'border-amber-400/40',
      accentText: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
      qrBg: 'bg-white',
      qrColor: '#451a03',
      rateBg: 'from-amber-400 via-yellow-400 to-amber-500 text-slate-950',
    },
    emerald: {
      bg: 'from-[#022c22] via-[#064e3b] to-[#022c22]',
      border: 'border-emerald-400/30',
      accentText: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/30 border-emerald-400/40 text-emerald-200',
      qrBg: 'bg-white',
      qrColor: '#064e3b',
      rateBg: 'from-emerald-400 to-teal-400 text-slate-950',
    },
    crimson: {
      bg: 'from-[#4c0519] via-[#881337] to-[#1e1b4b]',
      border: 'border-rose-400/30',
      accentText: 'text-rose-300',
      badgeBg: 'bg-rose-500/30 border-rose-400/40 text-rose-200',
      qrBg: 'bg-white',
      qrColor: '#881337',
      rateBg: 'from-rose-400 to-pink-500 text-white',
    },
  }[theme];

  return (
    <div className="space-y-4">
      {/* Controls Bar: Theme & Format selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
        {/* Theme Picker */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase mr-1">
            {language === 'bn' ? 'থিম:' : 'Theme:'}
          </span>
          {[
            { id: 'indigo', name: 'Indigo', color: 'bg-indigo-600' },
            { id: 'darkgold', name: 'Gold', color: 'bg-amber-500' },
            { id: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
            { id: 'crimson', name: 'Crimson', color: 'bg-rose-600' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                hapticFeedback.light();
                setTheme(t.id as PosterTheme);
              }}
              className={`w-6 h-6 rounded-full ${t.color} flex items-center justify-center transition-all ${
                theme === t.id ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              title={t.name}
            >
              {theme === t.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
          ))}
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-750 p-1 rounded-xl">
          <button
            onClick={() => {
              hapticFeedback.light();
              setFormat('story');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 ${
              format === 'story' ? 'bg-white dark:bg-slate-850 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Story (9:16)</span>
          </button>
          <button
            onClick={() => {
              hapticFeedback.light();
              setFormat('square');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 ${
              format === 'square' ? 'bg-white dark:bg-slate-850 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Post (1:1)</span>
          </button>
        </div>
      </div>

      {/* Poster Preview Frame */}
      <div className="flex justify-center p-2 sm:p-4 bg-slate-900/10 dark:bg-slate-950/60 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div
          ref={posterRef}
          className={`w-full max-w-[340px] bg-gradient-to-br ${themeStyles.bg} text-white p-5 rounded-3xl shadow-2xl border ${themeStyles.border} relative overflow-hidden flex flex-col justify-between select-none ${
            format === 'story' ? 'min-h-[560px]' : 'min-h-[420px]'
          }`}
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Header Bar */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                  MF
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                    Mail Factory
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
                  </h4>
                  <p className="text-[9px] text-slate-300 font-mono">
                    ★ বিশ্বস্ত ও দ্রুত এক্সচেঞ্জ ★
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                Verified Partner
              </span>
            </div>

            {/* Main Headline */}
            <div className="text-center space-y-1.5 pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10">
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                <span>ঘরে বসে অনলাইন ইনকাম</span>
              </span>

              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                জিমেইল একাউন্ট সেল করে <br />
                <span className={themeStyles.accentText}>প্রতিদিন নগদ টাকা ইনকাম!</span>
              </h2>
            </div>
          </div>

          {/* Features & Benefits Showcase */}
          <div className="relative z-10 space-y-2 my-3">
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs flex-shrink-0">
                  ✓
                </div>
                <div>
                  <div className="text-[10px] text-slate-300">প্রতি জিমেইল রেট</div>
                  <div className="text-xs font-black text-emerald-300">৳৮ - ৳১৫ পর্যন্ত</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center text-xs flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <div className="text-[10px] text-slate-300">পেমেন্ট মেথড</div>
                  <div className="text-xs font-black text-amber-300">বিকাশ • নগদ • রকেট</div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span className="text-[11px] text-amber-100 font-bold">
                  রেফারেল জয়েনিং বোনাস:
                </span>
              </div>
              <span className="text-xs font-black text-amber-300 font-mono">
                +৳{signupBonusUser} INSTANT
              </span>
            </div>
          </div>

          {/* QR Code & Referral Code Core Unit */}
          <div className="relative z-10 p-3.5 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-center space-y-2 shadow-inner">
            <div className="flex items-center justify-center gap-3">
              {/* QR Code */}
              <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
                <QRCode value={referralLink} size={76} fgColor={themeStyles.qrColor} />
              </div>

              {/* Referral Code details */}
              <div className="text-left space-y-1">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-300 block">
                  USE REFERRAL CODE
                </span>
                <div className="px-3 py-1.5 rounded-xl bg-white text-slate-950 font-mono font-black text-base sm:text-lg tracking-widest shadow-sm inline-block border-2 border-amber-400">
                  {referralCode}
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1 font-medium">
                  <span>Referred by:</span>
                  <span className="font-bold text-white truncate max-w-[100px]">{username}</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-300/90 pt-1 border-t border-white/10 flex items-center justify-between">
              <span>১০০% বিশ্বস্ত ও সিকিউর</span>
              <span>24/7 লাইভ সাপোর্ট</span>
              <span>দ্রুততম রিভিউ</span>
            </div>
          </div>

          {/* Footer Official Verification */}
          <div className="relative z-10 text-center pt-2 text-[9px] text-slate-400 font-mono flex items-center justify-between">
            <span>Official Referral Poster</span>
            <span>https://mailfactory.top</span>
          </div>
        </div>
      </div>

      {/* Action Buttons for Poster */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleDownloadPoster}
          disabled={isExporting}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
          id="btn-download-promo-poster"
        >
          {isExporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>{language === 'bn' ? 'পোস্টার তৈরি হচ্ছে...' : 'Generating HD Poster...'}</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{language === 'bn' ? 'এইচডি পোস্টার ডাউনলোড' : 'Download HD Poster'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleSharePoster}
          className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow flex items-center justify-center gap-2 transition-all active:scale-98"
          id="btn-share-promo-poster"
        >
          <Share2 className="w-4 h-4 text-white" />
          <span>{language === 'bn' ? 'সোশ্যাল মিডিয়ায় শেয়ার' : 'Share on Social Media'}</span>
        </button>
      </div>
    </div>
  );
};
