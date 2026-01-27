import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JoinRoomClient } from "@/components/home/join-room-client"

interface JoinPageProps {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/join/${code}`)
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

  // Get room by code
  const { data: room } = await supabase
    .from("game_rooms")
    .select(
      `
      *,
      host:profiles!game_rooms_host_id_fkey(*)
    `
    )
    .eq("code", code.toUpperCase())
    .single()

  if (!room) {
    redirect("/?error=room_not_found")
  }

  // If user is the host, redirect to the game
  if (room.host_id === user.id) {
    redirect(`/game/${room.id}`)
  }

  // If room already has a guest and it's this user, redirect to game
  if (room.guest_id === user.id) {
    redirect(`/game/${room.id}`)
  }

  // If room is full with another guest
  if (room.guest_id && room.guest_id !== user.id) {
    redirect("/?error=room_full")
  }

  return <JoinRoomClient room={room} userId={user.id} />
}
