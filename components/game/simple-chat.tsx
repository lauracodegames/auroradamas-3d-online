"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { sendChatMessage, getChatMessages } from "@/lib/game-actions"
import type { ChatMessage, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Mic, MicOff, Play, Pause, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SimpleChatProps {
  roomId: string
  currentUserId: string
  isMobile?: boolean
}

export function SimpleChat({ roomId, currentUserId, isMobile = false }: SimpleChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    console.log('Loading messages for room:', roomId)
    setIsLoading(true)
    const result = await getChatMessages(roomId)
    if (result.data) {
      const messageCount = result.data.length
      console.log('Messages loaded:', messageCount, 'messages')
      setMessages(result.data as ChatMessage[])
      
      // Show notification if new messages arrived
      if (messageCount > lastMessageCount && lastMessageCount > 0) {
        const newMessagesCount = messageCount - lastMessageCount
        toast.success(`${newMessagesCount} nova(s) mensagem(ns)`)
      }
      setLastMessageCount(messageCount)
    } else if (result.error) {
      console.error('Error loading messages:', result.error)
    }
    setIsLoading(false)
  }, [roomId, lastMessageCount])

  useEffect(() => {
    loadMessages()

    // Poll every 2 seconds for new messages
    const interval = setInterval(() => {
      loadMessages()
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [roomId, loadMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    const tempMessage = newMessage.trim()
    setNewMessage("")
    
    console.log('Sending chat message...')
    const result = await sendChatMessage(roomId, tempMessage, null)

    if (result.error) {
      console.error('Failed to send message:', result.error)
      toast.error(result.error)
      setNewMessage(tempMessage) // Restore message on error
    } else {
      console.log('Message sent successfully')
      // Immediately reload messages to show the sent message
      setTimeout(() => loadMessages(), 500)
    }
  }

  // Mobile collapsed view
  if (isMobile && !isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full h-12 bg-card border-border"
        onClick={() => setIsExpanded(true)}
      >
        <Send className="w-4 h-4 mr-2" />
        Abrir Chat
        {messages.length > 0 && (
          <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </Button>
    )
  }

  return (
    <div className={cn(
      "flex flex-col bg-card rounded-lg border border-border",
      isMobile ? "h-[250px]" : "h-[300px]"
    )}>
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Chat da Partida</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={loadMessages}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setIsExpanded(false)}
            >
              Fechar
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground text-sm">
              Nenhuma mensagem ainda. Seja o primeiro a falar!
            </p>
          )}
          
          {isLoading && (
            <div className="flex justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {messages.map((msg) => {
            const user = msg.user as Profile | undefined
            const isOwn = msg.user_id === currentUserId

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isOwn && "flex-row-reverse"
                )}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {user?.username?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg p-2",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.message && (
                    <p className="text-sm break-words">{msg.message}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-input border-border"
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            className="shrink-0"
            disabled={isLoading || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
