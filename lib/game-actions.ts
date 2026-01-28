"use server"

import { createClient } from "@/lib/supabase/server"
import { createInitialGameState } from "./game-logic"
import type { GameState } from "./types"
import { nanoid } from "nanoid"

export async function createRoom(isAiGame: boolean = false, aiDifficulty?: "facil" | "medio" | "dificil") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const roomCode = nanoid(8).toUpperCase()
  const initialState = createInitialGameState()

  // Map difficulty from UI to DB
  const difficultyMap: Record<string, string> = {
    easy: "facil",
    medium: "medio", 
    hard: "dificil",
  }
  const dbDifficulty = aiDifficulty ? difficultyMap[aiDifficulty] || aiDifficulty : null

  const { data, error } = await supabase
    .from("game_rooms")
    .insert({
      host_id: user.id,
      code: roomCode,
      game_state: initialState,
      status: isAiGame ? "playing" : "waiting",
      is_ai_game: isAiGame,
      ai_difficulty: dbDifficulty,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function joinRoom(roomCode: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('User not authenticated for joinRoom')
    return { error: "Not authenticated" }
  }

  console.log('Attempting to join room:', roomCode, 'User ID:', user.id)

  // First, let's check what rooms exist
  const { data: allRooms, error: allRoomsError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("code", roomCode.toUpperCase())
    .eq("is_ai_game", false)

  if (allRoomsError) {
    console.error('Error checking rooms:', allRoomsError)
    return { error: "Error checking room availability" }
  }

  console.log('Found rooms with code:', allRooms?.length || 0, allRooms)

  // Find available room (without guest)
  const availableRoom = allRooms?.find(room => !room.guest_id)
  
  if (!availableRoom) {
    console.error('No available room found with code:', roomCode)
    return { error: "Room not found or already full" }
  }

  if (availableRoom.host_id === user.id) {
    console.error('User trying to join own room')
    return { error: "Cannot join your own room" }
  }

  console.log('Joining room:', availableRoom.id, 'Current status:', availableRoom.status)

  // Join the room
  const { data, error: updateError } = await supabase
    .from("game_rooms")
    .update({
      guest_id: user.id,
      status: "playing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", availableRoom.id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to join room:', updateError)
    return { error: updateError.message }
  }

  console.log('Successfully joined room:', availableRoom.id)
  return { data }
}

export async function updateGameState(roomId: string, gameState: GameState) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("game_rooms")
    .update({
      game_state: gameState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function endGame(roomId: string, winnerId: string | null) {
  const supabase = await createClient()

  // Get room to determine players
  const { data: room } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single()

  if (!room) {
    return { error: "Room not found" }
  }

  // Update room status
  const { error: roomError } = await supabase
    .from("game_rooms")
    .update({
      status: "finished",
      winner_id: winnerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)

  if (roomError) {
    return { error: roomError.message }
  }

  // Update player stats if not an AI game
  if (!room.is_ai_game && room.guest_id) {
    const hostId = room.host_id
    const guestId = room.guest_id

    if (winnerId) {
      const loserId = winnerId === hostId ? guestId : hostId
      // Update winner
      await supabase.rpc("increment_wins", { user_id: winnerId })
      // Update loser
      await supabase.rpc("increment_losses", { user_id: loserId })
    } else {
      // Draw
      await supabase.rpc("increment_draws", { user_id: hostId })
      await supabase.rpc("increment_draws", { user_id: guestId })
    }
  } else if (room.is_ai_game && winnerId) {
    // AI game - only update host stats
    if (winnerId === room.host_id) {
      await supabase.rpc("increment_wins", { user_id: room.host_id })
    } else {
      await supabase.rpc("increment_losses", { user_id: room.host_id })
    }
  }

  return { success: true }
}

export async function getRoom(roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_rooms")
    .select(
      `
      *,
      host:profiles!game_rooms_host_id_fkey(*),
      guest:profiles!game_rooms_guest_id_fkey(*)
    `
    )
    .eq("id", roomId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getRoomByCode(roomCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_rooms")
    .select(
      `
      *,
      host:profiles!game_rooms_host_id_fkey(*),
      guest:profiles!game_rooms_guest_id_fkey(*)
    `
    )
    .eq("code", roomCode.toUpperCase())
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getRankings(limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .limit(limit)

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function sendChatMessage(
  roomId: string,
  message: string | null,
  audioUrl: string | null
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      user_id: user.id,
      message,
      audio_url: audioUrl,
    })
    .select(
      `
      *,
      user:profiles(*)
    `
    )
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getChatMessages(roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      `
      *,
      user:profiles(*)
    `
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error('Error fetching chat messages:', error)
    return { error: error.message }
  }

  console.log('Fetched chat messages:', data?.length || 0, 'messages')
  return { data }
}
