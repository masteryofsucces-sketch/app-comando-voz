// Voice Master - Sistema de autenticação e email
'use client'

export interface UserAuth {
  email: string
  hasUsedTrial: boolean
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  isSubscribed: boolean
}

export interface EmailData {
  email: string
  name?: string
  action: 'trial_started' | 'trial_ending' | 'trial_expired' | 'subscription_reminder'
}

class AuthService {
  private readonly STORAGE_KEY = 'voice_master_user'
  
  // Verificar se usuário já existe no localStorage
  getCurrentUser(): UserAuth | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null
      
      const user = JSON.parse(stored)
      // Converter strings de data de volta para Date objects
      if (user.trialStartedAt) user.trialStartedAt = new Date(user.trialStartedAt)
      if (user.trialEndsAt) user.trialEndsAt = new Date(user.trialEndsAt)
      
      return user
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      return null
    }
  }
  
  // Salvar usuário no localStorage
  saveUser(user: UserAuth): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
    }
  }
  
  // Iniciar teste grátis com email
  async startTrial(email: string, name?: string): Promise<UserAuth> {
    const now = new Date()
    const trialEnd = new Date(now.getTime() + (24 * 60 * 60 * 1000)) // 24 horas
    
    const user: UserAuth = {
      email,
      hasUsedTrial: true,
      trialStartedAt: now,
      trialEndsAt: trialEnd,
      isSubscribed: false
    }
    
    this.saveUser(user)
    
    // Enviar email de boas-vindas
    await this.sendEmail({
      email,
      name,
      action: 'trial_started'
    })
    
    return user
  }
  
  // Verificar se usuário pode usar teste grátis
  canUseTrial(email: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return true // Novo usuário pode usar
    
    return user.email !== email || !user.hasUsedTrial
  }
  
  // Verificar se teste ainda está ativo
  isTrialActive(): boolean {
    const user = this.getCurrentUser()
    if (!user || !user.trialEndsAt) return false
    
    return new Date() < user.trialEndsAt
  }
  
  // Obter tempo restante do teste em segundos
  getTrialTimeLeft(): number {
    const user = this.getCurrentUser()
    if (!user || !user.trialEndsAt) return 0
    
    const now = new Date()
    const timeLeft = Math.max(0, user.trialEndsAt.getTime() - now.getTime())
    return Math.floor(timeLeft / 1000)
  }
  
  // Enviar email (simulado - em produção usaria serviço real)
  private async sendEmail(data: EmailData): Promise<void> {
    try {
      // Em produção, isso seria uma chamada para API de email (SendGrid, etc.)
      console.log('📧 Email enviado:', data)
      
      // Simular envio de email
      const emailContent = this.generateEmailContent(data)
      console.log('Conteúdo do email:', emailContent)
      
      // Aqui você integraria com serviço de email real
      // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(data) })
      
    } catch (error) {
      console.error('Erro ao enviar email:', error)
    }
  }
  
  private generateEmailContent(data: EmailData): string {
    const { email, name, action } = data
    const userName = name || email.split('@')[0]
    
    switch (action) {
      case 'trial_started':
        return `
Olá ${userName}!

Bem-vindo ao Voice Master! 🎉

Seu teste grátis de 24 horas começou agora. Você pode experimentar:
• Comandos de voz com Neo e Lia
• Reconhecimento inteligente
• Controle básico de aplicativos

Aproveite ao máximo seu teste!

Equipe Voice Master
        `
      
      case 'trial_ending':
        return `
Olá ${userName}!

Seu teste grátis do Voice Master expira em breve! ⏰

Para continuar usando todas as funcionalidades, considere assinar um de nossos planos:
• Plano Voz/Chat: R$ 29,99/mês
• Plano Completo: R$ 49,99/mês

Não perca suas configurações e histórico!

Equipe Voice Master
        `
      
      case 'trial_expired':
        return `
Olá ${userName}!

Seu teste grátis do Voice Master expirou. 😔

Mas não se preocupe! Você ainda pode assinar e continuar de onde parou:
• Todas as suas configurações serão mantidas
• Histórico de comandos preservado
• Acesso imediato a todas as funcionalidades

Que tal continuar conosco?

Equipe Voice Master
        `
      
      default:
        return `Olá ${userName}! Obrigado por usar o Voice Master.`
    }
  }
  
  // Limpar dados do usuário (logout)
  clearUser(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }
  
  // Verificar se email é válido
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Instância singleton
export const authService = new AuthService()

// Hook para usar autenticação em componentes React
export const useAuth = () => {
  const getCurrentUser = () => authService.getCurrentUser()
  const startTrial = (email: string, name?: string) => authService.startTrial(email, name)
  const canUseTrial = (email: string) => authService.canUseTrial(email)
  const isTrialActive = () => authService.isTrialActive()
  const getTrialTimeLeft = () => authService.getTrialTimeLeft()
  const clearUser = () => authService.clearUser()
  const isValidEmail = (email: string) => authService.isValidEmail(email)
  
  return {
    getCurrentUser,
    startTrial,
    canUseTrial,
    isTrialActive,
    getTrialTimeLeft,
    clearUser,
    isValidEmail
  }
}