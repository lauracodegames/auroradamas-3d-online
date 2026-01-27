import type { GameState, Piece, PieceColor, Position, Move } from "./types"

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  // Place black pieces (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: "black", type: "normal" }
      }
    }
  }

  // Place white pieces (bottom)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: "white", type: "normal" }
      }
    }
  }

  return board
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: "white",
    blackPieces: 12,
    whitePieces: 12,
    blackCaptured: 0,
    whiteCaptured: 0,
    selectedPiece: null,
    validMoves: [],
    winner: null,
    moveHistory: [],
  }
}

export function getValidMoves(
  board: (Piece | null)[][],
  position: Position,
  mustCapture: boolean = false
): Move[] {
  const piece = board[position.row][position.col]
  if (!piece) return []

  const moves: Move[] = []
  const captures: Move[] = []

  const directions =
    piece.type === "king"
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : piece.color === "black"
        ? [
            [1, -1],
            [1, 1],
          ]
        : [
            [-1, -1],
            [-1, 1],
          ]

  for (const [dRow, dCol] of directions) {
    const newRow = position.row + dRow
    const newCol = position.col + dCol

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetPiece = board[newRow][newCol]

      if (!targetPiece) {
        if (!mustCapture) {
          moves.push({ from: position, to: { row: newRow, col: newCol } })
        }
      } else if (targetPiece.color !== piece.color) {
        // Check for capture
        const jumpRow = newRow + dRow
        const jumpCol = newCol + dCol

        if (
          jumpRow >= 0 &&
          jumpRow < 8 &&
          jumpCol >= 0 &&
          jumpCol < 8 &&
          !board[jumpRow][jumpCol]
        ) {
          captures.push({
            from: position,
            to: { row: jumpRow, col: jumpCol },
            captured: [{ row: newRow, col: newCol }],
          })
        }
      }
    }
  }

  // If king, check for longer moves
  if (piece.type === "king") {
    for (const [dRow, dCol] of directions) {
      let newRow = position.row + dRow
      let newCol = position.col + dCol
      let foundEnemy: Position | null = null

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol]

        if (!targetPiece) {
          if (foundEnemy) {
            captures.push({
              from: position,
              to: { row: newRow, col: newCol },
              captured: [foundEnemy],
            })
          }
        } else if (targetPiece.color !== piece.color && !foundEnemy) {
          foundEnemy = { row: newRow, col: newCol }
        } else {
          break
        }

        newRow += dRow
        newCol += dCol
      }
    }
  }

  return captures.length > 0 ? captures : mustCapture ? [] : moves
}

export function getAllValidMoves(
  board: (Piece | null)[][],
  color: PieceColor
): { position: Position; moves: Move[] }[] {
  const allMoves: { position: Position; moves: Move[] }[] = []
  let hasCapture = false

  // First pass: check if any captures are available
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, { row, col }, false)
        if (moves.some((m) => m.captured && m.captured.length > 0)) {
          hasCapture = true
        }
      }
    }
  }

  // Second pass: get moves (only captures if captures are available)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, { row, col }, hasCapture)
        if (moves.length > 0) {
          allMoves.push({ position: { row, col }, moves })
        }
      }
    }
  }

  return allMoves
}

