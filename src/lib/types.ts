// Voice Master - Tipos principais
export type VoiceType = 'neo' | 'lia'
export type Language = 'pt-BR' | 'en-US' | 'es-ES'
export type SubscriptionPlan = 'trial' | 'basic' | 'complete' | 'international-basic' | 'international-complete'

export interface VoiceSettings {
  voice: VoiceType
  language: Language
  wakeWordSensitivity: number // 0.1 a 1.0
  voiceSpeed: number // 0.5 a 2.0
  volume: number // 0 a 1
}

export interface UserPermissions {
  microphone: boolean
  accessibility: boolean
  notifications: boolean
  contacts: boolean
  files: boolean
  streaming: boolean
  location: boolean
}

export interface SubscriptionStatus {
  plan: SubscriptionPlan
  isActive: boolean
  expiresAt: Date | null
  trialStartedAt: Date | null
  trialEndsAt: Date | null
}

export interface CommandHistory {
  id: string
  command: string
  response: string
  timestamp: Date
  wasSuccessful: boolean
  executionTime: number
}

export interface UserProfile {
  id: string
  name: string
  voiceSettings: VoiceSettings
  permissions: UserPermissions
  subscription: SubscriptionStatus
  preferences: {
    privateMode: boolean
    confirmSensitiveActions: boolean
    keepCommandHistory: boolean
    offlineMode: boolean
  }
}

export interface AppState {
  isListening: boolean
  isProcessing: boolean
  currentMode: 'idle' | 'listening' | 'processing' | 'responding'
  lastCommand: string | null
  connectionStatus: 'online' | 'offline'
}