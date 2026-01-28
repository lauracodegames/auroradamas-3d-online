"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendChatMessage, getChatMessages } from "@/lib/game-actions"
import type { ChatMessage, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Mic, MicOff, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface GameChatProps {
  roomId: string
  currentUserId: string
  isMobile?: boolean
}

export function GameChat({ roomId, currentUserId, isMobile = false }: GameChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadMessages = useCallback(async () => {
    console.log('Loading messages for room:', roomId)
    const result = await getChatMessages(roomId)
    if (result.data) {
      console.log('Messages loaded:', result.data.length, 'messages')
      setMessages(result.data as ChatMessage[])
    } else if (result.error) {
      console.error('Error loading messages:', result.error)
    }
  }, [roomId])

  useEffect(() => {
    loadMessages()

    const supabase = createClient()
    console.log('Setting up chat subscription for room:', roomId)
    
    // Create a unique channel name to avoid conflicts
    const channelName = `chat_${roomId}_${Date.now()}`
    const channel = supabase.channel(channelName)
    
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New chat message received:', payload)
          try {
            // Direct use the payload data instead of re-fetching
            const messageData = payload.new as any
            console.log('Message data from payload:', messageData)
            
            // Get user profile separately if needed
            if (messageData.user_id && !messageData.user) {
              const { data: userData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", messageData.user_id)
                .single()
              
              messageData.user = userData
            }
            
            setMessages((prev) => {
              const newMessages = [...prev, messageData as ChatMessage]
              console.log('Updated messages list:', newMessages.length, 'messages')
              return newMessages
            })
          } catch (error) {
            console.error('Error processing new message:', error)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Chat subscription status:', status)
        if (err) {
          console.error('Chat subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chat updates')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('Failed to subscribe to chat updates, status:', status)
          // Don't show error toast immediately, let the polling handle it
        }
      })

    // Fallback: Refresh messages every 3 seconds in case realtime fails
    const interval = setInterval(() => {
      loadMessages()
    }, 3000)

    return () => {
      console.log('Cleaning up chat subscription:', channelName)
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [roomId, loadMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() && !audioBlob) return

    let audioUrl: string | null = null

    if (audioBlob) {
      console.log('Uploading audio file...')
      const supabase = createClient()
      const fileName = `audio_${Date.now()}.webm`
      
      try {
        const { data, error } = await supabase.storage
          .from("chat-audio")
          .upload(fileName, audioBlob)

        if (error) {
          console.error('Audio upload error:', error)
          toast.error("Erro ao enviar áudio: " + error.message)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from("chat-audio")
          .getPublicUrl(data.path)

        audioUrl = publicUrl
        console.log('Audio uploaded successfully:', publicUrl)
      } catch (error) {
        console.error('Unexpected error uploading audio:', error)
        toast.error("Erro inesperado ao enviar áudio")
        return
      }
    }

    console.log('Sending chat message...')
    const result = await sendChatMessage(
      roomId,
      newMessage.trim() || null,
      audioUrl
    )

    if (result.error) {
      console.error('Failed to send message:', result.error)
      toast.error(result.error)
      return
    }

    console.log('Message sent successfully')
    setNewMessage("")
    setAudioBlob(null)
  }

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone access granted')
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing audio...')
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
        console.log('Audio processing completed')
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        toast.error('Erro na gravação de áudio')
      }

      mediaRecorder.start()
      setIsRecording(true)
      console.log('Recording started')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Permissão de microfone negada. Permita o acesso ao microfone nas configurações do navegador.')
        } else if (error.name === 'NotFoundError') {
          toast.error('Nenhum microfone encontrado.')
        } else {
          toast.error('Erro ao acessar microfone: ' + error.message)
        }
      } else {
        toast.error('Erro desconhecido ao acessar microfone')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }

    if (playingAudio === url) {
      setPlayingAudio(null)
      return
    }

    audioRef.current = new Audio(url)
    audioRef.current.onended = () => setPlayingAudio(null)
    audioRef.current.play()
    setPlayingAudio(url)
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

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
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
                  {msg.audio_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => playAudio(msg.audio_url!)}
                    >
                      {playingAudio === msg.audio_url ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span className="ml-1 text-xs">Áudio</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        {audioBlob && (
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Áudio gravado</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-destructive"
              onClick={() => setAudioBlob(null)}
            >
              Cancelar
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-input border-border"
          />
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className="shrink-0"
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button size="icon" onClick={handleSend} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
