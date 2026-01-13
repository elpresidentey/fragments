import { supabase } from '../supabase'
import { User } from '../../types'
import { InputValidator, SecurityUtils } from '../security/security-utils'

export interface UserUpdateData {
  name?: string
  avatar_url?: string
}

export interface UserService {
  updateProfile(userId: string, updates: UserUpdateData): Promise<{ success: boolean; user?: User; error?: string }>
  getUserProfile(userId: string): Promise<{ success: boolean; user?: User; error?: string }>
}

class SupabaseUserService implements UserService {
  async updateProfile(userId: string, updates: UserUpdateData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Updating user profile:', { userId, updates })

      // Validate input data
      if (!userId) {
        return { success: false, error: 'User ID is required' }
      }

      // Validate and sanitize updates
      const sanitizedUpdates: UserUpdateData = {}
      
      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          return { success: false, error: 'Name cannot be empty' }
        }
        
        if (updates.name.length > 50) {
          return { success: false, error: 'Name must be 50 characters or less' }
        }
        
        sanitizedUpdates.name = InputValidator.sanitizeText(updates.name.trim())
      }

      if (updates.avatar_url !== undefined) {
        if (updates.avatar_url && !InputValidator.isValidUrl(updates.avatar_url)) {
          return { success: false, error: 'Please enter a valid avatar URL' }
        }
        sanitizedUpdates.avatar_url = updates.avatar_url?.trim() || undefined
      }

      // Add updated timestamp
      const updateData = {
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      }

      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        
        // Handle specific database errors
        if (error.code === 'PGRST116') {
          return { success: false, error: 'User profile not found' }
        }
        
        if (error.message.includes('users_pkey')) {
          return { success: false, error: 'Invalid user ID' }
        }
        
        return { success: false, error: 'Failed to update profile. Please try again.' }
      }

      if (!data) {
        return { success: false, error: 'No data returned from update' }
      }

      // Log successful profile update
      SecurityUtils.logSecurityEvent('profile_update', {
        userId,
        updatedFields: Object.keys(sanitizedUpdates)
      })

      console.log('Profile updated successfully:', data)
      return { success: true, user: data as User }

    } catch (error) {
      console.error('Profile update exception:', error)
      
      // Handle network errors
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        return { success: false, error: 'Network error. Please check your connection and try again.' }
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }
    }
  }

  async getUserProfile(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' }
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Get user profile error:', error)
        
        if (error.code === 'PGRST116') {
          return { success: false, error: 'User profile not found' }
        }
        
        return { success: false, error: 'Failed to load user profile' }
      }

      return { success: true, user: data as User }

    } catch (error) {
      console.error('Get user profile exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }
    }
  }
}

export const userService = new SupabaseUserService()