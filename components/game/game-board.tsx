"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useGameSync } from "@/hooks/useGameSync"
import { updateGameState } from "@/lib/game-actions"
import {
  createInitialGameState,
  makeMove,
  getValidMoves,
  getAllValidMoves,
  getAIMove,
} from "@/lib/game-logic"
import type { GameRoom, Profile, GameState, Position, Move, Piece } from "@/lib/types"
import { CheckersBoard } from "./checkers-board"
import { PlayerCard } from "./player-card"
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

interface GameBoardProps {
  roomId: string
  currentUser: Profile
}

export function GameBoard({ roomId, currentUser }: GameBoardProps) {
  const router = useRouter()
  const { gameRoom, isLoading, error, updateGameState: syncUpdateGameState } = useGameSync(roomId)
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const isAiTurnRef = useRef(false)

  // Initialize game state when room loads
  useEffect(() => {
    if (gameRoom?.game_state) {
      setGameState(gameRoom.game_state as GameState)
    }
  }, [gameRoom])

  const isHost = gameRoom?.host_id === currentUser.id
  const playerColor = isHost ? "white" : "black"
  const isMyTurn = gameRoom?.current_turn === currentUser.id

  const hostProfile = gameRoom?.host as Profile
  const guestProfile = gameRoom?.guest as Profile | null

  const leftPlayer = {
    profile: isHost ? hostProfile : guestProfile,
    color: isHost ? "white" : "black",
    pieces: gameState.pieces.filter(p => p.color === (isHost ? "white" : "black")).length,
    captured: gameState.captured.filter(p => p.color === (isHost ? "white" : "black")).length,
  }

  const rightPlayer = {
    profile: isHost ? guestProfile : hostProfile,
    color: isHost ? "black" : "white",
    pieces: gameState.pieces.filter(p => p.color === (isHost ? "black" : "white")).length,
    captured: gameState.captured.filter(p => p.color === (isHost ? "black" : "white")).length,
  }

  const handleSelectPiece = (position: Position) => {
    if (!isMyTurn && !gameRoom?.is_ai_game) return

    const piece = gameState.pieces.find(p => p.position === position)
    if (!piece || piece.color !== gameState.currentPlayer) return

    setSelectedPiece(position)
    const moves = getValidMoves(gameState.board, position)
    setValidMoves(moves.map(m => m.to))
  }

  const handleMove = async (move: Move) => {
    if (!isMyTurn && !gameRoom?.is_ai_game) return

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

    // Update server state using the hook
    if (!gameRoom?.is_ai_game) {
      console.log('Updating game state on server...')
      await syncUpdateGameState({
        game_state: newState,
        current_turn: gameRoom.current_turn === gameRoom.host_id 
          ? gameRoom.guest_id 
          : gameRoom.host_id
      })
    }

    if (newState.winner) {
      handleGameEnd(newState.winner)
    }
  }

  const handleGameEnd = useCallback(
    (result: "black" | "white" | "draw") => {
      let winnerName: string
      let winnerId: string | null = null

      if (result === "draw") {
        winnerName = "Empate"
      } else {
        const winnerColor = result
        const winnerProfile = winnerColor === "white" ? hostProfile : guestProfile
        winnerName = winnerProfile?.username || "Unknown"
        winnerId = winnerProfile?.id || null
      }

      setWinner(winnerName)
      setShowEndDialog(true)
    },
    [hostProfile, guestProfile]
  )

  const handleRestart = async () => {
    const newState = createInitialGameState()
    setGameState(newState)
    
    await syncUpdateGameState({
      game_state: newState,
      current_turn: gameRoom?.host_id
    })
    
    setShowEndDialog(false)
    setWinner(null)
  }

  const handleLeaveGame = () => {
    router.push("/")
  }

  // AI move logic
  useEffect(() => {
    if (
      gameRoom?.is_ai_game &&
      gameState.currentPlayer === "black" &&
      !isAiTurnRef.current
    ) {
      isAiTurnRef.current = true

      const timer = setTimeout(() => {
        const aiMove = getAIMove(gameState, "hard" as any) // Temporarily cast to any
        if (aiMove) {
          handleMove(aiMove)
        }
        isAiTurnRef.current = false
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [gameState, gameRoom])

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Carregando sala...</p>
        </div>
      </div>
    )
  }

  if (error || !gameRoom) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-4">
            {error || "Sala não encontrada"}
          </p>
          <Button onClick={() => router.push("/")}>
            Voltar para o início
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">
            <span className="text-primary">AURORA</span>{" "}
            <span className="text-foreground">DAMAS</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Sala: {gameRoom.code}
            </span>
            <Button variant="outline" size="sm" onClick={handleLeaveGame}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 w-full">
        <div className="flex items-start gap-4 lg:gap-8 max-w-6xl w-full justify-center">
          {/* Left Player - Hidden on mobile */}
          <div className="hidden lg:block w-64 shrink-0">
            <PlayerCard
              player={leftPlayer.profile}
              color={leftPlayer.color as "white" | "black"}
              pieces={leftPlayer.pieces}
              captured={leftPlayer.captured}
              isCurrentTurn={gameState.currentPlayer === leftPlayer.color}
              isAI={gameRoom.is_ai_game}
              aiDifficulty={gameRoom.ai_difficulty as "facil" | "medio" | "dificil" | "impossivel" | undefined}
            />
          </div>

          {/* Game Board */}
          <div className="flex-1 flex flex-col items-center gap-4 sm:gap-6 max-w-[min(90vw,500px)] lg:max-w-none">
            <CheckersBoard
              gameState={gameState}
              onSelectPiece={handleSelectPiece}
              onMove={handleMove}
              playerColor={playerColor}
            />
            
            <div className="text-center text-sm text-muted-foreground">
              VEZ ATUAL: {gameRoom.current_turn === currentUser.id ? currentUser.username : 
                        (gameRoom.current_turn === gameRoom.host_id ? hostProfile?.username : guestProfile?.username)}
            </div>
          </div>

          {/* Right Player - Hidden on mobile */}
          <div className="hidden lg:flex w-64 shrink-0 flex-col gap-4">
            <PlayerCard
              player={rightPlayer.profile}
              color={rightPlayer.color as "white" | "black"}
              pieces={rightPlayer.pieces}
              captured={rightPlayer.captured}
              isCurrentTurn={gameState.currentPlayer === rightPlayer.color}
            />

            {!gameRoom.is_ai_game && (
              <SimpleChat roomId={gameRoom.id} currentUserId={currentUser.id} />
            )}
          </div>
        </div>
        
        {/* Mobile Chat Button */}
        {!gameRoom.is_ai_game && (
          <div className="lg:hidden w-full max-w-md">
            <SimpleChat roomId={gameRoom.id} currentUserId={currentUser.id} isMobile />
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
              {winner === "Empate" ? (
                <span>O jogo terminou em empate!</span>
              ) : (
                <span>
                  <span className="font-bold">{winner}</span> venceu!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2">
            <Button onClick={handleRestart} className="w-full">
              Jogar Novamente
            </Button>
            <Button variant="outline" onClick={handleLeaveGame} className="w-full">
              Sair da Sala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
