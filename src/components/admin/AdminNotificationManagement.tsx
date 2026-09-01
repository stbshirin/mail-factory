import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { hapticFeedback } from '../../lib/haptics';
import {
  Bell,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
  Users,
  User,
  Megaphone,
  Sparkles,
  Clock,
  Radio,
  Search,
} from 'lucide-react';
import { BroadcastNotification } from '../../types';

export const AdminNotificationManagement: React.FC = () => {
  const {
    language,
    allUsers,
    broadcastNotifications,
    adminSendBroadcastNotification,
    adminDeleteBroadcastNotification,
    addNotification,
  } = useApp();

  const t = translations[language];

  // Composer Form State
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedTargetUid, setSelectedTargetUid] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifDesc, setNotifDesc] = useState<string>('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'danger'>('info');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Quick Preset Templates
  const templates = [
    {
      title: '🚀 নতুন জিমেইল রেট বৃদ্ধি!',
      desc: 'সম্মানিত সেলারগণ, জিমেইল এক্সচেঞ্জ রেট বৃদ্ধি করা হয়েছে! সর্বোচ্চ রেটে বিক্রি করতে এখনই সাবমিট করুন।',
      type: 'success' as const,
    },
    {
      title: '⏰ লাইভ রিভিউ শিফট চলমান!',
      desc: 'শুভ রাত্রি রিভিউ শিফট শুরু হয়েছে। আপনার জিমেইল ব্যাচ দ্রুত রিভিউ ও পেমেন্ট পেতে এখনই সাবমিট করুন।',
      type: 'info' as const,
    },
    {
      title: '💸 পে-আউট নোটিশ: পেমেন্ট সম্পূর্ণ',
      desc: 'আজকের সকল পেন্ডিং বিকাশ/নগদ উত্তোলন সফলভাবে পাঠানো হয়েছে। ওয়ালেট ট্রানজেকশন চেক করুন।',
      type: 'success' as const,
    },
    {
      title: '⚠️ সতর্কবার্তা: সঠিক পাসওয়ার্ড দিন',
      desc: 'ভুল পাসওয়ার্ড ও 2FA যুক্ত জিমেইল সরাসরি বাতিল হবে। অনুগ্রহ করে যাচাইকৃত ও ফ্রেশ জিমেইল সাবমিট করুন।',
      type: 'warning' as const,
    },
    {
      title: '⚙️ সিস্টেম মেইনটেন্যান্স অ্যালার্ট',
      desc: 'সার্ভার আপগ্রেডের জন্য সাময়িক মেইনটেন্যান্স চলবে। আপনার ব্যালেন্স ও ডাটা শতভাগ নিরাপদ রয়েছে।',
      type: 'danger' as const,
    },
  ];

  // Filtered users for specific selector
  const filteredUsers = allUsers.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase().trim();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q)
    );
  });

  const selectedTargetUser = allUsers.find((u) => u.uid === selectedTargetUid);

  // Handle Form Submit
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifDesc.trim()) {
      alert(language === 'bn' ? 'দয়া করে শিরোনাম এবং বার্তা লিখুন' : 'Please enter title and description');
      return;
    }

    if (targetType === 'specific' && !selectedTargetUid) {
      alert(language === 'bn' ? 'দয়া করে একজন ইউজার নির্বাচন করুন' : 'Please select a target user');
      return;
    }

    hapticFeedback.heavy();
    setIsSending(true);

    const res = await adminSendBroadcastNotification({
      title: notifTitle,
      desc: notifDesc,
      type: notifType,
      targetUserId: targetType === 'specific' ? selectedTargetUid : undefined,
      targetUserEmail: targetType === 'specific' ? selectedTargetUser?.email || selectedTargetUser?.username : undefined,
    });

    setIsSending(false);

    if (res.success) {
      setNotifTitle('');
      setNotifDesc('');
      setSelectedTargetUid('');
    }
  };

  const handleApplyTemplate = (tmpl: { title: string; desc: string; type: 'info' | 'success' | 'warning' | 'danger' }) => {
    hapticFeedback.light();
    setNotifTitle(tmpl.title);
    setNotifDesc(tmpl.desc);
    setNotifType(tmpl.type);
  };

  const handleDeleteBroadcast = async (key?: string) => {
    if (!key) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি এই নোটিফিকেশনটি মুছে ফেলতে চান?' : 'Delete this notification?')) {
      hapticFeedback.medium();
      await adminDeleteBroadcastNotification(key);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Summary Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-black">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800">
              {language === 'bn' ? 'নোটিফিকেশন ও ব্রডকাস্ট ম্যানেজার' : 'Broadcast & Notification Hub'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'সকল ইউজারকে অথবা নির্দিষ্ট গ্রাহককে সরাসরি পুশ নোটিফিকেশন পাঠান'
                : 'Send instant push & in-app alerts to all members or direct individuals'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>{allUsers.length} Active Users</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Composer & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 cols): Dispatch Composer */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <span>{language === 'bn' ? 'নতুন নোটিফিকেশন পাঠান' : 'Compose New Notification'}</span>
          </h3>

          <form onSubmit={handleDispatch} className="space-y-4">
            {/* Target Audience Selector */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-600 block mb-1.5">
                {language === 'bn' ? 'প্রাপক নির্বাচন করুন:' : 'Target Audience:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('all');
                    setSelectedTargetUid('');
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                    targetType === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{language === 'bn' ? 'সকল ইউজার (গ্লোবাল)' : 'All Registered Users'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                    targetType === 'specific'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নির্দিষ্ট ইউজার' : 'Specific Target User'}</span>
                </button>
              </div>
            </div>

            {/* Specific User Search & Select (Conditional) */}
            {targetType === 'specific' && (
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <label className="text-[11px] font-bold text-indigo-900 block">
                  {language === 'bn' ? 'ইউজার খুঁজুন ও সিলেক্ট করুন:' : 'Search & Select Target User:'}
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email or UID..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {filteredUsers.slice(0, 15).map((u) => (
                    <button
                      key={u.uid}
                      type="button"
                      onClick={() => setSelectedTargetUid(u.uid)}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                        selectedTargetUid === u.uid
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{u.username || 'User'} ({u.email})</span>
                      <span className="text-[10px] opacity-70 ml-2 font-mono">৳{(u.balance || 0).toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Type Selector */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-600 block mb-1.5">
                {language === 'bn' ? 'নোটিফিকেশনের ধরন (Type):' : 'Notification Type:'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'info', label: 'Info (নীল)', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                  { id: 'success', label: 'Success (সবুজ)', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
                  { id: 'warning', label: 'Warning (হলুদ)', color: 'border-amber-300 text-amber-700 bg-amber-50' },
                  { id: 'danger', label: 'Urgent (লাল)', color: 'border-rose-300 text-rose-700 bg-rose-50' },
                ].map((tOption) => (
                  <button
                    key={tOption.id}
                    type="button"
                    onClick={() => setNotifType(tOption.id as any)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-black border transition-all text-center ${
                      notifType === tOption.id
                        ? `${tOption.color} ring-2 ring-indigo-500 shadow-xs`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Title */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                {language === 'bn' ? 'নোটিফিকেশন শিরোনাম (Title):' : 'Notification Title:'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: নতুন রেট আপডেট বা অফার...' : 'e.g. Rate Hike Update or Maintenance Notice'}
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Notification Description */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                {language === 'bn' ? 'বিস্তারিত বার্তা (Description):' : 'Detailed Message / Description:'}
              </label>
              <textarea
                rows={3}
                placeholder={language === 'bn' ? 'ইউজারদের জন্য বার্তা লিখুন...' : 'Write message content to display on users screen...'}
                value={notifDesc}
                onChange={(e) => setNotifDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSending || !notifTitle.trim() || !notifDesc.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSending
                  ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Dispatching...')
                  : targetType === 'all'
                  ? (language === 'bn' ? 'গ্লোবাল ব্রডকাস্ট পাঠান 📢' : 'Broadcast to All Users 📢')
                  : (language === 'bn' ? 'নির্দিষ্ট গ্রাহককে পাঠান 👤' : 'Send to Specific User 👤')}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column (1 col): Fast Presets / Templates */}
        <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === 'bn' ? 'দ্রুত রেডিমেড টেমপ্লেট' : 'Quick Presets & Templates'}</span>
            </h3>

            <div className="space-y-2">
              {templates.map((tpl, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-700 truncate">
                      {tpl.title}
                    </h4>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        tpl.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tpl.type === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : tpl.type === 'danger'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tpl.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{tpl.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
            <p className="font-extrabold flex items-center gap-1 mb-0.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Realtime Delivery:</span>
            </p>
            <p className="text-indigo-700 text-[10px]">
              Notifications are immediately synced across all mobile, desktop, and web clients via Firebase Realtime Database.
            </p>
          </div>
        </div>
      </div>

      {/* Sent Broadcasts History Table */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>{language === 'bn' ? 'ব্রডকাস্ট ও নোটিফিকেশন হিস্ট্রি' : 'Broadcast & Notice History'}</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Total: {broadcastNotifications.length}
          </span>
        </div>

        {broadcastNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-500" />
            <p>{language === 'bn' ? 'কোনো নোটিফিকেশন পাঠানো হয়নি' : 'No broadcast history found'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {broadcastNotifications.map((b) => {
              const timeStr = b.timestamp
                ? new Date(b.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <div key={b.key || b.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        b.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.type === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : b.type === 'danger'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {b.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : b.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : b.type === 'danger' ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-slate-800">{b.title}</h4>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            b.targetUserId
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {b.targetUserId ? `Direct: ${b.targetUserEmail || b.targetUserId.slice(0, 6)}` : 'Global Broadcast'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">{b.desc}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                        <span>{timeStr}</span>
                        <span>•</span>
                        <span>Sent by: {b.sentBy || 'Admin'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBroadcast(b.key)}
                    title="Delete Notification"
                    className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
