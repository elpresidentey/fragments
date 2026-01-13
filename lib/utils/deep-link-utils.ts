/**
 * Deep Link Utilities for Password Reset
 * Handles parsing and validation of deep link URLs for password reset functionality
 */

export interface DeepLinkParams {
  accessToken?: string
  refreshToken?: string
  type?: string
  error?: string
  errorDescription?: string
}

export interface ParsedDeepLink {
  isPasswordReset: boolean
  params: DeepLinkParams
  isValid: boolean
  errorMessage?: string
}

/**
 * Parse a deep link URL and extract password reset parameters
 */
export function parsePasswordResetDeepLink(url: string): ParsedDeepLink {
  try {
    console.log('Parsing deep link URL:', url)
    
    // Check if this is a password reset URL
    const isPasswordReset = url.includes('reset-password') || 
                           url.includes('type=recovery') ||
                           url.includes('#access_token=')
    
    if (!isPasswordReset) {
      return {
        isPasswordReset: false,
        params: {},
        isValid: false
      }
    }
    
    // Parse the URL to extract parameters
    const urlObj = new URL(url)
    
    // Supabase sends tokens in the hash fragment for security
    const hashParams = new URLSearchParams(urlObj.hash?.substring(1) || '')
    const searchParams = new URLSearchParams(urlObj.search)
    
    // Extract parameters from both hash and search params
    const params: DeepLinkParams = {
      accessToken: hashParams.get('access_token') || searchParams.get('access_token') || undefined,
      refreshToken: hashParams.get('refresh_token') || searchParams.get('refresh_token') || undefined,
      type: hashParams.get('type') || searchParams.get('type') || undefined,
      error: hashParams.get('error') || searchParams.get('error') || undefined,
      errorDescription: hashParams.get('error_description') || searchParams.get('error_description') || undefined
    }
    
    console.log('Extracted parameters:', params)
    
    // Validate the parameters
    const validation = validatePasswordResetParams(params)
    
    return {
      isPasswordReset: true,
      params,
      isValid: validation.isValid,
      errorMessage: validation.errorMessage
    }
    
  } catch (error) {
    console.error('Error parsing deep link URL:', error)
    
    return {
      isPasswordReset: url.includes('reset-password') || url.includes('type=recovery'),
      params: {
        error: 'parse_error',
        errorDescription: 'Unable to parse the reset link properly'
      },
      isValid: false,
      errorMessage: 'Invalid URL format'
    }
  }
}

/**
 * Validate password reset parameters
 */
export function validatePasswordResetParams(params: DeepLinkParams): { isValid: boolean; errorMessage?: string } {
  // If there's an explicit error, it's invalid but we should handle it
  if (params.error) {
    return {
      isValid: false,
      errorMessage: getErrorMessage(params.error, params.errorDescription)
    }
  }
  
  // For password reset, we need access token and refresh token
  if (!params.accessToken || !params.refreshToken) {
    return {
      isValid: false,
      errorMessage: 'Missing required authentication tokens'
    }
  }
  
  // Check if type is recovery (for password reset)
  if (params.type !== 'recovery') {
    return {
      isValid: false,
      errorMessage: 'Invalid link type for password reset'
    }
  }
  
  return { isValid: true }
}

/**
 * Get user-friendly error message for deep link errors
 */
export function getErrorMessage(error: string, description?: string): string {
  switch (error) {
    case 'invalid_token':
      return 'The reset link is missing required authentication information.'
    case 'parse_error':
      return 'The reset link format is invalid.'
    case 'expired':
      return 'This reset link has expired. Please request a new password reset.'
    case 'access_denied':
      return 'Access denied. The reset link may have been used already.'
    case 'invalid_request':
      return 'The reset link is malformed or invalid.'
    case 'server_error':
      return 'A server error occurred. Please try again later.'
    default:
      return description || 'This password reset link is invalid or has expired.'
  }
}

/**
 * Check if a token is expired based on timestamp
 */
export function isTokenExpired(tokenTimestamp: number, maxAgeMs: number = 3600000): boolean {
  const tokenAge = Date.now() - tokenTimestamp
  return tokenAge > maxAgeMs
}

/**
 * Format time remaining for user display
 */
export function formatTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now()
  
  if (remaining <= 0) {
    return 'expired'
  }
  
  const minutes = Math.ceil(remaining / 60000)
  
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  
  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

/**
 * Generate navigation parameters for reset password screen
 */
export function generateResetPasswordParams(parsedLink: ParsedDeepLink): Record<string, string> {
  const navParams: Record<string, string> = {}
  
  if (parsedLink.params.accessToken) {
    navParams.accessToken = parsedLink.params.accessToken
  }
  
  if (parsedLink.params.refreshToken) {
    navParams.refreshToken = parsedLink.params.refreshToken
  }
  
  if (parsedLink.params.type) {
    navParams.type = parsedLink.params.type
  }
  
  if (parsedLink.params.error) {
    navParams.error = parsedLink.params.error
  }
  
  if (parsedLink.params.errorDescription) {
    navParams.errorDescription = parsedLink.params.errorDescription
  }
  
  return navParams
}

/**
 * Log deep link events for debugging and security monitoring
 */
export function logDeepLinkEvent(event: string, data: any): void {
  console.log(`[DeepLink] ${event}:`, data)
  
  // In production, you might want to send this to analytics or monitoring service
  if (__DEV__) {
    console.table(data)
  }
}