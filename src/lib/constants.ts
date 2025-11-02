// Voice Master - Constantes e configurações
import { Language, VoiceType } from './types'

export const VOICE_MASTER_CONFIG = {
  APP_NAME: 'Voice Master',
  VERSION: '1.0.0',
  TRIAL_DURATION_HOURS: 24,
  WAKE_WORDS: ['neo', 'lia'],
  MAX_COMMAND_HISTORY: 1000,
  DEFAULT_WAKE_SENSITIVITY: 0.7,
  DEFAULT_VOICE_SPEED: 1.0,
  DEFAULT_VOLUME: 0.8,
} as const

export const SUBSCRIPTION_PLANS = {
  trial: {
    name: 'Teste Grátis',
    duration: '24 horas',
    price: 'Grátis',
    features: ['Comandos básicos', 'Reconhecimento de voz', 'Respostas simples']
  },
  basic: {
    name: 'Plano Voz/Chat',
    price: 'R$ 29,99/mês',
    features: [
      'Modo online e offline',
      'Conversas naturais',
      'Informações e consultas',
      'Sem controle de apps'
    ]
  },
  complete: {
    name: 'Plano Completo',
    price: 'R$ 49,99/mês',
    features: [
      'Todas as funcionalidades',
      'Controle total de apps',
      'Envio de mensagens',
      'Controle de chamadas',
      'Automação completa'
    ]
  },
  'international-basic': {
    name: 'Basic Plan',
    price: '$10/month',
    features: [
      'Online and offline mode',
      'Natural conversations',
      'Information and queries',
      'No app control'
    ]
  },
  'international-complete': {
    name: 'Complete Plan',
    price: '$20/month',
    features: [
      'All features',
      'Full app control',
      'Send messages',
      'Call control',
      'Complete automation'
    ]
  }
} as const

export const SUPPORTED_LANGUAGES: Record<Language, { name: string; flag: string; voices: VoiceType[] }> = {
  'pt-BR': {
    name: 'Português (Brasil)',
    flag: '🇧🇷',
    voices: ['neo', 'lia']
  },
  'en-US': {
    name: 'English (US)',
    flag: '🇺🇸',
    voices: ['neo', 'lia']
  },
  'es-ES': {
    name: 'Español',
    flag: '🇪🇸',
    voices: ['neo', 'lia']
  }
}

export const VOICE_PERSONALITIES = {
  neo: {
    name: 'Neo',
    gender: 'masculine',
    personality: 'Profissional e direto',
    greeting: 'Sim, o que você precisa?',
    color: 'from-blue-500 to-cyan-500'
  },
  lia: {
    name: 'Lia',
    gender: 'feminine', 
    personality: 'Amigável e calorosa',
    greeting: 'Oi! Como posso ajudar?',
    color: 'from-purple-500 to-pink-500'
  }
} as const

export const PERMISSION_DESCRIPTIONS = {
  microphone: {
    title: 'Microfone',
    description: 'Necessário para ouvir seus comandos de voz',
    required: true
  },
  accessibility: {
    title: 'Acessibilidade',
    description: 'Permite controlar outros apps e executar ações automatizadas',
    required: false
  },
  notifications: {
    title: 'Notificações',
    description: 'Para avisar sobre comandos executados e lembretes',
    required: false
  },
  contacts: {
    title: 'Contatos',
    description: 'Para ligar e enviar mensagens usando nomes dos contatos',
    required: false
  },
  files: {
    title: 'Arquivos',
    description: 'Para acessar e reproduzir músicas e arquivos locais',
    required: false
  },
  streaming: {
    title: 'Streaming',
    description: 'Para controlar apps de música e vídeo (Spotify, YouTube, etc.)',
    required: false
  },
  location: {
    title: 'Localização',
    description: 'Para comandos baseados em localização e navegação',
    required: false
  }
} as const

export const EXAMPLE_COMMANDS = [
  'Neo, que horas são?',
  'Lia, que dia é hoje?',
  'Neo, entra no YouTube e toca o vídeo X',
  'Neo, abre o WhatsApp e manda mensagem para João',
  'Lia, toca minha playlist de treino',
  'Neo, ativa o modo silencioso',
  'Neo, lê as notificações de hoje'
] as const