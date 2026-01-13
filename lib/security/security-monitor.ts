import { SecurityUtils } from './security-utils'

/**
 * Security monitoring hooks and utilities
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor
  private monitoringEnabled: boolean = true
  private alertThresholds = {
    failedAttempts: 5,
    suspiciousActivity: 20,
    rateLimitExceeded: 3,
    tokenExpiration: 10
  }

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  /**
   * Enable or disable security monitoring
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled
    SecurityUtils.logSecurityEvent('auth_success', {
      action: 'security_monitoring_toggle',
      enabled
    })
  }

  /**
   * Monitor authentication events
   */
  monitorAuthEvent(
    event: 'signin' | 'signup' | 'signout' | 'password_reset',
    success: boolean,
    details: Record<string, any> = {}
  ): void {
    if (!this.monitoringEnabled) return

    const eventType = success ? 'auth_success' : 'auth_failure'
    
    SecurityUtils.logSecurityEvent(eventType, {
      action: event,
      ...details
    })

    // Check for patterns that might indicate security issues
    if (!success) {
      this.checkForSecurityPatterns(event, details)
    }
  }

  /**
   * Monitor session events
   */
  monitorSessionEvent(
    event: 'created' | 'expired' | 'invalidated' | 'extended',
    details: Record<string, any> = {}
  ): void {
    if (!this.monitoringEnabled) return

    SecurityUtils.logSecurityEvent('auth_success', {
      action: `session_${event}`,
      ...details
    })

    if (event === 'expired') {
      this.handleTokenExpiration(details)
    }
  }

  /**
   * Monitor rate limiting events
   */
  monitorRateLimitEvent(
    action: string,
    exceeded: boolean,
    details: Record<string, any> = {}
  ): void {
    if (!this.monitoringEnabled) return

    if (exceeded) {
      SecurityUtils.logSecurityEvent('rate_limit_exceeded', {
        action,
        ...details
      })
      
      this.checkRateLimitPatterns(action, details)
    }
  }

  /**
   * Monitor password reset events
   */
  monitorPasswordResetEvent(
    stage: 'request' | 'validate' | 'complete',
    success: boolean,
    details: Record<string, any> = {}
  ): void {
    if (!this.monitoringEnabled) return

    const eventType = success ? 'password_reset_success' : 'password_reset_failure'
    
    SecurityUtils.logSecurityEvent(eventType, {
      action: `password_reset_${stage}`,
      ...details
    })

    if (!success && stage === 'validate') {
      this.handleTokenExpiration(details)
    }
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard(): {
    recentEvents: any[]
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    activeThreats: string[]
    recommendations: string[]
  } {
    try {
      const criticalEvents = JSON.parse(localStorage.getItem('critical_security_events') || '[]')
      const recentEvents = criticalEvents.slice(-20) // Last 20 events
      
      // Calculate threat level based on recent events
      const threatLevel = this.calculateThreatLevel(recentEvents)
      
      // Identify active threats
      const activeThreats = this.identifyActiveThreats(recentEvents)
      
      // Generate security recommendations
      const recommendations = this.generateRecommendations(recentEvents, activeThreats)
      
      return {
        recentEvents,
        threatLevel,
        activeThreats,
        recommendations
      }
    } catch (error) {
      console.error('Failed to get security dashboard:', error)
      return {
        recentEvents: [],
        threatLevel: 'low',
        activeThreats: [],
        recommendations: ['Enable security monitoring']
      }
    }
  }

  /**
   * Check for security patterns that might indicate threats
   */
  private checkForSecurityPatterns(event: string, details: Record<string, any>): void {
    const now = Date.now()
    const windowMs = 300000 // 5 minutes
    
    try {
      // Get recent failed attempts
      const recentEvents = JSON.parse(localStorage.getItem('critical_security_events') || '[]')
      const recentFailures = recentEvents.filter((e: any) => 
        e.event.includes('failure') && 
        (now - new Date(e.timestamp).getTime()) < windowMs
      )
      
      // Check for multiple failures from same source
      if (recentFailures.length >= this.alertThresholds.failedAttempts) {
        SecurityUtils.logSecurityEvent('multiple_failed_attempts', {
          event,
          failureCount: recentFailures.length,
          timeWindow: windowMs,
          ...details
        })
      }
      
      // Check for suspicious patterns
      if (SecurityUtils.detectSuspiciousActivity(details.userId, event)) {
        SecurityUtils.logSecurityEvent('suspicious_activity', {
          event,
          pattern: 'rapid_repeated_attempts',
          ...details
        })
      }
    } catch (error) {
      console.error('Failed to check security patterns:', error)
    }
  }

  /**
   * Handle token expiration events
   */
  private handleTokenExpiration(details: Record<string, any>): void {
    SecurityUtils.logSecurityEvent('token_expired', {
      action: 'token_expiration_detected',
      ...details
    })
    
    // Check if there are too many token expirations (might indicate attack)
    const key = 'token_expiration_count'
    const stored = localStorage.getItem(key)
    const count = stored ? parseInt(stored) + 1 : 1
    
    localStorage.setItem(key, count.toString())
    
    if (count >= this.alertThresholds.tokenExpiration) {
      SecurityUtils.logSecurityEvent('suspicious_activity', {
        action: 'excessive_token_expirations',
        count,
        threshold: this.alertThresholds.tokenExpiration
      })
    }
    
    // Reset counter after 1 hour
    setTimeout(() => {
      localStorage.removeItem(key)
    }, 3600000)
  }

  /**
   * Check rate limit patterns for potential attacks
   */
  private checkRateLimitPatterns(action: string, details: Record<string, any>): void {
    const key = `rate_limit_pattern_${action}`
    const stored = localStorage.getItem(key)
    const data = stored ? JSON.parse(stored) : { count: 0, firstOccurrence: Date.now() }
    
    data.count += 1
    
    // If rate limiting is being hit frequently, it might be an attack
    if (data.count >= this.alertThresholds.rateLimitExceeded) {
      SecurityUtils.logSecurityEvent('suspicious_activity', {
        action: 'repeated_rate_limit_exceeded',
        rateLimitAction: action,
        count: data.count,
        duration: Date.now() - data.firstOccurrence,
        ...details
      })
    }
    
    localStorage.setItem(key, JSON.stringify(data))
    
    // Reset counter after 1 hour
    setTimeout(() => {
      localStorage.removeItem(key)
    }, 3600000)
  }

  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(recentEvents: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (recentEvents.length === 0) return 'low'
    
    const criticalEvents = recentEvents.filter(e => 
      e.event === 'multiple_failed_attempts' || 
      e.event === 'suspicious_activity'
    ).length
    
    const highSeverityEvents = recentEvents.filter(e => 
      e.event === 'unauthorized_access' || 
      e.event === 'rate_limit_exceeded'
    ).length
    
    if (criticalEvents >= 3) return 'critical'
    if (criticalEvents >= 1 || highSeverityEvents >= 5) return 'high'
    if (highSeverityEvents >= 2) return 'medium'
    
    return 'low'
  }

  /**
   * Identify active security threats
   */
  private identifyActiveThreats(recentEvents: any[]): string[] {
    const threats: string[] = []
    const now = Date.now()
    const recentWindow = 600000 // 10 minutes
    
    const veryRecentEvents = recentEvents.filter(e => 
      (now - new Date(e.timestamp).getTime()) < recentWindow
    )
    
    if (veryRecentEvents.some(e => e.event === 'multiple_failed_attempts')) {
      threats.push('Brute force attack detected')
    }
    
    if (veryRecentEvents.some(e => e.event === 'suspicious_activity')) {
      threats.push('Suspicious user activity')
    }
    
    if (veryRecentEvents.filter(e => e.event === 'rate_limit_exceeded').length >= 3) {
      threats.push('Potential DDoS or automated attack')
    }
    
    if (veryRecentEvents.some(e => e.event === 'unauthorized_access')) {
      threats.push('Unauthorized access attempt')
    }
    
    return threats
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(recentEvents: any[], activeThreats: string[]): string[] {
    const recommendations: string[] = []
    
    if (activeThreats.length > 0) {
      recommendations.push('Review recent security events immediately')
      recommendations.push('Consider temporarily increasing rate limits')
    }
    
    const failedAttempts = recentEvents.filter(e => e.event.includes('failure')).length
    if (failedAttempts > 10) {
      recommendations.push('Consider implementing CAPTCHA for authentication')
      recommendations.push('Review and strengthen password policies')
    }
    
    const rateLimitEvents = recentEvents.filter(e => e.event === 'rate_limit_exceeded').length
    if (rateLimitEvents > 5) {
      recommendations.push('Consider implementing IP-based blocking')
      recommendations.push('Review rate limiting thresholds')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Security monitoring is active and healthy')
      recommendations.push('Continue monitoring for unusual patterns')
    }
    
    return recommendations
  }

  /**
   * Export security logs for analysis
   */
  exportSecurityLogs(): string {
    try {
      const criticalEvents = JSON.parse(localStorage.getItem('critical_security_events') || '[]')
      const dashboard = this.getSecurityDashboard()
      
      const exportData = {
        timestamp: new Date().toISOString(),
        events: criticalEvents,
        dashboard,
        version: '1.0'
      }
      
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export security logs:', error)
      return JSON.stringify({ error: 'Failed to export logs' }, null, 2)
    }
  }

  /**
   * Clear security logs (use with caution)
   */
  clearSecurityLogs(): void {
    try {
      localStorage.removeItem('critical_security_events')
      
      // Clear rate limit data
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('rate_limit_') || key.startsWith('advanced_rate_limit_') || key.startsWith('failed_attempts_')) {
          localStorage.removeItem(key)
        }
      })
      
      SecurityUtils.logSecurityEvent('auth_success', {
        action: 'security_logs_cleared',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to clear security logs:', error)
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance()