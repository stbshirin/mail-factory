import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { hapticFeedback } from '../../lib/haptics';
import {
  MessageSquare,
  Send,
  Trash2,
  Search,
  User,
  Shield,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  CornerDownLeft,
  Headphones,
  Zap,
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../../types';

export const AdminLiveChat: React.FC = () => {
  const {
    language,
    allSupportChats,
    allUsers,
    adminSendChatMessage,
    adminDeleteChatMessage,
    adminClearChatThread,
    addNotification,
  } = useApp();

  const t = translations[language];

  // Selected thread by userId
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Map users by UID for fast metadata lookup
  const userMap = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    allUsers.forEach((u) => {
      if (u.uid) map[u.uid] = u;
    });
    return map;
  }, [allUsers]);

  // Transform allSupportChats into thread list with meta
  const chatThreads = useMemo(() => {
    const list: Array<{
      userId: string;
      user: UserProfile | undefined;
      messages: ChatMessage[];
      lastMessage: ChatMessage | undefined;
      lastTimestamp: number;
      unreadCount: number;
    }> = [];

    Object.keys(allSupportChats).forEach((uid) => {
      const msgs = allSupportChats[uid] || [];
      if (msgs.length === 0) return;
      const lastMsg = msgs[msgs.length - 1];
      const unreadCount = msgs.filter((m) => m.from === 'user' && !m.read).length;
      list.push({
        userId: uid,
        user: userMap[uid],
        messages: msgs,
        lastMessage: lastMsg,
        lastTimestamp: lastMsg?.timestamp || 0,
        unreadCount,
      });
    });

    // Sort by latest message
    list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    return list;
  }, [allSupportChats, userMap]);

  // Filter threads by search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return chatThreads;
    const q = searchQuery.toLowerCase().trim();
    return chatThreads.filter((th) => {
      const uName = th.user?.username?.toLowerCase() || '';
      const uEmail = th.user?.email?.toLowerCase() || '';
      const lastText = th.lastMessage?.message?.toLowerCase() || '';
      return uName.includes(q) || uEmail.includes(q) || th.userId.toLowerCase().includes(q) || lastText.includes(q);
    });
  }, [chatThreads, searchQuery]);

  // Set default selected thread if none selected
  useEffect(() => {
    if (!selectedUserId && filteredThreads.length > 0) {
      setSelectedUserId(filteredThreads[0].userId);
    }
  }, [filteredThreads, selectedUserId]);

  // Auto-scroll on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, allSupportChats]);

  // Selected thread data
  const currentThread = selectedUserId ? allSupportChats[selectedUserId] || [] : [];
  const selectedUser = selectedUserId ? userMap[selectedUserId] : undefined;

  // Handle Send Reply
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserId || !replyText.trim() || isSending) return;

    hapticFeedback.medium();
    setIsSending(true);
    const textToSend = replyText.trim();
    setReplyText('');

    const res = await adminSendChatMessage(selectedUserId, textToSend, selectedUser?.username);
    setIsSending(false);

    if (!res.success) {
      addNotification('Error', res.message || 'Failed to send message', 'danger');
    }
  };

  // Canned quick replies
  const quickReplies = [
    { label: 'Checking Gmails', text: '✅ আপনার জিমেইল ব্যাচ চেক করা হচ্ছে, অনুগ্রহ করে ৫-১০ মিনিট অপেক্ষা করুন।' },
    { label: 'Payment Sent', text: '💰 আপনার উত্তোলন সফলভাবে পাঠানো হয়েছে! আপনার একাউন্টে ট্রানজেকশন চেক করুন।' },
    { label: 'Password Error', text: '⚠️ কিছু জিমেইলে ভুল পাসওয়ার্ড বা 2FA সমস্যা পাওয়া গেছে। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।' },
    { label: 'Support Greeting', text: '👋 হ্যালো! Mail Factory সাপোর্টে আপনাকে স্বাগতম। আমরা আপনাকে কীভাবে সাহায্য করতে পারি?' },
    { label: 'Approved Notice', text: '🎉 আপনার জিমেইল ব্যাচ অনুমোদিত হয়েছে এবং টাকা মূল ব্যালেন্সে যোগ করা হয়েছে।' },
  ];

  const handleApplyQuickReply = (text: string) => {
    setReplyText(text);
  };

  const handleClearThread = async () => {
    if (!selectedUserId) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে এই ইউজারের সকল চ্যাট মুছে ফেলতে চান?' : 'Clear all chat messages for this user?')) {
      hapticFeedback.heavy();
      await adminClearChatThread(selectedUserId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800">
              {language === 'bn' ? 'এডমিন লাইভ চ্যাট সাপোর্ট ডেক্স' : 'Admin Live Support Desk'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? `মোট সক্রিয় চ্যাট থ্রেড: ${chatThreads.length} টি`
                : `Total Active Conversations: ${chatThreads.length}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'ইউজার বা মেসেজ খুঁজুন...' : 'Search user or message...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Chat Layout: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[520px]">
        {/* Left Column: Thread List */}
        <div className="rounded-3xl bg-white border border-slate-200 p-3 shadow-sm flex flex-col overflow-hidden h-[540px]">
          <div className="px-2 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{language === 'bn' ? 'ইউজার কনভারসেশন' : 'User Conversations'}</span>
            <span className="text-indigo-600">{filteredThreads.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1 divide-y divide-slate-50">
            {filteredThreads.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-500" />
                <p>{language === 'bn' ? 'কোনো মেসেজ পাওয়া যায়নি' : 'No conversations found'}</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedUserId === thread.userId;
                const userObj = thread.user;
                const timeStr = thread.lastTimestamp
                  ? new Date(thread.lastTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <button
                    key={thread.userId}
                    onClick={() => {
                      hapticFeedback.light();
                      setSelectedUserId(thread.userId);
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {userObj?.photoURL ? (
                          <img
                            src={userObj.photoURL}
                            alt=""
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          (userObj?.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white absolute -bottom-0.5 -right-0.5" />
                    </div>

                    {/* Meta & Last Message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {userObj?.username || 'User'}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {timeStr}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        {thread.lastMessage?.from === 'admin' ? '🛡️ You: ' : ''}
                        {thread.lastMessage?.message || 'No message'}
                      </p>
                    </div>

                    {thread.unreadCount > 0 && !isSelected && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Workspace */}
        <div className="md:col-span-2 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[540px]">
          {selectedUserId ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedUser?.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      (selectedUser?.username || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>{selectedUser?.username || 'Mail Factory User'}</span>
                      <span className="text-[10px] font-mono text-slate-400">({selectedUser?.email || selectedUserId})</span>
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span>Balance: ৳{(selectedUser?.balance || 0).toFixed(2)}</span>
                      <span>•</span>
                      <span>Approved: {selectedUser?.manual_approved_count || 0} Gmails</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClearThread}
                    title="Clear All Messages in Thread"
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Canned Replies Bar */}
              <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 whitespace-nowrap mr-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Quick Replies:</span>
                </div>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyQuickReply(qr.text)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 whitespace-nowrap shadow-2xs hover:bg-indigo-50/50 transition-all active:scale-95"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {currentThread.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs font-medium">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-500" />
                    <p>{language === 'bn' ? 'এই ইউজারের কোনো মেসেজ নেই' : 'No messages in this thread yet'}</p>
                  </div>
                ) : (
                  currentThread.map((msg, index) => {
                    const isAdmin = msg.from === 'admin';
                    const isBot = msg.from === 'bot';
                    const timeStr = msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col group ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-xs relative ${
                            isAdmin
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-md'
                              : isBot
                              ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {/* Sender Tag */}
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-extrabold opacity-80">
                            {isAdmin ? (
                              <>
                                <Shield className="w-3 h-3 text-amber-300" />
                                <span>Support Admin</span>
                              </>
                            ) : isBot ? (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>System Bot</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-indigo-600" />
                                <span>{selectedUser?.username || 'User'}</span>
                              </>
                            )}
                          </div>

                          {/* Message Body */}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>

                          {/* Time & Action */}
                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1.5 text-[9px] font-mono ${
                              isAdmin ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{timeStr}</span>
                            {msg.id && (
                              <button
                                onClick={() => {
                                  if (selectedUserId && msg.id) {
                                    adminDeleteChatMessage(selectedUserId, msg.id);
                                  }
                                }}
                                title="Delete message"
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Area */}
              <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'সাপোর্ট এডমিন হিসেবে মেসেজ লিখুন...' : 'Type reply as Support Admin...'}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (language === 'bn' ? 'পাঠান' : 'Send')}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-indigo-300 opacity-40" />
              <h3 className="text-sm font-black text-slate-700 mb-1">
                {language === 'bn' ? 'একটি চ্যাট নির্বাচন করুন' : 'Select a conversation'}
              </h3>
              <p className="text-xs max-w-sm">
                {language === 'bn'
                  ? 'বামের তালিকা থেকে যেকোনো ইউজারের ওপর ক্লিক করে লাইভ রিপ্লাই প্রদান করুন।'
                  : 'Click on any user on the left list to view thread and send real-time replies.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
