'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, User, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface EmailCaptureProps {
  onComplete: (email: string, name?: string) => void
  onSkip?: () => void
}

export default function EmailCapture({ onComplete, onSkip }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isValidEmail, canUseTrial } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Por favor, insira seu email')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('Por favor, insira um email válido')
      return
    }
    
    if (!canUseTrial(email)) {
      setError('Este email já foi usado para teste grátis')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      onComplete(email.trim(), name.trim() || undefined)
    } catch (error) {
      setError('Erro ao processar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Teste Grátis</CardTitle>
          <CardDescription className="text-gray-300">
            Insira seu email para começar seu teste de 24 horas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Nome (opcional)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <>
                    Começar Teste Grátis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              {onSkip && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSkip}
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Pular por agora
                </Button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Ao continuar, você concorda com nossos termos de uso.
              Seu email será usado apenas para notificações importantes.
            </p>
          </div>
          
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-400 mb-1">
              Por que precisamos do seu email?
            </h4>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Salvar que você já usou o teste grátis</li>
              <li>• Notificar quando o teste estiver acabando</li>
              <li>• Enviar informações sobre planos (opcional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}