"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, RotateCcw, LogOut } from "lucide-react"
import Link from "next/link"

interface GameHeaderProps {
  roomCode: string
  isAiGame: boolean
  onRestart: () => void
  onExit: () => void
}

export function GameHeader({
  roomCode,
  isAiGame,
  onRestart,
  onExit,
}: GameHeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border safe-area-inset-top">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted w-8 h-8 sm:w-10 sm:h-10"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">
            <span className="text-primary">AURORA</span>{" "}
            <span className="text-foreground hidden sm:inline">DAMAS</span>
          </h1>
          <Badge
            variant={isAiGame ? "secondary" : "default"}
            className="text-xs"
          >
            {isAiGame ? "VS IA" : roomCode}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button 
          variant="secondary" 
          onClick={onRestart} 
          size="sm"
          className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reiniciar</span>
        </Button>
        <Button
          variant="outline"
          onClick={onExit}
          size="sm"
          className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}
