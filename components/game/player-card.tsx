"use client"

import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface PlayerCardProps {
  player: Profile | null
  color: "black" | "white"
  pieces: number
  captured: number
  isCurrentTurn: boolean
  isAI?: boolean
  aiDifficulty?: "easy" | "medium" | "hard"
}

export function PlayerCard({
  player,
  color,
  pieces,
  captured,
  isCurrentTurn,
  isAI = false,
  aiDifficulty,
}: PlayerCardProps) {
  const displayName = isAI
    ? `IA ${aiDifficulty === "easy" ? "Fácil" : aiDifficulty === "medium" ? "Médio" : "Difícil"}`
    : player?.username || "Aguardando..."

  const initials = isAI
    ? "IA"
    : player?.username?.slice(0, 2).toUpperCase() || "??"

  return (
    <Card
      className={cn(
        "transition-all duration-300 border-2",
        color === "black"
          ? "bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-700"
          : "bg-gradient-to-br from-stone-100 to-stone-200 border-stone-300",
        isCurrentTurn && "ring-2 ring-primary shadow-lg shadow-primary/20"
      )}
    >
      <CardContent className="p-6 flex flex-col items-center gap-4">
        <Avatar className="w-20 h-20 border-4 border-muted">
          <AvatarImage src={player?.avatar_url || undefined} />
          <AvatarFallback
            className={cn(
              "text-xl font-bold",
              isAI ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <h3 className="text-lg font-semibold text-foreground text-balance text-center">
          {displayName}
        </h3>

        <div className="flex gap-4 w-full">
          <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Cap.
            </p>
            <p className="text-2xl font-bold text-foreground">{captured}</p>
          </div>
          <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Peças
            </p>
            <p className="text-2xl font-bold text-foreground">{pieces}</p>
          </div>
        </div>

        {isCurrentTurn && (
          <div className="flex items-center gap-2 text-primary text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Sua vez
          </div>
        )}
      </CardContent>
    </Card>
  )
}
