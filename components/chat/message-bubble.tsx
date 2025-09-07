import type { Message } from "@/lib/chat"
import { formatMessageTime } from "@/lib/chat"
import { Check, CheckCheck, Clock, DollarSign, Ticket, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { LazyAvatar } from "@/components/ui/lazy-avatar"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  showTime?: boolean
}

export function MessageBubble({ message, isOwn, showAvatar = true, showTime = true }: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case "sent":
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  const isMoneyTransfer = message.content.startsWith("💰")
  const isSupportTicket = message.content.startsWith("🎫")
  const isSpecialMessage = isMoneyTransfer || isSupportTicket

  const messageDate = typeof message.createdAt === "string" ? new Date(message.createdAt) : message.createdAt

  if (isSpecialMessage) {
    return (
      <div className={cn("flex gap-3 max-w-[90%] my-4", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}>
        {showAvatar && !isOwn && (
          <LazyAvatar
            src={message.sender.avatar}
            alt={message.sender.name}
            fallback={message.sender.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
            className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/20"
          />
        )}

        <div className={cn("flex flex-col gap-2", isOwn ? "items-end" : "items-start")}>
          {!isOwn && showAvatar && (
            <span className="text-sm text-muted-foreground font-semibold">{message.sender.name}</span>
          )}

          <div
            className={cn(
              "relative rounded-2xl px-6 py-4 max-w-full break-words shadow-lg border-2 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
              isMoneyTransfer
                ? "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200 text-emerald-900 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950 dark:border-emerald-700 dark:text-emerald-100"
                : "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200 text-purple-900 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 dark:border-purple-700 dark:text-purple-100",
              isOwn ? "rounded-br-md" : "rounded-bl-md",
            )}
          >
            <div className="absolute inset-0 rounded-2xl opacity-30">
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl animate-pulse",
                  isMoneyTransfer
                    ? "bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent"
                    : "bg-gradient-to-r from-transparent via-purple-200/50 to-transparent",
                )}
                style={{
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
            </div>

            <div className="relative z-10 flex items-start gap-3">
              <div
                className={cn(
                  "flex-shrink-0 p-2 rounded-full shadow-md",
                  isMoneyTransfer
                    ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white"
                    : "bg-gradient-to-br from-purple-400 to-blue-500 text-white",
                )}
              >
                {isMoneyTransfer ? <DollarSign className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                      isMoneyTransfer
                        ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                        : "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200",
                    )}
                  >
                    {isMoneyTransfer ? "Money Transfer" : "Support Ticket"}
                  </span>
                  <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                </div>

                <div className="text-base font-semibold leading-relaxed">
                  {message.content.replace(/^(💰|🎫)\s*/, "")}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 rounded-2xl opacity-20 blur-sm -z-10",
                isMoneyTransfer
                  ? "bg-gradient-to-br from-emerald-400 to-green-500"
                  : "bg-gradient-to-br from-purple-400 to-blue-500",
              )}
            />
          </div>

          {showTime && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isOwn ? "flex-row-reverse" : "flex-row",
                isMoneyTransfer ? "text-emerald-600" : "text-purple-600",
              )}
            >
              <span>{formatMessageTime(messageDate)}</span>
              {isOwn && getStatusIcon()}
              {message.isEdited && <span className="text-muted-foreground">(edited)</span>}
              <div
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isMoneyTransfer ? "bg-emerald-500" : "bg-purple-500",
                )}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3 max-w-[80%]", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {showAvatar && !isOwn && (
        <LazyAvatar
          src={message.sender.avatar}
          alt={message.sender.name}
          fallback={message.sender.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
          className="h-8 w-8 flex-shrink-0"
        />
      )}

      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground font-medium">{message.sender.name}</span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card text-card-foreground border rounded-bl-md",
          )}
        >
          {message.replyTo && (
            <div
              className={cn(
                "border-l-2 pl-2 mb-2 text-xs opacity-70",
                isOwn ? "border-primary-foreground/30" : "border-primary/30",
              )}
            >
              <div className="font-medium">{message.replyTo.sender.name}</div>
              <div className="truncate">{message.replyTo.content}</div>
            </div>
          )}

          <div className="text-sm leading-relaxed">{message.content}</div>

          {message.fileUrl && (
            <div className="mt-2 p-2 rounded-lg bg-black/10 dark:bg-white/10">
              <div className="flex items-center gap-2 text-xs">
                <div className="truncate font-medium">{message.fileName}</div>
                {message.fileSize && (
                  <div className="text-muted-foreground">{(message.fileSize / 1024).toFixed(1)}KB</div>
                )}
              </div>
            </div>
          )}
        </div>

        {showTime && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs text-muted-foreground",
              isOwn ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span>{formatMessageTime(messageDate)}</span>
            {isOwn && getStatusIcon()}
            {message.isEdited && <span className="text-muted-foreground">(edited)</span>}
          </div>
        )}
      </div>
    </div>
  )
}

const shimmerKeyframes = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
`

// Inject the keyframes into the document head
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = shimmerKeyframes
  document.head.appendChild(style)
}
