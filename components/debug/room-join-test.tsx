"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Users, CheckCircle } from "lucide-react"

export function RoomJoinTest() {
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadAvailableRooms()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadAvailableRooms = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("game_rooms")
      .select(`
        *,
        host:profiles!game_rooms_host_id_fkey(*)
      `)
      .is("guest_id", null)
      .eq("is_ai_game", false)
      .order("created_at", { ascending: false })

    if (data) {
      setAvailableRooms(data)
      console.log('Available rooms:', data)
    } else if (error) {
      console.error('Error loading rooms:', error)
    }
  }

  const handleJoinRoom = async (code: string) => {
    if (!code.trim()) {
      toast.error("Digite o código da sala")
      return
    }

    setIsLoading(true)
    console.log('Attempting to join room:', code)

    try {
      const response = await fetch('/api/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode: code }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Erro ao entrar na sala")
        console.error('Join room error:', result)
        if (result.debug) {
          console.log('Debug info:', result.debug)
        }
      } else {
        toast.success("Entrou na sala com sucesso!")
        console.log('Joined room successfully:', result.data)
        if (result.debug) {
          console.log('Debug info:', result.debug)
        }
        // Refresh rooms list
        loadAvailableRooms()
        // Redirect to game
        window.location.href = `/game/${result.data.id}`
      }
    } catch (error) {
      console.error('Network error:', error)
      toast.error("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectJoin = async (roomId: string, code: string) => {
    await handleJoinRoom(code)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Teste de Entrada em Salas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current User Info */}
        {currentUser && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Usuário atual:</p>
            <p className="text-sm">{currentUser.email}</p>
            <p className="text-xs text-muted-foreground">ID: {currentUser.id}</p>
          </div>
        )}

        {/* Manual Join */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Entrar manualmente:</label>
          <div className="flex gap-2">
            <Input
              placeholder="Código da sala"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
            <Button 
              onClick={() => handleJoinRoom(roomCode)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Salas disponíveis:</label>
            <Button size="sm" variant="outline" onClick={loadAvailableRooms}>
              Atualizar
            </Button>
          </div>
          
          {availableRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sala disponível</p>
          ) : (
            <div className="space-y-2">
              {availableRooms.map((room) => (
                <div key={room.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold">{room.code}</p>
                      <p className="text-sm text-muted-foreground">
                        Host: {room.host?.username || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criada: {new Date(room.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDirectJoin(room.id, room.code)}
                      disabled={isLoading}
                    >
                      Entrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="p-3 bg-black/5 rounded-lg">
          <p className="text-xs font-mono">
            Total de salas disponíveis: {availableRooms.length}
          </p>
          <p className="text-xs font-mono">
            Status: Conectado
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
