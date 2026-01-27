"use client"

import { useState } from "react"
import { signUp } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Gamepad2, ArrowLeft } from "lucide-react"

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await signUp(formData)
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else {
      toast.success("Cadastro realizado! Verifique seu email para confirmar.")
      router.push("/auth/sign-up-success")
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="pt-6 pb-4 px-6">
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>
        
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-primary">AURORA</span>{" "}
            <span className="text-foreground">DAMAS 3D</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie sua conta para comecar a jogar
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 pb-8 overflow-y-auto">
        <form action={handleSubmit} className="max-w-sm mx-auto space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground text-sm font-medium">
              Nome de Usuario
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Seu apelido"
              required
              autoComplete="username"
              className="h-12 bg-input border-border text-foreground rounded-xl px-4 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="h-12 bg-input border-border text-foreground rounded-xl px-4 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground text-sm font-medium">
              Senha
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 bg-input border-border text-foreground rounded-xl px-4 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-foreground text-sm font-medium">
                Idade
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="25"
                min={10}
                max={120}
                className="h-12 bg-input border-border text-foreground rounded-xl px-4 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill_level" className="text-foreground text-sm font-medium">
                Nivel
              </Label>
              <Select name="skill_level" defaultValue="iniciante">
                <SelectTrigger className="h-12 bg-input border-border text-foreground rounded-xl px-4">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediario</SelectItem>
                  <SelectItem value="avancado">Avancado</SelectItem>
                  <SelectItem value="mestre">Mestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold rounded-xl" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Criar Conta
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center pt-2">
            Ja tem uma conta?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
