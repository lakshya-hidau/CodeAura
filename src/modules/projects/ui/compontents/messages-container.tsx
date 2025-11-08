'use client';

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import MessageCard from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef } from "react";
import { Fragment } from "@/generated/prisma/client";

interface Props {
  projectId: string;
  activeFragment?: Fragment | null;
  setActiveFragment?: (fragment: Fragment | null) => void;
}

export const MessagesContainer = ({ projectId, activeFragment, setActiveFragment }: Props) => {
  const trpc = useTRPC();
  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch messages with polling every 2 seconds
  const { data: messages } = useSuspenseQuery({
    ...trpc.message.getMany.queryOptions({ projectId }),
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const lastAssistantMessageWithFragment = messages.findLast(
      (message) => message.role === "ASSISTANT" && !!message.fragment
    );
    
    if (lastAssistantMessageWithFragment && setActiveFragment) {
      setActiveFragment(lastAssistantMessageWithFragment.fragment);
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Check if AI is processing: either last message is the user's message (we're waiting)
  // or the last message is an assistant placeholder with empty content.
  const isAIProcessing = (() => {
    if (!messages || messages.length === 0) return false;
    const last = messages[messages.length - 1];
    if (!last) return false;
    if (last.role === "USER") return true;
    if (last.role === "ASSISTANT" && (!last.content || last.content.toString().trim() === "")) return true;
    return false;
  })();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages && messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  fragment={message.fragment}
                  createdAt={new Date(message.createdAt)}
                  isActiveFragment={activeFragment?.id === message.fragment?.id}
                  onFragmentClick={(frag) => setActiveFragment?.(frag)}
                  type={message.type}
                />
              ))}
              
              {/* Loading indicator when AI is processing */}
              {isAIProcessing && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <div className="size-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>CodeAura is thinking...</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export default MessagesContainer;