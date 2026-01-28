export type PieceColor = "black" | "white"
export type PieceType = "normal" | "king"

// Visual theme colors that can be customized
export type ThemeColor = "classic" | "wood" | "neon" | "ocean"

export interface Piece {
  color: PieceColor
  type: PieceType
  position?: Position  // Adicionar position para compatibilidade
}

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  captured?: Position[]
}

export interface GameState {
  board: (Piece | null)[][]
  currentPlayer: PieceColor
  blackPieces: number
  whitePieces: number
  blackCaptured: number
  whiteCaptured: number
  selectedPiece: Position | null
  validMoves: Move[]
  winner: PieceColor | "draw" | null
  moveHistory: Move[]
  // Adicionar propriedades para compatibilidade
  pieces: Piece[]
  captured: Piece[]
}

export interface Profile {
  id: string
  username: string
  age: number | null
  skill_level: "iniciante" | "intermediario" | "avancado" | "mestre"
  avatar_url: string | null
  wins: number
  losses: number
  draws: number
  total_games: number
  is_admin: boolean
  is_banned: boolean
  ban_reason: string | null
  created_at: string
  updated_at: string
}

export interface GameRoom {
  id: string
  host_id: string
  guest_id: string | null
  code: string
  game_state: GameState
  status: "waiting" | "playing" | "finished" | "abandoned"
  winner_id: string | null
  is_ai_game: boolean
  ai_difficulty: "facil" | "medio" | "dificil" | "impossivel" | null
  current_turn: string | null  // ID do jogador atual
  game_status: "waiting" | "playing" | "finished"  // Status do jogo
  created_at: string
  updated_at: string
  host?: Profile
  guest?: Profile
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  message: string | null
  audio_url: string | null
  created_at: string
  user?: Profile
}

export interface RankingEntry {
  id: string
  username: string
  avatar_url: string | null
  wins: number
  losses: number
  draws: number
  total_games: number
  win_rate: number
  rank: number
}
