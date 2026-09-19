'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from '@/lib/navigation';
import { ArrowRight, Loader2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { MessagesIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { AUTH_USER_KEY } from '@/lib/constants';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  Window,
  ChannelHeader,
  MessageList,
  MessageComposer,
  Thread,
  useChatContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

const streamApiKey = process.env.NEXT_PUBLIC_GETSTREAM_API || 'affyy642y3fs';

type ChatType = 'dm' | 'team';

const EmptyChannelIndicator = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 gap-3 h-full min-h-[260px] select-none">
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
      <MessageSquare className="w-6 h-6 text-zinc-400" />
    </div>
    <p className="text-xs font-bold text-zinc-200">لا توجد محادثات سابقة</p>
    <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
      يمكنك مراسلة أي لاعب من خلال زيارة حسابه الشخصي والنقر على "مراسلة اللاعب"
    </p>
  </div>
);

function ChatResponsiveView({
  activeTab,
  dmFilters,
  teamFilters,
  sort,
  activeChannel,
  setActiveChannel,
}: {
  activeTab: ChatType;
  dmFilters: any;
  teamFilters: any;
  sort: any;
  activeChannel: any;
  setActiveChannel: (ch: any) => void;
}) {
  const { channel, setActiveChannel: setContextChannel } = useChatContext();

  useEffect(() => {
    if (activeChannel) {
      setContextChannel(activeChannel);
    }
  }, [activeChannel, setContextChannel]);

  const currentChannel = channel || activeChannel;
  const isChannelOpen = !!currentChannel;

  return (
    <div className="flex flex-col md:flex-row w-full h-full min-h-0 relative overflow-hidden">
      {/* Sidebar Channel List: Full width on mobile when no channel open; w-80 on desktop */}
      <div
        className={`${
          isChannelOpen ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-80 md:shrink-0 h-full border-r border-white/10 bg-[#080808] shadow-inner overflow-y-auto`}
      >
        {activeTab === 'dm' ? (
          <ChannelList
            key="dm-list"
            filters={dmFilters}
            sort={sort}
            setActiveChannelOnMount={false}
            EmptyStateIndicator={EmptyChannelIndicator}
          />
        ) : (
          <ChannelList
            key="team-list"
            filters={teamFilters}
            sort={sort}
            setActiveChannelOnMount={false}
            EmptyStateIndicator={EmptyChannelIndicator}
          />
        )}
      </div>

      {/* Main Conversation Window: Full width on mobile when open; flex-1 on desktop */}
      <div
        className={`${
          isChannelOpen ? 'flex' : 'hidden md:flex'
        } flex-col flex-1 min-w-0 h-full bg-black relative`}
      >
        {currentChannel ? (
          <Channel channel={currentChannel}>
            <Window>
              {/* Mobile Back Header Bar */}
              <div className="md:hidden flex items-center justify-between px-3 py-2.5 bg-[#0e0e0e] border-b border-white/10 text-white shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel(null);
                    setContextChannel(undefined);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>العودة للمحادثات</span>
                </button>
                <div className="text-xs font-black truncate max-w-[200px] text-zinc-200">
                  {currentChannel.data?.name || (activeTab === 'team' ? 'محادثة الفريق' : 'محادثة خاصة')}
                </div>
              </div>
              <ChannelHeader />
              <MessageList />
              <MessageComposer />
            </Window>
            <Thread />
          </Channel>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-zinc-500 gap-3 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-xs font-bold text-zinc-400">حدد محادثة من القائمة للبدء بالتواصل</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialRecipientId = searchParams.get('recipientId');
  const initialTargetTeamId = searchParams.get('targetTeamId');

  const [activeTab, setActiveTab] = useState<ChatType>(initialTargetTeamId ? 'team' : 'dm');
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<any>(null);

  useEffect(() => {
    initStream();
    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [initialRecipientId, initialTargetTeamId]);

  const initStream = async () => {
    setIsClientReady(false);
    setErrorMsg(null);

    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    if (!savedUserId) {
      setErrorMsg('يجب تسجيل الدخول لاستخدام نظام المحادثة.');
      return;
    }
    const userId = savedUserId;

    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const client = StreamChat.getInstance(streamApiKey, { browser: true, timeout: 10000 });

      if (client.userID !== userId) {
        if (client.userID) {
          await client.disconnectUser();
        }

        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, recipientId: initialRecipientId }),
        });

        const tokenData = await response.json();
        if (!tokenData.token) {
          throw new Error(tokenData.error || 'فشل في الحصول على مفتاح جلسة المحادثة');
        }

        await client.connectUser(
          {
            id: userId,
            name: userData?.full_name || userData?.username || `Player_${userId.substring(0, 6)}`,
            image: userData?.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
          },
          tokenData.token
        );
      }

      setChatClient(client);

      // If initialRecipientId is set, create or watch a DM channel
      if (initialRecipientId && initialRecipientId !== userId) {
        setActiveTab('dm');
        const channel = client.channel('messaging', {
          members: [userId, initialRecipientId],
        });
        await channel.watch();
        setActiveChannel(channel);
      }

      // If initialTargetTeamId is set, create or watch a team channel
      if (initialTargetTeamId) {
        setActiveTab('team');
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', initialTargetTeamId)
          .maybeSingle();

        if (teamData) {
          const members = [userId];
          if (teamData.captain_id && teamData.captain_id !== userId) {
            members.push(teamData.captain_id);
          }

          const channel = client.channel('team', `team-${initialTargetTeamId}`, {
            ...(({ name: teamData.name, image: teamData.logo_url || '', members }) as Record<string, unknown>),
          });
          await channel.watch();
          setActiveChannel(channel);
        }
      }

      // Notification listener for outgoing messages
      client.on('message.new', async (event) => {
        if (event.user?.id === userId && event.message && event.channel_id) {
          const channel = client.activeChannels[event.channel_id] || client.activeChannels[event.channel_type + ':' + event.channel_id];
          if (channel?.state?.members) {
            const otherMembers = Object.values(channel.state.members).filter((m: any) => m.user_id !== userId);
            for (const member of otherMembers) {
              if (member.user_id) {
                try {
                  await supabase.from('notifications').insert({
                    user_id: member.user_id,
                    type: 'message',
                    title: channel.type === 'team' ? 'رسالة فريق جديدة' : 'رسالة خاصة جديدة',
                    message: `تلقيت رسالة من ${event.user.name || event.user.id}`,
                    actor_id: userId,
                    link_url: channel.type === 'team'
                      ? `/messages?targetTeamId=${channel.id?.replace('team-', '')}`
                      : `/messages?recipientId=${userId}`,
                    is_read: false,
                  });
                } catch (nErr) {
                  console.warn('Could not insert message notification:', nErr);
                }
              }
            }
          }
        }
      });

      setIsClientReady(true);
    } catch (err: any) {
      console.error('Failed to init stream', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بنظام المحادثة.');
      setIsClientReady(false);
    }
  };

  const dmFilters = chatClient ? { type: 'messaging', members: { $in: [chatClient.userID as string] } } : {};
  const teamFilters = chatClient ? { type: 'team', members: { $in: [chatClient.userID as string] } } : {};
  const sort = { last_message_at: -1 as const };

  return (
    <div className="w-full layout-container h-[calc(100dvh-75px)] md:h-[calc(100vh-105px)] mt-1 sm:mt-2 card-3d rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden animate-in fade-in duration-300 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#0a0a0a] text-white border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black shrink-0 shadow-sm">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>غرفة المحادثة والرسائل الفورية</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 font-mono">
                IEH Chat
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              تنسيق المباريات والتواصل المباشر مع اللاعبين وقادة الفرق
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex bg-[#050505] border border-white/10 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('dm'); setActiveChannel(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                activeTab === 'dm' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessagesIcon className="w-4 h-4" />
              <span>الرسائل الخاصة (DMs)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('team'); setActiveChannel(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                activeTab === 'team' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TeamsIcon className="w-4 h-4" />
              <span>بريد الفرق (Teams)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden bg-black relative">
        {errorMsg ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            <AlertCircle className="w-10 h-10 text-white mb-3" />
            <p className="font-bold text-sm text-white mb-1">تعذر الاتصال بالمحادثة</p>
            <p className="text-xs text-zinc-400 max-w-sm mb-4">{errorMsg}</p>
            <button
              onClick={() => initStream()}
              className="px-4 py-2 rounded-xl btn-3d-primary text-black font-extrabold text-xs flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : !isClientReady || !chatClient ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-white" />
            <p className="font-bold text-xs text-zinc-400">جاري الاتصال بنظام المحادثة المشفر...</p>
          </div>
        ) : (
          <div className="w-full h-full str-chat-custom-container" style={{ direction: 'ltr' }}>
            {/* 100% Strict Monochrome Stream Chat Styles */}
            <style dangerouslySetInnerHTML={{__html: `
              .str-chat-custom-container {
                --str-chat__primary-color: #ffffff;
                --str-chat__active-primary-color: #e5e5e5;
                --str-chat__surface-color: #080808;
                --str-chat__background-color: #000000;
                --str-chat__text-color: #ffffff;
                --str-chat__text-low-emphasis-color: #a1a1aa;
                --str-chat__text-primary: #ffffff;
                --str-chat__text-secondary: #a1a1aa;
                --str-chat__background-core: #000000;
                --str-chat__background-core-elevation-1: #0e0e0e;
                --str-chat__border-radius-sm: 8px;
                --str-chat__border-radius-md: 12px;
                --str-chat__border-radius-lg: 16px;
              }
              .str-chat-custom-container .str-chat {
                height: 100%;
                width: 100%;
                background: #000000 !important;
                color: #ffffff !important;
                font-family: inherit;
              }

              /* Channel List & Channel Items Styling for Mobile & Desktop */
              .str-chat-custom-container .str-chat__channel-list,
              .str-chat-custom-container .str-chat.str-chat__channel-list {
                background: #080808 !important;
                border-right: 1px solid rgba(255,255,255,0.1) !important;
                color: #ffffff !important;
                height: 100% !important;
                width: 100% !important;
                max-width: 100% !important;
                min-width: 0 !important;
                position: relative !important;
                top: auto !important;
                bottom: auto !important;
                inset-inline-start: auto !important;
                transform: none !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                display: flex !important;
                flex-direction: column !important;
                z-index: 1 !important;
              }
              .str-chat-custom-container .str-chat__channel-list-inner,
              .str-chat-custom-container .str-chat__channel-list-inner__main {
                background: #080808 !important;
                height: 100% !important;
                width: 100% !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .str-chat-custom-container .str-chat__channel-list-messenger,
              .str-chat-custom-container .str-chat__channel-list-messenger__main {
                height: 100% !important;
                width: 100% !important;
                visibility: visible !important;
                opacity: 1 !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .str-chat-custom-container .str-chat__channel-list-item,
              .str-chat-custom-container .str-chat__channel-list-item-container,
              .str-chat-custom-container .str-chat__channel-preview-messenger {
                background: #0e0e0e !important;
                border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                border-radius: 12px !important;
                margin: 4px 8px !important;
                padding: 10px 12px !important;
                color: #ffffff !important;
                cursor: pointer !important;
                transition: background 0.15s ease, border-color 0.15s ease !important;
                width: calc(100% - 16px) !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                display: flex !important;
              }
              .str-chat-custom-container .str-chat__channel-list-item:hover,
              .str-chat-custom-container .str-chat__channel-preview-messenger:hover {
                background: #181818 !important;
              }
              .str-chat-custom-container .str-chat__channel-list-item[aria-pressed="true"],
              .str-chat-custom-container .str-chat__channel-preview-messenger--active {
                background: #222222 !important;
                border-left: 3px solid #ffffff !important;
              }
              .str-chat-custom-container .str-chat__channel-list-item-data__title,
              .str-chat-custom-container .str-chat__channel-list-item-data__title span,
              .str-chat-custom-container .str-chat__channel-preview-messenger--name {
                color: #ffffff !important;
                font-weight: 800 !important;
                font-size: 13px !important;
              }
              .str-chat-custom-container .str-chat__channel-list-item-data,
              .str-chat-custom-container .str-chat__channel-preview-messenger--last-message {
                color: #a1a1aa !important;
                font-size: 12px !important;
              }
              .str-chat-custom-container .str-chat__channel-list-item-timestamp {
                color: #71717a !important;
                font-size: 10px !important;
              }

              /* Chat Header */
              .str-chat-custom-container .str-chat__header-livestream,
              .str-chat-custom-container .str-chat__channel-header {
                background: #0c0c0c !important;
                border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                color: #ffffff !important;
                padding: 10px 16px !important;
              }

              /* Messages Bubble Styling */
              .str-chat-custom-container .str-chat__message-simple-text-inner {
                border-radius: 16px !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
              }
              .str-chat-custom-container .str-chat__message--me .str-chat__message-simple-text-inner {
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: 600 !important;
                border: none !important;
                box-shadow: 0 1px 4px rgba(255,255,255,0.1) !important;
              }
              .str-chat-custom-container .str-chat__message--other .str-chat__message-simple-text-inner {
                background: #141414 !important;
                color: #ffffff !important;
                border: 1px solid rgba(255,255,255,0.15) !important;
              }

              /* Message Composer Input */
              .str-chat-custom-container .str-chat__message-input {
                background: #0a0a0a !important;
                border-top: 1px solid rgba(255,255,255,0.1) !important;
                padding: 10px 14px !important;
              }
              .str-chat-custom-container .str-chat__input-flat {
                background: #141414 !important;
                border: 1px solid rgba(255,255,255,0.2) !important;
                border-radius: 14px !important;
                padding: 4px 10px !important;
              }
              .str-chat-custom-container .str-chat__textarea textarea {
                color: #ffffff !important;
                background: transparent !important;
                font-size: 13px !important;
              }
              .str-chat-custom-container .str-chat__textarea textarea::placeholder {
                color: #71717a !important;
              }
              .str-chat-custom-container .str-chat__send-button {
                color: #000000 !important;
                background: #ffffff !important;
                border-radius: 50% !important;
                width: 32px !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .str-chat-custom-container .str-chat__send-button svg {
                fill: #000000 !important;
              }

              /* Issue 3: 100% True Circular Avatar with NO rectangular inner artifacts */
              .str-chat-custom-container .str-chat__avatar,
              .str-chat-custom-container .str-chat__message-sender-avatar .str-chat__avatar,
              .str-chat-custom-container .str-chat__avatar--circle {
                width: 38px !important;
                height: 38px !important;
                min-width: 38px !important;
                min-height: 38px !important;
                max-width: 38px !important;
                max-height: 38px !important;
                border: 1.5px solid rgba(255,255,255,0.25) !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                aspect-ratio: 1 / 1 !important;
                background: #111111 !important;
                padding: 0 !important;
                box-shadow: none !important;
              }
              .str-chat-custom-container .str-chat__avatar::before,
              .str-chat-custom-container .str-chat__avatar::after {
                display: none !important;
                content: none !important;
                border: none !important;
              }
              .str-chat-custom-container .str-chat__avatar img,
              .str-chat-custom-container .str-chat__avatar .str-chat__avatar-image {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 50% !important;
                display: block !important;
                aspect-ratio: 1 / 1 !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .str-chat-custom-container .str-chat__avatar .str-chat__avatar-fallback,
              .str-chat-custom-container .str-chat__avatar .str-chat__avatar-initials {
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: #18181b !important;
                color: #ffffff !important;
                font-weight: bold !important;
                font-size: 13px !important;
                border-radius: 50% !important;
                border: none !important;
              }

              /* Issue 5: Generous space between profile picture and message bubble */
              .str-chat-custom-container .str-chat__message.str-chat__message--with-avatar {
                column-gap: 14px !important;
              }
              .str-chat-custom-container .str-chat__message.str-chat__message--other .str-chat__avatar {
                margin-inline-end: 12px !important;
              }
              .str-chat-custom-container .str-chat__message.str-chat__message--me .str-chat__avatar {
                margin-inline-start: 12px !important;
              }
            `}} />
            <Chat client={chatClient} theme="str-chat__theme-dark">
              <ChatResponsiveView
                activeTab={activeTab}
                dmFilters={dmFilters}
                teamFilters={teamFilters}
                sort={sort}
                activeChannel={activeChannel}
                setActiveChannel={setActiveChannel}
              />
            </Chat>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full layout-container h-[calc(100vh-105px)] mt-2 card-3d rounded-3xl flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
