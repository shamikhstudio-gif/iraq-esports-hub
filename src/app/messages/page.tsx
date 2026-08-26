'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MessagesIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  useChatContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

const streamApiKey = process.env.NEXT_PUBLIC_GETSTREAM_API || 'affyy642y3fs';

type ChatType = 'dm' | 'team';

function ActiveChannelSetter({ channel }: { channel: any }) {
  const { setActiveChannel } = useChatContext();
  
  useEffect(() => {
    if (channel) {
      setActiveChannel(channel);
    }
  }, [channel, setActiveChannel]);

  return null;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialRecipientId = searchParams.get('recipientId');
  const initialTargetTeamId = searchParams.get('targetTeamId');

  const [activeTab, setActiveTab] = useState<ChatType>(initialTargetTeamId ? 'team' : 'dm');
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  
  // Custom states for programmatic channel creation
  const [activeChannel, setActiveChannel] = useState<any>(null);

  useEffect(() => {
    initStream();
    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [initialRecipientId, initialTargetTeamId]);

  const initStream = async () => {
    setIsClientReady(false);
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      return;
    }
    const userId = savedUserId;

    const { data: userData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!userData) return;
    
    const client = StreamChat.getInstance(streamApiKey);

    try {
      if (client.userID !== userId) {
        if (client.userID) {
          await client.disconnectUser();
        }

        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const { token } = await response.json();

        await client.connectUser(
          {
            id: userId,
            name: userData.full_name,
            image: userData.avatar_url || 'https://via.placeholder.com/150',
          },
          token
        );
      }

      setChatClient(client);

      // If initialRecipientId is set, create/watch a DM channel
      if (initialRecipientId && initialRecipientId !== userId) {
        setActiveTab('dm');
        const channel = client.channel('messaging', {
          members: [userId, initialRecipientId],
        });
        await channel.watch();
        setActiveChannel(channel);
      }

      // If initialTargetTeamId is set, create/watch a team channel
      if (initialTargetTeamId) {
        setActiveTab('team');
        const { data: teamData } = await supabase.from('teams').select('*').eq('id', initialTargetTeamId).single();
        if (teamData) {
          // Add the user to the team channel (along with the captain so the captain receives it)
          const members = [userId];
          if (teamData.captain_id && teamData.captain_id !== userId) {
            members.push(teamData.captain_id);
          }
          
          const channel = client.channel('team', `team-${initialTargetTeamId}`, {
            name: teamData.name,
            image: teamData.logo_url || 'https://via.placeholder.com/150',
            members: members,
          });
          await channel.watch();
          setActiveChannel(channel);
        }
      }

      // Add event listener to trigger Supabase notifications for outgoing messages
      client.on('message.new', async (event) => {
        // Only trigger if the current user SENT the message
        if (event.user?.id === userId && event.message && event.channel_id) {
           const channel = client.activeChannels[event.channel_id] || client.activeChannels[event.channel_type + ':' + event.channel_id];
           if (channel && channel.state && channel.state.members) {
              const otherMembers = Object.values(channel.state.members).filter(m => m.user_id !== userId);
              
              for (const member of otherMembers) {
                if (member.user_id) {
                  await supabase.from('notifications').insert({
                    user_id: member.user_id,
                    type: 'message',
                    title: channel.type === 'team' ? `رسالة فريق جديدة` : 'رسالة جديدة',
                    description: `تلقيت رسالة من ${event.user.name || event.user.id}`,
                    actor_id: userId,
                    link_url: channel.type === 'team' 
                      ? `/messages?targetTeamId=${channel.id?.replace('team-', '')}` 
                      : `/messages?recipientId=${userId}`
                  });
                }
              }
           }
        }
      });

      setIsClientReady(true);
    } catch (err) {
      console.error('Failed to init stream', err);
      setIsClientReady(false);
    }
  };

  // Custom filters for the lists
  const dmFilters = chatClient ? { type: 'messaging', members: { $in: [chatClient.userID as string] } } : {};
  const teamFilters = chatClient ? { type: 'team', members: { $in: [chatClient.userID as string] } } : {};
  const sort = { last_message_at: -1 as const };

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-100px)] mt-4 card-3d rounded-3xl flex flex-col overflow-hidden animate-in fade-in duration-300" style={{ direction: 'ltr' }}>
      <div className="flex items-center justify-between p-4 bg-[#121212] text-white border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-black flex items-center gap-2 text-base">
            <span className="text-white">Stream</span>
            <span className="text-zinc-400">Chat</span>
          </h2>
        </div>
        <div className="flex bg-[#080808] border border-white/10 p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => { setActiveTab('dm'); setActiveChannel(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-2 ${activeTab === 'dm' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <MessagesIcon className="w-4 h-4" /> Direct Messages
            </button>
            <button 
              onClick={() => { setActiveTab('team'); setActiveChannel(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-2 ${activeTab === 'team' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <TeamsIcon className="w-4 h-4" /> Teams Inbox
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-[#050505]">
        {!isClientReady || !chatClient ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-white" />
            <p className="font-medium text-zinc-400">Connecting to Stream...</p>
          </div>
        ) : (
          <div className="w-full h-full str-chat-custom-container">
            <style dangerouslySetInnerHTML={{__html: `
              .str-chat-custom-container .str-chat { height: 100%; width: 100%; background: #000000; color: #ffffff; }
              .str-chat-custom-container .str-chat__channel-list { background: #080808; border-right: 1px solid rgba(255,255,255,0.1); color: #ffffff; }
              .str-chat-custom-container .str-chat__header-livestream { background: #111111; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ffffff; }
              .str-chat-custom-container .str-chat__message-input { background: #111111; border-top: 1px solid rgba(255,255,255,0.1); color: #ffffff; }
            `}} />
            <Chat client={chatClient} theme="str-chat__theme-dark">
              <ActiveChannelSetter channel={activeChannel} />
              <div className="w-80 h-full border-r border-white/10 bg-[#080808] flex-shrink-0 float-left shadow-inner">
                {activeTab === 'dm' ? (
                  <ChannelList 
                    key="dm-list" 
                    filters={dmFilters} 
                    sort={sort} 
                    setActiveChannelOnMount={!activeChannel} 
                  />
                ) : (
                  <ChannelList 
                    key="team-list" 
                    filters={teamFilters} 
                    sort={sort} 
                    setActiveChannelOnMount={!activeChannel} 
                  />
                )}
              </div>
              <div className="h-full overflow-hidden bg-black" style={{ width: 'calc(100% - 20rem)' }}>
                <Channel>
                  <Window>
                    <ChannelHeader />
                    <MessageList />
                    <MessageInput />
                  </Window>
                  <Thread />
                </Channel>
              </div>
            </Chat>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-7xl mx-auto h-[calc(100vh-100px)] mt-4 card-3d rounded-3xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
