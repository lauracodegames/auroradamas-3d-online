"use client"

import { useState } from "react"
import { joinRoom } from "@/lib/game-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Users } from "lucide-react"
import type { Profile } from "@/lib/types"

interface JoinRoomClientProps {
  room: {
    id: string
    code: string
    host: Profile
  }
  userId: string
}

export function JoinRoomClient({ room, userId }: JoinRoomClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    setIsLoading(true)
    const result = await joinRoom(room.code)
    
    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    router.push(`/game/${room.id}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Convite para Jogar
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Você foi convidado para uma partida de damas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={room.host.avatar_url || undefined} />
              <AvatarFallback>
                {room.host.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{room.host.username}</p>
              <p className="text-sm text-muted-foreground">Anfitrião da sala</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Código da sala</p>
            <p className="text-2xl font-bold font-mono text-foreground">
              {room.code}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleJoin} className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Entrar na Partida
          </Button>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => router.push("/")}
          >
            Voltar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
