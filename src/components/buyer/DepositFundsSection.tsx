import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../lib/haptics';
import {
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Wallet,
} from 'lucide-react';

interface DepositFundsSectionProps {
  onSuccess?: () => void;
  onNavigateMarketplace?: () => void;
}

export type DepositMethod = 'bKash' | 'Nagad' | 'USDT BEP20' | 'Rocket';

interface MethodInfo {
  id: DepositMethod;
  name: string;
  type: string;
  number: string;
  iconBg: string;
  iconColor: string;
  tag: string;
  dialCode?: string;
}

export const DepositFundsSection: React.FC<DepositFundsSectionProps> = ({
  onSuccess,
  onNavigateMarketplace,
}) => {
  const {
    language,
    user,
    profile,
    setAuthModalOpen,
    submitDepositRequest,
    addNotification,
    copyText,
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>('bKash');
  const [amount, setAmount] = useState<number>(100);
  const [customAmountInput, setCustomAmountInput] = useState<string>('100');
  const [senderNumber, setSenderNumber] = useState<string>(profile?.phone || profile?.paymentNumber || '');
  const [trxId, setTrxId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<any>(null);

  const methodsList: MethodInfo[] = [
    {
      id: 'bKash',
      name: 'bKash',
      type: 'Personal Send Money',
      number: '01715569959',
      iconBg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
      iconColor: 'text-pink-600 dark:text-pink-400',
      tag: 'Most Popular',
      dialCode: '*247#',
    },
    {
      id: 'Nagad',
      name: 'Nagad',
      type: 'Personal Send Money',
      number: '01715569959',
      iconBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
      iconColor: 'text-orange-600 dark:text-orange-400',
      tag: 'Instant',
      dialCode: '*167#',
    },
    {
      id: 'USDT BEP20',
      name: 'USDT BEP20',
      type: 'USDT / BEP20 Crypto',
      number: '0x71C568165F792B602931d8f58c499252327D1691',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      tag: 'Zero Fee',
    },
    {
      id: 'Rocket',
      name: 'Rocket',
      type: 'Personal Send Money',
      number: '017155699597',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
      tag: 'Fast',
      dialCode: '*322#',
    },
  ];

  const currentMethodInfo = methodsList.find((m) => m.id === selectedMethod) || methodsList[0];

  const handleAmountChip = (val: number) => {
    hapticFeedback.light();
    setAmount(val);
    setCustomAmountInput(String(val));
    setErrorMsg('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmountInput(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setAmount(num);
    }
    setErrorMsg('');
  };

  const handleProceedToStep2 = () => {
    hapticFeedback.medium();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!amount || amount < 50) {
      setErrorMsg(language === 'bn' ? 'সর্বনিম্ন ডিপোজিট পরিমাণ ৳৫০।' : 'Minimum deposit amount is ৳50.');
      return;
    }
    setStep(2);
    setErrorMsg('');
  };

  const handleCopyNumber = () => {
    hapticFeedback.light();
    copyText(currentMethodInfo.number, 'Payment Number');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const isValidTrxId = trxId.trim().length >= 6;
  const isValidSender = senderNumber.trim().length >= 8;

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticFeedback.medium();
    setErrorMsg('');

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!isValidTrxId) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে সঠিক Transaction ID (TrxID) লিখুন।'
          : 'Please enter a valid Transaction ID (TrxID).'
      );
      return;
    }

    if (!isValidSender) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার প্রেরক নম্বর লিখুন।'
          : 'Please enter your sender mobile/wallet number.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitDepositRequest({
        amount,
        method: selectedMethod,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
      });

      if (res.success) {
        setSubmittedDeposit({
          amount,
          method: selectedMethod,
          trxId: trxId.trim().toUpperCase(),
          senderNumber: senderNumber.trim(),
          time: Date.now(),
        });
        setShowSuccessModal(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message || 'Failed to submit deposit. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Deposit submission error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 shadow-xl border border-indigo-500/30">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {language === 'bn' ? 'ডিপোজিট ওয়ালেট ফান্ড' : 'Deposit Funds'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-indigo-100">
              {language === 'bn'
                ? 'bKash, Nagad, Rocket বা USDT এর মাধ্যমে নিরাপদে ইনস্ট্যান্ট ব্যালেন্স যোগ করুন'
                : 'Add funds securely via bKash, Nagad, Rocket, or USDT'}
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">
              {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'ADD FUNDS'}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300">
              ৳{(Number(profile?.balance) || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          <div className="flex items-center gap-2 z-10">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                step >= 1
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none ring-4 ring-indigo-50 dark:ring-indigo-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              ১
            </div>
            <span
              className={`text-xs font-black ${
                step === 1
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {language === 'bn' ? 'পরিমাণ ও মাধ্যম' : 'Amount & Method'}
            </span>
          </div>

          <div className="flex-1 mx-3 h-1 bg-slate-100 dark:bg-slate-800 relative rounded-full overflow-hidden">
            <div
              className={`h-full bg-indigo-600 transition-all duration-300 ${
                step === 2 ? 'w-full' : 'w-1/2'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 z-10">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                step === 2
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none ring-4 ring-indigo-50 dark:ring-indigo-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              ২
            </div>
            <span
              className={`text-xs font-black ${
                step === 2
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {language === 'bn' ? 'নির্দেশনা ও ভেরিফাই' : 'Instructions & Verify'}
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Amount & Method Selection */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Method Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'পেমেন্ট মাধ্যম সিলেক্ট করুন:' : 'Select Payment Method:'}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {methodsList.map((m) => {
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      hapticFeedback.light();
                      setSelectedMethod(m.id);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${m.iconBg} ${m.iconColor}`}>
                        {m.id === 'bKash' ? 'bK' : m.id === 'Nagad' ? 'NG' : m.id === 'Rocket' ? 'RK' : '₮'}
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {m.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {m.type}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Selection Chips */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'ডিপোজিট অ্যামাউন্ট নির্বাচন করুন (BDT):' : 'Select Deposit Amount (BDT):'}
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[50, 100, 200, 500, 1000, 2000].map((val) => {
                const isSelected = amount === val && customAmountInput === String(val);
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAmountChip(val)}
                    className={`py-3 rounded-2xl border text-center transition-all font-black text-sm ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-102'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    ৳{val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'অথবা কাস্টম টাকার পরিমাণ লিখুন (৳):' : 'Or Enter Custom Amount (৳):'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 font-black text-base">
                ৳
              </div>
              <input
                type="number"
                min={50}
                value={customAmountInput}
                onChange={handleCustomAmountChange}
                placeholder="100"
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'bn' ? '• সর্বনিম্ন ডিপোজিট: ৳৫০' : '• Minimum deposit: ৳50'}
            </p>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleProceedToStep2}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>{language === 'bn' ? 'পেমেন্ট নির্দেশনায় এগিয়ে যান' : 'Proceed to Payment Instructions'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Payment Instructions & Transaction Verification */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Top Bar with Back & Amount Pill */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                setStep(1);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'bn' ? 'পরিমাণ পরিবর্তন করুন' : 'Change Amount'}</span>
            </button>

            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">
                AMOUNT
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-300">
                ৳{amount}
              </span>
            </div>
          </div>

          <form onSubmit={handleVerifySubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ট্রানজেকশন আইডি দিন' : 'Enter Transaction ID'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                {selectedMethod}
              </span>
            </div>

            {/* Input 1: Transaction ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID) : *প্রয়োজনীয়' : 'Enter Transaction ID (TrxID) : *Required'}
                </label>
                {isValidTrxId && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> Valid Format
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={trxId}
                onChange={(e) => {
                  setTrxId(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                placeholder="e.g. DGSUJEBEVUS or 9K72B8X9"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'আপনার SMS অথবা অ্যাপের রসিদ থেকে সঠিক TrxID লিখুন।'
                  : 'Enter the exact TrxID from your SMS or Mobile App receipt.'}
              </p>
            </div>

            {/* Input 2: Sender Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {language === 'bn'
                    ? `আপনার ${selectedMethod} প্রেরক নম্বর : *প্রয়োজনীয়`
                    : `Your ${selectedMethod} Sender Number : *Required`}
                </label>
                {isValidSender && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> Valid Number
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={senderNumber}
                onChange={(e) => {
                  setSenderNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={selectedMethod === 'USDT BEP20' ? 'BEP20 Wallet Address' : '01XXXXXXXXX (11 digits)'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Step-by-Step Payment Instructions Box */}
            <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                  {selectedMethod} Payment Instructions:
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200">
                  SEND MONEY
                </span>
              </div>

              {selectedMethod === 'USDT BEP20' ? (
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <p>1. Open Binance / Trust Wallet / Any BEP-20 Wallet.</p>
                  <p>2. Send USDT (BEP20 network) equivalent to <strong>৳{amount}</strong> (Approx ${(amount / 125).toFixed(2)} USDT).</p>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs break-all text-indigo-700 dark:text-indigo-300 font-bold">
                      {currentMethodInfo.number}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center gap-1 hover:bg-indigo-700"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p>3. Copy the <strong>Transaction Hash / TxID</strong> and paste it above, then click <strong>VERIFY</strong>.</p>
                </div>
              ) : (
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>
                    {currentMethodInfo.dialCode ? (
                      <span><strong>{currentMethodInfo.dialCode}</strong> ডায়াল করে আপনার <strong>{selectedMethod.toUpperCase()}</strong> মোবাইল মেনুতে যান অথবা <strong>{selectedMethod.toUpperCase()}</strong> অ্যাপে যান।</span>
                    ) : (
                      <span>আপনার <strong>{selectedMethod.toUpperCase()}</strong> অ্যাপে যান।</span>
                    )}
                  </li>
                  <li>
                    <span><strong>"Send Money"</strong> -এ ক্লিক করুন।</span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 my-1">
                    <span>
                      প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুন: <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{currentMethodInfo.number}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="self-start sm:self-auto px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1 transition-all"
                    >
                      {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </li>
                  <li>
                    <span>টাকার পরিমাণ: <strong className="text-indigo-600 dark:text-indigo-400">৳{amount}</strong></span>
                  </li>
                  <li>
                    <span>নিশ্চিত করতে এখন আপনার <strong>{selectedMethod.toUpperCase()}</strong> মোবাইল মেনু পিন লিখুন।</span>
                  </li>
                  <li>
                    <span>সবকিছু ঠিক থাকলে, আপনি <strong>{selectedMethod.toUpperCase()}</strong> থেকে একটি নিশ্চিতকরণ বার্তা ও <strong>TrxID</strong> পাবেন।</span>
                  </li>
                  <li>
                    <span>এখন উপরের বক্সে আপনার <strong>Transaction ID</strong> দিন এবং নিচের <strong>VERIFY</strong> বাটনে ক্লিক করুন।</span>
                  </li>
                </ol>
              )}
            </div>

            {/* Anti-Fraud Security Box */}
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-amber-900 dark:text-amber-200 block">
                  {language === 'bn' ? 'সিকিউরিটি ও অ্যান্টি-ফ্রড পলিসি:' : 'Security & Anti-Fraud Policy:'}
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-tight">
                  {language === 'bn'
                    ? 'আপনার পেমেন্টের সঠিক TrxID দিন। ডুপ্লিকেট বা ভুয়া TrxID সাবমিট করলে একাউন্ট তাৎক্ষণিক স্থায়ীভাবে ব্যান করা হবে।'
                    : 'Provide the genuine TrxID from your payment. Submitting duplicate or fake TrxIDs is strictly prohibited and will result in an immediate account ban.'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Verify Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isValidTrxId}
              className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 ${
                isSubmitting
                  ? 'bg-indigo-400 cursor-wait'
                  : !isValidTrxId
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 shadow-emerald-200 dark:shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VERIFY</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Success Confirmation Modal (matching Screenshot 2) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-5 animate-scale-up">
            {/* Animated Checkmark Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-100 dark:shadow-none">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'ডিপোজিট রিকোয়েস্ট সাবমিট হয়েছে! 🎉' : 'Deposit Request Submitted! 🎉'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'bn'
                  ? 'আমাদের সিস্টেম আপনার ট্রানজেকশনটি ভেরিফাই করছে। ১-১০ মিনিটের মধ্যে আপনার ব্যালেন্সে টাকা যোগ হয়ে যাবে।'
                  : 'Our system is verifying your transaction. Your balance will be credited within 1–10 minutes.'}
              </p>
            </div>

            {submittedDeposit && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">৳{submittedDeposit.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Method:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{submittedDeposit.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TrxID:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{submittedDeposit.trxId}</span>
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigateMarketplace) onNavigateMarketplace();
                }}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'bn' ? 'মার্কেটপ্লেসে ফিরে যান' : 'Back to Marketplace'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setStep(1);
                  setTrxId('');
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {language === 'bn' ? 'আরেকটি ডিপোজিট করুন' : 'Deposit Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
