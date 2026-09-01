import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { BuyerPackage, BuyerOrder } from '../../types';
import {
  ShoppingBag,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Copy,
  ExternalLink,
  ChevronRight,
  PackageCheck,
  AlertCircle,
  CreditCard,
  Send,
  Lock,
  ArrowRight,
  Download,
  Info
} from 'lucide-react';
import { hapticFeedback } from '../../lib/haptics';
import { ref, onValue, push, set, update } from 'firebase/database';
import { db } from '../../lib/firebase';

import { DepositFundsSection } from '../buyer/DepositFundsSection';

const DEFAULT_PACKAGES: BuyerPackage[] = [
  {
    id: 'fresh-usa-10',
    sku: 'GM-USA-FRESH',
    title: 'USA High Quality Fresh Gmail (Phone Verified)',
    titleBn: 'ইউএসএ হাই কোয়ালিটি ফ্রেশ জিমেইল (ফোন ভেরিফাইড)',
    category: 'fresh',
    categoryBadge: 'USA Fresh',
    price: 18.5,
    minQty: 5,
    inStock: 450,
    deliveryTime: 'Instant / 5-15 mins',
    warranty: '48 Hours Replacement Warranty',
    imageType: 'fresh',
    description: '100% Unique IP Created, Recovery Mail Included, SMS Verified, Zero spam score.',
    descriptionBn: '১০০% রিয়েল আইপি ক্রিয়েটেড, রিকভারি মেইল সহ, এসএমএস ভেরিফাইড এবং লাইভ গ্যারান্টি।',
    active: true,
  },
  {
    id: 'fresh-bd-10',
    sku: 'GM-BD-FRESH',
    title: 'Bangladesh Fresh Gmail (Personal / Mix IP)',
    titleBn: 'বাংলাদেশ ফ্রেশ জিমেইল (পার্সোনাল / মিক্সড আইপি)',
    category: 'fresh',
    categoryBadge: 'BD Fresh',
    price: 14.0,
    minQty: 10,
    inStock: 1280,
    deliveryTime: 'Instant Auto-Delivery',
    warranty: '24 Hours Replacement Warranty',
    imageType: 'fresh',
    description: 'Clean Bangladeshi Fresh Mail accounts. Recovery active, tested for Youtube, CPA, PlayStore.',
    descriptionBn: 'ক্লিন বাংলাদেশ ফ্রেশ জিমেইল একাউন্ট। রিকভারি সেট করা, সকল মার্কেটপ্লেস ও প্ল্যাটফর্মে ব্যবহারযোগ্য।',
    active: true,
  },
  {
    id: 'aged-2022-2023',
    sku: 'GM-AGED-OLD',
    title: 'Aged Old Gmail Accounts (2021-2023 Vintage)',
    titleBn: 'ওল্ড ভিন্টেজ জিমেইল একাউন্ট (২০২১-২০২৩ সালের পুরাতন)',
    category: 'aged',
    categoryBadge: '2+ Yrs Old',
    price: 38.0,
    minQty: 2,
    inStock: 190,
    deliveryTime: 'Instant / 10 mins',
    warranty: '7 Days Replacement Warranty',
    imageType: 'old',
    description: 'Ultra high-trust aged vintage accounts with realistic cookies and active histories. Safe from disabling.',
    descriptionBn: 'উচ্চ ট্রাস্ট স্কোর সম্বলিত পুরাতন জিমেইল। ফেসবুক এডস, গুগল এডস এবং যেকোনো বিজনেস কাজের জন্য উপযুক্ত।',
    active: true,
  },
  {
    id: 'bulk-wholesale-50',
    sku: 'GM-BULK-FRESH',
    title: 'Wholesale Bulk Fresh Gmail Bundle (50+ Pack)',
    titleBn: 'হোলসেল বাল্ক ফ্রেশ জিমেইল বান্ডেল (৫০+ প্যাক)',
    category: 'fresh',
    categoryBadge: 'Bulk Pack',
    price: 12.5,
    minQty: 50,
    inStock: 3500,
    deliveryTime: 'Instant Batch Delivery',
    warranty: '48 Hours Replacement Guarantee',
    imageType: 'fresh',
    description: 'Cost effective wholesale batch. High deliverability and verified POP3/IMAP access.',
    descriptionBn: 'পাইকারি রেটে ৫০ বা ততোধিক জিমেইল বান্ডেল। দ্রুত ডেলিভারি ও ফুল ওয়ারেন্টি সুবিধা।',
    active: true,
  },
];