export function makeMove(state: GameState, move: Move): GameState {
  const newBoard = state.board.map((row) => [...row])
  const piece = newBoard[move.from.row][move.from.col]!

  // Move the piece
  newBoard[move.to.row][move.to.col] = piece
  newBoard[move.from.row][move.from.col] = null

  let newBlackCaptured = state.blackCaptured
  let newWhiteCaptured = state.whiteCaptured
  let newBlackPieces = state.blackPieces
  let newWhitePieces = state.whitePieces

  // Handle captures
  if (move.captured) {
    for (const capturedPos of move.captured) {
      const capturedPiece = newBoard[capturedPos.row][capturedPos.col]
      if (capturedPiece) {
        if (capturedPiece.color === "black") {
          newBlackPieces--
          newWhiteCaptured++
        } else {
          newWhitePieces--
          newBlackCaptured++
        }
      }
      newBoard[capturedPos.row][capturedPos.col] = null
    }
  }

  // Check for promotion to king
  if (piece.type === "normal") {
    if (piece.color === "black" && move.to.row === 7) {
      newBoard[move.to.row][move.to.col] = { ...piece, type: "king" }
    } else if (piece.color === "white" && move.to.row === 0) {
      newBoard[move.to.row][move.to.col] = { ...piece, type: "king" }
    }
  }

  // Check for additional captures
  let nextPlayer: PieceColor = state.currentPlayer === "black" ? "white" : "black"
  if (move.captured && move.captured.length > 0) {
    const additionalCaptures = getValidMoves(newBoard, move.to, true)
    if (additionalCaptures.length > 0) {
      // Player can continue capturing
      nextPlayer = state.currentPlayer
    }
  }

  // Check for winner
  let winner: PieceColor | "draw" | null = null
  if (newBlackPieces === 0) {
    winner = "white"
  } else if (newWhitePieces === 0) {
    winner = "black"
  } else {
    // Check if next player has any valid moves
    const nextMoves = getAllValidMoves(newBoard, nextPlayer)
    if (nextMoves.length === 0) {
      winner = nextPlayer === "black" ? "white" : "black"
    }
  }

  return {
    board: newBoard,
    currentPlayer: nextPlayer,
    blackPieces: newBlackPieces,
    whitePieces: newWhitePieces,
    blackCaptured: newBlackCaptured,
    whiteCaptured: newWhiteCaptured,
    selectedPiece: null,
    validMoves: [],
    winner,
    moveHistory: [...state.moveHistory, move],
  }
}

// AI Logic
export function evaluateBoard(board: (Piece | null)[][], color: PieceColor): number {
  let score = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece) {
        let pieceValue = piece.type === "king" ? 5 : 1
        // Add positional bonus
        if (piece.type === "normal") {
          if (piece.color === "black") {
            pieceValue += row * 0.1 // Reward advancing
          } else {
            pieceValue += (7 - row) * 0.1
          }
        }
        // Center control bonus
        if (col >= 2 && col <= 5) {
          pieceValue += 0.2
        }

        if (piece.color === color) {
          score += pieceValue
        } else {
          score -= pieceValue
        }
      }
    }
  }

  return score
}

export function minimax(
  board: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiColor: PieceColor
): { score: number; move: Move | null } {
  const currentColor = maximizing ? aiColor : aiColor === "black" ? "white" : "black"
  const allMoves = getAllValidMoves(board, currentColor)

  if (depth === 0 || allMoves.length === 0) {
    return { score: evaluateBoard(board, aiColor), move: null }
  }

  let bestMove: Move | null = null

  if (maximizing) {
    let maxScore = -Infinity
    for (const { moves } of allMoves) {
      for (const move of moves) {
        const tempState = makeMove(
          {
            board,
            currentPlayer: currentColor,
            blackPieces: 0,
            whitePieces: 0,
            blackCaptured: 0,
            whiteCaptured: 0,
            selectedPiece: null,
            validMoves: [],
            winner: null,
            moveHistory: [],
          },
          move
        )
        const result = minimax(tempState.board, depth - 1, alpha, beta, false, aiColor)
        if (result.score > maxScore) {
          maxScore = result.score
          bestMove = move
        }
        alpha = Math.max(alpha, result.score)
        if (beta <= alpha) break
      }
    }
    return { score: maxScore, move: bestMove }
  } else {
    let minScore = Infinity
    for (const { moves } of allMoves) {
      for (const move of moves) {
        const tempState = makeMove(
          {
            board,
            currentPlayer: currentColor,
            blackPieces: 0,
            whitePieces: 0,
            blackCaptured: 0,
            whiteCaptured: 0,
            selectedPiece: null,
            validMoves: [],
            winner: null,
            moveHistory: [],
          },
          move
        )
        const result = minimax(tempState.board, depth - 1, alpha, beta, true, aiColor)
        if (result.score < minScore) {
          minScore = result.score
          bestMove = move
        }
        beta = Math.min(beta, result.score)
        if (beta <= alpha) break
      }
    }
    return { score: minScore, move: bestMove }
  }
}

export function getAIMove(
  state: GameState,
  difficulty: "easy" | "medium" | "hard"
): Move | null {
  const depthMap = { easy: 2, medium: 4, hard: 6 }
  const depth = depthMap[difficulty]

  const result = minimax(
    state.board,
    depth,
    -Infinity,
    Infinity,
    true,
    state.currentPlayer
  )

  return result.move
}
