"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Users, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchmakingProps {
  currentUserId: string
  onRoomJoined: (roomId: string) => void
}

export function Matchmaking({ currentUserId, onRoomJoined }: MatchmakingProps) {
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshRooms = useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from("game_rooms")
        .select(`
          *,
          host:profiles!game_rooms_host_id_fkey(*)
        `)
        .is("guest_id", null)
        .eq("is_ai_game", false)
        .neq("host_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (data) {
        setAvailableRooms(data)
        console.log('Available rooms refreshed:', data.length)
      } else if (error) {
        console.error('Error refreshing rooms:', error)
      }
    } catch (error) {
      console.error('Network error refreshing rooms:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [currentUserId])

  useEffect(() => {
    refreshRooms()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(refreshRooms, 10000)
    return () => clearInterval(interval)
  }, [refreshRooms])

  const handleJoinRoom = async (roomId: string, code: string) => {
    if (isJoining) return
    
    setIsJoining(true)
    console.log('Attempting to join room:', code, 'Room ID:', roomId)

    try {
      const supabase = createClient()
      
      // First check if room is still available
      const { data: roomCheck, error: checkError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .is("guest_id", null)
        .single()

      if (checkError || !roomCheck) {
        toast.error("Sala não está mais disponível")
        await refreshRooms()
        return
      }

      // Join the room
      const { data, error } = await supabase
        .from("game_rooms")
        .update({
          guest_id: currentUserId,
          status: "playing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .select()
        .single()

      if (error) {
        console.error('Failed to join room:', error)
        toast.error("Erro ao entrar na sala: " + error.message)
      } else {
        console.log('Successfully joined room:', roomId)
        toast.success("Entrou na sala com sucesso!")
        onRoomJoined(roomId)
      }
    } catch (error) {
      console.error('Network error joining room:', error)
      toast.error("Erro de conexão")
    } finally {
      setIsJoining(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) {
      toast.error("Digite o código da sala")
      return
    }

    setIsJoining(true)
    const supabase = createClient()

    try {
      // Find room by code
      const { data: rooms, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .eq("is_ai_game", false)
        .is("guest_id", null)

      if (error) {
        toast.error("Erro ao buscar sala")
        return
      }

      if (!rooms || rooms.length === 0) {
        toast.error("Sala não encontrada ou já cheia")
        return
      }

      const room = rooms[0]
      await handleJoinRoom(room.id, room.code)
    } catch (error) {
      console.error('Error joining by code:', error)
      toast.error("Erro ao entrar na sala")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
            Jogo Multiplayer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Join by Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Entrar com código:</label>
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código da sala"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              disabled={isJoining}
            />
            <Button 
              onClick={handleJoinByCode}
              disabled={isJoining || !roomCode.trim()}
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Salas disponíveis:</label>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshRooms}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Atualizar
            </Button>
          </div>
          
          {availableRooms.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma sala disponível no momento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie uma sala ou aguarde alguém criar uma
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableRooms.map((room) => (
                <div key={room.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">{room.code}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Host: {room.host?.username || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criada: {new Date(room.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRoom(room.id, room.code)}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Status: {availableRooms.length} sala(s) disponível(is)
          </p>
          <p className="text-xs text-muted-foreground">
            Atualização automática a cada 10 segundos
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
