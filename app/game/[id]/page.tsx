import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { GameRoomComponent } from "@/components/game/game-room"
import type { Profile, GameRoom } from "@/lib/types"

interface GamePageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Check if user is banned
  if (profile.is_banned) {
    redirect("/banned")
  }

  // Get game room
  const { data: room, error } = await supabase
    .from("game_rooms")
    .select(
      `
      *,
      host:profiles!game_rooms_host_id_fkey(*),
      guest:profiles!game_rooms_guest_id_fkey(*)
    `
    )
    .eq("id", id)
    .single()

  if (error || !room) {
    notFound()
  }

  // Check if user is part of this game
  const isHost = room.host_id === user.id
  const isGuest = room.guest_id === user.id

  if (!isHost && !isGuest && !room.is_ai_game) {
    redirect("/")
  }

  return (
    <GameRoomComponent
      room={room as GameRoom}
      currentUser={profile as Profile}
    />
  )
}
