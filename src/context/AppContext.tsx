import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  ref,
  set,
  get,
  update,
  push,
  onValue,
  increment,
  query,
  orderByChild,
  equalTo,
  remove,
  onChildAdded,
  User,
} from '../lib/firebase';
import {
  UserProfile,
  Submission,
  WithdrawRequest,
  DepositRequest,
  LevelConfig,
  ShiftInfo,
  PaymentMethodConfig,
  AppNotification,
  ChatMessage,
  BroadcastNotification,
  ActiveTab,
  Language,
  ThemeMode,
} from '../types';

export const DEFAULT_LOGO = "https://z-cdn-media.chatglm.cn/files/254f7f82-610d-4700-abc8-2e10435c149a.png?auth_key=1874890147-5ce8a86650d0488299a25b07660a73f8-0-b25e70b5ad3109adec869d78d8584440";

export const DEFAULT_LEVELS: LevelConfig[] = [
  { level: 1, approved: 0, rate: 10, old_rate: 8, title: 'Bronze Member', perkDescription: 'Standard exchange rate' },
  { level: 2, approved: 40, rate: 11, old_rate: 9, title: 'Silver Member', perkDescription: '+1৳ per Gmail' },
  { level: 3, approved: 100, rate: 12, old_rate: 10, title: 'Gold VIP', perkDescription: '+2৳ per Gmail + Fast payouts' },
  { level: 4, approved: 250, rate: 13, old_rate: 11, title: 'Platinum Partner', perkDescription: '+3৳ per Gmail + Instant audit' },
  { level: 5, approved: 500, rate: 14, old_rate: 12, title: 'Diamond Boss', perkDescription: 'Maximum rate + VIP 24/7 dedicated review' },
];

export const DEFAULT_SHIFTS: Record<string, ShiftInfo> = {
  shift1: { title: 'শুভ রাত্রি প্রথম সময়', time: '12:00 AM', active: true, order: 1, icon: 'moon' },
  shift2: { title: 'শুভ দিনের প্রথম সময়', time: '07:00 AM', active: true, order: 2, icon: 'sun' },
};

