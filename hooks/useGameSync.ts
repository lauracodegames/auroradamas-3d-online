"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GameRoom } from "@/lib/types"

interface UseGameSyncReturn {
  gameRoom: GameRoom | null
  isLoading: boolean
  error: string | null
  updateGameState: (updates: Partial<GameRoom>) => Promise<void>
  refreshRoom: () => Promise<void>
}

export function useGameSync(roomId: string): UseGameSyncReturn {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshRoom = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("game_rooms")
        .select(`
          *,
          host:profiles!game_rooms_host_id_fkey(*),
          guest:profiles!game_rooms_guest_id_fkey(*)
        `)
        .eq("id", roomId)
        .single()

      if (error) {
        console.error('Error fetching game room:', error)
        setError(error.message)
        return
      }

      setGameRoom(data)
      setError(null)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Failed to load game room')
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  const updateGameState = useCallback(async (updates: Partial<GameRoom>) => {
    if (!gameRoom) return

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("game_rooms")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .select()
        .single()

      if (error) {
        console.error('Error updating game state:', error)
        setError(error.message)
        return
      }

      setGameRoom(data)
      setError(null)
    } catch (err) {
      console.error('Unexpected error updating:', err)
      setError('Failed to update game state')
    }
  }, [gameRoom, roomId])

  useEffect(() => {
    // Initial load
    refreshRoom()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`game_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Game room updated:', payload.new)
          setGameRoom(payload.new as GameRoom)
        }
      )
      .subscribe((status) => {
        console.log('Game sync subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to game room updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to game room updates')
          setError('Connection error - using polling')
        }
      })

    // Fallback polling every 3 seconds
    const interval = setInterval(() => {
      refreshRoom()
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [roomId, refreshRoom])

  return {
    gameRoom,
    isLoading,
    error,
    updateGameState,
    refreshRoom,
  }
}
