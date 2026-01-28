"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

async function getBaseUrl() {
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = headersList.get("x-forwarded-proto") || "https"
  return `${protocol}://${host}`
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const baseUrl = await getBaseUrl()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string
  const age = formData.get("age") as string
  const skillLevel = formData.get("skill_level") as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        age: age ? parseInt(age) : null,
        skill_level: skillLevel || "iniciante",
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) return null
  return data
}

export async function updateProfile(
  userId: string,
  updates: {
    username?: string
    age?: number
    skill_level?: string
    avatar_url?: string
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
