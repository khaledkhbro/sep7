"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Copy, Facebook, Twitter, Linkedin, MessageCircle, X } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  url: string
}

export function ShareModal({ isOpen, onClose, title, description, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank",
          "width=600,height=400",
        )
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          "_blank",
          "width=600,height=400",
        )
      },
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          "_blank",
          "width=600,height=400",
        )
      },
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600 hover:bg-green-700",
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`, "_blank")
      },
    },
  ]

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The service link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Share This Service</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">Spread the word about this service</p>
        </DialogHeader>

        {/* Social Media Share Options */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className={`${option.color} text-white p-3 rounded-lg transition-all duration-200 hover:scale-105 flex flex-col items-center gap-2 group`}
            >
              <option.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{option.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Copy Link</label>
          <div className="flex gap-2">
            <Input value={url} readOnly className="flex-1 bg-gray-50 border-gray-200 text-sm" />
            <Button
              onClick={copyToClipboard}
              variant={copied ? "default" : "outline"}
              size="sm"
              className={`px-4 transition-all duration-200 ${
                copied ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-gray-50"
              }`}
            >
              <Copy className="w-4 h-4 mr-1" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
