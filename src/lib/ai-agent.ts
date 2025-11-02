// Voice Master - Agente de IA para processar comandos de voz
import OpenAI from 'openai'

export interface AIResponse {
  text: string
  action?: string
  confidence: number
  shouldSpeak: boolean
}

export interface VoiceCommand {
  text: string
  timestamp: Date
  voice: 'neo' | 'lia'
}

class VoiceAIAgent {
  private openai: OpenAI | null = null
  private isInitialized = false

  constructor() {
    // Inicializar OpenAI apenas se a chave estiver disponível
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })
      this.isInitialized = true
    }
  }

  async processCommand(command: VoiceCommand): Promise<AIResponse> {
    try {
      // Limpar e normalizar o comando
      const cleanCommand = this.cleanCommand(command.text, command.voice)
      
      // Se não tiver IA configurada, usar respostas padrão
      if (!this.isInitialized || !this.openai) {
        return this.getDefaultResponse(cleanCommand, command.voice)
      }

      // Processar com IA
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(command.voice)
          },
          {
            role: 'user',
            content: cleanCommand
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })

      const aiText = response.choices[0]?.message?.content || 'Desculpe, não entendi.'
      
      return {
        text: aiText,
        action: this.extractAction(cleanCommand),
        confidence: 0.9,
        shouldSpeak: true
      }
    } catch (error) {
      console.error('Erro ao processar comando com IA:', error)
      return this.getDefaultResponse(command.text, command.voice)
    }
  }

  private cleanCommand(text: string, voice: 'neo' | 'lia'): string {
    // Remover wake words do início
    const wakeWords = ['neo', 'lia', 'hey neo', 'hey lia', 'oi neo', 'oi lia']
    let cleaned = text.toLowerCase().trim()
    
    for (const wake of wakeWords) {
      if (cleaned.startsWith(wake)) {
        cleaned = cleaned.substring(wake.length).trim()
        break
      }
    }
    
    // Remover pontuação desnecessária
    cleaned = cleaned.replace(/[,\.!?]+$/, '')
    
    return cleaned || text
  }

  private getSystemPrompt(voice: 'neo' | 'lia'): string {
    const personality = voice === 'neo' 
      ? 'Você é Neo, um assistente profissional e direto. Seja conciso e objetivo nas respostas.'
      : 'Você é Lia, uma assistente amigável e calorosa. Seja acolhedora e prestativa nas respostas.'
    
    return `${personality}
    
Você é um assistente de voz para celular. Responda de forma natural e conversacional.
Para comandos que requerem ação no dispositivo, seja claro sobre o que você faria.
Mantenha as respostas curtas (máximo 2 frases).
Responda sempre em português brasileiro.
Se não souber algo, seja honesto mas ofereça alternativas.`
  }

  private getDefaultResponse(command: string, voice: 'neo' | 'lia'): AIResponse {
    const lowerCommand = command.toLowerCase()
    
    // Respostas baseadas em palavras-chave
    if (lowerCommand.includes('hora') || lowerCommand.includes('tempo')) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      return {
        text: voice === 'neo' 
          ? `São ${timeStr}.` 
          : `Agora são ${timeStr}!`,
        confidence: 1.0,
        shouldSpeak: true
      }
    }
    
    if (lowerCommand.includes('dia') || lowerCommand.includes('data')) {
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      return {
        text: voice === 'neo' 
          ? `Hoje é ${dateStr}.` 
          : `Hoje é ${dateStr}!`,
        confidence: 1.0,
        shouldSpeak: true
      }
    }
    
    if (lowerCommand.includes('música') || lowerCommand.includes('toca')) {
      return {
        text: voice === 'neo' 
          ? 'Abrindo o aplicativo de música.' 
          : 'Vou tocar uma música para você!',
        action: 'open_music_app',
        confidence: 0.8,
        shouldSpeak: true
      }
    }
    
    if (lowerCommand.includes('whatsapp') || lowerCommand.includes('mensagem')) {
      return {
        text: voice === 'neo' 
          ? 'Abrindo WhatsApp.' 
          : 'Vou abrir o WhatsApp para você!',
        action: 'open_whatsapp',
        confidence: 0.8,
        shouldSpeak: true
      }
    }
    
    if (lowerCommand.includes('silencioso') || lowerCommand.includes('silêncio')) {
      return {
        text: voice === 'neo' 
          ? 'Modo silencioso ativado.' 
          : 'Ativei o modo silencioso!',
        action: 'toggle_silent_mode',
        confidence: 0.9,
        shouldSpeak: true
      }
    }
    
    // Resposta padrão
    return {
      text: voice === 'neo' 
        ? 'Desculpe, não entendi esse comando.' 
        : 'Desculpe, não consegui entender. Pode repetir?',
      confidence: 0.3,
      shouldSpeak: true
    }
  }

  private extractAction(command: string): string | undefined {
    const lowerCommand = command.toLowerCase()
    
    if (lowerCommand.includes('música') || lowerCommand.includes('toca')) {
      return 'open_music_app'
    }
    if (lowerCommand.includes('whatsapp') || lowerCommand.includes('mensagem')) {
      return 'open_whatsapp'
    }
    if (lowerCommand.includes('silencioso')) {
      return 'toggle_silent_mode'
    }
    if (lowerCommand.includes('youtube')) {
      return 'open_youtube'
    }
    if (lowerCommand.includes('ligar') || lowerCommand.includes('chamar')) {
      return 'make_call'
    }
    
    return undefined
  }

  // Método para testar a voz selecionada
  async testVoice(voice: 'neo' | 'lia'): Promise<string> {
    const greetings = {
      neo: [
        'Olá, sou o Neo. Estou pronto para ajudar.',
        'Neo aqui. O que você precisa?',
        'Assistente Neo ativo e funcionando.'
      ],
      lia: [
        'Oi! Eu sou a Lia, sua assistente virtual!',
        'Olá! Lia aqui, pronta para te ajudar!',
        'Oi! Sou a Lia, como posso ajudar você hoje?'
      ]
    }
    
    const messages = greetings[voice]
    return messages[Math.floor(Math.random() * messages.length)]
  }
}

// Instância singleton
export const aiAgent = new VoiceAIAgent()

// Função para simular reconhecimento de voz (para desenvolvimento)
export const simulateVoiceRecognition = (): Promise<string> => {
  return new Promise((resolve) => {
    // Simular delay de reconhecimento
    setTimeout(() => {
      const examples = [
        'Neo, que horas são?',
        'Lia, toca uma música',
        'Neo, abre o WhatsApp',
        'Lia, que dia é hoje?',
        'Neo, ativa o modo silencioso'
      ]
      const randomCommand = examples[Math.floor(Math.random() * examples.length)]
      resolve(randomCommand)
    }, 2000)
  })
}