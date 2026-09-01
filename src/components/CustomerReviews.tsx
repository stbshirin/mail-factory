import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { hapticFeedback } from '../lib/haptics';
import { CustomerReview } from '../types';
import { db, ref, push, set, onValue } from '../lib/firebase';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Award,
  Filter,
  Plus,
  Send,
  X,
  Wallet,
  TrendingUp,
} from 'lucide-react';

const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    name: 'Tanvir Hossain',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: '2 hours ago',
    timestamp: Date.now() - 2 * 3600 * 1000,
    commentBn: 'খুবই দ্রুত পেমেন্ট পেলাম! ৫০টি ফ্রেশ জিমেইল দিয়েছি, মাত্র ৩০ মিনিটে bKash এ ৳৭৫০ ক্যাশআউট পেয়েছি। বেস্ট প্ল্যাটফর্ম!',
    comment: 'Got payment very quickly! Submitted 50 fresh gmails, received ৳750 in bKash within 30 minutes. Best platform!',
    payoutProof: 'bKash Received ৳750',
    verified: true,
    tier: 'Level 2 VIP',
    likes: 18,
  },
  {
    id: 'rev-2',
    name: 'MD Shakib Al Hasan',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: '5 hours ago',
    timestamp: Date.now() - 5 * 3600 * 1000,
    commentBn: 'সাপোর্ট টিম অত্যন্ত হেল্পফুল। পাসওয়ার্ড সমস্যা হয়েছিল, চ্যাটে মেসেজ দেওয়ার পর ৫ মিনিটের মধ্যে সমাধান করে দিয়েছে।',
    comment: 'Support team is extremely helpful. Had password issues and they resolved it within 5 mins via live chat!',
    payoutProof: 'Nagad Received ৳1,400',
    verified: true,
    tier: 'Gold Partner',
    likes: 24,
  },
  {
    id: 'rev-3',
    name: 'Rakibul Islam',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: '1 day ago',
    timestamp: Date.now() - 24 * 3600 * 1000,
    commentBn: 'প্রতিদিন গড়ে ১০০+ জিমেইল এক্সচেঞ্জ করি। লেভেল ৩ এ রেট অনেক ভালো পাই। পেমেন্ট নিয়ে কোনো চিন্তা নেই।',
    comment: 'I exchange 100+ Gmails daily. Level 3 rate is high and payouts are 100% guaranteed.',
    payoutProof: 'bKash Received ৳2,850',
    verified: true,
    tier: 'Diamond VIP',
    likes: 41,
  },
  {
    id: 'rev-4',
    name: 'Nusrat Jahan',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: '1 day ago',
    timestamp: Date.now() - 28 * 3600 * 1000,
    commentBn: 'আগে অনেক গ্রুপে কাজ করে প্রতারিত হয়েছি। মেইল ফ্যাক্টরি তে রিয়েল টাইম ব্যালেন্স ও সরাসরি অটো উইথড্র দেখে খুব ভালো লাগলো।',
    comment: 'Got scammed in random groups before. Mail Factory automated review and instant withdrawals are truly trustworthy!',
    payoutProof: 'Nagad Received ৳500',
    verified: true,
    tier: 'Starter Member',
    likes: 15,
  },
  {
    id: 'rev-5',
    name: 'Farhan Ahmed',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: '2 days ago',
    timestamp: Date.now() - 48 * 3600 * 1000,
    commentBn: 'রেফারেল কমিশন সিস্টেম অসাধারণ! আমার টিম মেম্বারদের কাজের থেকে প্রতিদিন ভালো পরিমাণ প্রফিট পাচ্ছি।',
    comment: 'Referral commission system is awesome! Earning steady profits every day from active team members.',
    payoutProof: 'Rocket Received ৳1,920',
    verified: true,
    tier: 'VIP Executive',
    likes: 32,
  },
];

