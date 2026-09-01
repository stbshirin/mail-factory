import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { hapticFeedback } from '../../lib/haptics';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import {
  ArrowLeft,
  Download,
  Link as LinkIcon,
  ShieldCheck,
  Check,
  Award,
  QrCode,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  User,
  Star,
  FileCheck,
  Calendar,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface DigitalIdCardProps {
  onBack?: () => void;
}

export type CardThemeId =
  | 'navy'
  | 'gold'
  | 'emerald'
  | 'violet'
  | 'crimson'
  | 'onyx';

interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  subtitle: string;
  gradientClass: string;
  accentBorder: string;
  headerBg: string;
  chipColor: string;
  previewGradient: string;
  textColor: string;
}

const THEMES: CardThemeConfig[] = [
  {
    id: 'navy',
    name: 'Royal Navy',
    subtitle: 'Corporate Elite',
    gradientClass: 'from-[#0b132b] via-[#1c2541] to-[#0b132b]',
    accentBorder: 'border-cyan-400/40',
    headerBg: 'from-[#0b192c] to-[#1e3e62]',
    chipColor: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
    previewGradient: 'bg-gradient-to-tr from-[#0b132b] to-[#1e3e62]',
    textColor: 'text-cyan-400',
  },
  {
    id: 'gold',
    name: 'Imperial Gold',
    subtitle: 'Luxury Executive',
    gradientClass: 'from-[#1c1917] via-[#292524] to-[#451a03]',
    accentBorder: 'border-amber-400/50',
    headerBg: 'from-[#2a1b06] to-[#45270c]',
    chipColor: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    previewGradient: 'bg-gradient-to-tr from-[#292524] to-[#b45309]',
    textColor: 'text-amber-400',
  },
  {
    id: 'emerald',
    name: 'Emerald VIP',
    subtitle: 'Prestige Growth',
    gradientClass: 'from-[#022c22] via-[#064e3b] to-[#022c22]',
    accentBorder: 'border-emerald-400/40',
    headerBg: 'from-[#022c22] to-[#047857]',
    chipColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    previewGradient: 'bg-gradient-to-tr from-[#022c22] to-[#059669]',
    textColor: 'text-emerald-400',
  },
  {
    id: 'violet',
    name: 'Cyber Violet',
    subtitle: 'High-Tech Alpha',
    gradientClass: 'from-[#2e1065] via-[#3b0764] to-[#1e1b4b]',
    accentBorder: 'border-purple-400/40',
    headerBg: 'from-[#2e1065] to-[#581c87]',
    chipColor: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
    previewGradient: 'bg-gradient-to-tr from-[#2e1065] to-[#7e22ce]',
    textColor: 'text-purple-400',
  },
  {
    id: 'crimson',
    name: 'Ruby Crimson',
    subtitle: 'Executive Titan',
    gradientClass: 'from-[#450a0a] via-[#7f1d1d] to-[#450a0a]',
    accentBorder: 'border-rose-400/40',
    headerBg: 'from-[#450a0a] to-[#991b1b]',
    chipColor: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
    previewGradient: 'bg-gradient-to-tr from-[#450a0a] to-[#dc2626]',
    textColor: 'text-rose-400',
  },
  {
    id: 'onyx',
    name: 'Midnight Onyx',
    subtitle: 'Carbon Stealth',
    gradientClass: 'from-[#09090b] via-[#18181b] to-[#09090b]',
    accentBorder: 'border-slate-500/40',
    headerBg: 'from-[#18181b] to-[#27272a]',
    chipColor: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
    previewGradient: 'bg-gradient-to-tr from-[#09090b] to-[#3f3f46]',
    textColor: 'text-slate-300',
  },
];

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ onBack }) => {
  const { profile, user, language, currentLevel, copyText, setActiveTab } = useApp();
  const t = translations[language];

  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('navy');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEMES.find((th) => th.id === selectedTheme) || THEMES[0];

  // Unique formatted Member ID
  const rawUid = profile?.uid || user?.uid || 'FIBQF0';
  const memberCode = (rawUid.slice(-6) || 'FIBQF0').toUpperCase();
  const formattedMemberId = `MF-2026-${memberCode}`;
  const barcodeText = `*MF2026${memberCode}*`;
  const verificationUrl = `https://mailfectory.top/verify?id=${formattedMemberId}`;

  // Trust score calculation
  const approvedCount = profile?.manual_approved_count || 0;
  const trustScore = approvedCount > 20 ? '99.4%' : '98.9%';
  const tierName = currentLevel?.level >= 3 ? 'Diamond VIP' : currentLevel?.level >= 2 ? 'Gold Partner' : 'Starter Member';
  const memberCategory = currentLevel?.level >= 3 ? 'VIP EXECUTIVE' : 'GENERAL MEMBER';

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    hapticFeedback.medium();
    setIsDownloading(true);

    try {
      // High resolution capture
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // HD quality
        quality: 0.98,
      });

      const link = document.createElement('a');
      link.download = `MailFactory_MemberID_${formattedMemberId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export ID card PNG', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyVerificationLink = () => {
    hapticFeedback.light();
    copyText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => {
            hapticFeedback.light();
            if (onBack) onBack();
            else setActiveTab('profile');
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-black shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'bn' ? 'ফিরে যান' : 'Back'}</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-xs font-black shadow-sm">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>Official Executive Member ID Card</span>
        </div>
      </div>

      {/* Theme Style Selector Section */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
                Card Background & Theme Style
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                6 Styles
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Choose your background pattern, executive gradient, and download in HD with Barcode & Seal
            </p>
          </div>
        </div>

        {/* 6 Theme Grid Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  hapticFeedback.light();
                  setSelectedTheme(theme.id);
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full ${theme.previewGradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    {theme.name}
                  </h4>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block truncate">
                    {theme.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="space-y-2">
        <button
          onClick={handleDownloadCard}
          disabled={isDownloading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-600 to-teal-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>
            {isDownloading
              ? language === 'bn'
                ? 'ডাউনলোড প্রসেস হচ্ছে...'
                : 'Generating HD PNG...'
              : 'Download Full ID Card (HD PNG)'}
          </span>
        </button>

        <button
          onClick={handleCopyVerificationLink}
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          {copiedLink ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">Verification Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Copy Verification Link</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            hapticFeedback.light();
            setShowVerifyModal(true);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all border border-slate-700"
        >
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>Verify Certificate</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* THE ACTUAL DIGITAL MEMBER ID CARD (EXPORTABLE CANVAS AREA)                */}
      {/* ========================================================================= */}
      <div className="flex justify-center my-4 overflow-x-auto py-1">
        <div
          ref={cardRef}
          className={`w-full max-w-[440px] rounded-3xl bg-gradient-to-b ${activeTheme.gradientClass} border-2 ${activeTheme.accentBorder} shadow-2xl text-slate-900 overflow-hidden relative font-sans`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)`,
          }}
        >
          {/* Card Top Brand Header Banner */}
          <div className={`p-4 bg-gradient-to-r ${activeTheme.headerBg} border-b border-white/10 text-white relative overflow-hidden flex items-center justify-between`}>
            {/* Subtle background decorative grid */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Mail <span className="text-amber-400">Factory</span>
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-amber-300/90 tracking-wider uppercase">
                  <span>★ TRUSTED</span>
                  <span>•</span>
                  <span>FAST</span>
                  <span>•</span>
                  <span>OFFICIAL ★</span>
                </div>
              </div>
            </div>

            {/* Top-Right Member Badge */}
            <div className="relative z-10 flex flex-col items-end">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mb-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[8px] font-black tracking-wider uppercase text-cyan-200">
                {memberCategory}
              </span>
            </div>
          </div>

          {/* Sub Header Ribbon */}
          <div className="bg-slate-950/70 border-b border-white/5 py-1.5 px-3 text-center">
            <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
              ★ MAIL FACTORY OFFICIAL IDENTIFICATION SYSTEM • SECURE MEMBER REGISTRY ★
            </span>
          </div>

          {/* Main Card Body */}
          <div className="p-5 space-y-4 bg-slate-50 text-slate-900 rounded-b-3xl">
            {/* Avatar & ID Code Pill */}
            <div className="text-center space-y-2.5">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-amber-400 shadow-xl mx-auto">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-900 text-amber-300 font-black text-3xl flex items-center justify-center">
                      {(profile?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Member ID Pill */}
              <div className="inline-block px-6 py-2 rounded-2xl bg-[#091e36] text-white shadow-md border border-cyan-400/30">
                <span className="text-[9px] font-black tracking-wider uppercase text-cyan-300 block">
                  MEMBER ID
                </span>
                <span className="text-sm font-black font-mono tracking-wider text-white">
                  {formattedMemberId}
                </span>
              </div>

              {/* Gold Official Security Seal Stamp */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center animate-pulse">
                  <div className="w-full h-full rounded-full bg-amber-950 border border-amber-300 flex flex-col items-center justify-center text-[7px] font-black text-amber-300 text-center leading-tight">
                    <span>OFFICIAL</span>
                    <span className="text-[6px] text-white">★ GENUINE ★</span>
                    <span>SEAL</span>
                  </div>
                </div>
                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase mt-1">
                  OFFICIAL SECURITY SEAL
                </span>
              </div>

              {/* Authorized Signature in cursive */}
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div
                  className="text-lg font-serif italic text-slate-700 tracking-wider"
                  style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive" }}
                >
                  Mail Factory
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                  AUTHORIZED SIGNATURE
                </span>
              </div>
            </div>

            {/* Information Grid Rows */}
            <div className="space-y-2 text-xs">
              {/* Full Name */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Full Name
                    </span>
                    <h4 className="text-xs font-black text-slate-900">
                      {profile?.username || 'md Forward'}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Member Rank Tier */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Member Rank Tier
                    </span>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span className="text-amber-500">⭐</span> {tierName}
                    </h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black border border-slate-200">
                  Standard
                </span>
              </div>

              {/* Completed Submissions */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Completed Submissions
                    </span>
                    <h4 className="text-xs font-black text-slate-900">
                      {approvedCount} Approved Mails Submitted
                    </h4>
                  </div>
                </div>
              </div>

              {/* Trust & Accuracy Rating */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Trust & Accuracy Rating
                    </span>
                    <h4 className="text-xs font-black text-emerald-600">
                      {trustScore} Trust Score (5.0 ★)
                    </h4>
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Validity Period
                    </span>
                    <h4 className="text-xs font-black text-slate-900">
                      31 Dec 2028 (Lifetime Active)
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  SEC-#{memberCode}-26
                </span>
              </div>
            </div>

            {/* QR Code & Barcode Module */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-slate-100 to-cyan-50/50 border border-slate-200/80 text-center space-y-3">
              <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center relative">
                <QRCode
                  value={verificationUrl}
                  size={120}
                  level="H"
                  className="w-full h-full"
                />
                {/* Center orange dot matching screenshot */}
                <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-sm flex items-center justify-center pointer-events-none" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#091e36] text-white text-[11px] font-bold shadow-sm">
                <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                <span>Scan to verify identity</span>
              </div>

              {/* 1D Barcode Simulation matching screenshot */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm max-w-[200px] mx-auto text-center">
                <div className="h-7 w-full flex items-center justify-center gap-[2px] opacity-80">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 3, 1].map((w, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 h-full rounded-xs"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider block mt-1">
                  {barcodeText}
                </span>
              </div>
            </div>

            {/* ID Card Footer Link Banner */}
            <div className="rounded-2xl bg-[#091e36] text-white p-3 text-center space-y-1">
              <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                <span>🌐</span> www.mailfectory.top/verify
              </div>
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Trusted • Secure • Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MEMBER ID CARD FEATURES & VERIFICATION SECTION                            */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>MEMBER ID CARD FEATURES & VERIFICATION</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Feature 1 */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
            <h4 className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
              <span>🏆</span> Dynamic Rank Tiers
            </h4>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 mt-0.5 leading-relaxed">
              Ranks scale from Starter to VIP Elite automatically based on verified tasks and approved payouts.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
            <h4 className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
              <span>🛡️</span> Digital Hologram Seal
            </h4>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400/90 mt-0.5 leading-relaxed">
              Genuine security seal verifying authorization under the Mail Factory central registry.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-900/50">
            <h4 className="font-black text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5 text-xs">
              <span>📱</span> Dual QR & 1D Barcode
            </h4>
            <p className="text-[11px] text-cyan-800/90 dark:text-cyan-400/90 mt-0.5 leading-relaxed">
              Instant scan verification for authentication across all mobile devices and barcode readers.
            </p>
          </div>
        </div>
      </div>

      {/* Verify Certificate Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Official Certification Verified
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This digital ID is authentic and active on the Mail Factory Central Database.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-1.5 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Registry ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formattedMemberId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Holder:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.username || 'Verified User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Active & Lifetime</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Encrypted Hash:</span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">SHA256-MF9942A</span>
              </div>
            </div>

            <button
              onClick={() => setShowVerifyModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black shadow transition-colors"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
