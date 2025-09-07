"use client"

import { useState, useEffect } from "react"
import { ChatList } from "@/components/chat/chat-list"
import { ChatWindow } from "@/components/chat/chat-window"
import {
  type Chat,
  type Message,
  createJobChat,
  getStoredChats,
  getMessagesByChatId,
  saveMessage,
  saveChat,
} from "@/lib/chat"
import { saveFileToChat, initFileCleanup } from "@/lib/file-management"
import { getJobById } from "@/lib/jobs"
import { useAuth } from "@/contexts/auth-context"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MessagesPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initFileCleanup()

    const initializeChat = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const storedChats = getStoredChats()
        setChats(storedChats)
        console.log("[v0] Loaded chats from storage:", storedChats.length)

        const urlParams = new URLSearchParams(window.location.search)
        const jobIdFromUrl = urlParams.get("jobId")
        const chatIdFromUrl = urlParams.get("chatId")

        if (jobIdFromUrl && user) {
          console.log("[v0] Creating/finding chat for job:", jobIdFromUrl)

          try {
            const job = await getJobById(jobIdFromUrl)

            if (!job) {
              console.error("[v0] Job not found:", jobIdFromUrl)
              setError("Job not found")
              setIsLoading(false)
              return
            }

            console.log("[v0] Found job:", job.title, "posted by:", job.userId)

            let existingChat = storedChats.find((chat) => chat.jobId === jobIdFromUrl)

            if (!existingChat) {
              const jobPosterId = job.userId
              console.log("[v0] Creating chat between user:", user.id, "and job poster:", jobPosterId)

              try {
                existingChat = await createJobChat(jobIdFromUrl, user.id, jobPosterId)
                if (existingChat) {
                  setChats((prev) => {
                    const chatExists = prev.some((chat) => chat.id === existingChat!.id)
                    if (!chatExists) {
                      console.log("[v0] Added new job chat to list:", existingChat!.id)
                      return [...prev, existingChat!]
                    }
                    return prev
                  })
                  console.log("[v0] Created new job chat:", existingChat.id)
                }
              } catch (error) {
                console.error("[v0] Error creating job chat:", error)
                setError("Failed to create chat. Please try again.")
                setIsLoading(false)
                return
              }
            }

            if (existingChat) {
              setSelectedChatId(existingChat.id)
              console.log("[v0] Selected job chat:", existingChat.id)
            } else {
              setError("Unable to create or find chat for this job")
            }
          } catch (error) {
            console.error("[v0] Error retrieving job:", error)
            setError("Failed to load job details. Please try again.")
            setIsLoading(false)
            return
          }
        } else if (chatIdFromUrl) {
          setSelectedChatId(chatIdFromUrl)
        } else if (jobIdFromUrl && !user) {
          setError("Please log in to access chat")
        }
      } catch (error) {
        console.error("[v0] Error initializing chat:", error)
        setError("Failed to load chat. Please refresh the page.")
      }

      setIsLoading(false)
    }

    initializeChat()

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [user])

  useEffect(() => {
    if (selectedChatId) {
      try {
        const chatMessages = getMessagesByChatId(selectedChatId)
        setMessages(chatMessages)
        console.log("[v0] Loaded messages for chat:", selectedChatId, "Count:", chatMessages.length)
      } catch (error) {
        console.error("[v0] Error loading messages:", error)
        setMessages([])
      }
    }
  }, [selectedChatId])

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)

    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)))
  }

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!selectedChatId || !user) return

    try {
      const fileAttachments: any[] = []
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const chatFile = await saveFileToChat(file, selectedChatId, `msg_${Date.now()}`)
            fileAttachments.push({
              fileName: chatFile.fileName,
              fileSize: chatFile.fileSize,
              fileUrl: chatFile.fileUrl,
              fileType: chatFile.fileType,
            })
          } catch (error) {
            console.error("[v0] Error saving file:", error)
            // Continue with other files even if one fails
          }
        }
      }

      const newMessage = await saveMessage({
        chatId: selectedChatId,
        senderId: user.id,
        sender: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          userType: "user",
          isOnline: true,
        },
        content,
        messageType: files && files.length > 0 ? "file" : "text",
        fileUrl: fileAttachments[0]?.fileUrl,
        fileName: fileAttachments[0]?.fileName,
        fileSize: fileAttachments[0]?.fileSize,
        isEdited: false,
        status: "sent",
      })

      // Update local state
      setMessages((prev) => [...prev, newMessage])

      // Update chat with last message
      const updatedChats = chats.map((chat) =>
        chat.id === selectedChatId ? { ...chat, lastMessage: newMessage, lastMessageAt: new Date() } : chat,
      )
      setChats(updatedChats)

      // Save updated chat
      const updatedChat = updatedChats.find((c) => c.id === selectedChatId)
      if (updatedChat) {
        await saveChat(updatedChat)
      }

      console.log("[v0] Message sent and saved:", newMessage.id)
      if (fileAttachments.length > 0) {
        console.log("[v0] File attachments saved:", fileAttachments.length)
      }

      // Simulate delivery status update
      setTimeout(() => {
        setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))
      }, 1000)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading chat...</p>
          <p className="text-sm text-muted-foreground mt-2">Setting up your conversation</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Chat Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (isMobile) {
    if (selectedChatId && selectedChat) {
      return (
        <div className="h-screen">
          <div className="flex items-center gap-2 p-4 border-b bg-card/50">
            <Button variant="ghost" size="sm" onClick={() => setSelectedChatId(null)}>
              ← Back
            </Button>
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <div className="h-[calc(100vh-73px)]">
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              currentUserId={user?.id || ""}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="h-screen">
        <div className="p-4 border-b bg-card/50">
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
        <div className="h-[calc(100vh-73px)]">
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
            currentUserId={user?.id || ""}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r bg-card/30">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          currentUserId={user?.id || ""}
        />
      </div>

      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            currentUserId={user?.id || ""}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center bg-muted/20">
            <div className="bg-primary/10 rounded-full p-6 mb-6">
              <MessageCircle className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Messages</h2>
            <p className="text-muted-foreground max-w-md">
              Select a conversation from the sidebar to start chatting with buyers, sellers, or our support team.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
