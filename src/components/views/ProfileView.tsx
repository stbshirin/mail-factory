import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { auth, signOut } from '../../lib/firebase';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { hapticFeedback } from '../../lib/haptics';
import { ReferralHub } from '../profile/ReferralHub';
import { StatsSummaryCard } from '../profile/StatsSummaryCard';
import { ThemeSwitcherCard } from '../profile/ThemeSwitcherCard';
import {
  Wallet,
  Hourglass,
  Flame,
  Gift,
  ChevronRight,
  User,
  Shield,
  Key,
  LogOut,
  HelpCircle,
  Mail,
  FileText,
  Info,
  Trash2,
  Bell,
  Camera,
  Award,
  TrendingUp,
  Download,
  Activity,
  QrCode,
  Sparkles,
  Settings,
  Star,
  Zap,
  Check,
  Copy,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
  Palette,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProfileViewProps {
  onOpenEditProfile: () => void;
  onOpenChangePass: () => void;
  onOpenFAQ: () => void;
  onOpenContact: () => void;
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenEditProfile,
  onOpenChangePass,
  onOpenFAQ,
  onOpenContact,
  onOpenPrivacy,
  onOpenAbout,
}) => {
  const {
    profile,
    user,
    language,
    currentLevel,
    nextLevel,
    setWithdrawModalOpen,
    setActiveTab,
    setChatDrawerOpen,
    setNotifDrawerOpen,
    claimDailyStreak,
    signupBonusUser,
    copyText,
    submissions,
    isAdmin,
    theme,
    setTheme,
    isDarkMode,
    toggleTheme,
  } = useApp();

  const t = translations[language];
  const { isInstallable, promptInstall } = usePWAInstall();

  const [claimingStreak, setClaimingStreak] = useState<boolean>(false);
  const [copiedProfileRefCode, setCopiedProfileRefCode] = useState<boolean>(false);
  const [copiedProfileRefLink, setCopiedProfileRefLink] = useState<boolean>(false);

  // Recharts: Last 30 Days Earnings Trend
  const last30Days = React.useMemo(() => {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  }, []);

  const chartData = React.useMemo(() => {
    const earningsMap: Record<string, number> = {};
    submissions
      .filter((s) => s.status === 'approved')
      .forEach((s) => {
        const d = new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        earningsMap[d] = (earningsMap[d] || 0) + (s.totalAmount || 0);
      });
    return last30Days.map((date) => ({
      date,
      amount: earningsMap[date] || 0,
    }));
  }, [submissions, last30Days]);

  const alreadyClaimed = profile?.last_login_date === new Date().toDateString();

  const mainBalance = (Number(profile?.balance) || 0).toFixed(2);
  const holdBalance = (Number(profile?.hold) || 0).toFixed(2);
  const referralCode = profile?.referralCode || 'MFVIP88';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleShare = () => {
    hapticFeedback.medium();
    const shareTitle = 'Mail Factory - Trusted Gmail Exchange';
    const shareText =
      language === 'bn'
        ? `Join Mail Factory using my referral code ${referralCode} and get bonus cash!`
        : `Join Mail Factory using my referral code ${referralCode} and get bonus cash!`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: referralLink,
      }).catch(() => copyText(referralLink));
    } else {
      copyText(referralLink);
    }
  };

  const handleCopyProfileCode = async () => {
    hapticFeedback.light();
    const ok = await copyText(referralCode, language === 'bn' ? 'রেফারেল কোড কপি হয়েছে!' : 'Referral code copied!');
    if (ok) {
      setCopiedProfileRefCode(true);
      setTimeout(() => setCopiedProfileRefCode(false), 2000);
    }
  };

  const handleCopyProfileLink = async () => {
    hapticFeedback.medium();
    const ok = await copyText(referralLink, language === 'bn' ? 'রেফারেল লিংক কপি হয়েছে!' : 'Referral link copied!');
    if (ok) {
      setCopiedProfileRefLink(true);
      setTimeout(() => setCopiedProfileRefLink(false), 2000);
    }
  };

  const handleClaimStreak = async () => {
    hapticFeedback.medium();
    setClaimingStreak(true);
    await claimDailyStreak();
    setClaimingStreak(false);
  };

  const handleLogout = async () => {
    if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে লগআউট করতে চান?' : 'Are you sure you want to log out?')) {
      await signOut(auth);
      setActiveTab('home');
    }
  };

  // Submissions stats
  const totalSubCount = profile?.total_submitted || submissions.length;
  const approvedCount = profile?.manual_approved_count || 0;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Level progress percentage
  const currentReq = currentLevel.approved;
  const nextReq = nextLevel ? nextLevel.approved : currentReq + 100;
  const levelProgress = nextLevel
    ? Math.min(100, Math.max(0, ((approvedCount - currentReq) / (nextReq - currentReq)) * 100))
    : 100;
  const neededMails = nextLevel ? Math.max(0, nextLevel.approved - approvedCount) : 0;

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'Jul 2026';

  const memberCategory = currentLevel?.level >= 3 ? 'VIP Member' : 'General Member';

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4">
      {/* Top Profile Header Card matching Screenshot 5 */}
      <div className="rounded-3xl bg-gradient-to-br from-[#240b4f] via-[#3a1078] to-[#1e0840] text-white p-6 shadow-xl relative overflow-hidden text-center border border-purple-500/20">
        {/* Subtle blur background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Settings gear icon on top right */}
        <button
          onClick={() => {
            hapticFeedback.light();
            onOpenEditProfile();
          }}
          className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 z-20"
          title="Account Settings"
        >
          <Settings className="w-4 h-4 text-purple-200" />
        </button>

        <div className="relative z-10">
          {/* Avatar with gold glow and camera button */}
          <div className="relative inline-block mb-3">
            <div
              onClick={onOpenEditProfile}
              className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-1 mx-auto cursor-pointer shadow-xl hover:scale-105 transition-transform"
            >
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.username}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-900 text-amber-300 font-black text-3xl flex items-center justify-center">
                  {(profile?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={onOpenEditProfile}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 border-2 border-white text-white shadow-md hover:bg-indigo-700 transition-colors"
              title="Change Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            {profile?.username || 'md Forward'}
          </h2>
          <p className="text-xs text-purple-200/90 mt-0.5 font-mono">
            {profile?.email || user?.email || 'user@mailfactory.top'}
          </p>

          {/* Badges row matching Screenshot 5 */}
          <div className="flex items-center justify-center gap-2 mt-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Level {currentLevel.level} ({currentLevel.title})</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile?.login_streak || 1} Days Streak</span>
            </span>

            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/10 text-purple-200">
              Joined {memberSince}
            </span>
          </div>

          {/* Digital Member ID Card Banner inside profile card */}
          <div className="mt-5 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white">Digital Member ID Card</h4>
                  <span className="px-2 py-0.2 rounded-full bg-indigo-500/40 text-indigo-200 text-[9px] font-bold border border-indigo-400/30">
                    {memberCategory}
                  </span>
                </div>
                <p className="text-[10px] text-purple-200 truncate">
                  Official Membership & Verification Badge
                </p>
              </div>
            </div>

            {/* Glowing yellow-orange action button */}
            <button
              onClick={() => {
                hapticFeedback.medium();
                setActiveTab('id-card');
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>{language === 'bn' ? '✨ কার্ড দেখুন ও ডাউনলোড (ID Card)' : '✨ View & Download Digital ID Card'}</span>
              <ChevronRight className="w-4 h-4 text-slate-900 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* 1-Tap Quick Referral Copy & Sharing Unit */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 shadow-lg border border-indigo-500/30 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">
                  {language === 'bn' ? 'রেফারেল কোড ও লিংক' : 'Your Referral Link & Code'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-300 text-[9px] font-black border border-emerald-400/30">
                  Instant Bonus
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                {language === 'bn' ? '১-ট্যাপে কোড কপি করে বন্ধুকে ইনভাইট করুন' : 'One-tap copy to share with your friends'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Bonus</span>
            <span className="text-xs font-black text-amber-300 font-mono">+৳{signupBonusUser}</span>
          </div>
        </div>

        {/* Code Bar with 1-Tap Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Code display pill */}
          <div className="flex-1 px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Code:</span>
              <span className="font-black text-amber-300 tracking-wider text-sm sm:text-base">
                {referralCode}
              </span>
            </div>

            {/* Quick 1-Tap Copy Code button */}
            <button
              onClick={handleCopyProfileCode}
              className={`px-3 py-1.5 rounded-xl font-sans font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 ${
                copiedProfileRefCode
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              id="btn-profile-onetap-copy-code"
              title="Copy Referral Code"
            >
              {copiedProfileRefCode ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{language === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কোড কপি' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          {/* 1-Tap Copy Link Button */}
          <button
            onClick={handleCopyProfileLink}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow ${
              copiedProfileRefLink
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            id="btn-profile-onetap-copy-link"
            title="Copy Full Referral Link"
          >
            {copiedProfileRefLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                <span>{language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!'}</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'লিংক কপি' : 'Copy Link'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Balance Cards (Available & Hold) */}
      <div className="space-y-3">
        {/* Available Balance Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 block mb-1">
                AVAILABLE BALANCE
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                ৳{mainBalance}
              </div>
            </div>
            <button
              onClick={() => setWithdrawModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-black text-xs shadow hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4 text-emerald-700" />
              <span>{t.withdraw}</span>
            </button>
          </div>
        </div>

        {/* Hold Balance Card */}
        <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 dark:text-amber-300">Hold Balance</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 text-[9px] font-black border border-amber-300/40">
                  Reviewing
                </span>
              </div>
              <div className="text-base font-black text-amber-800 dark:text-amber-400 font-mono">
                ৳{holdBalance}
              </div>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Balance will unlock automatically upon admin audit completion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Streak Card matching Screenshot 4 */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">Daily Streak</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Check in daily to claim ৳0.50 - ৳4.00 free cash bonus!
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/80 px-3 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 fill-orange-500" />
            <span>{profile?.login_streak || 1} Days</span>
          </span>
        </div>

        {/* 7 Days Node Bubbles matching Screenshot 4 */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {[
            { label: 'S', day: 'Day 1' },
            { label: 'M', day: 'Day 2' },
            { label: 'T', day: 'Day 3' },
            { label: 'W', day: 'Day 4' },
            { label: 'T', day: 'Day 5' },
            { label: 'F', day: 'Day 6' },
            { label: 'S', day: 'Day 7' },
          ].map((node, i) => {
            const streakNum = profile?.login_streak || 1;
            const streakMod = streakNum % 7 === 0 && streakNum > 0 ? 7 : streakNum % 7;
            const isClaimed = i < streakMod;
            const isToday = i === streakMod - 1;

            return (
              <div
                key={i}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all text-center ${
                  isClaimed
                    ? 'bg-gradient-to-b from-orange-500 to-rose-500 text-white border-transparent shadow-sm'
                    : isToday
                    ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-400 dark:border-orange-500 text-orange-700 dark:text-orange-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-center">
                  {isClaimed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : node.label}
                </div>
                <span className={`text-[9px] font-bold truncate ${isClaimed ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'}`}>
                  {node.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Glowing Claim Button */}
        <button
          onClick={handleClaimStreak}
          disabled={claimingStreak || alreadyClaimed}
          className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-98 flex items-center justify-center gap-2 ${
            alreadyClaimed
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:opacity-95 text-white shadow-lg shadow-rose-500/25'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {claimingStreak
              ? language === 'bn'
                ? 'ক্লেইম হচ্ছে...'
                : 'Claiming bonus...'
              : alreadyClaimed
              ? language === 'bn'
                ? 'আজকের জন্য ক্লেইম করা হয়েছে ✅'
                : 'Claimed for Today ✅'
              : language === 'bn'
              ? '✨ ক্লেইম ডেইলি বোনাস'
              : '✨ Claim Daily Bonus'}
          </span>
        </button>
      </div>

      {/* VIP LEVEL STATUS Card matching Screenshot 4 */}
      <div className="rounded-3xl bg-[#111827] text-white p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Award className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  VIP LEVEL STATUS
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black border border-amber-400/30">
                  Level {currentLevel.level}
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                {currentLevel.title}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Rate / Pcs
            </span>
            <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
              ৳{currentLevel.rate}
            </span>
          </div>
        </div>

        {/* Progress bar and requirements */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Approved Accounts {approvedCount}</span>
            </div>
            <span className="text-amber-400 font-mono">{Math.round(levelProgress)}% Complete</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-tight pt-1">
            বর্তমান: {currentLevel.title} পরবর্তী {nextLevel ? nextLevel.title : 'VIP'} লেভেলে পৌঁছাতে আরও{' '}
            <span className="text-amber-300 font-bold">{neededMails} টি</span> অনুমোদিত কাজ দরকার
          </p>
        </div>

        {/* 3 VIP Sub-Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[9px] font-bold text-slate-400 block uppercase">
              Task Payout
            </span>
            <span className="text-xs font-black text-white font-mono">
              ৳{currentLevel.rate}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[9px] font-bold text-slate-400 block uppercase">
              Audit in Progress
            </span>
            <span className="text-xs font-black text-cyan-300">
              Fast Track
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[9px] font-bold text-slate-400 block uppercase">
              Exclusive Perks
            </span>
            <span className="text-xs font-black text-purple-300">
              VIP Verified
            </span>
          </div>
        </div>
      </div>

      {/* Data-Driven Performance & Stats Summary Card */}
      <StatsSummaryCard />

      {/* Submission Stats & 30 Days Trend */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t.submissionStats}</span>
        </h4>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 block">{totalSubCount}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t.total}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 block">{approvedCount}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t.approved}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
            <span className="text-lg font-black text-amber-700 dark:text-amber-300 block">{pendingCount}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t.pending}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
            <span className="text-lg font-black text-rose-700 dark:text-rose-300 block">{rejectedCount}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t.rejected}</span>
          </div>
        </div>

        {/* 30 Days Earnings Trend Chart */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Earnings Trend (Last 30 Days)</span>
          </h4>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8' }} 
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8' }} 
                  tickFormatter={(val) => `৳${val}`} 
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                  formatter={(value) => [`৳${value}`, 'Earned']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Referral Earnings & Code Generator Sub-Component */}
      <ReferralHub />

      {/* Settings & Info Section */}
      <div className="rounded-3xl bg-white border border-slate-200 p-2 shadow-sm divide-y divide-slate-100 transition-colors">
        <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t.account}
        </div>

        {/* Digital ID Card Direct Shortcut */}
        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('id-card');
          }}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800">
                {language === 'bn' ? 'ডিজিটাল মেম্বার আইডি কার্ড' : 'Digital Member ID Card'}
              </h5>
              <span className="text-[10px] text-slate-400 font-medium">
                Official badge with Barcode, Seal & Verification
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Buyer Orders & Inventory Shortcut */}
        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('buyer');
          }}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800">
                {language === 'bn' ? 'বায়ার মার্কেটপ্লেস (জিমেইল কিনুন)' : 'Buyer Marketplace (Buy Gmails)'}
              </h5>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'bn' ? 'ভেরিফাইড জিমেইল প্যাকেজ ও ইনস্ট্যান্ট ডেলিভারি' : 'Verified Gmail packages & secured escrow'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Admin Management Entry - Strictly visible only to authenticated Admin email */}
        {isAdmin && (
          <button
            onClick={() => {
              hapticFeedback.medium();
              setActiveTab('admin');
            }}
            className="w-full flex items-center justify-between p-3 text-left bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 dark:from-amber-500/20 dark:to-indigo-500/20 rounded-2xl border border-amber-300/60 dark:border-amber-500/30 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">
                    {language === 'bn' ? 'এডমিন কন্ট্রোল ও ম্যানেজমেন্ট' : 'Admin Control & Management'}
                  </h5>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black uppercase">
                    ADMIN
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'bn'
                    ? 'জিমেইল রিভিউ, পেমেন্ট অ্যাপ্রুভ ও ইউজার কন্ট্রোল'
                    : 'Approve Gmails, Payouts, Users & Rates'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>
        )}

        <button
          onClick={onOpenEditProfile}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.editProfile}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Update name, photo, phone & wallet</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={() => setNotifDrawerOpen(true)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.notifications}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Push and audit status alerts</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onOpenChangePass}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.changePassword}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Secure your account credential</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onOpenFAQ}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.faq}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Common questions & rules</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onOpenContact}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.contactSupport}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Telegram, WhatsApp & Live Agent</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onOpenPrivacy}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.privacyPolicy}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Security & user data protection</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={onOpenAbout}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{t.aboutUs}</h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">App version & licenses</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold">{t.logout}</h5>
              <span className="text-[10px] text-rose-400 dark:text-rose-500 font-medium">End your current session</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 dark:text-rose-500" />
        </button>
      </div>

      {/* PWA Install Button (Mobile View) */}
      {isInstallable && (
        <button
          onClick={() => {
            hapticFeedback.medium();
            promptInstall();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Download className="w-4 h-4" />
          <span>{language === 'bn' ? 'Mail Factory অ্যাপ ইনস্টল করুন' : 'Install Mail Factory App'}</span>
        </button>
      )}

      {/* Delete Account (Visual Only) */}
      <button
        onClick={() => {
          alert(language === 'bn' ? 'অ্যাকাউন্ট ডিলিট করতে লাইভ চ্যাটে অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Please contact admin via Live Chat to delete your account.');
        }}
        className="w-full py-3.5 rounded-2xl text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:text-rose-600 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{language === 'bn' ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Request Account Deletion'}</span>
      </button>
    </div>
  );
};