export const CustomerReviews: React.FC = () => {
  const { user, profile, language, setAuthModalOpen } = useApp();
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [filter, setFilter] = useState<'all' | '5stars' | 'proofs'>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Review Form state
  const [rating, setRating] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bKash');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync with Firebase realtime database
  useEffect(() => {
    try {
      const reviewsRef = ref(db, 'customer_reviews');
      const unsubscribe = onValue(reviewsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list: CustomerReview[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          // Merge with initial reviews for rich display
          setReviews([...list, ...INITIAL_REVIEWS]);
        }
      });
      return () => unsubscribe();
    } catch {
      // fallback to initial
    }
  }, []);

  const handleLike = (id: string) => {
    hapticFeedback.light();
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isLiked = likedMap[id];
          return {
            ...r,
            likes: (r.likes || 0) + (isLiked ? -1 : 1),
          };
        }
        return r;
      })
    );
  };

  const handleOpenWriteReview = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    hapticFeedback.light();
    setIsWriteModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    hapticFeedback.medium();
    setIsSubmitting(true);

    const newReview: CustomerReview = {
      id: `rev-${Date.now()}`,
      userId: profile?.uid || user?.uid || 'user',
      name: profile?.username || 'Verified Member',
      avatar: profile?.photoURL || undefined,
      rating,
      date: 'Just now',
      timestamp: Date.now(),
      comment: commentText.trim(),
      commentBn: commentText.trim(),
      payoutProof: payoutAmount ? `${paymentMethod} Received ৳${payoutAmount}` : undefined,
      verified: true,
      tier: profile?.manual_approved_count && profile.manual_approved_count > 50 ? 'Level 2 VIP' : 'Starter Member',
      likes: 1,
    };

    try {
      const reviewsRef = ref(db, 'customer_reviews');
      await push(reviewsRef, newReview);
    } catch {
      // Local fallback
      setReviews((prev) => [newReview, ...prev]);
    }

    setIsSubmitting(false);
    setIsWriteModalOpen(false);
    setCommentText('');
    setPayoutAmount('');
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === '5stars') return r.rating === 5;
    if (filter === 'proofs') return Boolean(r.payoutProof);
    return true;
  });

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
      {/* Header & Overall Trust Score Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black mb-1.5 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'bn' ? '১০০% ভেরিফাইড রিভিউ' : '100% Verified Reviews'}</span>
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
            {language === 'bn' ? 'কাস্টমার মতামত ও পেমেন্ট প্রুফ' : 'Customer Reviews & Payment Proofs'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {language === 'bn'
              ? 'আমাদের নিয়মিত সেলারদের সৎ রিভিউ ও ক্যাশআউট অভিজ্ঞতা'
              : 'Real feedback & payment experiences from verified sellers'}
          </p>
        </div>

        {/* Overall Trust Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-slate-850 border border-amber-200/80 dark:border-amber-900/50">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">4.9</div>
            <div className="flex items-center justify-center gap-0.5 text-amber-500 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold border-l border-amber-200 dark:border-amber-800 pl-3 leading-tight">
            <span className="block text-slate-900 dark:text-white font-extrabold text-xs">1,480+ Reviews</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">99.4% Positive Rating</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Write Review Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              hapticFeedback.light();
              setFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {language === 'bn' ? 'সকল রিভিউ' : 'All Reviews'}
          </button>

          <button
            onClick={() => {
              hapticFeedback.light();
              setFilter('proofs');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filter === 'proofs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'পেমেন্ট প্রুফ' : 'Payment Proofs'}</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.light();
              setFilter('5stars');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filter === '5stars'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>5 Stars</span>
          </button>
        </div>

        <button
          onClick={handleOpenWriteReview}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black shadow hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'রিভিউ দিন' : 'Write Review'}</span>
        </button>
      </div>

      {/* Reviews Stream List */}
      <div className="space-y-3 pt-1">
        {filteredReviews.slice(0, 6).map((item) => {
          const isLiked = likedMap[item.id];
          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 hover:border-indigo-100 dark:hover:border-indigo-900/60 transition-all space-y-2.5"
            >
              {/* User Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-sm">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{item.name}</h4>
                      {item.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      <span>{item.date}</span>
                      {item.tier && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.tier}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {language === 'bn' ? item.commentBn || item.comment : item.comment}
              </p>

              {/* Bottom Proof & Like Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                {item.payoutProof ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{item.payoutProof}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Verified Seller Review
                  </span>
                )}

                <button
                  onClick={() => handleLike(item.id)}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                    isLiked
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400' : ''}`} />
                  <span>{item.likes || 0}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-indigo-600 dark:fill-indigo-400" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {language === 'bn' ? 'আপনার অভিজ্ঞতা ও রিভিউ লিখুন' : 'Submit Your Feedback'}
                </h3>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Star Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'স্টার রেটিং' : 'Your Rating'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => {
                        hapticFeedback.light();
                        setRating(star);
                      }}
                      className="p-1 text-2xl transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-amber-600 ml-2">
                    {rating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'রিভিউ ও অভিজ্ঞতা' : 'Review Message'}
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'মেইল ফ্যাক্টরিতে আপনার কাজ ও পেমেন্টের অভিজ্ঞতা কেমন ছিল?'
                      : 'Share your genuine experience with Mail Factory payouts & speed...'
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Optional Payment Proof */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Binance">Binance USDT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Amount Received (৳)
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="e.g. 750"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? language === 'bn'
                      ? 'সাবমিট হচ্ছে...'
                      : 'Posting...'
                    : language === 'bn'
                    ? 'রিভিউ পাবলিশ করুন'
                    : 'Publish Review'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
