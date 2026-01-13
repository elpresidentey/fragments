import { supabase } from '../supabase'
import { StorageService } from '../../types'

class StorageServiceImpl implements StorageService {
  private readonly BUCKET_NAME = 'post-images'

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Create a unique file path
      const fileExt = path.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Convert URI to blob for upload
      const response = await fetch(uri)
      const blob = await response.blob()

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from image upload')
      }

      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  /**
   * Get the public URL for an image
   */
  async getImageUrl(path: string): Promise<string> {
    try {
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(path)

      return data.publicUrl
    } catch (error) {
      console.error('Error getting image URL:', error)
      throw error
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(path: string): Promise<void> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Extract the file path from the full URL if needed
      const filePath = path.includes('/') ? path.split('/').slice(-2).join('/') : path

      // Delete file from Supabase Storage
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath])

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  /**
   * Create the storage bucket if it doesn't exist (for setup)
   */
  async createBucket(): Promise<void> {
    try {
      const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      })

      if (error && !error.message.includes('already exists')) {
        throw new Error(`Failed to create storage bucket: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating storage bucket:', error)
      throw error
    }
  }
}

// Export singleton instance
export const storageService = new StorageServiceImpl()
export default storageService