'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Mic, 
  Shield, 
  Bell, 
  Users, 
  FileText, 
  Music, 
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  XCircle,
  RefreshCw,
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react'
import { PERMISSION_DESCRIPTIONS } from '@/lib/constants'
import { UserPermissions } from '@/lib/types'

interface OnboardingProps {
  onComplete: (permissions: UserPermissions) => void
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Voice Master',
    description: 'Seu assistente pessoal inteligente'
  },
  {
    id: 'voice-selection',
    title: 'Escolha sua voz',
    description: 'Neo ou Lia estão prontos para ajudar'
  },
  {
    id: 'permissions',
    title: 'Permissões',
    description: 'Configure o que o Voice Master pode fazer'
  },
  {
    id: 'trial',
    title: 'Teste Grátis',
    description: '24 horas para experimentar tudo'
  }
]

const PERMISSION_ICONS = {
  microphone: Mic,
  accessibility: Shield,
  notifications: Bell,
  contacts: Users,
  files: FileText,
  streaming: Music,
  location: MapPin
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState<'neo' | 'lia'>('neo')
  const [permissions, setPermissions] = useState<UserPermissions>({
    microphone: false,
    accessibility: false,
    notifications: false,
    contacts: false,
    files: false,
    streaming: false,
    location: false
  })
  const [permissionLoading, setPermissionLoading] = useState<string | null>(null)
  const [permissionErrors, setPermissionErrors] = useState<Record<string, string>>({})
  const [permissionAttempts, setPermissionAttempts] = useState<Record<string, number>>({})
  const [isClient, setIsClient] = useState(false)
  const [showTroubleshooting, setShowTroubleshooting] = useState<string | null>(null)
  
  // Refs para controlar tentativas simultâneas
  const microphoneRequestRef = useRef<Promise<boolean> | null>(null)
  const notificationRequestRef = useRef<Promise<boolean> | null>(null)

  // Garantir que estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100

  const checkMicrophoneSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Seu navegador não suporta acesso ao microfone')
    }
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Acesso ao microfone requer conexão segura (HTTPS)')
    }
  }

  const requestMicrophonePermission = async (): Promise<boolean> => {
    // Se já existe uma requisição em andamento, aguarda ela
    if (microphoneRequestRef.current) {
      console.log('Aguardando requisição de microfone em andamento...')
      return await microphoneRequestRef.current
    }

    // Verificar se já tentou muitas vezes
    const attempts = permissionAttempts.microphone || 0
    if (attempts >= 5) {
      setPermissionErrors(prev => ({ 
        ...prev, 
        microphone: 'Muitas tentativas. Recarregue a página ou verifique as configurações do navegador.' 
      }))
      setShowTroubleshooting('microphone')
      return false
    }

    setPermissionLoading('microphone')
    setPermissionErrors(prev => ({ ...prev, microphone: '' }))
    
    // Criar a promise e armazenar a referência
    const requestPromise = (async (): Promise<boolean> => {
      try {
        // Verificar suporte do navegador
        checkMicrophoneSupport()
        
        console.log('🎤 Solicitando permissão do microfone... (tentativa', attempts + 1, ')')
        
        // Incrementar contador de tentativas
        setPermissionAttempts(prev => ({ 
          ...prev, 
          microphone: (prev.microphone || 0) + 1 
        }))
        
        // Primeiro, tentar verificar o status atual da permissão
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          console.log('Status atual da permissão do microfone:', permissionStatus.state)
          
          if (permissionStatus.state === 'granted') {
            console.log('✅ Permissão do microfone já concedida!')
            setPermissions(prev => ({ ...prev, microphone: true }))
            setPermissionAttempts(prev => ({ ...prev, microphone: 0 }))
            return true
          }
          
          if (permissionStatus.state === 'denied') {
            throw new Error('Permissão negada permanentemente. Clique no ícone de microfone na barra de endereços e permita o acesso.')
          }
        } catch (permError) {
          // Alguns navegadores não suportam permissions.query para microfone
          console.log('Permissions API não disponível, continuando com getUserMedia...')
        }
        
        // Solicitar permissão com configurações específicas
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        console.log('✅ Permissão do microfone concedida com sucesso!')
        
        // Parar o stream imediatamente após obter permissão
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('Track do microfone parado:', track.label)
        })
        
        setPermissions(prev => ({
          ...prev,
          microphone: true
        }))
        
        // Limpar contador de tentativas em caso de sucesso
        setPermissionAttempts(prev => ({ ...prev, microphone: 0 }))
        
        return true
      } catch (error: any) {
        console.log('❌ Erro ao solicitar permissão do microfone:', error.name, error.message)
        
        let errorMessage = 'Erro desconhecido ao acessar microfone'
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão negada pelo usuário. Clique no ícone de microfone na barra de endereços e permita o acesso.'
          setShowTroubleshooting('microphone')
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhum microfone encontrado no seu dispositivo.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Seu navegador não suporta acesso ao microfone.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microfone está sendo usado por outro aplicativo.'
        } else if (error.name === 'AbortError') {
          errorMessage = 'Solicitação cancelada. Tente novamente.'
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Erro de segurança. Verifique se está usando HTTPS.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        setPermissionErrors(prev => ({ ...prev, microphone: errorMessage }))
        
        // Mostrar troubleshooting após 2 tentativas falhadas
        if (attempts >= 1) {
          setShowTroubleshooting('microphone')
        }
        
        return false
      } finally {
        setPermissionLoading(null)
        // Limpar a referência da promise
        microphoneRequestRef.current = null
      }
    })()

    // Armazenar a referência da promise
    microphoneRequestRef.current = requestPromise
    
    return await requestPromise
  }

  const checkNotificationSupport = () => {
    if (!('Notification' in window)) {
      throw new Error('Seu navegador não suporta notificações')
    }
  }

  const requestNotificationPermission = async (): Promise<boolean> => {
    // Se já existe uma requisição em andamento, aguarda ela
    if (notificationRequestRef.current) {
      console.log('Aguardando requisição de notificação em andamento...')
      return await notificationRequestRef.current
    }

    // Verificar se já tentou muitas vezes
    const attempts = permissionAttempts.notifications || 0
    if (attempts >= 5) {
      setPermissionErrors(prev => ({ 
        ...prev, 
        notifications: 'Muitas tentativas. Verifique as configurações do navegador.' 
      }))
      setShowTroubleshooting('notifications')
      return false
    }

    setPermissionLoading('notifications')
    setPermissionErrors(prev => ({ ...prev, notifications: '' }))
    
    // Criar a promise e armazenar a referência
    const requestPromise = (async (): Promise<boolean> => {
      try {
        checkNotificationSupport()
        
        console.log('🔔 Solicitando permissão de notificações... (tentativa', attempts + 1, ')')
        
        // Verificar se a permissão já foi concedida
        if (Notification.permission === 'granted') {
          console.log('✅ Permissão de notificações já concedida!')
          setPermissions(prev => ({ ...prev, notifications: true }))
          setPermissionAttempts(prev => ({ ...prev, notifications: 0 }))
          return true
        }
        
        if (Notification.permission === 'denied') {
          throw new Error('Permissão negada permanentemente. Verifique as configurações do navegador.')
        }
        
        // Incrementar contador de tentativas
        setPermissionAttempts(prev => ({ 
          ...prev, 
          notifications: (prev.notifications || 0) + 1 
        }))
        
        const permission = await Notification.requestPermission()
        const granted = permission === 'granted'
        
        console.log('Status da permissão de notificações:', permission)
        
        if (granted) {
          console.log('✅ Permissão de notificações concedida!')
        } else {
          console.log('❌ Permissão de notificações negada')
        }
        
        if (!granted && permission === 'denied') {
          setPermissionErrors(prev => ({ 
            ...prev, 
            notifications: 'Permissão negada. Verifique as configurações do navegador.' 
          }))
          setShowTroubleshooting('notifications')
        }
        
        setPermissions(prev => ({
          ...prev,
          notifications: granted
        }))
        
        // Limpar contador de tentativas em caso de sucesso
        if (granted) {
          setPermissionAttempts(prev => ({ ...prev, notifications: 0 }))
        }
        
        return granted
      } catch (error: any) {
        console.log('❌ Erro ao solicitar permissão de notificações:', error.message)
        setPermissionErrors(prev => ({ 
          ...prev, 
          notifications: error.message || 'Erro ao solicitar permissão de notificações' 
        }))
        
        // Mostrar troubleshooting após 1 tentativa falhada
        if (attempts >= 0) {
          setShowTroubleshooting('notifications')
        }
        
        return false
      } finally {
        setPermissionLoading(null)
        // Limpar a referência da promise
        notificationRequestRef.current = null
      }
    })()

    // Armazenar a referência da promise
    notificationRequestRef.current = requestPromise
    
    return await requestPromise
  }

  const handlePermissionChange = async (permission: keyof UserPermissions, value: boolean) => {
    if (value) {
      // Solicitar permissão real do navegador
      switch (permission) {
        case 'microphone':
          const micGranted = await requestMicrophonePermission()
          if (!micGranted) return
          break
        case 'notifications':
          await requestNotificationPermission()
          break
        default:
          // Para outras permissões, apenas atualizar o estado por enquanto
          setPermissions(prev => ({
            ...prev,
            [permission]: value
          }))
      }
    } else {
      setPermissions(prev => ({
        ...prev,
        [permission]: value
      }))
      // Limpar erros quando desabilitar
      setPermissionErrors(prev => ({ ...prev, [permission]: '' }))
      setShowTroubleshooting(null)
    }
  }

  const retryPermission = async (permission: keyof UserPermissions) => {
    // Resetar contador de tentativas
    setPermissionAttempts(prev => ({ ...prev, [permission]: 0 }))
    setPermissionErrors(prev => ({ ...prev, [permission]: '' }))
    setShowTroubleshooting(null)
    
    // Tentar novamente
    await handlePermissionChange(permission, true)
  }

  const resetBrowserPermissions = () => {
    if (isClient) {
      // Instruções para resetar permissões no navegador
      const userAgent = navigator.userAgent.toLowerCase()
      let instructions = ''
      
      if (userAgent.includes('chrome')) {
        instructions = 'Chrome: Clique no ícone de cadeado/microfone na barra de endereços → Configurações do site → Redefinir permissões'
      } else if (userAgent.includes('firefox')) {
        instructions = 'Firefox: Clique no ícone de escudo na barra de endereços → Configurações → Limpar permissões'
      } else if (userAgent.includes('safari')) {
        instructions = 'Safari: Safari → Configurações → Sites → Microfone/Notificações → Remover este site'
      } else {
        instructions = 'Clique no ícone de configurações na barra de endereços e redefina as permissões do site'
      }
      
      alert(`Para redefinir as permissões:\n\n${instructions}\n\nDepois, recarregue a página e tente novamente.`)
    }
  }

  const openBrowserSettings = () => {
    if (isClient) {
      // Tentar abrir configurações do navegador (funciona apenas em alguns casos)
      try {
        window.open('chrome://settings/content/microphone', '_blank')
      } catch {
        alert('Acesse as configurações do seu navegador manualmente:\n\n1. Digite "chrome://settings/content" na barra de endereços\n2. Procure por "Microfone" e "Notificações"\n3. Remova este site da lista de bloqueados')
      }
    }
  }

  const renderTroubleshootingCard = (permission: string) => {
    if (showTroubleshooting !== permission) return null

    const isMicrophone = permission === 'microphone'
    const isNotifications = permission === 'notifications'

    return (
      <Card className="bg-amber-500/10 border-amber-500/30 mt-3">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-400 mb-2">
                Problemas com {isMicrophone ? 'microfone' : 'notificações'}?
              </h4>
              
              <div className="space-y-3 text-sm text-amber-200">
                <div>
                  <p className="font-medium mb-1">1. Verifique a barra de endereços:</p>
                  <p>Procure por um ícone de {isMicrophone ? 'microfone 🎤' : 'sino 🔔'} ou cadeado 🔒 e clique nele</p>
                </div>
                
                <div>
                  <p className="font-medium mb-1">2. Configurações do navegador:</p>
                  <p>Se a permissão foi negada permanentemente, você precisa resetá-la</p>
                </div>
                
                <div>
                  <p className="font-medium mb-1">3. Passos específicos:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Chrome: Clique no cadeado → Configurações do site → Redefinir</li>
                    <li>Firefox: Clique no escudo → Configurações → Limpar</li>
                    <li>Safari: Safari → Configurações → Sites → Remover</li>
                  </ul>
                </div>
                
                {isMicrophone && (
                  <div>
                    <p className="font-medium mb-1">4. Problemas comuns:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Outro app está usando o microfone</li>
                      <li>Microfone desconectado ou com defeito</li>
                      <li>Configurações de privacidade do sistema</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetBrowserPermissions}
                  className="h-7 text-xs bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Como resetar
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="h-7 text-xs bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Recarregar página
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTroubleshooting(null)}
                  className="h-7 text-xs bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(permissions)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-16 h-16 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Mic className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">Voice Master</h2>
        <p className="text-xl text-gray-300">
          Seu assistente pessoal inteligente
        </p>
        <p className="text-gray-400 max-w-md mx-auto">
          Controle seu celular com comandos de voz. Diga "Neo" ou "Lia" e deixe a mágica acontecer!
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-white">Exemplos do que você pode fazer:</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p>"Neo, que horas são?"</p>
          <p>"Lia, toca minha playlist favorita"</p>
          <p>"Neo, manda mensagem pro João"</p>
        </div>
      </div>
    </div>
  )

  const renderVoiceSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Escolha sua voz</h2>
        <p className="text-gray-400">Selecione quem será seu assistente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-300 ${
            selectedVoice === 'neo' 
              ? 'ring-2 ring-blue-500 bg-blue-500/10' 
              : 'bg-white/5 hover:bg-white/10'
          }`}
          onClick={() => setSelectedVoice('neo')}
        >
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">N</span>
            </div>
            <CardTitle className="text-white">Neo</CardTitle>
            <CardDescription className="text-gray-400">
              Voz masculina • Profissional e direto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-300 italic">
                "Sim, o que você precisa?"
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-300 ${
            selectedVoice === 'lia' 
              ? 'ring-2 ring-purple-500 bg-purple-500/10' 
              : 'bg-white/5 hover:bg-white/10'
          }`}
          onClick={() => setSelectedVoice('lia')}
        >
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
            <CardTitle className="text-white">Lia</CardTitle>
            <CardDescription className="text-gray-400">
              Voz feminina • Amigável e calorosa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-300 italic">
                "Oi! Como posso ajudar?"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderPermissionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Permissões</h2>
        <p className="text-gray-400">Configure o que o Voice Master pode fazer</p>
      </div>

      <div className="space-y-4">
        {Object.entries(PERMISSION_DESCRIPTIONS).map(([key, info]) => {
          const Icon = PERMISSION_ICONS[key as keyof UserPermissions]
          const isEnabled = permissions[key as keyof UserPermissions]
          const isLoading = permissionLoading === key
          const error = permissionErrors[key]
          const attempts = permissionAttempts[key] || 0
          
          return (
            <div key={key}>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                        <Icon className={`w-5 h-5 ${isEnabled ? 'text-green-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={key} className="text-white font-medium">
                            {info.title}
                          </Label>
                          {info.required && (
                            <Badge variant="secondary" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                          {isEnabled && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {info.description}
                        </p>
                        {isLoading && (
                          <p className="text-xs text-blue-400 mt-1 flex items-center space-x-1">
                            <span className="animate-pulse">●</span>
                            <span>Solicitando permissão...</span>
                          </p>
                        )}
                        {error && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                            <div className="flex items-start space-x-2">
                              <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span>{error}</span>
                                {attempts < 5 && (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => retryPermission(key as keyof UserPermissions)}
                                      className="h-6 text-xs bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Tentar novamente
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowTroubleshooting(key)}
                                      className="h-6 text-xs bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                                    >
                                      <HelpCircle className="w-3 h-3 mr-1" />
                                      Ajuda
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={isEnabled}
                      onCheckedChange={(value) => handlePermissionChange(key as keyof UserPermissions, value)}
                      disabled={isLoading || (error && attempts >= 5)}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {renderTroubleshootingCard(key)}
            </div>
          )
        })}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-400">Sobre as permissões</h3>
            <p className="text-sm text-amber-200 mt-1">
              Você pode alterar essas configurações a qualquer momento nas configurações do app. 
              Algumas funcionalidades só estarão disponíveis com as permissões adequadas.
            </p>
          </div>
        </div>
      </div>

      {!permissions.microphone && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-400">Permissão do microfone necessária</h3>
              <p className="text-sm text-red-200 mt-1">
                O Voice Master precisa acessar seu microfone para funcionar. Clique no switch acima para permitir.
              </p>
              <p className="text-xs text-red-300 mt-2">
                💡 Se aparecer um bloqueio, clique no ícone do microfone na barra de endereços do navegador.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informações técnicas para debug */}
      {isClient && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <details className="text-xs text-blue-200">
            <summary className="cursor-pointer font-medium">Informações técnicas</summary>
            <div className="mt-2 space-y-1">
              <p>Protocolo: {window.location.protocol}</p>
              <p>Host: {window.location.hostname}</p>
              <p>User Agent: {navigator.userAgent.split(' ')[0]}</p>
              <p>Suporte MediaDevices: {navigator.mediaDevices ? '✅' : '❌'}</p>
              <p>Suporte getUserMedia: {navigator.mediaDevices?.getUserMedia ? '✅' : '❌'}</p>
              <p>Suporte Notifications: {'Notification' in window ? '✅' : '❌'}</p>
              <p>Status Notification: {Notification.permission}</p>
              <p>Tentativas Microfone: {permissionAttempts.microphone || 0}/5</p>
              <p>Tentativas Notificações: {permissionAttempts.notifications || 0}/5</p>
            </div>
          </details>
        </div>
      )}
    </div>
  )

  const renderTrialStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Teste Grátis Ativado!</h2>
        <p className="text-gray-300">
          Você tem 24 horas para experimentar todas as funcionalidades do Voice Master
        </p>
      </div>

      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-white">O que você pode fazer no teste:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Comandos de voz básicos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Reconhecimento offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Respostas inteligentes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Controle básico de apps</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          Após o período de teste, você poderá escolher entre nossos planos para continuar usando o Voice Master.
        </p>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep()
      case 1: return renderVoiceSelection()
      case 2: return renderPermissionsStep()
      case 3: return renderTrialStep()
      default: return renderWelcomeStep()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header com progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-white">
              {ONBOARDING_STEPS[currentStep].title}
            </h1>
            <span className="text-sm text-gray-400">
              {currentStep + 1} de {ONBOARDING_STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Conteúdo do step atual */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Botões de navegação */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Voltar
          </Button>

          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={currentStep === 2 && !permissions.microphone}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Começar' : 'Próximo'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}