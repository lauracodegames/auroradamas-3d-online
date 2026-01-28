"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Gamepad2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    const email = formData.get("email") as string
    
    // Simulação de envio de email de recuperação
    // Em um ambiente real, você integraria com o Supabase para enviar email de reset
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      toast.success("Email de recuperação enviado com sucesso!")
    }, 2000)
  }

  if (isSubmitted) {
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
              Email enviado com sucesso!
            </p>
          </div>
        </header>

        {/* Success Message */}
        <main className="flex-1 px-6 pb-8 flex items-center justify-center">
          <div className="max-w-sm mx-auto text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Verifique seu email
              </h2>
              <p className="text-sm text-muted-foreground">
                Enviamos as instruções para redefinir sua senha para o endereço de email fornecido.
              </p>
            </div>
            <Button 
              onClick={() => router.push("/auth/login")}
              className="w-full h-12 font-semibold rounded-xl"
            >
              Voltar para o login
            </Button>
          </div>
        </main>
      </div>
    )
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
            Recuperar sua senha
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 pb-8 overflow-y-auto">
        <form action={handleSubmit} className="max-w-sm mx-auto space-y-5">
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

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Instruções:</strong>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Digite o email cadastrado na sua conta</li>
              <li>Enviaremos um link para redefinir sua senha</li>
              <li>O link expira em 24 horas</li>
              <li>Verifique sua caixa de spam caso não receba o email</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold rounded-xl" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Enviar email de recuperação
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center pt-2">
            Lembrou sua senha?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Voltar para o login
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
