"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAllUsers(page: number = 1, limit: number = 20) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return { error: error.message }
  }

  return { data, count }
}

export async function getUserStats() {
  const supabase = await createClient()

  const { data: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })

  const { data: bannedUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })
    .eq("is_banned", true)

  const { data: totalGames } = await supabase
    .from("game_rooms")
    .select("id", { count: "exact" })

  const { data: activeGames } = await supabase
    .from("game_rooms")
    .select("id", { count: "exact" })
    .eq("status", "playing")

  return {
    totalUsers: totalUsers?.length || 0,
    bannedUsers: bannedUsers?.length || 0,
    totalGames: totalGames?.length || 0,
    activeGames: activeGames?.length || 0,
  }
}

export async function banUser(userId: string, reason: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function unbanUser(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: false,
      ban_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUserDetails(userId: string) {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (profileError) {
    return { error: profileError.message }
  }

  const { data: games } = await supabase
    .from("game_rooms")
    .select("*")
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(10)

  return { profile, games }
}

export async function searchUsers(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", `%${query}%`)
    .limit(20)

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function makeAdmin(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      is_admin: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function removeAdmin(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      is_admin: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
