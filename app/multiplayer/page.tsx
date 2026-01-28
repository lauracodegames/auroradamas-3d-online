"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { createRoom } from "@/lib/game-actions"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Matchmaking } from "@/components/game/matchmaking"
import { toast } from "sonner"
import { Users, Plus, ArrowLeft } from "lucide-react"

interface MultiplayerLobbyProps {
  profile: Profile
}

export function MultiplayerLobby({ profile }: MultiplayerLobbyProps) {
  const router = useRouter()
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true)
    
    try {
      const result = await createRoom(false)
      
      if (result.error) {
        toast.error("Erro ao criar sala: " + result.error)
      } else if (result.data) {
        toast.success("Sala criada com sucesso!")
        toast.info(`Código da sala: ${result.data.code}`)
        
        // Redirect to the game room
        router.push(`/game/${result.data.id}`)
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error("Erro ao criar sala")
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleRoomJoined = (roomId: string) => {
    // Redirect to the game room
    router.push(`/game/${roomId}`)
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">
              <span className="text-primary">AURORA</span>{" "}
              <span className="text-foreground">DAMAS</span>
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Jogador: {profile.username}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto p-4 w-full">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Room Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Criar Nova Sala
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Crie uma nova sala e convide um amigo para jogar. 
                Você receberá um código único para compartilhar.
              </p>
              
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Como funciona:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Clique em "Criar Sala"</li>
                    <li>Compartilhe o código com seu amigo</li>
                    <li>Seu amigo entra com o código</li>
                    <li>Comecem a jogar!</li>
                  </ol>
                </div>
                
                <Button 
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                  className="w-full"
                >
                  {isCreatingRoom ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Criando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Criar Sala
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Room Section */}
          <Matchmaking 
            currentUserId={profile.id}
            onRoomJoined={handleRoomJoined}
          />
        </div>
      </main>
    </div>
  )
}
