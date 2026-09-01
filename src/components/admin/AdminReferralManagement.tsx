import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { hapticFeedback } from '../../lib/haptics';
import {
  Users,
  Award,
  Gift,
  Share2,
  Search,
  CheckCircle2,
  TrendingUp,
  Percent,
  Coins,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Send,
  Sparkles,
  QrCode,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../../types';

export const AdminReferralManagement: React.FC = () => {
  const {
    language,
    allUsers,
    commissionPercent,
    signupBonusUser,
    signupBonusReferrer,
    adminUpdateSettings,
    adminRewardReferral,
    addNotification,
  } = useApp();

  const t = translations[language];

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'top_earners' | 'top_recruits'>('all');
  const [expandedUserUid, setExpandedUserUid] = useState<string | null>(null);

  // Bonus Reward Modal State
  const [rewardModalUser, setRewardModalUser] = useState<UserProfile | null>(null);
  const [bonusAmount, setBonusAmount] = useState<string>('50');
  const [bonusNote, setBonusNote] = useState<string>('Top Referrer Milestone Bonus 🏆');
  const [isRewarding, setIsRewarding] = useState<boolean>(false);

  // Referral Settings Inline Editor
  const [rateCommission, setRateCommission] = useState<number>(commissionPercent);
  const [bonusUser, setBonusUser] = useState<number>(signupBonusUser);
  const [bonusReferrer, setBonusReferrer] = useState<number>(signupBonusReferrer);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Compute Referral Network Statistics
  const referralStats = useMemo(() => {
    let totalCommissionsDistributed = 0;
    let totalReferredMembers = 0;
    let referrersCount = 0;

    allUsers.forEach((u) => {
      const earned = Number(u.referralEarnings) || 0;
      const count = Number(u.referralCount) || 0;
      totalCommissionsDistributed += earned;
      totalReferredMembers += count;
      if (count > 0 || earned > 0) {
        referrersCount += 1;
      }
    });

    return {
      totalCommissionsDistributed,
      totalReferredMembers,
      referrersCount,
    };
  }, [allUsers]);

  // Build referrers list with their referred members lookup
  const referrersList = useMemo(() => {
    return allUsers.map((u) => {
      // Find friends referred by this user
      const userRefCode = (u.referralCode || '').trim().toUpperCase();
      const myFriends = userRefCode
        ? allUsers.filter((f) => f.referredBy && f.referredBy.trim().toUpperCase() === userRefCode)
        : [];

      return {
        ...u,
        calculatedFriends: myFriends,
        totalRecruits: Math.max(u.referralCount || 0, myFriends.length),
        totalEarnings: Number(u.referralEarnings) || 0,
      };
    });
  }, [allUsers]);

  // Filtered & Sorted Referrers
  const filteredReferrers = useMemo(() => {
    let list = [...referrersList];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.username || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.referralCode || '').toLowerCase().includes(q) ||
          (u.uid || '').toLowerCase().includes(q)
      );
    }

    // Filter type
    if (filterType === 'top_earners') {
      list = list.filter((u) => u.totalEarnings > 0);
    } else if (filterType === 'top_recruits') {
      list = list.filter((u) => u.totalRecruits > 0);
    }

    // Sort by recruits & earnings descending
    list.sort((a, b) => {
      if (b.totalRecruits !== a.totalRecruits) {
        return b.totalRecruits - a.totalRecruits;
      }
      return b.totalEarnings - a.totalEarnings;
    });

    return list;
  }, [referrersList, searchQuery, filterType]);

  // Handle Save Referral Rules
  const handleSaveReferralRules = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticFeedback.heavy();
    setIsSavingSettings(true);

    const res = await adminUpdateSettings({
      commission_percent: Number(rateCommission),
      signup_bonus_user: Number(bonusUser),
      signup_bonus_referrer: Number(bonusReferrer),
    });

    setIsSavingSettings(false);
  };

  // Handle Disburse Referral Bonus
  const handleDisburseBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardModalUser) return;
    const amount = Number(bonusAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid bonus amount');
      return;
    }

    hapticFeedback.heavy();
    setIsRewarding(true);

    const res = await adminRewardReferral(rewardModalUser.uid, amount, bonusNote);
    setIsRewarding(false);

    if (res.success) {
      setRewardModalUser(null);
      setBonusAmount('50');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Summary Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-black">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800">
              {language === 'bn' ? 'রেফারেল হাব ও নেটওয়ার্ক ম্যানেজমেন্ট' : 'Referral Hub & Affiliate Manager'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'ইউজারদের রেফারেল পরিসংখ্যান মনিটরিং ও বোনাস নিয়ন্ত্রণ'
                : 'Monitor viral growth, referral tiers, and distribute custom bonuses'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs font-black flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-purple-600" />
            <span>{commissionPercent}% Lifetime Commission</span>
          </span>
        </div>
      </div>

      {/* Network Overview 4-Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase">Total Recruits</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-800 font-mono">{referralStats.totalReferredMembers}</p>
          <p className="text-[10px] text-slate-400">Invited via referral links</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase">Commission Paid</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 font-mono">
            ৳{referralStats.totalCommissionsDistributed.toFixed(2)}
          </p>
          <p className="text-[10px] text-emerald-600/80 font-medium">To active promoters</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase">Active Promoters</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-800 font-mono">{referralStats.referrersCount}</p>
          <p className="text-[10px] text-slate-400">Earned at least 1 referral</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase">Commission Rate</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-600 font-mono">{commissionPercent}%</p>
          <p className="text-[10px] text-slate-400">On every verified Gmail</p>
        </div>
      </div>

      {/* Referral Incentive Settings Form */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{language === 'bn' ? 'রেফারেল কমিশন ও বোনাস সেটিংস' : 'Referral Commission & Incentive Rules'}</span>
          </h3>
        </div>

        <form onSubmit={handleSaveReferralRules} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Commission Per Gmail (%):
            </label>
            <input
              type="number"
              value={rateCommission}
              onChange={(e) => setRateCommission(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              User Welcome Bonus (৳):
            </label>
            <input
              type="number"
              value={bonusUser}
              onChange={(e) => setBonusUser(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Referrer Sign-up Bonus (৳):
            </label>
            <input
              type="number"
              value={bonusReferrer}
              onChange={(e) => setBonusReferrer(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving Rules...' : 'Save Referral Rules ⚙️'}
            </button>
          </div>
        </form>
      </div>

      {/* Referrers Leaderboard & Friends Explorer */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{language === 'bn' ? 'টপ রেফারার তালিকা ও একাউন্ট' : 'Top Referrers Directory'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Showing {filteredReferrers.length} active promoters
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Filter Pills */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-[11px] font-bold w-full sm:w-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition-all ${
                  filterType === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('top_recruits')}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition-all ${
                  filterType === 'top_recruits' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                With Recruits
              </button>
              <button
                onClick={() => setFilterType('top_earners')}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition-all ${
                  filterType === 'top_earners' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Commission Earners
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search referrer or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Referrers List Table */}
        <div className="divide-y divide-slate-100">
          {filteredReferrers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-500" />
              <p>{language === 'bn' ? 'কোনো রেফারেল রেকর্ড পাওয়া যায়নি' : 'No referrer records found'}</p>
            </div>
          ) : (
            filteredReferrers.map((userItem, idx) => {
              const isExpanded = expandedUserUid === userItem.uid;

              return (
                <div key={userItem.uid} className="py-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                        {userItem.photoURL ? (
                          <img src={userItem.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          (userItem.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-slate-800 truncate">
                            {userItem.username || 'User'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                            Code: {userItem.referralCode || 'N/A'}
                          </span>
                          {userItem.referredBy && (
                            <span className="text-[10px] text-slate-400">
                              (Referred by: {userItem.referredBy})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{userItem.email}</p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-black text-indigo-600 font-mono">
                          {userItem.totalRecruits} Friends
                        </p>
                        <p className="text-[11px] font-black text-emerald-600 font-mono">
                          +৳{userItem.totalEarnings.toFixed(2)} Earned
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          hapticFeedback.light();
                          setRewardModalUser(userItem);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/30 text-xs font-black transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>{language === 'bn' ? 'বোনাস দিন' : 'Bonus'}</span>
                      </button>

                      <button
                        onClick={() => {
                          hapticFeedback.light();
                          setExpandedUserUid(isExpanded ? null : userItem.uid);
                        }}
                        className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Friend List under this Referrer */}
                  {isExpanded && (
                    <div className="pl-12 pr-2 py-3 bg-slate-50/60 rounded-2xl border border-slate-200/60 space-y-2">
                      <h5 className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {language === 'bn' ? 'আমন্ত্রিত ফ্রেন্ড তালিকা' : 'Referred Friend Accounts'} (
                          {userItem.calculatedFriends.length})
                        </span>
                      </h5>

                      {userItem.calculatedFriends.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No direct user database matches registered under code "{userItem.referralCode}".
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {userItem.calculatedFriends.map((friend) => (
                            <div
                              key={friend.uid}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-black text-slate-800 truncate">{friend.username || 'User'}</p>
                                <p className="text-[10px] text-slate-400 truncate">{friend.email}</p>
                              </div>
                              <div className="text-right ml-2 font-mono">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                                  {friend.manual_approved_count || 0} Gmails
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Disburse Bonus Modal */}
      {rewardModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {language === 'bn' ? 'রেফারেল বোনাস প্রদান করুন' : 'Reward Referral Bonus'}
                </h3>
                <p className="text-xs text-slate-400">
                  To: <span className="font-bold text-slate-700">{rewardModalUser.username}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleDisburseBonus} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Bonus Amount (৳):</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Bonus Note / Reason:</label>
                <input
                  type="text"
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  placeholder="e.g. Top 10 referral milestone"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRewardModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRewarding}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all disabled:opacity-50"
                >
                  {isRewarding ? 'Crediting...' : 'Credit Bonus 🎁'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
