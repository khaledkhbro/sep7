"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Smile, DollarSign, HelpCircle, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTransferDialog } from "./money-transfer-dialog"
import { SupportRequestDialog } from "./support-request-dialog"
import { validateFile, formatFileSize, getFileIcon } from "@/lib/file-management"
import { toast } from "sonner"

interface ChatInputProps {
  onSendMessage: (content: string, files?: File[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  recipientName?: string
  recipientId?: string
  chatId?: string
}

export function ChatInput({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  className,
  recipientName,
  recipientId,
  chatId,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMoneyTransferOpen, setIsMoneyTransferOpen] = useState(false)
  const [isSupportRequestOpen, setIsSupportRequestOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if ((message.trim() || selectedFiles.length > 0) && !disabled) {
      onSendMessage(message.trim() || "File attachment", selectedFiles)
      setMessage("")
      setSelectedFiles([])
      setIsTyping(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      const validation = validateFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      toast.error(`File validation failed:\n${errors.join("\n")}`)
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
      toast.success(`${validFiles.length} file(s) selected`)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoneyTransferComplete = (transferData: any) => {
    const transferMessage = `💰 Sent $${transferData.amount.toFixed(2)} to ${recipientName}${
      transferData.message ? ` - "${transferData.message}"` : ""
    }`
    onSendMessage(transferMessage)
  }

  const handleSupportRequestComplete = (ticketData: any) => {
    const supportMessage = `🎫 Created ${ticketData.ticketType} support ticket: "${ticketData.subject}"${
      ticketData.ticketType === "priority" ? ` (Paid $${ticketData.paymentAmount.toFixed(2)})` : ""
    }`
    onSendMessage(supportMessage)
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  return (
    <>
      <div className={cn("border-t bg-background p-3 sm:p-4", className)}>
        {selectedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span>{selectedFiles.length} file(s) selected</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>Files will be automatically deleted after 14 days of chat inactivity</span>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.csv"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileSelect}
            disabled={disabled}
            className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11"
            title="Attach files (Max 5MB each)"
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {recipientId && recipientName && chatId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMoneyTransferOpen(true)}
              disabled={disabled}
              className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Send Money"
            >
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSupportRequestOpen(true)}
            disabled={disabled}
            className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Call Admin Support"
          >
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setIsTyping(e.target.value.length > 0)
                adjustTextareaHeight()
              }}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[44px] sm:min-h-[40px] max-h-[120px] resize-none pr-12 py-3 sm:py-2 text-base sm:text-sm"
              rows={1}
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 bottom-1 h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={(!message.trim() && selectedFiles.length === 0) || disabled}
            size="icon"
            className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {isTyping && (
          <div className="text-xs text-muted-foreground mt-2 px-2 hidden sm:block">
            Press Enter to send, Shift+Enter for new line
          </div>
        )}
      </div>

      {recipientId && recipientName && chatId && (
        <MoneyTransferDialog
          isOpen={isMoneyTransferOpen}
          onClose={() => setIsMoneyTransferOpen(false)}
          recipientName={recipientName}
          recipientId={recipientId}
          chatId={chatId}
          onTransferComplete={handleMoneyTransferComplete}
        />
      )}

      <SupportRequestDialog
        isOpen={isSupportRequestOpen}
        onClose={() => setIsSupportRequestOpen(false)}
        chatId={chatId}
        onRequestComplete={handleSupportRequestComplete}
      />
    </>
  )
}
