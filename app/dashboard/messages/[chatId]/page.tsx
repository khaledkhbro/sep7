"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatWindow } from "@/components/chat/chat-window"
import { type Chat, type Message, getStoredChats, getMessagesByChatId, saveMessage, saveChat } from "@/lib/chat"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const chatId = params.chatId as string

  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const storedChats = getStoredChats()
    const foundChat = storedChats.find((c) => c.id === chatId)
    if (foundChat) {
      setChat(foundChat)
      const chatMessages = getMessagesByChatId(chatId)
      setMessages(chatMessages)
    }
  }, [chatId])

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!chat || !user) return

    try {
      const newMessage = await saveMessage({
        chatId: chat.id,
        senderId: user.id,
        sender: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          userType: "user",
          isOnline: true,
        },
        content,
        messageType: files && files.length > 0 ? "file" : "text",
        fileUrl: files?.[0] ? URL.createObjectURL(files[0]) : undefined,
        fileName: files?.[0]?.name,
        fileSize: files?.[0]?.size,
        isEdited: false,
        status: "sent",
      })

      setMessages((prev) => [...prev, newMessage])

      const updatedChat = {
        ...chat,
        lastMessage: newMessage,
        lastMessageAt: new Date(),
      }
      setChat(updatedChat)
      await saveChat(updatedChat)

      // Simulate message delivery
      setTimeout(() => {
        setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))
      }, 1000)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    }
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chat not found</h2>
          <p className="text-muted-foreground mb-4">The conversation you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/messages")}>Back to Messages</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile header */}
      <div className="md:hidden flex items-center gap-2 p-4 border-b bg-card/50">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/messages")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Chat</h1>
      </div>

      <div className="flex-1">
        <ChatWindow chat={chat} messages={messages} currentUserId={user?.id || ""} onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