export const BuyerView: React.FC = () => {
  const { user, profile, language, setAuthModalOpen, depositRequests, setActiveTab } = useApp();
  const t = translations[language];

  const [packages, setPackages] = useState<BuyerPackage[]>(DEFAULT_PACKAGES);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'fresh' | 'aged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Order Modal State
  const [selectedPackage, setSelectedPackage] = useState<BuyerPackage | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<BuyerOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Buyer Orders History & Tab Navigation
  const [myOrders, setMyOrders] = useState<BuyerOrder[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<'marketplace' | 'deposit' | 'my-orders' | 'deposit-history'>('marketplace');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync Live Packages from Firebase if available
  useEffect(() => {
    const packagesRef = ref(db, 'buyer_packages');
    const unsub = onValue(packagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: BuyerPackage[] = Object.keys(val).map((k) => ({
          ...val[k],
          id: k,
        }));
        if (list.length > 0) {
          setPackages(list.filter((p) => p.active !== false));
        }
      }
    });

    return () => unsub();
  }, []);

  // Sync My Orders
  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(db, `buyer_orders`);
    const unsub = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: BuyerOrder[] = Object.keys(val)
          .map((k) => ({
            ...val[k],
            key: k,
          }))
          .filter((o) => o.userId === user.uid)
          .sort((a, b) => (b.orderedAt || 0) - (a.orderedAt || 0));
        setMyOrders(list);
      } else {
        setMyOrders([]);
      }
    });

    return () => unsub();
  }, [user]);

  const handleOpenOrder = (pkg: BuyerPackage) => {
    hapticFeedback.light();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedPackage(pkg);
    setOrderQuantity(pkg.minQty || 5);
    setErrorMsg('');
    setOrderSuccess(null);
  };

  const handleConfirmOrder = async () => {
    if (!user || !profile || !selectedPackage) return;
    hapticFeedback.medium();
    setErrorMsg('');

    const unitPrice = selectedPackage.price;
    const totalPrice = unitPrice * orderQuantity;
    const currentBalance = Number(profile.balance) || 0;

    if (currentBalance < totalPrice) {
      setErrorMsg(
        language === 'bn'
          ? `আপনার ব্যালেন্স অপর্যাপ্ত। মোট প্রয়োজন ৳${totalPrice.toFixed(2)}, আপনার ব্যালেন্সে আছে ৳${currentBalance.toFixed(2)}। অনুগ্রহ করে ওয়ালেট ডিপোজিট করুন।`
          : `Insufficient balance. Total required ৳${totalPrice.toFixed(2)}, you have ৳${currentBalance.toFixed(2)}. Please deposit funds first.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Deduct Balance
      const newBalance = currentBalance - totalPrice;
      await update(ref(db, `users/${user.uid}`), {
        balance: newBalance,
      });

      // 2. Create Order in Firebase
      const orderRef = push(ref(db, 'buyer_orders'));
      const orderData: BuyerOrder = {
        id: `BO-${Date.now().toString().slice(-6)}`,
        userId: user.uid,
        userEmail: user.email || '',
        username: profile.name || 'Valued Buyer',
        packageId: selectedPackage.id,
        packageSku: selectedPackage.sku,
        packageTitle: selectedPackage.title,
        quantity: orderQuantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        status: 'pending',
        orderedAt: Date.now(),
        buyerNotes: orderNotes,
      };

      await set(orderRef, orderData);

      // 3. Create Notification for user
      const notifRef = push(ref(db, `user_notifications/${user.uid}`));
      await set(notifRef, {
        title: language === 'bn' ? 'জিমেইল অর্ডার সফলভাবে গৃহীত হয়েছে' : 'Gmail Order Placed Successfully',
        desc: language === 'bn'
          ? `${selectedPackage.title} (${orderQuantity} টি) অর্ডারের জন্য ৳${totalPrice.toFixed(2)} কাটা হয়েছে। আমাদের ডেলিভারি টিম দ্রুত প্রসেস করছে।`
          : `Order placed for ${orderQuantity}x ${selectedPackage.title}. ৳${totalPrice.toFixed(2)} deducted. Delivery in progress.`,
        type: 'success',
        timestamp: Date.now(),
        read: false,
      });

      setOrderSuccess(orderData);
      setSelectedPackage(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    hapticFeedback.light();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesFilter = selectedFilter === 'all' || pkg.category === selectedFilter;
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.titleBn && pkg.titleBn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pkg.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6 animate-fade-in pb-24">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 text-white p-6 shadow-xl border border-amber-400/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>{language === 'bn' ? 'অফিসিয়াল বায়ার মার্কেটপ্লেস' : 'Official Buyer Marketplace'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'bn' ? 'ভেরিফাইড ফ্রেশ ও ওল্ড জিমেইল কিনুন' : 'Buy Verified Fresh & Aged Gmails'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl leading-relaxed">
              {language === 'bn'
                ? '১০০% ওয়ারেন্টি সহ রিয়েল আইপি ক্রিয়েটেড ফ্রেশ ও ওল্ড জিমেইল। ইনস্ট্যান্ট অটো ডেলিভারি এবং ২৪/৭ রিপ্লেসমেন্ট গ্যারান্টি।'
                : 'Premium quality verified Gmail packages with instant delivery, active recovery mails, and replacement guarantee.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-200 block">
                {language === 'bn' ? 'আপনার ব্যালেন্স' : 'Your Balance'}
              </span>
              <span className="text-xl font-black text-amber-300">
                ৳{(Number(profile?.balance) || 0).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => {
                hapticFeedback.light();
                if (!user) setAuthModalOpen(true);
                else setActiveViewTab('deposit');
              }}
              className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>{language === 'bn' ? 'ডিপোজিট / রিচার্জ' : 'Recharge'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Marketplace vs Deposit vs My Orders vs Deposit History */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <div className="flex items-center gap-2 flex-nowrap">
          <button
            onClick={() => {
              hapticFeedback.light();
              setActiveViewTab('marketplace');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              activeViewTab === 'marketplace'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'bn' ? 'মার্কেটপ্লেস প্যাকেজ' : 'All Packages'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-[10px] font-bold">
              {packages.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.light();
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              setActiveViewTab('deposit');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              activeViewTab === 'deposit'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>{language === 'bn' ? 'ডিপোজিট ফান্ড' : 'Deposit Funds'}</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 text-[9px] font-black uppercase">
              NEW
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.light();
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              setActiveViewTab('my-orders');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              activeViewTab === 'my-orders'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>{language === 'bn' ? 'আমার অর্ডারসমূহ' : 'My Orders'}</span>
            {myOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                {myOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              hapticFeedback.light();
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              setActiveViewTab('deposit-history');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              activeViewTab === 'deposit-history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{language === 'bn' ? 'ডিপোজিট হিস্ট্রি' : 'Deposit History'}</span>
            {depositRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black">
                {depositRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Support Telegram Link */}
        <a
          href="https://t.me/techlystb"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs font-extrabold text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800 transition-all shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram: @techlystb</span>
        </a>
      </div>

      {activeViewTab === 'deposit' ? (
        <DepositFundsSection
          onNavigateMarketplace={() => setActiveViewTab('marketplace')}
          onSuccess={() => setActiveViewTab('deposit-history')}
        />
      ) : activeViewTab === 'deposit-history' ? (
        /* Deposit Requests History */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {language === 'bn' ? 'আপনার ওয়ালেট ডিপোজিট রিকোয়েস্ট' : 'Your Wallet Deposit Requests'}
            </h3>
            <button
              onClick={() => setActiveViewTab('deposit')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-indigo-700"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? '+ নতুন ডিপোজিট' : '+ New Deposit'}</span>
            </button>
          </div>

          {depositRequests.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                {language === 'bn' ? 'কোনো ডিপোজিট রেকর্ড পাওয়া যায়নি' : 'No Deposit Requests Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'bKash, Nagad, Rocket বা USDT দিয়ে ডিপোজিট করে আপনার ওয়ালেট রিচার্জ করুন।'
                  : 'Add funds securely to your wallet via bKash, Nagad, Rocket, or USDT.'}
              </p>
              <button
                onClick={() => setActiveViewTab('deposit')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
              >
                {language === 'bn' ? 'ডিপোজিট করুন' : 'Deposit Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {depositRequests.map((dep) => (
                <div
                  key={dep.id || dep.key}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          ৳{Number(dep.amount).toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {dep.method}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            dep.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : dep.status === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {new Date(dep.requestedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {dep.trxId}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Sender Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dep.senderNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Trx ID</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dep.trxId}</span>
                    </div>
                  </div>

                  {dep.adminNote && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">Admin Note: </span>
                      {dep.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeViewTab === 'marketplace' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'প্যাকেজের নাম বা SKU দিয়ে খুঁজুন (যেমন: Fresh, Aged, BD, USA)...'
                    : 'Search package by title or SKU...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {language === 'bn' ? 'সব প্যাকেজ' : 'All Types'}
              </button>
              <button
                onClick={() => setSelectedFilter('fresh')}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedFilter === 'fresh'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {language === 'bn' ? 'ফ্রেশ জিমেইল' : 'Fresh Gmails'}
              </button>
              <button
                onClick={() => setSelectedFilter('aged')}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedFilter === 'aged'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {language === 'bn' ? 'ওল্ড জিমেইল' : 'Aged / Old'}
              </button>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                      {pkg.categoryBadge}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      SKU: {pkg.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock: {pkg.inStock}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5 mb-4">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {language === 'bn' && pkg.titleBn ? pkg.titleBn : pkg.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'bn' && pkg.descriptionBn ? pkg.descriptionBn : pkg.description}
                  </p>
                </div>

                {/* Features Pill Box */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 mb-4 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'bn' ? 'ডেলিভারি স্পিড' : 'Delivery'}:</span>
                    </span>
                    <span className="font-bold text-slate-800">{pkg.deliveryTime}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'রিপ্লেসমেন্ট ওয়ারেন্টি' : 'Warranty'}:</span>
                    </span>
                    <span className="font-bold text-emerald-700">{pkg.warranty}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{language === 'bn' ? 'মিনিমাম অর্ডার' : 'Min Order'}:</span>
                    </span>
                    <span className="font-bold text-indigo-700">{pkg.minQty} Pcs</span>
                  </div>
                </div>

                {/* Pricing & CTA Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                      {language === 'bn' ? 'প্রতি পিস রেট' : 'Unit Price'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-indigo-600">
                        ৳{pkg.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">/ Piece</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenOrder(pkg)}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{language === 'bn' ? 'অর্ডার করুন' : 'Buy Now'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guarantee Footer Notice */}
          <div className="rounded-3xl bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black">
                  {language === 'bn'
                    ? '১০০% অটো রিপ্লেসমেন্ট ও সিকিউর এসক্রো প্রটেকশন'
                    : '100% Secure Escrow & Instant Replacement Support'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {language === 'bn'
                    ? 'কোনো জিমেইলে ডিসেবল বা পাসওয়ার্ড সমস্যা থাকলে ২৪ ঘণ্টার মধ্যে নতুন জিমেইল বা রিফান্ড প্রদান করা হয়।'
                    : 'Any disabled or invalid credentials are instantly replaced via our official support channel.'}
                </p>
              </div>
            </div>

            <a
              href="https://t.me/techlystb"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </a>
          </div>
        </>
      ) : (
        /* My Orders History View */
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <PackageCheck className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                {language === 'bn' ? 'কোনো পূর্ববর্তী অর্ডার নেই' : 'No Purchase Orders Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'মার্কেটপ্লেস থেকে আপনার প্রয়োজনীয় জিমেইল প্যাকেজটি অর্ডার করুন এবং ইনস্ট্যান্ট ডেলিভারি গ্রহণ করুন।'
                  : 'Select any verified Gmail package from the marketplace tab to place your first order.'}
              </p>
              <button
                onClick={() => setActiveViewTab('marketplace')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
              >
                {language === 'bn' ? 'প্যাকেজ ব্রাউজ করুন' : 'Browse Packages'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">
                          {order.packageTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            order.status === 'completed' || order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.status === 'processing'
                              ? 'bg-amber-100 text-amber-700 animate-pulse'
                              : order.status === 'refunded'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Order ID: {order.id} • {new Date(order.orderedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-600">
                        ৳{order.totalPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Qty: {order.quantity} Pcs
                      </span>
                    </div>
                  </div>

                  {/* Credentials / Delivery Box */}
                  {order.credentialsText ? (
                    <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-2xl font-mono text-xs space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered Credentials (Email:Pass:Recovery):</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.credentialsText || '', order.id)}
                          className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded-lg text-[10px]"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId === order.id ? 'Copied!' : 'Copy All'}</span>
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-[11px] font-mono leading-relaxed">
                        {order.credentialsText}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span>
                          {language === 'bn'
                            ? 'অর্ডার প্রসেসিং হচ্ছে। দ্রুত এই বক্সে আপনার জিমেইল লিস্ট ডেলিভারি দেওয়া হবে।'
                            : 'Order is being verified and prepared. Your credentials will appear here shortly.'}
                        </span>
                      </div>

                      <a
                        href="https://t.me/techlystb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-sky-600 hover:underline"
                      >
                        Helpline
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">
                  {language === 'bn' ? 'জিমেইল অর্ডার কনফার্মেশন' : 'Confirm Gmail Purchase'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Package Summary */}
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                  {selectedPackage.categoryBadge}
                </span>
                <h4 className="text-xs font-black text-indigo-950">
                  {language === 'bn' && selectedPackage.titleBn
                    ? selectedPackage.titleBn
                    : selectedPackage.title}
                </h4>
                <div className="flex items-center justify-between text-xs font-bold text-indigo-800 pt-1">
                  <span>Rate: ৳{selectedPackage.price.toFixed(2)} / pc</span>
                  <span className="text-emerald-700">Stock: {selectedPackage.inStock}</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  {language === 'bn' ? 'পরিমাণ নির্বাচন করুন (Pcs):' : 'Select Quantity (Pcs):'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setOrderQuantity((prev) =>
                        Math.max(selectedPackage.minQty || 1, prev - 5)
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg flex items-center justify-center active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={selectedPackage.minQty || 1}
                    value={orderQuantity}
                    onChange={(e) =>
                      setOrderQuantity(
                        Math.max(selectedPackage.minQty || 1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="flex-1 py-2 px-3 text-center text-base font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setOrderQuantity((prev) => prev + 5)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg flex items-center justify-center active:scale-95"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block text-right">
                  Min Order: {selectedPackage.minQty} Pcs
                </span>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  {language === 'bn' ? 'অতিরিক্ত নির্দেশনা (ঐচ্ছিক):' : 'Special Instructions (Optional):'}
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Need fresh recovery, specific country mix..."
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Total Calculation & Balance Check */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Unit Price:</span>
                  <span className="font-bold">৳{selectedPackage.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Quantity:</span>
                  <span className="font-bold">{orderQuantity} Pcs</span>
                </div>
                <div className="w-full h-px bg-slate-200 my-1" />
                <div className="flex items-center justify-between text-sm font-black text-slate-900">
                  <span>Total Payable:</span>
                  <span className="text-indigo-600">
                    ৳{(selectedPackage.price * orderQuantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Your Current Balance:</span>
                  <span className="font-bold text-slate-800">
                    ৳{(Number(profile?.balance) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                  {errorMsg.toLowerCase().includes('balance') || errorMsg.includes('ব্যালেন্স') ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackage(null);
                        setActiveViewTab('deposit');
                      }}
                      className="self-end px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-sm flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ওয়ালেট ডিপোজিট করুন' : 'Deposit Now'}</span>
                    </button>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {language === 'bn' ? 'পেমেন্ট ও কনফার্ম' : 'Pay & Confirm Order'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
