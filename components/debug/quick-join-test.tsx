"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Users } from "lucide-react"

export function QuickJoinTest() {
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleQuickJoin = async () => {
    if (!roomCode.trim()) {
      toast.error("Digite o código da sala")
      return
    }

    setIsLoading(true)
    console.log('Testing quick join with code:', roomCode)

    try {
      const response = await fetch('/api/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode: roomCode }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Erro ao entrar na sala")
        console.error('Quick join error:', result)
      } else {
        toast.success("Entrou na sala com sucesso!")
        console.log('Quick join success:', result)
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Entrada Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Código da Sala:</label>
          <Input
            placeholder="Digite o código"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="font-mono uppercase text-center text-lg"
            disabled={isLoading}
          />
        </div>
        
        <Button 
          onClick={handleQuickJoin}
          disabled={isLoading || !roomCode.trim()}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Entrando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Entrar na Sala
            </div>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Peça para seu amigo criar uma sala e compartilhar o código
        </div>
      </CardContent>
    </Card>
  )
}
