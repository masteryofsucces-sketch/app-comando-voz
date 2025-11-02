'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar'
import { 
  Mic, 
  MicOff, 
  Settings, 
  History, 
  Crown, 
  Zap,
  Volume2,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  MessageCircle,
  User
} from 'lucide-react'
import Onboarding from '@/components/Onboarding'
import EmailCapture from '@/components/EmailCapture'
import { UserPermissions, VoiceType, AppState } from '@/lib/types'
import { VOICE_PERSONALITIES } from '@/lib/constants'
import { aiAgent, simulateVoiceRecognition } from '@/lib/ai-agent'
import { useAuth } from '@/lib/auth'

export default function VoiceMasterApp() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showEmailCapture, setShowEmailCapture] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('neo')
  const [permissions, setPermissions] = useState<UserPermissions>({
    microphone: false,
    accessibility: false,
    notifications: false,
    contacts: false,
    files: false,
    streaming: false,
    location: false
  })
  const [appState, setAppState] = useState<AppState>({
    isListening: false,
    isProcessing: false,
    currentMode: 'idle',
    lastCommand: null,
    connectionStatus: 'online'
  })
  const [trialTimeLeft, setTrialTimeLeft] = useState(0)
  const [currentResponse, setCurrentResponse] = useState<string>('')
  const [commandHistory, setCommandHistory] = useState<Array<{command: string, response: string, timestamp: Date}>>([])
  const [userEmail, setUserEmail] = useState<string>('')
  
  const { getCurrentUser, startTrial, isTrialActive, getTrialTimeLeft } = useAuth()
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Verificar usuário existente ao carregar
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setUserEmail(user.email)
      setShowEmailCapture(false)
      
      if (isTrialActive()) {
        setTrialTimeLeft(getTrialTimeLeft())
        setShowOnboarding(true)
      } else {
        // Teste expirado
        setTrialTimeLeft(0)
      }
    }
  }, [])

  // Timer do teste grátis
  useEffect(() => {
    if (!showOnboarding && !showEmailCapture && trialTimeLeft > 0) {
      const timer = setInterval(() => {
        const timeLeft = getTrialTimeLeft()
        setTrialTimeLeft(timeLeft)
        
        if (timeLeft <= 0) {
          // Teste expirado
          alert('Seu teste grátis expirou! Assine um plano para continuar usando o Voice Master.')
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showOnboarding, showEmailCapture, trialTimeLeft])

  const handleEmailComplete = async (email: string, name?: string) => {
    try {
      const user = await startTrial(email, name)
      setUserEmail(user.email)
      setTrialTimeLeft(getTrialTimeLeft())
      setShowEmailCapture(false)
      setShowOnboarding(true)
    } catch (error) {
      console.error('Erro ao iniciar teste:', error)
      alert('Erro ao iniciar teste. Tente novamente.')
    }
  }

  const handleOnboardingComplete = (userPermissions: UserPermissions) => {
    setPermissions(userPermissions)
    setShowOnboarding(false)
  }

  const toggleListening = async () => {
    if (!permissions.microphone) {
      alert('Permissão de microfone necessária!')
      return
    }

    if (appState.isListening) {
      // Parar de escutar
      setAppState(prev => ({
        ...prev,
        isListening: false,
        currentMode: 'idle'
      }))
      return
    }

    // Começar a escutar
    setAppState(prev => ({
      ...prev,
      isListening: true,
      currentMode: 'listening'
    }))

    try {
      // Simular reconhecimento de voz (em produção usaria Web Speech API)
      const command = await simulateVoiceRecognition()
      
      setAppState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: true,
        currentMode: 'processing',
        lastCommand: command
      }))

      // Processar comando com IA
      const response = await aiAgent.processCommand({
        text: command,
        timestamp: new Date(),
        voice: selectedVoice
      })

      setCurrentResponse(response.text)
      
      // Adicionar ao histórico
      const historyEntry = {
        command,
        response: response.text,
        timestamp: new Date()
      }
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]) // Manter apenas 10 últimos

      // Falar resposta se solicitado
      if (response.shouldSpeak) {
        speakResponse(response.text)
      }

      setAppState(prev => ({
        ...prev,
        isProcessing: false,
        currentMode: 'idle'
      }))

    } catch (error) {
      console.error('Erro ao processar comando:', error)
      setAppState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        currentMode: 'idle'
      }))
      alert('Erro ao processar comando. Tente novamente.')
    }
  }

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Parar fala anterior se existir
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      utterance.rate = 0.9
      utterance.pitch = selectedVoice === 'neo' ? 0.8 : 1.2
      
      speechSynthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const testVoice = async () => {
    const greeting = await aiAgent.testVoice(selectedVoice)
    setCurrentResponse(greeting)
    speakResponse(greeting)
  }

  const switchVoice = () => {
    const newVoice = selectedVoice === 'neo' ? 'lia' : 'neo'
    setSelectedVoice(newVoice)
    
    // Parar fala atual
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    // Testar nova voz automaticamente
    setTimeout(() => {
      testVoice()
    }, 500)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Mostrar captura de email se necessário
  if (showEmailCapture) {
    return <EmailCapture onComplete={handleEmailComplete} />
  }

  // Mostrar onboarding se necessário
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  const voiceConfig = VOICE_PERSONALITIES[selectedVoice]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${voiceConfig.color} flex items-center justify-center`}>
              <span className="text-xl font-bold text-white">
                {selectedVoice === 'neo' ? 'N' : 'L'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Voice Master</h1>
              <p className="text-gray-400">Assistente {voiceConfig.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status de conexão */}
            <div className="flex items-center space-x-1">
              {appState.connectionStatus === 'online' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-400">
                {appState.connectionStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Email do usuário */}
            <div className="flex items-center space-x-1 bg-white/10 rounded-full px-3 py-1">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-300">{userEmail}</span>
            </div>

            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Trial Status */}
        {trialTimeLeft > 0 ? (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-amber-400">Teste Grátis Ativo</h3>
                    <p className="text-sm text-amber-200">
                      Tempo restante: {formatTime(trialTimeLeft)}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                  Assinar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-400">Teste Grátis Expirado</h3>
                    <p className="text-sm text-red-200">
                      Assine um plano para continuar usando
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                  Assinar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Control */}
        <div className="text-center space-y-6">
          {/* Voice Avatar */}
          <div className="relative">
            <div 
              className={`w-48 h-48 mx-auto rounded-full bg-gradient-to-br ${voiceConfig.color} flex items-center justify-center transition-all duration-300 cursor-pointer ${ 
                appState.isListening ? 'scale-110 shadow-2xl shadow-purple-500/50' : 'scale-100'
              }`}
              onClick={toggleListening}
            >
              <span className="text-6xl font-bold text-white">
                {selectedVoice === 'neo' ? 'N' : 'L'}
              </span>
            </div>

            {/* Status indicators */}
            {appState.isListening && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Escutando...</span>
                </div>
              </div>
            )}

            {appState.isProcessing && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              </div>
            )}
          </div>

          {/* Voice Name and Status */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">{voiceConfig.name}</h2>
            <p className="text-gray-400">{voiceConfig.personality}</p>
            {appState.lastCommand && (
              <p className="text-sm text-gray-500">
                Último comando: "{appState.lastCommand}"
              </p>
            )}
            {currentResponse && (
              <div className="bg-white/10 rounded-lg p-3 max-w-md mx-auto">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white text-left">{currentResponse}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Action Button */}
          <Button
            onClick={toggleListening}
            size="lg"
            disabled={trialTimeLeft <= 0}
            className={`w-64 h-16 text-lg font-semibold transition-all duration-300 ${
              appState.isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : trialTimeLeft <= 0
                ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            {appState.isListening ? (
              <>
                <MicOff className="w-6 h-6 mr-2" />
                Parar de Escutar
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-2" />
                {trialTimeLeft <= 0 ? 'Teste Expirado' : 'Começar a Escutar'}
              </>
            )}
          </Button>

          {/* Quick Actions */}
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testVoice}
              disabled={trialTimeLeft <= 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Testar Voz
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={switchVoice}
              disabled={trialTimeLeft <= 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Trocar para {selectedVoice === 'neo' ? 'Lia' : 'Neo'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Comandos Hoje</h3>
              <p className="text-2xl font-bold text-yellow-400">{commandHistory.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <History className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Último Comando</h3>
              <p className="text-sm font-bold text-blue-400">
                {appState.lastCommand ? appState.lastCommand.substring(0, 20) + '...' : 'Nenhum'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Status</h3>
              <p className="text-sm font-bold text-purple-400">
                {trialTimeLeft > 0 ? 'Trial Ativo' : 'Expirado'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Comandos</CardTitle>
              <CardDescription className="text-gray-400">
                Seus últimos comandos e respostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {commandHistory.map((entry, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-1">
                          <strong>Você:</strong> {entry.command}
                        </p>
                        <p className="text-sm text-blue-300">
                          <strong>{voiceConfig.name}:</strong> {entry.response}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {entry.timestamp.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Example Commands */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Comandos de Exemplo</CardTitle>
            <CardDescription className="text-gray-400">
              Experimente estes comandos com {voiceConfig.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                `${voiceConfig.name}, que horas são?`,
                `${voiceConfig.name}, que dia é hoje?`,
                `${voiceConfig.name}, toca uma música`,
                `${voiceConfig.name}, como está o tempo?`,
                `${voiceConfig.name}, abre o WhatsApp`,
                `${voiceConfig.name}, ativa o modo silencioso`
              ].map((command, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors">
                  <p className="text-sm text-gray-300">"{command}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}