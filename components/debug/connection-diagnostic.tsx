"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function ConnectionDiagnostic() {
  const [status, setStatus] = useState<{
    supabase: 'checking' | 'connected' | 'error'
    realtime: 'checking' | 'connected' | 'error'
    auth: 'checking' | 'connected' | 'error'
  }>({
    supabase: 'checking',
    realtime: 'checking',
    auth: 'checking'
  })
  const [details, setDetails] = useState<string[]>([])

  const addDetail = (message: string) => {
    setDetails(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runDiagnostic = async () => {
    setDetails([])
    addDetail("Iniciando diagnóstico de conexão...")
    
    const supabase = createClient()
    
    // Test 1: Supabase Connection
    try {
      addDetail("Testando conexão com Supabase...")
      const { data, error } = await supabase.from('profiles').select('count').single()
      
      if (error) {
        addDetail(`❌ Erro na conexão Supabase: ${error.message}`)
        setStatus(prev => ({ ...prev, supabase: 'error' }))
      } else {
        addDetail("✅ Conexão Supabase estabelecida")
        setStatus(prev => ({ ...prev, supabase: 'connected' }))
      }
    } catch (err) {
      addDetail(`❌ Erro crítico Supabase: ${err}`)
      setStatus(prev => ({ ...prev, supabase: 'error' }))
    }

    // Test 2: Auth Status
    try {
      addDetail("Verificando status de autenticação...")
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        addDetail(`❌ Erro de autenticação: ${error.message}`)
        setStatus(prev => ({ ...prev, auth: 'error' }))
      } else if (user) {
        addDetail(`✅ Usuário autenticado: ${user.email}`)
        setStatus(prev => ({ ...prev, auth: 'connected' }))
      } else {
        addDetail("⚠️ Nenhum usuário autenticado")
        setStatus(prev => ({ ...prev, auth: 'error' }))
      }
    } catch (err) {
      addDetail(`❌ Erro na verificação de auth: ${err}`)
      setStatus(prev => ({ ...prev, auth: 'error' }))
    }

    // Test 3: Realtime Connection
    try {
      addDetail("Testando conexão Realtime...")
      const channel = supabase.channel('test-diagnostic')
      
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          addDetail("✅ Conexão Realtime estabelecida")
          setStatus(prev => ({ ...prev, realtime: 'connected' }))
          supabase.removeChannel(channel)
        } else if (status === 'CHANNEL_ERROR') {
          addDetail("❌ Erro na conexão Realtime")
          setStatus(prev => ({ ...prev, realtime: 'error' }))
        }
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (status.realtime === 'checking') {
          addDetail("⏰ Timeout na conexão Realtime")
          setStatus(prev => ({ ...prev, realtime: 'error' }))
        }
      }, 5000)
    } catch (err) {
      addDetail(`❌ Erro no teste Realtime: ${err}`)
      setStatus(prev => ({ ...prev, realtime: 'error' }))
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const StatusIcon = ({ status }: { status: 'checking' | 'connected' | 'error' }) => {
    if (status === 'checking') return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
    if (status === 'connected') return <CheckCircle className="w-4 h-4 text-green-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Diagnóstico de Conexão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <StatusIcon status={status.supabase} />
            <div>
              <p className="text-sm font-medium">Supabase</p>
              <p className="text-xs text-muted-foreground">{status.supabase}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <StatusIcon status={status.auth} />
            <div>
              <p className="text-sm font-medium">Auth</p>
              <p className="text-xs text-muted-foreground">{status.auth}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <StatusIcon status={status.realtime} />
            <div>
              <p className="text-sm font-medium">Realtime</p>
              <p className="text-xs text-muted-foreground">{status.realtime}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Log detalhado:</p>
            <Button size="sm" variant="outline" onClick={runDiagnostic}>
              Executar novamente
            </Button>
          </div>
          <div className="bg-black/5 border rounded-lg p-3 h-32 overflow-y-auto">
            {details.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aguardando diagnóstico...</p>
            ) : (
              <div className="space-y-1">
                {details.map((detail, index) => (
                  <p key={index} className="text-xs font-mono">{detail}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
