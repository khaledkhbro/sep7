"use client"

import type { Chat } from "@/lib/chat"
import { Badge } from "@/components/ui/badge"
import { formatMessageTime } from "@/lib/chat"
import { cn } from "@/lib/utils"
import { MessageCircle, Shield, ShoppingBag } from "lucide-react"
import { LazyAvatar } from "@/components/ui/lazy-avatar"

interface ChatListProps {
  chats: Chat[]
  selectedChatId?: string
  onChatSelect: (chatId: string) => void
  currentUserId: string
}

export function ChatList({ chats, selectedChatId, onChatSelect, currentUserId }: ChatListProps) {
  const getChatIcon = (type: Chat["type"]) => {
    switch (type) {
      case "admin_support":
        return <Shield className="h-4 w-4 text-primary" />
      case "order":
        return <ShoppingBag className="h-4 w-4 text-secondary" />
      default:
        return <MessageCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p.id !== currentUserId) || chat.participants[0]
  }

  const getChatTitle = (chat: Chat) => {
    if (chat.title) return chat.title
    const otherParticipant = getOtherParticipant(chat)
    return otherParticipant.name
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation by messaging someone or placing an order
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat)
              const isSelected = chat.id === selectedChatId

              return (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                    isSelected && "bg-primary/5 border-r-2 border-primary",
                  )}
                >
                  <div className="relative">
                    <LazyAvatar
                      src={otherParticipant.avatar}
                      alt={otherParticipant.name}
                      fallback={otherParticipant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                      className="h-12 w-12"
                    />
                    {otherParticipant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getChatIcon(chat.type)}
                      <h3 className="font-medium truncate">{getChatTitle(chat)}</h3>
                      {chat.unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto h-5 min-w-[20px] text-xs">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage?.content || "No messages yet"}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {chat.lastMessage && formatMessageTime(chat.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
