"use client"

import { useState } from "react"
import { signOut } from "@/lib/auth-actions"
import { createRoom, joinRoom, getRankings } from "@/lib/game-actions"
import type { Profile, RankingEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Bot,
  Trophy,
  LogOut,
  Copy,
  Check,
  Shield,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import useSWR from "swr"

interface HomePageProps {
  profile: Profile
}

export function HomePage({ profile }: HomePageProps) {
  const router = useRouter()
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [showAIGame, setShowAIGame] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [createdRoomCode, setCreatedRoomCode] = useState("")
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  )
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: rankings } = useSWR<RankingEntry[]>("rankings", async () => {
    const result = await getRankings(10)
    return result.data || []
  })

  const handleCreateRoom = async () => {
    setIsLoading(true)
    const result = await createRoom(false)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.data) {
      setCreatedRoomCode(result.data.code)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error("Digite o código da sala")
      return
    }

    setIsLoading(true)
    const result = await joinRoom(roomCode)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.data) {
      router.push(`/game/${result.data.id}`)
    }
  }

  const handleStartAIGame = async () => {
    setIsLoading(true)
    const result = await createRoom(true, aiDifficulty)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.data) {
      router.push(`/game/${result.data.id}`)
    }
  }

  const copyRoomLink = () => {
    const link = `${window.location.origin}/join/${createdRoomCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  const goToCreatedRoom = () => {
    router.push(`/join/${createdRoomCode}`)
  }

  const skillLevelMap: Record<string, string> = {
    iniciante: "Iniciante",
    intermediario: "Intermediario",
    avancado: "Avancado",
    mestre: "Mestre",
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3 safe-area-inset-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold">
            <span className="text-primary">AURORA</span>{" "}
            <span className="text-foreground">DAMAS</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {profile.is_admin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                <Link href="/admin" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              </Button>
            )}
            {profile.is_admin && (
              <Button asChild variant="ghost" size="icon" className="sm:hidden">
                <Link href="/admin">
                  <Shield className="w-5 h-5" />
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {profile.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="font-medium text-foreground text-sm">{profile.username}</p>
                <p className="text-xs text-muted-foreground">
                  {skillLevelMap[profile.skill_level]}
                </p>
              </div>
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="icon" type="submit" className="w-8 h-8 sm:w-10 sm:h-10">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 w-full">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Game Options */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {profile.wins}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Vitorias</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-destructive">
                    {profile.losses}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Derrotas</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                    {profile.draws}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Empates</p>
                </CardContent>
              </Card>
            </div>

            {/* Game Modes */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Create Room */}
              <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
                <DialogTrigger asChild>
                  <Card className="bg-card border-border hover:border-primary active:scale-[0.98] transition-all cursor-pointer group">
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          Criar Sala
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          Jogue contra um amigo
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Sala</DialogTitle>
                    <DialogDescription>
                      Crie uma sala e convide um amigo para jogar
                    </DialogDescription>
                  </DialogHeader>
                  {createdRoomCode ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Código da Sala
                        </p>
                        <p className="text-2xl font-bold font-mono text-foreground">
                          {createdRoomCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={copyRoomLink}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copiar Link
                        </Button>
                        <Button className="flex-1" onClick={goToCreatedRoom}>
                          Ir para Sala
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DialogFooter>
                      <Button onClick={handleCreateRoom} disabled={isLoading}>
                        {isLoading && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Criar Sala
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>

              {/* Join Room */}
              <Dialog open={showJoinRoom} onOpenChange={setShowJoinRoom}>
                <DialogTrigger asChild>
                  <Card className="bg-card border-border hover:border-primary active:scale-[0.98] transition-all cursor-pointer group">
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          Entrar
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          Use um codigo de convite
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Entrar em Sala</DialogTitle>
                    <DialogDescription>
                      Digite o código da sala para entrar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Código da sala"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="font-mono text-center text-lg uppercase bg-input border-border"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleJoinRoom} disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Entrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* AI Game */}
              <Dialog open={showAIGame} onOpenChange={setShowAIGame}>
                <DialogTrigger asChild>
                  <Card className="bg-card border-border hover:border-primary active:scale-[0.98] transition-all cursor-pointer group col-span-2">
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          Jogar contra IA
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Desafie nossa inteligencia artificial
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Jogar contra IA</DialogTitle>
                    <DialogDescription>
                      Escolha a dificuldade da IA
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select
                      value={aiDifficulty}
                      onValueChange={(v) =>
                        setAiDifficulty(v as "easy" | "medium" | "hard")
                      }
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Dificuldade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground">
                      {aiDifficulty === "easy" && (
                        <p>A IA fará movimentos básicos, ideal para aprender.</p>
                      )}
                      {aiDifficulty === "medium" && (
                        <p>
                          A IA usará estratégias intermediárias para te desafiar.
                        </p>
                      )}
                      {aiDifficulty === "hard" && (
                        <p>
                          A IA usará algoritmos avançados. Prepare-se para um
                          desafio real!
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleStartAIGame} disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Iniciar Partida
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Rankings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 10 Jogadores
              </CardTitle>
              <CardDescription>Os melhores jogadores de Aurora Damas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankings?.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-yellow-950"
                          : index === 1
                            ? "bg-gray-400 text-gray-950"
                            : index === 2
                              ? "bg-amber-600 text-amber-950"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={player.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {player.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {player.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {player.wins}V / {player.losses}D
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {Math.round(player.win_rate * 100)}%
                    </Badge>
                  </div>
                ))}
                {(!rankings || rankings.length === 0) && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Nenhum jogador no ranking ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
