import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { HomePage } from "@/components/home/home-page"

export default async function Page() {
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

  return <HomePage profile={profile} />
}
