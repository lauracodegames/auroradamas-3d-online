"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Gamepad2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await signIn(formData)
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header com logo */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="w-7 h-7 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">
          <span className="text-primary">AURORA</span>{" "}
          <span className="text-foreground">DAMAS 3D</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Entre para continuar jogando
        </p>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 pb-8">
        <form action={handleSubmit} className="max-w-sm mx-auto space-y-6">
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
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
                className="h-12 bg-input border-border text-foreground rounded-xl px-4 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-sm text-muted-foreground">Lembrar senha</span>
            </label>
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-primary hover:underline font-medium"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold rounded-xl" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Entrar
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-8 pt-4 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Nao tem uma conta?{" "}
          <Link href="/auth/sign-up" className="text-primary font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </footer>
    </div>
  )
}
