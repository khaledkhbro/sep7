"use client"

import { useState, useEffect } from "react"
import { ChatList } from "@/components/chat/chat-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { type Chat, type Message, getStoredChats, getMessagesByChatId, saveMessage, saveChat } from "@/lib/chat"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Users, AlertCircle, Search, Filter } from "lucide-react"

export default function AdminChatPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "direct" | "order" | "admin_support">("all")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const storedChats = getStoredChats()
    setChats(storedChats)

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (selectedChatId) {
      const chatMessages = getMessagesByChatId(selectedChatId)
      setMessages(chatMessages)
    }
  }, [selectedChatId])

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
  }

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!selectedChatId || !user) return

    try {
      const newMessage = await saveMessage({
        chatId: selectedChatId,
        senderId: user.id,
        sender: {
          id: user.id,
          name: "Admin Support",
          userType: "admin",
          isOnline: true,
          avatar: "/admin-avatar.png",
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

      const updatedChats = chats.map((chat) => {
        if (chat.id === selectedChatId) {
          const updatedChat = { ...chat, lastMessage: newMessage, lastMessageAt: new Date() }
          saveChat(updatedChat) // Save to storage
          return updatedChat
        }
        return chat
      })
      setChats(updatedChats)
    } catch (error) {
      console.error("[v0] Error sending admin message:", error)
    }
  }

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      searchQuery === "" ||
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.participants.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFilter = filterType === "all" || chat.type === filterType

    return matchesSearch && matchesFilter
  })

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)

  // Statistics
  const totalChats = chats.length
  const activeChats = chats.filter((chat) => chat.isActive).length
  const supportChats = chats.filter((chat) => chat.type === "admin_support").length
  const unreadChats = chats.filter((chat) => chat.unreadCount > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Chat Management</h1>
        <p className="text-muted-foreground">Monitor and manage all platform conversations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChats}</div>
            <p className="text-xs text-muted-foreground">All conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChats}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportChats}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">
              !
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadChats}</div>
            <p className="text-xs text-muted-foreground">Require response</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Conversations</CardTitle>

            {/* Search and Filter */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chats</SelectItem>
                  <SelectItem value="direct">Direct Messages</SelectItem>
                  <SelectItem value="order">Order Chats</SelectItem>
                  <SelectItem value="admin_support">Support Tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="h-[600px] flex">
            {/* Chat List */}
            <div className={`${isMobile && selectedChatId ? "hidden" : "block"} w-full lg:w-80 border-r`}>
              <ChatList
                chats={filteredChats}
                selectedChatId={selectedChatId}
                onChatSelect={handleChatSelect}
                currentUserId={user?.id || "admin"}
              />
            </div>

            {/* Chat Window */}
            <div className={`${isMobile && !selectedChatId ? "hidden" : "block"} flex-1`}>
              {selectedChat ? (
                <div className="h-full flex flex-col">
                  {isMobile && (
                    <div className="flex items-center gap-2 p-4 border-b bg-card/50">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChatId(null)}>
                        ← Back
                      </Button>
                      <span className="font-medium">Chat Details</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <ChatWindow
                      chat={selectedChat}
                      messages={messages}
                      currentUserId={user?.id || "admin"}
                      onSendMessage={handleSendMessage}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center bg-muted/20">
                  <div className="bg-primary/10 rounded-full p-6 mb-6">
                    <MessageSquare className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Admin Chat Management</h2>
                  <p className="text-muted-foreground max-w-md">
                    Select a conversation from the list to view messages, provide support, or monitor user interactions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