export const DEFAULT_PAYMENT_METHODS: Record<string, PaymentMethodConfig> = {
  bkash: { name: 'bKash', icon: 'bi-wallet2', color: '#E2136E', active: true, minWithdraw: 100, feePercent: 0 },
  nagad: { name: 'Nagad', icon: 'bi-wallet2', color: '#F6921D', active: true, minWithdraw: 100, feePercent: 0 },
  rocket: { name: 'Rocket', icon: 'bi-send-check', color: '#8C3494', active: true, minWithdraw: 100, feePercent: 0 },
  binance: { name: 'USDT (Binance Pay)', icon: 'bi-currency-exchange', color: '#F0B90B', active: true, minWithdraw: 200, feePercent: 0 },
};

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  levels: LevelConfig[];
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  reviewShifts: Record<string, ShiftInfo>;
  paymentMethods: Record<string, PaymentMethodConfig>;
  maintenanceMode: boolean;
  isWithdrawDisabled: boolean;
  minWithdraw: number;
  commissionPercent: number;
  signupBonusUser: number;
  signupBonusReferrer: number;
  submissions: Submission[];
  withdrawRequests: WithdrawRequest[];
  allSubmissions: Submission[];
  allWithdrawRequests: WithdrawRequest[];
  depositRequests: DepositRequest[];
  allDepositRequests: DepositRequest[];
  notifications: AppNotification[];
  unreadNotifsCount: number;
  addNotification: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
  markNotificationRead: (id: string | number) => void;
  markAllNotificationsRead: () => void;
  allUsers: UserProfile[];
  chatMessages: ChatMessage[];
  sendChatMessage: (msg: string) => Promise<void>;
  submitGmails: (data: {
    gmails: Array<{ email: string; password: string; recoveryEmail?: string }>;
    type: 'new' | 'old';
    rate: number;
    totalAmount: number;
    count: number;
  }) => Promise<{ success: boolean; message?: string }>;
  requestWithdraw: (data: {
    amount: number;
    method: string;
    methodName: string;
    accountNumber: string;
  }) => Promise<{ success: boolean; message?: string }>;
  submitDepositRequest: (data: {
    amount: number;
    method: string;
    senderNumber: string;
    trxId: string;
    screenshotUrl?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  adminApproveDeposit: (depKey: string, deposit: DepositRequest) => Promise<{ success: boolean; message?: string }>;
  adminRejectDeposit: (depKey: string, deposit: DepositRequest, reason?: string) => Promise<{ success: boolean; message?: string }>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  allSupportChats: Record<string, ChatMessage[]>;
  broadcastNotifications: BroadcastNotification[];
  adminSendChatMessage: (targetUserId: string, message: string, targetUsername?: string) => Promise<{ success: boolean; message?: string }>;
  adminDeleteChatMessage: (targetUserId: string, messageId: string) => Promise<{ success: boolean }>;
  adminClearChatThread: (targetUserId: string) => Promise<{ success: boolean }>;
  adminSendBroadcastNotification: (data: {
    title: string;
    desc: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    targetUserId?: string;
    targetUserEmail?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  adminDeleteBroadcastNotification: (key: string) => Promise<{ success: boolean }>;
  adminRewardReferral: (targetUserId: string, amount: number, note: string) => Promise<{ success: boolean; message?: string }>;
  adminUnlocked: boolean;
  unlockAdmin: (pinOrPass: string) => boolean;
  lockAdmin: () => void;
  adminApproveSubmission: (subKey: string, sub: Submission) => Promise<{ success: boolean; message?: string }>;
  adminRejectSubmission: (subKey: string, sub: Submission, reason?: string) => Promise<{ success: boolean; message?: string }>;
  adminApproveWithdraw: (wdKey: string, req: WithdrawRequest, trxId?: string) => Promise<{ success: boolean; message?: string }>;
  adminRejectWithdraw: (wdKey: string, req: WithdrawRequest, reason?: string) => Promise<{ success: boolean; message?: string }>;
  adminUpdateUser: (uid: string, data: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  adminUpdateSettings: (settingsData: any) => Promise<{ success: boolean; message?: string }>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setWithdrawModalOpen: (open: boolean) => void;
  isChatDrawerOpen: boolean;
  setChatDrawerOpen: (open: boolean) => void;
  isNotifDrawerOpen: boolean;
  setNotifDrawerOpen: (open: boolean) => void;
  claimDailyStreak: () => Promise<{ success: boolean; streakCount: number }>;
  appLogo: string;
  copyText: (text: string, label?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('mf_lang') as Language) || 'bn';
  });
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('mf_theme') as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;

    const computeIsDark = () => {
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const applyTheme = () => {
      const dark = computeIsDark();
      setIsDarkMode(dark);

      if (dark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    try {
      localStorage.setItem('mf_theme', theme);
    } catch {
      // ignore
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('mf_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDarkMode ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [levels, setLevels] = useState<LevelConfig[]>(DEFAULT_LEVELS);
  const [reviewShifts, setReviewShifts] = useState<Record<string, ShiftInfo>>(DEFAULT_SHIFTS);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethodConfig>>(DEFAULT_PAYMENT_METHODS);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [isWithdrawDisabled, setIsWithdrawDisabled] = useState<boolean>(false);
  const [minWithdraw, setMinWithdraw] = useState<number>(100);
  const [commissionPercent, setCommissionPercent] = useState<number>(10);
  const [signupBonusUser, setSignupBonusUser] = useState<number>(5);
  const [signupBonusReferrer, setSignupBonusReferrer] = useState<number>(5);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [allWithdrawRequests, setAllWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allSupportChats, setAllSupportChats] = useState<Record<string, ChatMessage[]>>({});
  const [broadcastNotifications, setBroadcastNotifications] = useState<BroadcastNotification[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [allDepositRequests, setAllDepositRequests] = useState<DepositRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      from: 'bot',
      message: 'Welcome to Mail Factory! 👋 Our support team is online to assist with any verification or payout queries.',
      timestamp: Date.now(),
    },
  ]);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('mf_notifications_v2');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          title: 'Welcome to Mail Factory 🎉',
          desc: 'Get fast cash by exchanging fresh and aged Gmail accounts. Check out your Level perks!',
          type: 'success',
          read: false,
          time: 'Just now',
          timestamp: Date.now(),
        }
      ];
    } catch {
      return [];
    }
  });

  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setChatDrawerOpen] = useState<boolean>(false);
  const [isNotifDrawerOpen, setNotifDrawerOpen] = useState<boolean>(false);
  const appLogo = DEFAULT_LOGO;

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('mf_lang', lang);
  };

  const addNotification = useCallback((title: string, desc: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const newNotif: AppNotification = {
      id: Date.now() + Math.random(),
      title,
      desc,
      type,
      read: false,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev.slice(0, 49)];
      localStorage.setItem('mf_notifications_v2', JSON.stringify(updated));
      return updated;
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Mail Factory', { body: `${title}: ${desc}`, icon: appLogo });
      } catch {
        // Safe ignore
      }
    }
  }, [appLogo]);

  const markNotificationRead = useCallback((id: string | number) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('mf_notifications_v2', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('mf_notifications_v2', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const copyText = async (text: string, label: string = 'Copied'): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        addNotification(label, text, 'success');
        return true;
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      addNotification(label, text, 'success');
      return true;
    } catch {
      return false;
    }
  };

  // Sync Global Settings
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const settingsRef = ref(db, 'settings');
      unsubscribe = onValue(
        settingsRef,
        (snap) => {
          if (snap.exists()) {
            const val = snap.val();
            if (val.review_shifts) setReviewShifts(val.review_shifts);
            if (val.payment_methods) setPaymentMethods(val.payment_methods);
            if (val.maintenance_mode !== undefined) setMaintenanceMode(Boolean(val.maintenance_mode));
            if (val.withdraw_disabled !== undefined) setIsWithdrawDisabled(Boolean(val.withdraw_disabled));
            if (val.min_withdraw !== undefined) setMinWithdraw(Number(val.min_withdraw) || 100);
            if (val.commission_percent !== undefined) setCommissionPercent(Number(val.commission_percent) || 10);
            if (val.signup_bonus_user !== undefined) setSignupBonusUser(Number(val.signup_bonus_user) || 5);
            if (val.signup_bonus_referrer !== undefined) setSignupBonusReferrer(Number(val.signup_bonus_referrer) || 5);
            if (val.levels) {
              const parsedLevels: LevelConfig[] = [];
              Object.keys(val.levels).forEach((k) => {
                const item = val.levels[k];
                parsedLevels.push({
                  level: Number(k),
                  approved: Number(item.req) || 0,
                  rate: Number(item.new_rate) || 10,
                  old_rate: Number(item.old_rate) || 8,
                  title: item.title || `Level ${k} VIP`,
                  perkDescription: item.desc || `Rate: ৳${item.new_rate || 10}/Gmail`,
                });
              });
              if (parsedLevels.length > 0) {
                parsedLevels.sort((a, b) => a.approved - b.approved);
                setLevels(parsedLevels);
              }
            }
          }
        },
        (error) => {
          console.warn('Settings listener fallback notice:', error.message);
        }
      );
    } catch (e) {
      console.warn('Settings listener init warning:', e);
    }
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  // Sync All Users (for Leaderboard & Referral Friend list)
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const usersRef = ref(db, 'users');
      unsubscribe = onValue(
        usersRef,
        (snap) => {
          if (snap.exists()) {
            const list: UserProfile[] = [];
            snap.forEach((child) => {
              const u = child.val();
              u.uid = child.key;
              list.push(u);
            });
            setAllUsers(list);
          }
        },
        (error) => {
          console.warn('Users listener notice:', error.message);
        }
      );
    } catch (e) {
      console.warn('Users listener init warning:', e);
    }
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  // Sync Broadcast Notifications
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const broadcastRef = ref(db, 'broadcast_notifications');
      unsubscribe = onValue(
        broadcastRef,
        (snap) => {
          if (snap.exists()) {
            const list: BroadcastNotification[] = [];
            snap.forEach((child) => {
              const b = child.val() as BroadcastNotification;
              b.key = child.key;
              list.push(b);
            });
            list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setBroadcastNotifications(list);

            // If there are broadcasts targeted for everyone or this user, merge into user's notifications
            list.slice(0, 5).forEach((b) => {
              if (!b.targetUserId || (user && b.targetUserId === user.uid)) {
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === `broadcast_${b.key}`)) return prev;
                  const newN: AppNotification = {
                    id: `broadcast_${b.key}`,
                    title: `📢 ${b.title}`,
                    desc: b.desc,
                    type: b.type || 'info',
                    read: false,
                    time: new Date(b.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: b.timestamp,
                  };
                  return [newN, ...prev.slice(0, 49)];
                });
              }
            });
          } else {
            setBroadcastNotifications([]);
          }
        },
        (error) => {
          console.warn('Broadcast listener notice:', error.message);
        }
      );
    } catch (e) {
      console.warn('Broadcast listener init warning:', e);
    }
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [user]);

  // Sync All Support Chats (for Admin Live Chat Management)
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const chatsRef = ref(db, 'support_chats');
      unsubscribe = onValue(
        chatsRef,
        (snap) => {
          if (snap.exists()) {
            const allMap: Record<string, ChatMessage[]> = {};
            snap.forEach((userThread) => {
              const uId = userThread.key;
              if (uId) {
                const threadMessages: ChatMessage[] = [];
                userThread.forEach((msgSnap) => {
                  const m = msgSnap.val() as ChatMessage;
                  m.id = msgSnap.key || String(Date.now());
                  threadMessages.push(m);
                });
                threadMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                allMap[uId] = threadMessages;
              }
            });
            setAllSupportChats(allMap);
          } else {
            setAllSupportChats({});
          }
        },
        (error) => {
          console.warn('Admin chat listener notice:', error.message);
        }
      );
    } catch (e) {
      console.warn('Admin chat listener init warning:', e);
    }
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  // Auth & Profile Listener
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    const unsubAuth = onAuthStateChanged(auth, async (currUser) => {
      // Clear previous listeners
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
      unsubs = [];

      setUser(currUser);
      if (currUser) {
        try {
          const userRef = ref(db, `users/${currUser.uid}`);
          const unsubUser = onValue(
            userRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.val() as UserProfile;
                data.uid = currUser.uid;
                setProfile(data);
              }
            },
            (error) => {
              console.warn('User profile listener notice:', error.message);
            }
          );
          unsubs.push(unsubUser);

          // Global Submissions listener
          const subRef = ref(db, 'submissions');
          const unsubSub = onValue(
            subRef,
            (snap) => {
              const allSubsList: Submission[] = [];
              const mySubs: Submission[] = [];
              if (snap.exists()) {
                snap.forEach((c) => {
                  const sub = c.val() as Submission;
                  sub.key = c.key;
                  allSubsList.push(sub);
                  if (sub.userId === currUser.uid) {
                    mySubs.push(sub);
                  }
                });
                allSubsList.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
                mySubs.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
              }
              setAllSubmissions(allSubsList);
              setSubmissions(mySubs);
            },
            (error) => {
              console.warn('Submissions listener notice:', error.message);
            }
          );
          unsubs.push(unsubSub);

          // Global Withdrawals listener
          const wdRef = ref(db, 'withdraw_requests');
          const unsubWd = onValue(
            wdRef,
            (snap) => {
              const allWdsList: WithdrawRequest[] = [];
              const myWds: WithdrawRequest[] = [];
              if (snap.exists()) {
                snap.forEach((c) => {
                  const wd = c.val() as WithdrawRequest;
                  wd.key = c.key;
                  allWdsList.push(wd);
                  if (wd.userId === currUser.uid) {
                    myWds.push(wd);
                  }
                });
                allWdsList.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
                myWds.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
              }
              setAllWithdrawRequests(allWdsList);
              setWithdrawRequests(myWds);
            },
            (error) => {
              console.warn('Withdraw listener notice:', error.message);
            }
          );
          unsubs.push(unsubWd);

          // Global Deposit requests listener
          const depRef = ref(db, 'deposit_requests');
          const unsubDep = onValue(
            depRef,
            (snap) => {
              const allDeps: DepositRequest[] = [];
              const myDeps: DepositRequest[] = [];
              if (snap.exists()) {
                snap.forEach((c) => {
                  const d = c.val() as DepositRequest;
                  d.key = c.key;
                  allDeps.push(d);
                  if (d.userId === currUser.uid) {
                    myDeps.push(d);
                  }
                });
                allDeps.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
                myDeps.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
              }
              setAllDepositRequests(allDeps);
              setDepositRequests(myDeps);
            },
            (error) => {
              console.warn('Deposit listener notice:', error.message);
            }
          );
          unsubs.push(unsubDep);

          // Listen for support chat messages
          const chatRef = ref(db, `support_chats/${currUser.uid}`);
          const unsubChat = onChildAdded(
            chatRef,
            (snapshot) => {
              const msg = snapshot.val();
              if (msg) {
                setChatMessages((prev) => {
                  if (prev.some((m) => m.id === snapshot.key)) return prev;
                  return [...prev, { id: snapshot.key || String(Date.now()), ...msg }];
                });
              }
            },
            (error) => {
              console.warn('Chat listener notice:', error.message);
            }
          );
          unsubs.push(unsubChat);
        } catch (e) {
          console.warn('Profile sync error:', e);
        }
      } else {
        setProfile(null);
        setSubmissions([]);
        setWithdrawRequests([]);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }, []);

  // Compute Current & Next Level
  const totalApproved = profile?.manual_approved_count || 0;
  const sortedLevels = [...levels].sort((a, b) => a.approved - b.approved);
  let currentLevel = sortedLevels[0] || DEFAULT_LEVELS[0];
  let nextLevel: LevelConfig | null = sortedLevels[1] || null;

  for (let i = 0; i < sortedLevels.length; i++) {
    if (totalApproved >= sortedLevels[i].approved) {
      currentLevel = sortedLevels[i];
      nextLevel = sortedLevels[i + 1] || null;
    } else {
      break;
    }
  }

  // Update profile data in Firebase
  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await update(ref(db, `users/${user.uid}`), data);
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update profile');
    }
  };

  // Claim Daily Streak
  const claimDailyStreak = async (): Promise<{ success: boolean; streakCount: number }> => {
    if (!user || !profile) return { success: false, streakCount: 0 };
    const today = new Date().toDateString();
    const lastLogin = profile.last_login_date || '';
    if (lastLogin === today) {
      return { success: false, streakCount: profile.login_streak || 1 };
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newStreak = lastLogin === yesterday.toDateString() ? (profile.login_streak || 0) + 1 : 1;
    const streakBonus = Math.min(newStreak * 0.5, 5); // 0.5৳ to 5৳ streak bonus

    await update(ref(db, `users/${user.uid}`), {
      login_streak: newStreak,
      last_login_date: today,
      balance: increment(streakBonus),
    });

    addNotification('Daily Streak Bonus 🔥', `Streak Day ${newStreak}! +৳${streakBonus.toFixed(2)} added to your balance.`, 'success');
    return { success: true, streakCount: newStreak };
  };

  // Submit Gmail Exchange
  const submitGmails = async (data: {
    gmails: Array<{ email: string; password: string; recoveryEmail?: string }>;
    type: 'new' | 'old';
    rate: number;
    totalAmount: number;
    count: number;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      setAuthModalOpen(true);
      return { success: false, message: 'Please login to submit.' };
    }
    if (maintenanceMode) {
      return { success: false, message: 'Exchange is temporarily paused for maintenance.' };
    }

    try {
      // Check for duplicate emails already used
      for (const item of data.gmails) {
        const q = query(ref(db, 'used_emails'), orderByChild('email'), equalTo(item.email.toLowerCase().trim()));
        const snap = await get(q);
        if (snap.exists()) {
          return { success: false, message: `Email "${item.email}" has already been submitted in the past.` };
        }
      }

      // Create submission
      const newSubRef = push(ref(db, 'submissions'));
      const newSub: Submission = {
        userId: user.uid,
        username: profile?.username || user.displayName || 'User',
        submittedAt: Date.now(),
        status: 'pending',
        gmailsType: data.type,
        gmails: data.gmails.map((g) => ({
          email: g.email.toLowerCase().trim(),
          password: g.password.trim(),
          recoveryEmail: g.recoveryEmail?.trim() || '',
          status: 'pending',
        })),
        totalAmount: data.totalAmount,
        rate: data.rate,
        count: data.count,
        commission_percent: commissionPercent,
      };

      await set(newSubRef, newSub);

      // Record in used_emails
      for (const g of data.gmails) {
        await push(ref(db, 'used_emails'), { email: g.email.toLowerCase().trim(), submittedAt: Date.now() });
      }

      // Add to user's Hold balance
      await update(ref(db, `users/${user.uid}`), {
        hold: (Number(profile?.hold) || 0) + data.totalAmount,
        total_submitted: increment(data.count),
      });

      addNotification(
        'Submission Received 📩',
        `${data.count} ${data.type.toUpperCase()} Gmail(s) submitted for ৳${data.totalAmount}. Review is in progress!`,
        'success'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Submission failed. Please check internet connection.' };
    }
  };

  // Withdraw Request
  const requestWithdraw = async (data: {
    amount: number;
    method: string;
    methodName: string;
    accountNumber: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user || !profile) {
      setAuthModalOpen(true);
      return { success: false, message: 'Please login to withdraw.' };
    }
    if (isWithdrawDisabled) {
      return { success: false, message: 'Withdrawals are currently disabled by administrator.' };
    }
    if (data.amount < minWithdraw) {
      return { success: false, message: `Minimum withdrawal amount is ৳${minWithdraw}.` };
    }
    if (data.amount > (profile.balance || 0)) {
      return { success: false, message: `Insufficient balance. Available: ৳${(profile.balance || 0).toFixed(2)}` };
    }

    try {
      const newWdRef = push(ref(db, 'withdraw_requests'));
      const newWd: WithdrawRequest = {
        userId: user.uid,
        username: profile.username || 'User',
        amount: data.amount,
        method: data.method,
        paymentMethod: data.methodName,
        paymentNumber: data.accountNumber,
        status: 'pending',
        requestedAt: Date.now(),
      };

      await set(newWdRef, newWd);

      // Deduct from Main Balance
      await update(ref(db, `users/${user.uid}`), {
        balance: (profile.balance || 0) - data.amount,
        paymentNumber: data.accountNumber,
        paymentMethod: data.method,
        total_withdrawn: increment(data.amount),
      });

      addNotification(
        'Withdrawal Requested 💸',
        `৳${data.amount} requested via ${data.methodName}. Payout will arrive in 24-48 hours.`,
        'warning'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Withdrawal failed.' };
    }
  };

  // Send Chat message
  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      from: 'user',
      message: text.trim(),
      timestamp: Date.now(),
      username: profile?.username || 'User',
    };
    setChatMessages((prev) => [...prev, userMsg]);

    if (user) {
      try {
        await push(ref(db, `support_chats/${user.uid}`), {
          uid: user.uid,
          username: profile?.username || 'User',
          message: text.trim(),
          timestamp: Date.now(),
          from: 'user',
          read: false,
        });
      } catch (e) {
        console.warn('Chat sync error:', e);
      }
    }
  };

  // Submit Deposit Request (Wallet Recharge)
  const submitDepositRequest = async (data: {
    amount: number;
    method: string;
    senderNumber: string;
    trxId: string;
    screenshotUrl?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user || !profile) {
      setAuthModalOpen(true);
      return { success: false, message: 'Please log in to make a deposit.' };
    }

    if (!data.amount || data.amount < 50) {
      return { success: false, message: 'Minimum deposit is ৳50.' };
    }

    if (!data.trxId.trim() || !data.senderNumber.trim()) {
      return { success: false, message: 'Sender number and Transaction ID (TrxID) are required.' };
    }

    try {
      const depRef = push(ref(db, 'deposit_requests'));
      const depositData: DepositRequest = {
        id: `DEP-${Date.now().toString().slice(-6)}`,
        userId: user.uid,
        userEmail: user.email || '',
        username: profile.username || profile.name || 'User',
        amount: Number(data.amount),
        method: data.method,
        senderNumber: data.senderNumber.trim(),
        trxId: data.trxId.trim().toUpperCase(),
        screenshotUrl: data.screenshotUrl || '',
        status: 'pending',
        requestedAt: Date.now(),
      };

      await set(depRef, depositData);

      addNotification(
        'Deposit Submitted 💳',
        `৳${data.amount} deposit via ${data.method} submitted. TrxID: ${data.trxId.toUpperCase()}`,
        'success'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Deposit request failed' };
    }
  };

  // Admin: Approve Deposit
  const adminApproveDeposit = async (
    depKey: string,
    deposit: DepositRequest
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // 1. Mark deposit approved
      await update(ref(db, `deposit_requests/${depKey}`), {
        status: 'approved',
        processedAt: Date.now(),
        reviewerEmail: user?.email || 'admin@mailfactory.com',
      });

      // 2. Increment user balance
      await update(ref(db, `users/${deposit.userId}`), {
        balance: increment(Number(deposit.amount)),
      });

      // 3. Send Notification to User
      const notifRef = push(ref(db, `user_notifications/${deposit.userId}`));
      await set(notifRef, {
        title: 'ডিপোজিট ব্যালেন্স সফলভাবে যোগ হয়েছে! 🎉',
        desc: `আপনার ৳${Number(deposit.amount).toFixed(2)} (${deposit.method}) ডিপোজিট অনুমোদিত হয়েছে এবং ওয়ালেটে যুক্ত হয়েছে।`,
        type: 'success',
        timestamp: Date.now(),
        read: false,
      });

      addNotification('Deposit Approved 💳', `৳${deposit.amount} credited to ${deposit.userEmail || deposit.username}.`, 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to approve deposit' };
    }
  };

  // Admin: Reject Deposit
  const adminRejectDeposit = async (
    depKey: string,
    deposit: DepositRequest,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `deposit_requests/${depKey}`), {
        status: 'rejected',
        processedAt: Date.now(),
        adminNote: reason || 'Invalid Transaction ID or unverified payment.',
        reviewerEmail: user?.email || 'admin@mailfactory.com',
      });

      // Send Notification to User
      const notifRef = push(ref(db, `user_notifications/${deposit.userId}`));
      await set(notifRef, {
        title: 'ডিপোজিট রিকোয়েস্ট বাতিল হয়েছে ❌',
        desc: `আপনার ৳${Number(deposit.amount).toFixed(2)} (${deposit.method}) ডিপোজিট বাতিল করা হয়েছে। কারণ: ${reason || 'ভুল TrxID বা অপ্রাপ্ত পেমেন্ট'}।`,
        type: 'danger',
        timestamp: Date.now(),
        read: false,
      });

      addNotification('Deposit Rejected ❌', `Deposit for ${deposit.username} rejected.`, 'info');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reject deposit' };
    }
  };

  // Admin Status Determination - Exclusively determined by Firebase email/role
  const isSuperAdminEmail =
    user?.email?.toLowerCase() === 'stb.shirin@gmail.com' ||
    profile?.email?.toLowerCase() === 'stb.shirin@gmail.com';
  const isAdmin = Boolean(user && (isSuperAdminEmail || profile?.role === 'admin'));
  const adminUnlocked = isAdmin;

  const unlockAdmin = (code: string): boolean => {
    return isAdmin;
  };

  const lockAdmin = () => {
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  // Admin: Approve Submission
  const adminApproveSubmission = async (
    subKey: string,
    sub: Submission
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `submissions/${subKey}`), {
        status: 'approved',
        reviewedAt: Date.now(),
        reviewerEmail: user?.email || 'admin@mailfactory.com',
      });

      // Update user wallet and counts
      const targetUserRef = ref(db, `users/${sub.userId}`);
      const userSnap = await get(targetUserRef);
      if (userSnap.exists()) {
        const uData = userSnap.val() as UserProfile;
        const currentHold = Number(uData.hold) || 0;
        const newHold = Math.max(0, currentHold - (Number(sub.totalAmount) || 0));

        await update(targetUserRef, {
          hold: newHold,
          balance: increment(Number(sub.totalAmount) || 0),
          manual_approved_count: increment(Number(sub.count) || 1),
        });

        // Referral commission reward
        if (uData.referredBy) {
          const referrer = allUsers.find(
            (u) => u.uid === uData.referredBy || u.referralCode === uData.referredBy
          );
          if (referrer) {
            const commPercent = sub.commission_percent || commissionPercent || 10;
            const commissionEarned = (Number(sub.totalAmount) * commPercent) / 100;
            if (commissionEarned > 0) {
              await update(ref(db, `users/${referrer.uid}`), {
                balance: increment(commissionEarned),
                referralEarnings: increment(commissionEarned),
              });
            }
          }
        }
      }

      addNotification(
        'Submission Approved ✅',
        `Batch #${subKey.slice(-6)} (${sub.count} Gmails) approved. ৳${sub.totalAmount} credited.`,
        'success'
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to approve submission' };
    }
  };

  // Admin: Reject Submission
  const adminRejectSubmission = async (
    subKey: string,
    sub: Submission,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `submissions/${subKey}`), {
        status: 'rejected',
        rejectionReason: reason || 'Failed verification / Invalid credentials',
        reviewedAt: Date.now(),
        reviewerEmail: user?.email || 'admin@mailfactory.com',
      });

      const targetUserRef = ref(db, `users/${sub.userId}`);
      const userSnap = await get(targetUserRef);
      if (userSnap.exists()) {
        const uData = userSnap.val() as UserProfile;
        const currentHold = Number(uData.hold) || 0;
        const newHold = Math.max(0, currentHold - (Number(sub.totalAmount) || 0));
        await update(targetUserRef, {
          hold: newHold,
        });
      }

      addNotification(
        'Submission Rejected ⚠️',
        `Batch #${subKey.slice(-6)} marked as rejected. Reason: ${reason || 'Verification failed'}`,
        'warning'
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reject submission' };
    }
  };

  // Admin: Approve Withdrawal
  const adminApproveWithdraw = async (
    wdKey: string,
    req: WithdrawRequest,
    trxId?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `withdraw_requests/${wdKey}`), {
        status: 'approved',
        processedAt: Date.now(),
        transactionNote: trxId || 'Paid successfully',
        processedBy: user?.email || 'admin',
      });

      addNotification(
        'Payout Approved 💸',
        `৳${req.amount} paid to ${req.username} via ${req.paymentMethod}. TrxID: ${trxId || 'N/A'}`,
        'success'
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to approve withdrawal' };
    }
  };

  // Admin: Reject Withdrawal
  const adminRejectWithdraw = async (
    wdKey: string,
    req: WithdrawRequest,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `withdraw_requests/${wdKey}`), {
        status: 'rejected',
        transactionNote: reason || 'Rejected by Admin',
        processedAt: Date.now(),
      });

      // Refund the amount back to user's wallet
      await update(ref(db, `users/${req.userId}`), {
        balance: increment(Number(req.amount) || 0),
        total_withdrawn: increment(-(Number(req.amount) || 0)),
      });

      addNotification(
        'Payout Rejected & Refunded 🔄',
        `৳${req.amount} refunded back to ${req.username}. Reason: ${reason || 'Invalid details'}`,
        'warning'
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reject withdrawal' };
    }
  };

  // Admin: Update User Data
  const adminUpdateUser = async (
    uid: string,
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `users/${uid}`), data);
      addNotification('User Updated 👤', 'User record updated in database.', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update user' };
    }
  };

  // Admin: Update Global Settings
  const adminUpdateSettings = async (settingsData: any): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, 'settings'), settingsData);
      addNotification('Settings Saved ⚙️', 'Global rates and settings updated in database.', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to save settings' };
    }
  };

  // Admin: Send Live Chat Message to a User
  const adminSendChatMessage = async (
    targetUserId: string,
    messageText: string,
    targetUsername?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!messageText.trim() || !targetUserId) {
      return { success: false, message: 'Message cannot be empty.' };
    }
    try {
      const chatThreadRef = ref(db, `support_chats/${targetUserId}`);
      const newMsgRef = push(chatThreadRef);
      const newMsg: ChatMessage = {
        id: newMsgRef.key || String(Date.now()),
        uid: targetUserId,
        username: targetUsername || 'User',
        message: messageText.trim(),
        timestamp: Date.now(),
        from: 'admin',
        read: false,
      };
      await set(newMsgRef, newMsg);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to send admin chat message' };
    }
  };

  // Admin: Delete a single chat message
  const adminDeleteChatMessage = async (targetUserId: string, messageId: string): Promise<{ success: boolean }> => {
    try {
      await remove(ref(db, `support_chats/${targetUserId}/${messageId}`));
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  // Admin: Clear an entire chat thread
  const adminClearChatThread = async (targetUserId: string): Promise<{ success: boolean }> => {
    try {
      await remove(ref(db, `support_chats/${targetUserId}`));
      addNotification('Chat Cleared 🗑️', 'Conversation thread has been wiped.', 'info');
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  // Admin: Send Broadcast / Target Notification
  const adminSendBroadcastNotification = async (data: {
    title: string;
    desc: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    targetUserId?: string;
    targetUserEmail?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!data.title.trim() || !data.desc.trim()) {
      return { success: false, message: 'Title and description are required.' };
    }
    try {
      const broadcastRef = ref(db, 'broadcast_notifications');
      const newBroadcastRef = push(broadcastRef);
      const payload: BroadcastNotification = {
        id: String(Date.now()),
        title: data.title.trim(),
        desc: data.desc.trim(),
        type: data.type || 'info',
        timestamp: Date.now(),
        targetUserId: data.targetUserId || '',
        targetUserEmail: data.targetUserEmail || '',
        sentBy: user?.email || 'Support Admin',
      };
      await set(newBroadcastRef, payload);

      addNotification(
        'Notification Dispatched 📢',
        data.targetUserId ? `Sent to ${data.targetUserEmail || 'User'}` : 'Broadcast sent to all users.',
        'success'
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to dispatch notification' };
    }
  };

  // Admin: Delete Broadcast Notification
  const adminDeleteBroadcastNotification = async (key: string): Promise<{ success: boolean }> => {
    try {
      await remove(ref(db, `broadcast_notifications/${key}`));
      addNotification('Broadcast Deleted 🗑️', 'Announcement removed from database.', 'info');
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  // Admin: Reward Referral Bonus manually
  const adminRewardReferral = async (
    targetUserId: string,
    amount: number,
    note: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await update(ref(db, `users/${targetUserId}`), {
        balance: increment(amount),
        referralEarnings: increment(amount),
      });

      // Send notice to user
      const broadcastRef = ref(db, 'broadcast_notifications');
      const newBroadcastRef = push(broadcastRef);
      await set(newBroadcastRef, {
        id: String(Date.now()),
        title: 'Referral Bonus Rewarded 🎁',
        desc: `You received +৳${amount.toFixed(2)} referral bonus! Note: ${note || 'Admin milestone bonus'}`,
        type: 'success',
        timestamp: Date.now(),
        targetUserId: targetUserId,
        sentBy: user?.email || 'Admin',
      });

      addNotification('Bonus Credited 🎁', `৳${amount} credited to user referral wallet.`, 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reward user' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        language,
        setLanguage: handleLanguageChange,
        theme,
        setTheme,
        toggleTheme,
        isDarkMode,
        activeTab,
        setActiveTab,
        levels,
        currentLevel,
        nextLevel,
        reviewShifts,
        paymentMethods,
        maintenanceMode,
        isWithdrawDisabled,
        minWithdraw,
        commissionPercent,
        signupBonusUser,
        signupBonusReferrer,
        submissions,
        withdrawRequests,
        allSubmissions,
        allWithdrawRequests,
        depositRequests,
        allDepositRequests,
        submitDepositRequest,
        adminApproveDeposit,
        adminRejectDeposit,
        notifications,
        unreadNotifsCount,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        allUsers,
        allSupportChats,
        broadcastNotifications,
        chatMessages,
        sendChatMessage,
        submitGmails,
        requestWithdraw,
        updateProfileData,
        isAdmin,
        adminUnlocked,
        unlockAdmin,
        lockAdmin,
        adminApproveSubmission,
        adminRejectSubmission,
        adminApproveWithdraw,
        adminRejectWithdraw,
        adminUpdateUser,
        adminUpdateSettings,
        adminSendChatMessage,
        adminDeleteChatMessage,
        adminClearChatThread,
        adminSendBroadcastNotification,
        adminDeleteBroadcastNotification,
        adminRewardReferral,
        isAuthModalOpen,
        setAuthModalOpen,
        isWithdrawModalOpen,
        setWithdrawModalOpen,
        isChatDrawerOpen,
        setChatDrawerOpen,
        isNotifDrawerOpen,
        setNotifDrawerOpen,
        claimDailyStreak,
        appLogo,
        copyText,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
