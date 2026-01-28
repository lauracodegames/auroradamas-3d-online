import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { roomCode } = await request.json()
    
    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Test basic connection
    console.log('Testing Supabase connection...')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Check available rooms
    const { data: rooms, error } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("code", roomCode.toUpperCase())
      .eq("is_ai_game", false)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Found rooms:', rooms?.length || 0)

    const availableRoom = rooms?.find(room => !room.guest_id)
    
    if (!availableRoom) {
      return NextResponse.json({ 
        error: "Room not found or already full",
        debug: {
          roomsFound: rooms?.length || 0,
          rooms: rooms?.map(r => ({
            id: r.id,
            code: r.code,
            host_id: r.host_id,
            guest_id: r.guest_id,
            status: r.status
          }))
        }
      }, { status: 404 })
    }

    if (availableRoom.host_id === user.id) {
      return NextResponse.json({ error: "Cannot join your own room" }, { status: 400 })
    }

    // Join room
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
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('Successfully joined room:', data.id)

    return NextResponse.json({ 
      success: true,
      data,
      debug: {
        userId: user.id,
        roomId: data.id
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
