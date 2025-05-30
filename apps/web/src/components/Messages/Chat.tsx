'use client';

import { useSession } from '@/app/(main)/SessionProvider';
import NavigationCard from '@/components/Home/sidebars/left/NavigationCard';
import SuggestedConnections from '@/components/Home/sidebars/right/SuggestedConnections';
import StickyFooter from '@/components/Layouts/StinkyFooter';
import ChatSkeleton from '@/components/Layouts/skeletons/ChatSkeleton';
import useInitializeChatClient from '@/hooks/useInitializeChatClient';
import { Button } from '@zephyr/ui/shadui/button';
import { motion } from 'framer-motion';
import { MessageSquarePlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Channel, Chat as StreamChat } from 'stream-chat-react';
import ChatChannel from './ChatChannel';
import ChatSidebar from './ChatSidebar';
import { ChatThemeProvider } from './ChatThemeProvider';

const WelcomeScreen = ({ onNewChat }: { onNewChat: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center px-4 text-center"
    >
      <div className="mb-8 rounded-full bg-primary/10 p-6">
        <MessageSquarePlus className="h-12 w-12 text-primary" />
      </div>
      <h2 className="mb-3 font-bold text-2xl">Welcome to Whispers!</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Start connecting with others through private messages. Begin a
        conversation with anyone in the Zephyr community.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={onNewChat}
          size="lg"
          className="flex items-center gap-2"
        >
          <MessageSquarePlus className="h-5 w-5" />
          Start a New Chat
        </Button>
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/50 p-6">
        <h3 className="mb-4 font-semibold text-lg">Quick Tips:</h3>
        <ul className="text-start text-muted-foreground text-sm">
          <li className="mb-2">• Start private conversations with any user</li>
          <li className="mb-2">• Share images and links in your chats</li>
          <li className="mb-2">• Receive notifications for new messages</li>
          <li>• Access your conversations from any device</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default function Chat() {
  const { resolvedTheme } = useTheme();
  const session = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const router = useRouter();
  const { chatClient, isLoading, isConfigured, error } =
    useInitializeChatClient();
  const isProd = process.env.NODE_ENV === 'production';

  useEffect(() => {
    console.debug('[Chat] Status:', {
      isLoading,
      isConfigured,
      hasClient: !!chatClient,
      hasError: !!error,
      streamKey: process.env.NEXT_PUBLIC_STREAM_KEY ? 'Set' : 'Not Set',
      env: process.env.NODE_ENV,
      userId: session.user?.id,
      timestamp: new Date().toISOString(),
    });

    if (!isProd && !isLoading && !isConfigured) {
      console.warn('[Chat] Stream not configured, redirecting... (dev only)');
      router.replace('/messages/not-configured');
      return;
    }
  }, [isLoading, isConfigured, chatClient, router, isProd, session, error]);

  if (isLoading) {
    return <ChatSkeleton />;
  }

  if (error && isProd) {
    console.error('[Chat] Error:', error);
  }

  if (!chatClient && !isProd) {
    return <ChatSkeleton />;
  }

  return (
    <ChatThemeProvider>
      <main className="flex h-[calc(100vh-4rem)] w-full min-w-0 gap-5 overflow-hidden shadow-sm">
        <aside className="sticky top-[5rem] hidden h-full w-72 flex-shrink-0 overflow-y-auto bg-muted md:block">
          <div className="mt-5 mr-2 ml-2">
            <NavigationCard
              isCollapsed={false}
              className="h-[calc(100vh-6rem)]"
              stickyTop="5rem"
            />
          </div>
          <div className="mt-2 mr-2 ml-2">
            <SuggestedConnections />
          </div>
          <div className="mt-4 mr-2 ml-2">
            <StickyFooter />
          </div>
        </aside>
        <div className="mt-5 mr-2 mb-24 ml-2 w-full min-w-0 space-y-5 overflow-hidden rounded-2xl border border-border shadow-md md:mb-4 md:ml-0">
          {chatClient ? (
            <StreamChat
              client={chatClient}
              theme={
                resolvedTheme === 'dark'
                  ? 'str-chat__theme-dark'
                  : 'str-chat__theme-light'
              }
            >
              <div className="flex h-full w-full">
                <ChatSidebar
                  open={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  onChannelSelect={(channel) => {
                    setSelectedChannel(channel);
                    setSidebarOpen(false);
                  }}
                />
                <div className="flex-1 overflow-hidden">
                  {selectedChannel ? (
                    <Channel channel={selectedChannel}>
                      <ChatChannel
                        open={!sidebarOpen}
                        openSidebar={() => setSidebarOpen(true)}
                      />
                    </Channel>
                  ) : (
                    <WelcomeScreen onNewChat={() => setSidebarOpen(true)} />
                  )}
                </div>
              </div>
            </StreamChat>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-4">
                <h2 className="font-semibold text-lg">
                  Chat Temporarily Unavailable
                </h2>
                <p className="text-muted-foreground">
                  We're having trouble connecting to the chat service. Please
                  try again later.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </ChatThemeProvider>
  );
}
