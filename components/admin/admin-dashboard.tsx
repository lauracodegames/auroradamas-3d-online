"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getAllUsers,
  getUserStats,
  banUser,
  unbanUser,
  searchUsers,
  makeAdmin,
  removeAdmin,
  getUserDetails,
} from "@/lib/admin-actions"
import type { Profile } from "@/lib/types"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Ban,
  Shield,
  Gamepad2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  ShieldOff,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export function AdminDashboard() {
  const [users, setUsers] = useState<Profile[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    totalGames: 0,
    activeGames: 0,
  })
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [userGames, setUserGames] = useState<unknown[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    const result = await getAllUsers(page, 20)
    if (result.data) {
      setUsers(result.data)
      setTotalUsers(result.count || 0)
    }
  }, [page])

  const loadStats = async () => {
    const result = await getUserStats()
    setStats(result)
  }

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [page, loadUsers])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers()
      return
    }

    setIsSearching(true)
    const result = await searchUsers(searchQuery)
    setIsSearching(false)

    if (result.data) {
      setUsers(result.data)
    }
  }

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error("Digite o motivo do banimento")
      return
    }

    setIsLoading(true)
    const result = await banUser(selectedUser.id, banReason)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Usuário banido com sucesso")
    setShowBanDialog(false)
    setBanReason("")
    setSelectedUser(null)
    loadUsers()
    loadStats()
  }

  const handleUnban = async (userId: string) => {
    const result = await unbanUser(userId)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Usuário desbanido com sucesso")
    loadUsers()
    loadStats()
  }

  const handleMakeAdmin = async (userId: string) => {
    const result = await makeAdmin(userId)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Usuário promovido a admin")
    loadUsers()
  }

  const handleRemoveAdmin = async (userId: string) => {
    const result = await removeAdmin(userId)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Admin removido")
    loadUsers()
  }

  const handleViewDetails = async (user: Profile) => {
    setSelectedUser(user)
    const result = await getUserDetails(user.id)
    if (result.games) {
      setUserGames(result.games)
    }
    setShowDetailsDialog(true)
  }

  const totalPages = Math.ceil(totalUsers / 20)

  const skillLevelMap: Record<string, string> = {
    iniciante: "Iniciante",
    intermediario: "Intermediario",
    avancado: "Avancado",
    mestre: "Mestre",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-foreground">Painel</span>{" "}
              <span className="text-primary">Admin</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie usuários e partidas
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalUsers}
                </p>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Ban className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.bannedUsers}
                </p>
                <p className="text-sm text-muted-foreground">Usuários Banidos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalGames}
                </p>
                <p className="text-sm text-muted-foreground">Total de Partidas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.activeGames}
                </p>
                <p className="text-sm text-muted-foreground">Partidas Ativas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>
              Visualize, bana ou promova usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome de usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-input border-border"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Buscar
              </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Usuário</TableHead>
                    <TableHead className="text-muted-foreground">Nível</TableHead>
                    <TableHead className="text-muted-foreground">Estatísticas</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.username?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.age ? `${user.age} anos` : "Idade não informada"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {skillLevelMap[user.skill_level]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {user.wins}V / {user.losses}D / {user.draws}E
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.is_admin && (
                            <Badge variant="default">Admin</Badge>
                          )}
                          {user.is_banned && (
                            <Badge variant="destructive">Banido</Badge>
                          )}
                          {!user.is_admin && !user.is_banned && (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!user.is_admin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMakeAdmin(user.id)}
                            >
                              <ShieldCheck className="w-4 h-4 text-primary" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAdmin(user.id)}
                            >
                              <ShieldOff className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          )}
                          {!user.is_banned ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowBanDialog(true)
                              }}
                            >
                              <Ban className="w-4 h-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnban(user.id)}
                            >
                              <Ban className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja banir {selectedUser?.username}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo do banimento..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Banir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {selectedUser.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedUser.username}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedUser.age ? `${selectedUser.age} anos` : "Idade não informada"} -{" "}
                    {skillLevelMap[selectedUser.skill_level]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cadastrado em{" "}
                    {new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">
                    {selectedUser.wins}
                  </p>
                  <p className="text-sm text-muted-foreground">Vitórias</p>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {selectedUser.losses}
                  </p>
                  <p className="text-sm text-muted-foreground">Derrotas</p>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {selectedUser.draws}
                  </p>
                  <p className="text-sm text-muted-foreground">Empates</p>
                </div>
              </div>

              {selectedUser.is_banned && selectedUser.ban_reason && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive">
                  <p className="text-sm font-semibold text-destructive">
                    Motivo do Banimento:
                  </p>
                  <p className="text-foreground">{selectedUser.ban_reason}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Últimas Partidas
                </h4>
                {userGames.length > 0 ? (
                  <div className="space-y-2">
                    {userGames.map((game: unknown) => {
                      const g = game as { id: string; status: string; created_at: string; is_ai_game: boolean }
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <span className="text-sm text-foreground">
                            {g.is_ai_game ? "VS IA" : "Multiplayer"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(g.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          <Badge variant="outline">{g.status}</Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma partida encontrada
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
