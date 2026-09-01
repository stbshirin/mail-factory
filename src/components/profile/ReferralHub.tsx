import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { hapticFeedback } from '../../lib/haptics';
import QRCode from 'react-qr-code';
import { ShareTemplates } from './ShareTemplates';
import { PromoPosterCard } from './PromoPosterCard';
import {
  Gift,
  Users,
  Sparkles,
  Copy,
  Check,
  Share2,
  QrCode,
  RefreshCw,
  Wand2,
  TrendingUp,
  Search,
  UserCheck,
  Award,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Percent,
  Flame,
  Layers,
  ArrowUpRight,
  Calculator,
  FileText,
  Image,
} from 'lucide-react';

export const ReferralHub: React.FC = () => {
  const {
    profile,
    user,
    language,
    commissionPercent,
    signupBonusUser,
    signupBonusReferrer,
    copyText,
    allUsers,
    updateProfileData,
    addNotification,
  } = useApp();

  const t = translations[language];

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'friends' | 'calculator' | 'templates' | 'poster' | 'generator'>('overview');

  // Generator & customization state
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string>('');
  const [isSavingCode, setIsSavingCode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sharing & QR state
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Search & Filter for friends list
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'recent'>('all');

  // Calculator helper
  const [calcSubmissions, setCalcSubmissions] = useState<number>(50);

  const activeReferralCode = profile?.referralCode || 'MFVIP88';
  const referralLink = `${window.location.origin}/?ref=${activeReferralCode}`;
  const totalEarned = Number(profile?.referralEarnings) || 0;

  // Filter friends referred by this user
  const myFriends = useMemo(() => {
    if (!user && !profile) return [];
    return allUsers.filter(
      (u) =>
        (user?.uid && u.referredBy === user.uid) ||
        (activeReferralCode && u.referredBy?.toUpperCase() === activeReferralCode.toUpperCase())
    );
  }, [allUsers, user, activeReferralCode]);

  // Filtered friends list for display
  const displayedFriends = useMemo(() => {
    let list = [...myFriends];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.username?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q)
      );
    }

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (filterStatus === 'active') {
      list = list.filter((f) => (f.last_login && now - f.last_login < threeDaysMs) || (f.total_submitted && f.total_submitted > 0));
    } else if (filterStatus === 'recent') {
      list = list.filter((f) => f.createdAt && now - f.createdAt < sevenDaysMs);
    }

    return list;
  }, [myFriends, searchQuery, filterStatus]);

  // Handle Copy Code
  const handleCopyCode = async () => {
    hapticFeedback.light();
    const ok = await copyText(activeReferralCode, language === 'bn' ? 'রেফারেল কোড কপি হয়েছে!' : 'Referral code copied!');
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Handle Copy Link
  const handleCopyLink = async () => {
    hapticFeedback.medium();
    const ok = await copyText(referralLink, language === 'bn' ? 'রেফারেল লিংক কপি হয়েছে!' : 'Referral link copied!');
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Handle Share to Native or Clipboard
  const handleShare = () => {
    hapticFeedback.medium();
    const shareTitle = 'Mail Factory - Trusted Gmail Exchange';
    const shareText =
      language === 'bn'
        ? `🔥 মেইল ফ্যাক্টরিতে যোগ দিন আমার রেফারেল কোড [${activeReferralCode}] ব্যবহার করে এবং সাথে সাথে ৳${signupBonusUser} বোনাস পান! রিয়েল-টাইম পেমেন্ট ও সর্বোচ্চ রেট। লিংক:`
        : `🔥 Join Mail Factory using my referral code [${activeReferralCode}] and receive an instant ৳${signupBonusUser} signup bonus! Link:`;

    if (navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: shareText,
          url: referralLink,
        })
        .catch(() => handleCopyLink());
    } else {
      handleCopyLink();
    }
  };

  // Generate a random creative unique referral code
  const generateRandomCode = () => {
    hapticFeedback.light();
    setIsGenerating(true);
    const prefixes = ['MF', 'VIP', 'PRO', 'TOP', 'MAX', 'STAR'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generated = `${randomPrefix}${randomSuffix}`;
    setCustomCodeInput(generated);
    setCodeError('');
    setTimeout(() => setIsGenerating(false), 300);
  };

  // Save customized or generated referral code
  const handleSaveCustomCode = async () => {
    const cleanCode = (customCodeInput || '').trim().toUpperCase();

    if (!cleanCode) {
      setCodeError(language === 'bn' ? 'অনুগ্রহ করে একটি কোড লিখুন।' : 'Please enter a referral code.');
      return;
    }

    if (cleanCode.length < 3 || cleanCode.length > 12) {
      setCodeError(language === 'bn' ? 'কোড ৩ থেকে ১২ অক্ষরের হতে হবে।' : 'Code must be between 3 and 12 characters.');
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      setCodeError(language === 'bn' ? 'শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা ও হাইফেন গ্রহণযোগ্য।' : 'Only letters, numbers, and dashes are allowed.');
      return;
    }

    // Check if another user already has this referral code
    const isTaken = allUsers.some(
      (u) => u.uid !== user?.uid && u.referralCode?.toUpperCase() === cleanCode
    );

    if (isTaken) {
      setCodeError(language === 'bn' ? 'এই কোডটি ইতিমধ্যে ব্যবহৃত হচ্ছে। অন্য একটি চেষ্টা করুন।' : 'This code is already taken. Please try another.');
      return;
    }

    setIsSavingCode(true);
    setCodeError('');

    try {
      await updateProfileData({ referralCode: cleanCode });
      hapticFeedback.heavy();
      addNotification(
        'Referral Code Updated ✨',
        `Your unique referral code is now "${cleanCode}". Share your new link to invite friends!`,
        'success'
      );
      setIsEditingCode(false);
      setCustomCodeInput('');
    } catch (err: any) {
      setCodeError(err.message || 'Failed to save code. Please retry.');
    } finally {
      setIsSavingCode(false);
    }
  };

  return (
    <div id="referral-hub-section" className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Dynamic Header with Real-time Indicator */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 text-white p-5 relative overflow-hidden">
        {/* Ambient decorative lighting */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                <Gift className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black tracking-tight">{t.inviteAndEarn}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-[10px] font-extrabold text-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Real-time
                  </span>
                </div>
                <p className="text-xs text-indigo-100 font-medium">
                  {language === 'bn'
                    ? `প্রতিটি সফল বিক্রয়ে পাবেন ${commissionPercent}% আজীবন কমিশন`
                    : `Earn ${commissionPercent}% lifetime revenue on every friend's sell`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow"
              title="Show QR Code"
              id="btn-referral-qr-modal"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Earnings & Stats Showcase */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Stat 1: Total Real-time Earnings */}
            <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-2.5 text-center backdrop-blur-md border border-white/15">
              <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block">
                {language === 'bn' ? 'মোট আয়' : 'Total Earnings'}
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-0.5 flex items-center justify-center gap-0.5">
                <span>৳</span>
                <span>{totalEarned.toFixed(2)}</span>
              </div>
              <span className="text-[9px] text-emerald-200 font-bold block mt-0.5">
                Instant Auto-Credit
              </span>
            </div>

            {/* Stat 2: Active Referred Users */}
            <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-2.5 text-center backdrop-blur-md border border-white/15">
              <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block">
                {language === 'bn' ? 'সক্রিয় রেফারেল' : 'Referred Users'}
              </span>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-indigo-200" />
                <span>{myFriends.length}</span>
              </div>
              <span className="text-[9px] text-indigo-200 font-medium block mt-0.5">
                {language === 'bn' ? 'মোট নেটওয়ার্ক' : 'Network Total'}
              </span>
            </div>

            {/* Stat 3: Commission Tier */}
            <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-2.5 text-center backdrop-blur-md border border-white/15">
              <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block">
                {language === 'bn' ? 'কমিশন হার' : 'Commission'}
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5 flex items-center justify-center gap-0.5">
                <span>{commissionPercent}%</span>
              </div>
              <span className="text-[9px] text-indigo-200 font-medium block mt-0.5">
                {language === 'bn' ? 'আজীবন' : 'Lifetime Rate'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs matching screenshot with horizontal scrollable pill bar */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 p-1.5 gap-1.5">
        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('overview');
          }}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-referral-overview"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.overview}</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('friends');
          }}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'friends'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-referral-friends"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'ফ্রেন্ডস' : 'Friends'}</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            {myFriends.length}
          </span>
        </button>

        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('calculator');
          }}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'calculator'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-referral-calculator"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'আয় ক্যালকুলেটর' : 'Calculator'}</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('templates');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'templates'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50'
          }`}
          id="tab-referral-templates"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'শেয়ার টেমপ্লেট' : 'Share Templates'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </button>

        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('poster');
          }}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'poster'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-referral-poster"
        >
          <Image className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'পোস্টার ও কার্ড' : 'Promo Poster'}</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback.light();
            setActiveTab('generator');
            if (!customCodeInput) setCustomCodeInput(activeReferralCode);
          }}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'generator'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-referral-generator"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'কোড জেনারেটর' : 'Code'}</span>
        </button>
      </div>

      {/* TAB 1: Overview & Instant Sharing */}
      {activeTab === 'overview' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Active Referral Code Banner with Quick Copy */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-850 dark:to-indigo-950/30 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">
                {language === 'bn' ? 'আপনার সক্রিয় রেফারেল কোড' : 'YOUR ACTIVE REFERRAL CODE'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-400 tracking-wider">
                  {activeReferralCode}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyCode}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                id="btn-copy-ref-code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                <span>{copiedCode ? (language === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (language === 'bn' ? 'কোড কপি' : 'Copy Code')}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                id="btn-copy-ref-link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!') : (language === 'bn' ? 'লিংক কপি' : 'Copy Link')}</span>
              </button>
            </div>
          </div>

          {/* Value Proposition & Reward Benefits */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
            <div className="font-extrabold flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'bn' ? 'রেফারেল সুবিধা এবং রিয়েল-টাইম পে-আউট:' : 'Referral Benefits & Real-time Payouts:'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-1.5 bg-white/70 dark:bg-slate-800/80 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span>
                  {language === 'bn'
                    ? `বন্ধু অ্যাকাউন্ট খুললে পান ৳${signupBonusReferrer} স্বয়ংক্রিয় রেফারেল বোনাস`
                    : `Get ৳${signupBonusReferrer} instant welcome credit when a friend signs up`}
                </span>
              </div>
              <div className="flex items-start gap-1.5 bg-white/70 dark:bg-slate-800/80 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span>
                  {language === 'bn'
                    ? `বন্ধু প্রতিবার জিমেইল এক্সচেঞ্জ করলে পাবেন ${commissionPercent}% নগদ কমিশন`
                    : `Earn ${commissionPercent}% cash commission on every approved batch`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShare}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white font-extrabold text-xs shadow-md hover:opacity-95 active:scale-98 flex items-center justify-center gap-2 transition-all"
              id="btn-share-referral-native"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareReferral}</span>
            </button>

            <button
              onClick={() => setShowQRModal(true)}
              className="py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs active:scale-98 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all"
              id="btn-open-qr-panel"
            >
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'bn' ? 'QR কোড দেখুন' : 'View QR Code'}</span>
            </button>
          </div>

          {/* Real-time Commission Calculator Widget */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'bn' ? 'আয় প্রাক্কলন ক্যালকুলেটর' : 'Earnings Potential Estimator'}</span>
              </div>
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {calcSubmissions} Gmails / Week
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={calcSubmissions}
              onChange={(e) => setCalcSubmissions(Number(e.target.value))}
              className="w-full h-2 bg-indigo-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700 font-medium">
              <span className="text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'আনুমানিক সম্ভাব্য নেটওয়ার্ক আয়:' : 'Estimated Network Revenue:'}
              </span>
              <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                ≈ ৳{((calcSubmissions * 10 * commissionPercent) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Calculator */}
      {activeTab === 'calculator' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'bn' ? 'রেফারেল আয় ক্যালকুলেটর' : 'Referral Earnings Calculator'}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'আপনার রেফারেল নেটওয়ার্কের সদস্য সংখ্যা ও তাদের দৈনিক অ্যাক্টিভিটি থেকে আয়ের হিসাব দেখুন।'
                : 'Estimate your passive network earnings based on your friends activity and approved batches.'}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-850 dark:via-slate-800 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block tracking-wider">
                  {language === 'bn' ? 'নেটওয়ার্কের সাপ্তাহিক মোট মেইল' : 'Weekly Network Gmails'}
                </span>
                <span className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                  {calcSubmissions} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-bold">Pcs / Week</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block tracking-wider">
                  {language === 'bn' ? 'কমিশন রেট' : 'Commission Rate'}
                </span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-block">
                  {commissionPercent}%
                </span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={calcSubmissions}
              onChange={(e) => setCalcSubmissions(Number(e.target.value))}
              className="w-full h-2.5 bg-indigo-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/80 dark:border-slate-700 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase">
                  {language === 'bn' ? 'দৈনিক আয়' : 'Daily Est.'}
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-100">
                  ৳{(((calcSubmissions / 7) * 10 * commissionPercent) / 100).toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block uppercase">
                  {language === 'bn' ? 'সাপ্তাহিক আয়' : 'Weekly Est.'}
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-indigo-700 dark:text-indigo-300">
                  ৳{((calcSubmissions * 10 * commissionPercent) / 100).toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block uppercase">
                  {language === 'bn' ? 'মাসিক আয়' : 'Monthly Est.'}
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
                  ৳{((calcSubmissions * 4 * 10 * commissionPercent) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                {language === 'bn'
                  ? `টিপস: যত বেশি বন্ধু সক্রিয় থাকবে, আপনার স্বয়ংক্রিয় প্যাসিভ ইনকাম তত বৃদ্ধি পাবে। টাকা সাথে সাথে ব্যালেন্সে জমা হবে!`
                  : `Tip: The more friends who actively submit Gmails, the higher your real-time passive earnings. Auto-credited instantly!`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Share Templates */}
      {activeTab === 'templates' && (
        <div className="p-4 sm:p-5">
          <ShareTemplates referralCode={activeReferralCode} referralLink={referralLink} />
        </div>
      )}

      {/* TAB: Promo Card & Poster */}
      {activeTab === 'poster' && (
        <div className="p-4 sm:p-5">
          <PromoPosterCard referralCode={activeReferralCode} referralLink={referralLink} />
        </div>
      )}

      {/* TAB 2: Unique Referral Code Generator */}
      {activeTab === 'generator' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'bn' ? 'কাস্টম ও ইউনিক কোড জেনারেটর' : 'Unique Referral Code Generator'}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'আপনার পছন্দের সহজে মনে রাখার মতো কাস্টম কোড তৈরি করুন অথবা ১-ক্লিকে র্যান্ডম ভিআইপি কোড জেনারেট করুন।'
                : 'Create a memorable customized code or generate an instant VIP referral code.'}
            </p>
          </div>

          {/* Current Code Preview & Input Form */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 block tracking-wider">
              {language === 'bn' ? 'নতুন রেফারেল কোড লিখুন বা জেনারেট করুন:' : 'Enter or Generate New Code:'}
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customCodeInput}
                  onChange={(e) => {
                    setCustomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                    setCodeError('');
                  }}
                  placeholder="e.g. VIP-BOSS, EARN99"
                  maxLength={12}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  id="input-custom-referral-code"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                  {customCodeInput.length}/12
                </span>
              </div>

              <button
                type="button"
                onClick={generateRandomCode}
                disabled={isGenerating}
                className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                title="Generate Random VIP Code"
                id="btn-generate-random-code"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{language === 'bn' ? 'র্যান্ডম' : 'Auto'}</span>
              </button>
            </div>

            {codeError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                <span>⚠️ {codeError}</span>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveCustomCode}
              disabled={isSavingCode || !customCodeInput || customCodeInput === activeReferralCode}
              className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow ${
                !customCodeInput || customCodeInput === activeReferralCode
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white active:scale-98'
              }`}
              id="btn-save-custom-referral-code"
            >
              {isSavingCode ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving Code...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'bn' ? 'কোড সংরক্ষণ ও সক্রিয় করুন' : 'Save & Activate Referral Code'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick presets generator suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'bn' ? 'জনপ্রিয় প্রি-সেট ফরম্যাট:' : 'Quick Presets Suggestions:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {[`VIP${Math.floor(100 + Math.random() * 900)}`, `BOSS${Math.floor(10 + Math.random() * 90)}`, `CASH77`, `FAST${Math.floor(100 + Math.random() * 900)}`].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      hapticFeedback.light();
                      setCustomCodeInput(preset);
                      setCodeError('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold transition-all"
                  >
                    +{preset}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: List of Active Referred Users */}
      {activeTab === 'friends' && (
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Header & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'নাম বা ইমেইল দিয়ে খুঁজুন...' : 'Search referred friend by name or email...'}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-750 transition-colors"
                id="input-search-referred-friends"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'bn' ? 'সকল' : 'All'} ({myFriends.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  filterStatus === 'active' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'bn' ? 'সক্রিয়' : 'Active'}
              </button>
            </div>
          </div>

          {/* List of Friends */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayedFriends.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 opacity-60" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                    {searchQuery
                      ? language === 'bn'
                        ? 'কোনো ফলাফল পাওয়া যায়নি'
                        : 'No friends matched your search'
                      : language === 'bn'
                      ? 'এখনো কোনো বন্ধু যুক্ত হয়নি'
                      : 'No referred users yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                    {language === 'bn'
                      ? 'আপনার রেফারেল লিংক সোশ্যাল মিডিয়ায় শেয়ার করে প্রথম কমিশন আয় শুরু করুন!'
                      : 'Share your referral code on WhatsApp, Telegram or Facebook to start earning commissions.'}
                  </p>
                </div>
                <button
                  onClick={handleShare}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow transition-transform active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ইনভাইট লিংক শেয়ার করুন' : 'Share Invite Link'}</span>
                </button>
              </div>
            ) : (
              displayedFriends.map((friend, idx) => {
                const isRecentlyActive =
                  friend.last_login && Date.now() - friend.last_login < 3 * 24 * 60 * 60 * 1000;
                const totalSubmitted = friend.total_submitted || 0;
                const approvedCount = friend.manual_approved_count || 0;
                const joinDate = friend.createdAt
                  ? new Date(friend.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={friend.uid || idx}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt={friend.username}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                            {(friend.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isRecentlyActive && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"
                            title="Active Now"
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-800 dark:text-slate-100 text-xs truncate">
                            {friend.username || 'Member'}
                          </span>
                          {friend.isTopSeller && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              TOP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          <span>Joined {joinDate}</span>
                          {totalSubmitted > 0 && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              • {totalSubmitted} Submitted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Activity */}
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isRecentlyActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isRecentlyActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </>
                        ) : (
                          <span>Joined</span>
                        )}
                      </span>
                      {approvedCount > 0 && (
                        <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                          {approvedCount} Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal Drawer */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'bn' ? 'রেফারেল QR কোড' : 'Referral QR Code'}</span>
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* QR Frame */}
            <div className="p-4 bg-slate-50 dark:bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <QRCode value={referralLink} size={180} fgColor="#4338ca" />
            </div>

            <div className="space-y-1">
              <div className="text-base font-black font-mono text-indigo-700 dark:text-indigo-400 tracking-wider">
                {activeReferralCode}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'এই কিউআর কোড স্ক্যান করে বন্ধু সরাসরি বোনাসসহ রেজিস্ট্রেশন করতে পারবে।'
                  : 'Scan this QR code to register instantly with your referral bonus.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : (language === 'bn' ? 'লিংক কপি' : 'Copy Link')}</span>
              </button>
              <button
                onClick={handleShare}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'শেয়ার' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
