import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../lib/haptics';
import {
  Copy,
  Check,
  Share2,
  Send,
  MessageCircle,
  Sparkles,
  Flame,
  ExternalLink,
  Smartphone,
  Facebook,
  CheckCircle2,
} from 'lucide-react';

interface ShareTemplatesProps {
  referralCode: string;
  referralLink: string;
}

export const ShareTemplates: React.FC<ShareTemplatesProps> = ({
  referralCode,
  referralLink,
}) => {
  const { language, signupBonusUser, copyText } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template Definitions
  const templates = [
    {
      id: 'bn-full',
      title: language === 'bn' ? 'সোশ্যাল মিডিয়া পোস্ট (বাংলা)' : 'Social Media Post (Bangla)',
      tag: 'বাংলা',
      tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      text: `🔥 জিমেইল একাউন্ট সেল করে প্রতিদিন টাকা ইনকাম করুন!
✅ আনলিমিটেড নিউ ও ওল্ড জিমেইল গ্রহণযোগ্য
✅ প্রতি জিমেইল ৳৮ - ৳১৫ পর্যন্ত রেট
✅ বিকাশ, নগদ, রকেটে ইনস্ট্যান্ট উত্তোলন
🎁 আমার রেফারেল লিংকে জয়েন করলেই পাবেন ৳${signupBonusUser} বোনাস!
👉 জয়েন লিংক: ${referralLink}
রেফারেল কোড: ${referralCode}`,
    },
    {
      id: 'bn-short',
      title: language === 'bn' ? 'শর্ট ইনভাইট মেসেজ (বাংলা)' : 'Short Invite Message (Bangla)',
      tag: 'বাংলা',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      text: `ঘরে বসে সহজে ইনকাম করতে চাইলে Mail Factory তে জয়েন করুন। জিমেইল সেল করলেই টাকা! এখনই একাউন্ট খুলুন: ${referralLink} (কোড: ${referralCode})`,
    },
    {
      id: 'en-full',
      title: language === 'bn' ? 'সোশ্যাল মিডিয়া পোস্ট (English)' : 'Social Media Post (English)',
      tag: 'English',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      text: `🚀 Earn Daily Cash by Exchanging Gmail Accounts on Mail Factory!
✅ Instant Approval & Highest Payout Rates (৳8 - ৳15 / account)
✅ Instant Withdrawals via bKash, Nagad & Rocket
🎁 Sign up with my link and get ৳${signupBonusUser} Instant Welcome Bonus!
👉 Join Now: ${referralLink}
Referral Code: ${referralCode}`,
    },
    {
      id: 'en-short',
      title: language === 'bn' ? 'শর্ট ইনভাইট মেসেজ (English)' : 'Short Invite Message (English)',
      tag: 'English',
      tagColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      text: `Start earning daily by selling Gmails on Mail Factory. Join with my referral code ${referralCode} and get instant bonus! Link: ${referralLink}`,
    },
    {
      id: 'tg-group',
      title: language === 'bn' ? 'টেলিগ্রাম ও হোয়াটসঅ্যাপ স্পেশাল' : 'Telegram & WhatsApp Special',
      tag: 'Chat & Channel',
      tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      text: `⚡ Mail Factory - বিশ্বস্ত জিমেইল এক্সচেঞ্জ প্ল্যাটফর্ম ⚡
━━━━━━━━━━━━━━━━━━
💰 প্রতি জিমেইলে সর্বোচ্চ রেট
⚡ ইনস্ট্যান্ট বিকাশ/নগদ পেমেন্ট
🎁 সাইনআপ করলেই ৳${signupBonusUser} বোনাস!

👉 রেজিস্ট্রেশন লিংক: ${referralLink}
🔑 রেফারেল কোড: ${referralCode}`,
    },
  ];

  // Copy template text
  const handleCopyTemplate = async (templateId: string, text: string) => {
    hapticFeedback.medium();
    const ok = await copyText(text, language === 'bn' ? 'মেসেজ কপি হয়েছে!' : 'Message template copied!');
    if (ok) {
      setCopiedId(templateId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = (text: string) => {
    hapticFeedback.light();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Share to Telegram
  const handleShareTelegram = (text: string) => {
    hapticFeedback.light();
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'bn' ? 'শেয়ার টেমপ্লেট ও রেডি-মেড পোস্ট' : 'Ready-to-Share Invite Templates'}</span>
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'bn'
            ? '১-ট্যাপে যেকোনো রেডিমেড মেসেজ কপি করে ফেসবুক, হোয়াটসঅ্যাপ বা টেলিগ্রামে শেয়ার করুন।'
            : 'Copy ready-to-use promotional copy with one tap and share directly to Facebook, WhatsApp, or Telegram.'}
        </p>
      </div>

      {/* Templates List matching user screenshot */}
      <div className="space-y-4">
        {templates.map((tpl) => {
          const isCopied = copiedId === tpl.id;

          return (
            <div
              key={tpl.id}
              className="rounded-3xl bg-[#111827] text-white p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5 transition-all hover:border-slate-700"
            >
              {/* Header with Title and Language Pill */}
              <div className="flex items-center justify-between">
                <h5 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <span>{tpl.title}</span>
                </h5>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${tpl.tagColor}`}>
                  {tpl.tag}
                </span>
              </div>

              {/* Template Content Box matching screenshot dark card */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text break-words">
                {tpl.text}
              </div>

              {/* Action Buttons: 1-Tap Copy & Social Shares */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Main 1-Tap Copy Button */}
                <button
                  onClick={() => handleCopyTemplate(tpl.id, tpl.text)}
                  className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-98 ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                  }`}
                  id={`btn-copy-template-${tpl.id}`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                      <span>{language === 'bn' ? 'মেসেজ কপি হয়েছে! ✓' : 'Message Copied! ✓'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-300" />
                      <span>{language === 'bn' ? 'মেসেজ কপি করুন' : 'Copy Message'}</span>
                    </>
                  )}
                </button>

                {/* Direct WhatsApp Share */}
                <button
                  onClick={() => handleShareWhatsApp(tpl.text)}
                  className="p-3 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 transition-all active:scale-95 flex items-center justify-center"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                {/* Direct Telegram Share */}
                <button
                  onClick={() => handleShareTelegram(tpl.text)}
                  className="p-3 rounded-2xl bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] border border-[#0088cc]/40 transition-all active:scale-95 flex items-center justify-center"
                  title="Share on Telegram"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
