"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateGameState, endGame } from "@/lib/game-actions"
import {
  createInitialGameState,
  makeMove,
  getValidMoves,
  getAllValidMoves,
  getAIMove,
} from "@/lib/game-logic"
import type { GameRoom, Profile, GameState, Position, Move } from "@/lib/types"
import { CheckersBoard } from "./checkers-board"
import { PlayerCard } from "./player-card"
import { GameHeader } from "./game-header"
import { SimpleChat } from "./simple-chat"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"

interface GameRoomProps {
  room: GameRoom
  currentUser: Profile
}

export function GameRoomComponent({ room, currentUser }: GameRoomProps) {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>(
    room.game_state as GameState
  )
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const isAiTurnRef = useRef(false)

  const isHost = room.host_id === currentUser.id
  const playerColor = isHost ? "white" : "black"

  const hostProfile = room.host as Profile
  const guestProfile = room.guest as Profile | null

  // Subscribe to game state changes
  useEffect(() => {
    if (room.is_ai_game) return

    const supabase = createClient()
    console.log('Setting up realtime subscription for room:', room.id)
    
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          console.log('Game state update received:', payload)
          const newState = payload.new.game_state as GameState
          setGameState(newState)

          if (newState.winner) {
            handleGameEnd(newState.winner)
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to room updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to room updates')
          toast.error('Erro de conexão com a sala')
        }
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [room.id, room.is_ai_game])

  const handleGameEnd = useCallback(
    (result: "black" | "white" | "draw") => {
      let winnerName: string
      let winnerId: string | null = null

      if (result === "draw") {
        winnerName = "Empate!"
      } else if (result === "white") {
        winnerId = room.host_id
        winnerName =
          room.is_ai_game && result !== playerColor
            ? "IA venceu!"
            : hostProfile?.username || "Brancas"
      } else {
        winnerId = room.guest_id || (room.is_ai_game ? "ai" : null)
        winnerName =
          room.is_ai_game && result !== playerColor
            ? "IA venceu!"
            : guestProfile?.username || "Pretas"
      }

      setWinner(winnerName)
      setShowEndDialog(true)

      // Update stats
      if (!room.is_ai_game || result === playerColor) {
        endGame(room.id, winnerId)
      }
    },
    [room, playerColor, hostProfile, guestProfile]
  )

  // Handle AI moves
  useEffect(() => {
    if (!room.is_ai_game) return
    if (gameState.winner) return
    if (gameState.currentPlayer === playerColor) return
    if (isAiTurnRef.current) return

    isAiTurnRef.current = true

    const makeAIMove = async () => {
      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800))

      const difficultyMap: Record<string, "easy" | "medium" | "hard"> = {
        facil: "easy",
        medio: "medium",
        dificil: "hard",
        impossivel: "hard",
      }
      const difficulty = difficultyMap[room.ai_difficulty || "medio"] || "medium"
      const aiMove = getAIMove(gameState, difficulty)
      if (aiMove) {
        const newState = makeMove(gameState, aiMove)
        setGameState(newState)

        if (newState.winner) {
          handleGameEnd(newState.winner)
        }
      }

      isAiTurnRef.current = false
    }

    makeAIMove()
  }, [
    room.is_ai_game,
    room.ai_difficulty,
    gameState,
    playerColor,
    handleGameEnd,
  ])

  const handleSelectPiece = (position: Position) => {
    const allMoves = getAllValidMoves(gameState.board, gameState.currentPlayer)
    const hasCapture = allMoves.some(
      (m) => m.moves.some((move) => move.captured && move.captured.length > 0)
    )

    const moves = getValidMoves(gameState.board, position, hasCapture)

    setGameState((prev) => ({
      ...prev,
      selectedPiece: position,
      validMoves: moves,
    }))
  }

  const handleMove = async (move: Move) => {
    const newState = makeMove(gameState, move)
    setGameState(newState)

    // Check for chain captures
    if (move.captured && move.captured.length > 0) {
      const additionalCaptures = getValidMoves(newState.board, move.to, true)
      if (additionalCaptures.length > 0) {
        setGameState((prev) => ({
          ...prev,
          selectedPiece: move.to,
          validMoves: additionalCaptures,
        }))
        return
      }
    }

    // Update server state for multiplayer
    if (!room.is_ai_game) {
      console.log('Updating game state on server...')
      const result = await updateGameState(room.id, newState)
      if (result.error) {
        console.error('Failed to update game state:', result.error)
        toast.error('Erro ao sincronizar jogada')
        // Revert state on error
        setGameState(gameState)
      } else {
        console.log('Game state updated successfully')
      }
    }

    if (newState.winner) {
      handleGameEnd(newState.winner)
    }
  }

  const handleRestart = async () => {
    const newState = createInitialGameState()
    setGameState(newState)
    setShowEndDialog(false)
    setWinner(null)

    if (!room.is_ai_game) {
      await updateGameState(room.id, newState)
    }
  }

  const handleExit = () => {
    router.push("/")
  }

  // Determine which player shows on which side
  const leftPlayer = {
    profile: guestProfile || null,
    color: "black" as const,
    pieces: gameState.blackPieces,
    captured: gameState.blackCaptured,
    isAI: room.is_ai_game && !isHost,
  }

  const rightPlayer = {
    profile: hostProfile,
    color: "white" as const,
    pieces: gameState.whitePieces,
    captured: gameState.whiteCaptured,
    isAI: false,
  }

  const canPlay =
    room.status === "playing" &&
    (room.is_ai_game || (room.host_id && room.guest_id))

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <GameHeader
        roomCode={room.code}
        isAiGame={room.is_ai_game}
        onRestart={handleRestart}
        onExit={handleExit}
      />

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-2 sm:px-4 py-4 sm:py-8 gap-4">
        {/* Mobile: Top Player Info */}
        <div className="lg:hidden w-full max-w-md">
          <div className="flex items-center justify-between gap-4 bg-card rounded-xl p-3">
            {/* Black Player */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                {room.is_ai_game ? "IA" : guestProfile?.username?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div className="text-xs">
                <p className="font-medium text-foreground truncate max-w-[80px]">
                  {room.is_ai_game ? "IA" : guestProfile?.username || "Aguardando"}
                </p>
                <p className="text-muted-foreground">{gameState.blackCaptured} cap</p>
              </div>
            </div>
            
            {/* Turn Indicator */}
            <div className="px-3 py-1.5 bg-muted rounded-full">
              <span className={`text-xs font-bold ${gameState.currentPlayer === "white" ? "text-stone-300" : "text-neutral-400"}`}>
                {gameState.currentPlayer === "white" ? "BRANCAS" : "PRETAS"}
              </span>
            </div>
            
            {/* White Player */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-right">
                <p className="font-medium text-foreground truncate max-w-[80px]">
                  {hostProfile?.username || "Jogador 1"}
                </p>
                <p className="text-muted-foreground">{gameState.whiteCaptured} cap</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-stone-100 border-2 border-stone-300 flex items-center justify-center text-xs font-bold text-stone-800">
                {hostProfile?.username?.slice(0, 2).toUpperCase() || "P1"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 lg:gap-8 max-w-6xl w-full justify-center">
          {/* Left Player - Hidden on mobile */}
          <div className="hidden lg:block w-64 shrink-0">
            <PlayerCard
              player={leftPlayer.profile}
              color={leftPlayer.color}
              pieces={leftPlayer.pieces}
              captured={leftPlayer.captured}
              isCurrentTurn={gameState.currentPlayer === leftPlayer.color}
              isAI={room.is_ai_game}
              aiDifficulty={room.ai_difficulty as "facil" | "medio" | "dificil" | "impossivel" | undefined}
            />
          </div>

          {/* Game Board */}
          <div className="flex-1 flex flex-col items-center gap-4 sm:gap-6 max-w-[min(90vw,500px)] lg:max-w-none">
            <CheckersBoard
              gameState={gameState}
              onSelectPiece={handleSelectPiece}
              onMove={handleMove}
              playerColor={playerColor}
              disabled={!canPlay || gameState.winner !== null}
            />

            {/* Desktop Turn Indicator */}
            <div className="hidden lg:flex items-center gap-4 bg-card rounded-full px-6 py-3">
              <span className="text-muted-foreground">VEZ ATUAL:</span>
              <span className="font-bold text-foreground px-4 py-1 bg-muted rounded-full">
                {gameState.currentPlayer === "white"
                  ? hostProfile?.username || "JOGADOR 1"
                  : room.is_ai_game
                    ? "IA"
                    : guestProfile?.username || "JOGADOR 2"}
              </span>
            </div>
          </div>

          {/* Right Player - Hidden on mobile */}
          <div className="hidden lg:flex w-64 shrink-0 flex-col gap-4">
            <PlayerCard
              player={rightPlayer.profile}
              color={rightPlayer.color}
              pieces={rightPlayer.pieces}
              captured={rightPlayer.captured}
              isCurrentTurn={gameState.currentPlayer === rightPlayer.color}
            />

            {!room.is_ai_game && (
              <SimpleChat roomId={room.id} currentUserId={currentUser.id} />
            )}
          </div>
        </div>
        
        {/* Mobile Chat Button */}
        {!room.is_ai_game && (
          <div className="lg:hidden w-full max-w-md">
            <SimpleChat roomId={room.id} currentUserId={currentUser.id} isMobile />
          </div>
        )}
      </main>

      {/* End Game Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center text-2xl">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Fim de Jogo!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {winner}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={handleExit}>
              Voltar ao Menu
            </Button>
            <Button onClick={handleRestart}>Jogar Novamente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
