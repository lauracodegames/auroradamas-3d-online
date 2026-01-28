import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { roomCode } = await request.json()
    
    if (!roomCode) {
      console.error('API: No room code provided')
      return NextResponse.json({ error: "Room code is required" }, { status: 400 })
    }

    console.log('API: Attempting to join room with code:', roomCode)

    const supabase = await createClient()
    
    // Test basic connection
    console.log('API: Testing Supabase connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('API: Authentication error:', authError)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log('API: User authenticated:', user.id, user.email)

    // Check available rooms with detailed logging
    console.log('API: Checking available rooms...')
    const { data: allRooms, error: roomsError } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("code", roomCode.toUpperCase())
      .eq("is_ai_game", false)

    if (roomsError) {
      console.error('API: Database error checking rooms:', roomsError)
      return NextResponse.json({ error: "Error checking room availability: " + roomsError.message }, { status: 500 })
    }

    console.log('API: Found rooms:', allRooms?.length || 0)
    if (allRooms) {
      console.log('API: Room details:', allRooms.map(r => ({
        id: r.id,
        code: r.code,
        host_id: r.host_id,
        guest_id: r.guest_id,
        status: r.status
      })))
    }

    const availableRoom = allRooms?.find(room => !room.guest_id)
    
    if (!availableRoom) {
      console.error('API: No available room found')
      return NextResponse.json({ 
        error: "Room not found or already full",
        debug: {
          roomsFound: allRooms?.length || 0,
          rooms: allRooms?.map(r => ({
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
      console.error('API: User trying to join own room')
      return NextResponse.json({ error: "Cannot join your own room" }, { status: 400 })
    }

    console.log('API: Joining room:', availableRoom.id)

    // Join room with detailed error handling
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
      console.error('API: Update error:', updateError)
      return NextResponse.json({ error: "Failed to join room: " + updateError.message }, { status: 500 })
    }

    console.log('API: Successfully joined room:', data.id)
    return NextResponse.json({ 
      success: true,
      data,
      debug: {
        userId: user.id,
        roomId: data.id,
        roomCode: data.code
      }
    })

  } catch (error) {
    console.error('API: Unhandled error:', error)
    return NextResponse.json({ error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500 })
  }
}
