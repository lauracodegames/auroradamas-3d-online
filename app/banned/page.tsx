import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"
import { signOut } from "@/lib/auth-actions"

export default async function BannedPage() {
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

  // If not banned, redirect to home
  if (!profile?.is_banned) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Conta Banida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Sua conta foi banida por violar as regras da comunidade.
          </p>
          {profile.ban_reason && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Motivo:</p>
              <p className="text-foreground font-medium">{profile.ban_reason}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Se você acredita que isso foi um erro, entre em contato com o suporte.
          </p>
          <form action={signOut}>
            <Button variant="outline" type="submit" className="w-full bg-transparent">
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
