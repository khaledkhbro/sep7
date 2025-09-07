"use client"

import { useState, useRef, useEffect } from "react"
import type { Chat, Message } from "@/lib/chat"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Phone, Video, Info, ArrowLeft, HelpCircle, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LazyAvatar } from "@/components/ui/lazy-avatar"

interface ChatWindowProps {
  chat: Chat
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string, files?: File[]) => void
  onBack?: () => void
  className?: string
}

export function ChatWindow({ chat, messages, currentUserId, onSendMessage, onBack, className }: ChatWindowProps) {
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollUp, setShowScrollUp] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isAtTop = scrollTop <= 100
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100

    setShowScrollUp(!isAtTop)
    setShowScrollDown(!isAtBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll)
    // Initial check
    handleScroll()

    return () => container.removeEventListener("scroll", handleScroll)
  }, [messages])

  const getOtherParticipant = () => {
    return chat.participants.find((p) => p.id !== currentUserId) || chat.participants[0]
  }

  const getChatTitle = () => {
    if (chat.title) return chat.title
    const otherParticipant = getOtherParticipant()
    return otherParticipant.name
  }

  const getStatusBadge = () => {
    switch (chat.type) {
      case "admin_support":
        return (
          <Badge variant="secondary" className="text-xs">
            Support
          </Badge>
        )
      case "order":
        return (
          <Badge variant="outline" className="text-xs">
            Order Chat
          </Badge>
        )
      default:
        return null
    }
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-card/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="sm:hidden h-8 w-8 flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="relative flex-shrink-0">
            <LazyAvatar
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              fallback={otherParticipant.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
              className="h-8 w-8 sm:h-10 sm:w-10"
              priority={true}
            />
            {otherParticipant.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base truncate">{getChatTitle()}</h3>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="text-xs text-muted-foreground">{otherParticipant.isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto overscroll-behavior-y-contain scroll-smooth p-3 sm:p-4 space-y-3 sm:space-y-4"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch", // Better mobile scrolling
          }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="bg-muted/50 rounded-full p-4 sm:p-6 mb-4">
                <LazyAvatar
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  fallback={otherParticipant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                  className="h-12 w-12 sm:h-16 sm:w-16"
                  priority={true}
                />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Send a message to {otherParticipant.name} to get started
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm">
                <div className="flex items-center gap-2 text-blue-800 mb-1">
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Need Help?</span>
                </div>
                <p className="text-xs text-blue-700">
                  Use the help button in the chat input to call admin support for any issues.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.senderId === currentUserId
                const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId)
                const showTime =
                  index === messages.length - 1 ||
                  messages[index + 1].senderId !== message.senderId ||
                  messages[index + 1].createdAt.getTime() - message.createdAt.getTime() > 300000 // 5 minutes

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    showTime={showTime}
                  />
                )
              })}

              {isTyping && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <LazyAvatar
                    src={otherParticipant.avatar}
                    alt={otherParticipant.name}
                    fallback={otherParticipant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                    className="h-6 w-6 sm:h-8 sm:w-8"
                  />
                  <div className="bg-card border rounded-2xl rounded-bl-md px-3 sm:px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {messages.length > 0 && (
          <div className="absolute right-4 bottom-20 flex flex-col gap-2 z-10">
            {showScrollUp && (
              <Button
                onClick={scrollToTop}
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl"
                title="Scroll to top"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            )}
            {showScrollDown && (
              <Button
                onClick={scrollToBottom}
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl"
                title="Scroll to bottom"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        placeholder={`Message ${otherParticipant.name}...`}
        recipientName={otherParticipant.name}
        recipientId={otherParticipant.id}
        chatId={chat.id}
      />
    </div>
  )
}
