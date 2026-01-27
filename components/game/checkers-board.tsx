"use client"

import { memo, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { GameState, Position, Move, Piece } from "@/lib/types"
import { getValidMoves, getAllValidMoves } from "@/lib/game-logic"

interface CheckersBoardProps {
  gameState: GameState
  onSelectPiece: (position: Position) => void
  onMove: (move: Move) => void
  playerColor: "black" | "white" | null
  disabled?: boolean
}

// Memoized piece component for better performance
const CheckerPiece = memo(function CheckerPiece({
  piece,
  isSelected,
  canMove,
}: {
  piece: Piece
  isSelected: boolean
  canMove: boolean
}) {
  const isBlack = piece.color === "black"

  return (
    <div
      className={cn(
        "w-[75%] h-[75%] rounded-full relative transition-transform duration-150",
        isSelected && "scale-110",
        canMove && !isSelected && "ring-2 ring-primary/40"
      )}
      style={{
        background: isBlack
          ? "linear-gradient(145deg, #2a2a2a 0%, #0a0a0a 100%)"
          : "linear-gradient(145deg, #ffffff 0%, #d4d4d4 100%)",
        boxShadow: isBlack
          ? `0 4px 8px rgba(0,0,0,0.5), 
             inset 0 2px 4px rgba(255,255,255,0.1), 
             inset 0 -2px 4px rgba(0,0,0,0.3)`
          : `0 4px 8px rgba(0,0,0,0.3), 
             inset 0 2px 4px rgba(255,255,255,0.8), 
             inset 0 -2px 4px rgba(0,0,0,0.1)`,
      }}
    >
      {/* Inner ring for 3D effect */}
      <div
        className="absolute inset-[15%] rounded-full"
        style={{
          background: isBlack
            ? "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)"
            : "linear-gradient(145deg, #f5f5f5 0%, #e0e0e0 100%)",
          boxShadow: isBlack
            ? "inset 0 1px 2px rgba(255,255,255,0.1)"
            : "inset 0 1px 2px rgba(255,255,255,0.5)",
        }}
      />

      {/* King crown */}
      {piece.type === "king" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className={cn(
              "w-[40%] h-[40%] drop-shadow",
              isBlack ? "text-amber-400" : "text-amber-600"
            )}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2v2h14v-2H5z" />
          </svg>
        </div>
      )}
    </div>
  )
})

// Memoized cell component
const BoardCell = memo(function BoardCell({
  row,
  col,
  piece,
  isDark,
  isSelected,
  isValidMove,
  isCapture,
  canMove,
  canInteract,
  onClick,
}: {
  row: number
  col: number
  piece: Piece | null
  isDark: boolean
  isSelected: boolean
  isValidMove: boolean
  isCapture: boolean
  canMove: boolean
  canInteract: boolean
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        "relative aspect-square flex items-center justify-center",
        canInteract && isDark && "cursor-pointer",
        isSelected && "z-10"
      )}
      onClick={onClick}
      style={{
        background: isDark
          ? "linear-gradient(135deg, #5d4037 0%, #3e2723 100%)"
          : "linear-gradient(135deg, #d7ccc8 0%, #bcaaa4 100%)",
        boxShadow: isDark
          ? "inset 0 1px 2px rgba(0,0,0,0.3)"
          : "inset 0 1px 2px rgba(255,255,255,0.3)",
      }}
    >
      {/* Selection highlight */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/30 ring-2 ring-primary ring-inset" />
      )}

      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <div
          className={cn(
            "w-[30%] h-[30%] rounded-full",
            isCapture ? "bg-destructive animate-pulse" : "bg-primary/60"
          )}
        />
      )}

      {/* Capture target highlight */}
      {isCapture && piece && (
        <div className="absolute inset-0 bg-destructive/30 animate-pulse" />
      )}

      {/* Piece */}
      {piece && (
        <CheckerPiece piece={piece} isSelected={isSelected} canMove={canMove} />
      )}
    </div>
  )
})

export function CheckersBoard({
  gameState,
  onSelectPiece,
  onMove,
  playerColor,
  disabled = false,
}: CheckersBoardProps) {
  const { board, selectedPiece, validMoves, currentPlayer } = gameState

  const isMyTurn = playerColor === currentPlayer
  const canInteract = !disabled && isMyTurn

  // Memoize movable pieces calculation
  const movablePiecesSet = useMemo(() => {
    if (!canInteract) return new Set<string>()
    const moves = getAllValidMoves(board, currentPlayer)
    return new Set(moves.map((m) => `${m.position.row}-${m.position.col}`))
  }, [board, currentPlayer, canInteract])

  // Memoize valid moves map
  const validMovesMap = useMemo(() => {
    const map = new Map<string, Move>()
    for (const move of validMoves) {
      map.set(`${move.to.row}-${move.to.col}`, move)
    }
    return map
  }, [validMoves])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!canInteract) return

      const piece = board[row][col]

      // If clicking on own piece, select it
      if (piece && piece.color === currentPlayer) {
        const moves = getValidMoves(board, { row, col }, false)
        const allMoves = getAllValidMoves(board, currentPlayer)
        const hasCapture = allMoves.some((m) =>
          m.moves.some((move) => move.captured && move.captured.length > 0)
        )
        const filteredMoves = hasCapture
          ? moves.filter((m) => m.captured && m.captured.length > 0)
          : moves

        if (filteredMoves.length > 0) {
          onSelectPiece({ row, col })
        }
        return
      }

      // If a piece is selected and clicking on a valid move destination
      if (selectedPiece) {
        const move = validMovesMap.get(`${row}-${col}`)
        if (move) {
          onMove(move)
        }
      }
    },
    [board, currentPlayer, canInteract, selectedPiece, validMovesMap, onSelectPiece, onMove]
  )

  return (
    <div className="relative w-full max-w-[500px]">
      {/* 3D Table effect */}
      <div
        className="absolute -inset-3 sm:-inset-4 rounded-xl"
        style={{
          background: "linear-gradient(145deg, #8b5a2b 0%, #5d3a1a 50%, #3d2512 100%)",
          boxShadow: `
            0 20px 40px rgba(0,0,0,0.4),
            0 10px 20px rgba(0,0,0,0.3),
            inset 0 2px 4px rgba(255,255,255,0.1)
          `,
        }}
      />

      {/* Board container with perspective */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          boxShadow: `
            0 8px 16px rgba(0,0,0,0.3),
            inset 0 0 0 2px rgba(0,0,0,0.2)
          `,
        }}
      >
        {/* Board grid */}
        <div className="grid grid-cols-8 aspect-square">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const key = `${rowIndex}-${colIndex}`
              const isDark = (rowIndex + colIndex) % 2 === 1
              const isSelected =
                selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
              const moveAtCell = validMovesMap.get(key)
              const isValidMove = !!moveAtCell
              const isCapture = !!(moveAtCell?.captured && moveAtCell.captured.length > 0)
              const canMove = movablePiecesSet.has(key)

              return (
                <BoardCell
                  key={key}
                  row={rowIndex}
                  col={colIndex}
                  piece={piece}
                  isDark={isDark}
                  isSelected={isSelected}
                  isValidMove={isValidMove}
                  isCapture={isCapture}
                  canMove={canMove}
                  canInteract={canInteract}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
