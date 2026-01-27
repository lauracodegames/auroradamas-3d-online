import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function RankingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get rankings
  const { data: rankings } = await supabase
    .from("rankings")
    .select("*")
    .limit(50)

  const topThree = rankings?.slice(0, 3) || []
  const rest = rankings?.slice(3) || []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            <span className="text-primary">AURORA</span>{" "}
            <span className="text-foreground">DAMAS 3D</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Ranking Global
          </h2>
          <p className="text-muted-foreground mt-2">
            Os melhores jogadores de damas
          </p>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="flex items-end justify-center gap-4 py-8">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 border-4 border-gray-400">
                  <AvatarImage src={topThree[1].avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {topThree[1].username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="w-24 h-24 bg-gray-400 rounded-t-lg mt-2 flex flex-col items-center justify-center">
                  <Medal className="w-8 h-8 text-gray-800" />
                  <span className="text-2xl font-bold text-gray-800">2</span>
                </div>
                <p className="font-semibold text-foreground mt-2 text-center">
                  {topThree[1].username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topThree[1].wins} vitórias
                </p>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex flex-col items-center -mt-8">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-yellow-500">
                    <AvatarImage src={topThree[0].avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {topThree[0].username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="w-28 h-32 bg-yellow-500 rounded-t-lg mt-2 flex flex-col items-center justify-center">
                  <Trophy className="w-10 h-10 text-yellow-800" />
                  <span className="text-3xl font-bold text-yellow-800">1</span>
                </div>
                <p className="font-bold text-lg text-foreground mt-2 text-center">
                  {topThree[0].username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topThree[0].wins} vitórias
                </p>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 border-4 border-amber-600">
                  <AvatarImage src={topThree[2].avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {topThree[2].username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="w-24 h-20 bg-amber-600 rounded-t-lg mt-2 flex flex-col items-center justify-center">
                  <Award className="w-8 h-8 text-amber-900" />
                  <span className="text-2xl font-bold text-amber-900">3</span>
                </div>
                <p className="font-semibold text-foreground mt-2 text-center">
                  {topThree[2].username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topThree[2].wins} vitórias
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rest of Rankings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Classificação Geral</CardTitle>
            <CardDescription>
              Jogadores ordenados por número de vitórias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rest.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 4}
                  </span>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={player.avatar_url || undefined} />
                    <AvatarFallback>
                      {player.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {player.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {player.total_games} partidas jogadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {player.wins}V / {player.losses}D / {player.draws}E
                    </p>
                    <Badge variant="secondary">
                      {Math.round(player.win_rate * 100)}% taxa de vitória
                    </Badge>
                  </div>
                </div>
              ))}
              {rest.length === 0 && topThree.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum jogador no ranking ainda. Seja o primeiro a jogar!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
