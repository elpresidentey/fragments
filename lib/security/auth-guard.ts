import { authService } from '../services/auth'

/**
 * Authorization guard utility for protecting operations
 */
export class AuthGuard {
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await authService.getCurrentUser()
      return user !== null
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  }

  /**
   * Require authentication for an operation
   * Throws error if user is not authenticated
   */
  static async requireAuth(): Promise<void> {
    const isAuth = await this.isAuthenticated()
    if (!isAuth) {
      throw new Error('Authentication required. Please sign in to continue.')
    }
  }

  /**
   * Check if user owns a resource
   */
  static async isResourceOwner(resourceUserId: string): Promise<boolean> {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        return false
      }
      return currentUser.id === resourceUserId
    } catch (error) {
      console.error('Resource ownership check failed:', error)
      return false
    }
  }

  /**
   * Require resource ownership for an operation
   * Throws error if user doesn't own the resource
   */
  static async requireResourceOwnership(resourceUserId: string): Promise<void> {
    await this.requireAuth()
    
    const isOwner = await this.isResourceOwner(resourceUserId)
    if (!isOwner) {
      throw new Error('You do not have permission to perform this action.')
    }
  }

  /**
   * Get current user ID safely
   */
  static async getCurrentUserId(): Promise<string> {
    await this.requireAuth()
    
    const user = await authService.getCurrentUser()
    if (!user) {
      throw new Error('Unable to get current user ID')
    }
    
    return user.id
  }
}