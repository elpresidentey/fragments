import { supabase } from '../supabase'
import { Post, PostService } from '../../types'
import { SecurityUtils, AuthGuard } from '../security/security-utils'

class PostServiceImpl implements PostService {
  /**
   * Create a new post with content and optional image
   */
  async createPost(content: string, imageUri?: string): Promise<Post> {
    return SecurityUtils.secureOperation(async () => {
      // Validate and sanitize input
      const validation = SecurityUtils.validatePostData(content, imageUri)
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid post data')
      }

      // Get current user ID securely
      const userId = await AuthGuard.getCurrentUserId()

      // Check permissions
      const permission = await SecurityUtils.canPerformAction('create', 'post')
      if (!permission.allowed) {
        throw new Error(permission.message || 'Permission denied')
      }

      // Prepare post data with sanitized content
      const postData: any = {
        user_id: userId,
        content: validation.sanitizedContent,
        image_url: imageUri || null,
      }

      // Insert post into database
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        // Enhanced error handling
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          SecurityUtils.logSecurityEvent('unauthorized_access', { 
            action: 'create_post', 
            userId,
            error: error.message 
          })
          throw new Error('You do not have permission to create posts. Please sign in again.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        } else if (error.message.includes('does not exist')) {
          throw new Error('Database not properly configured. Please contact support.')
        }
        throw new Error(`Failed to create post: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from post creation')
      }

      // Transform the response to match our Post interface
      const post: Post = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        image_url: data.image_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          name: data.user?.name || 'Unknown User',
          avatar_url: data.user?.avatar_url || null,
        },
      }

      SecurityUtils.logSecurityEvent('auth_success', { 
        action: 'create_post', 
        userId,
        postId: post.id 
      })

      return post
    }, {
      requireAuth: true,
      rateLimitKey: 'create_post',
      maxAttempts: 10 // Allow 10 posts per minute
    })
  }

  /**
   * Get posts with pagination support
   */
  async getPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    return SecurityUtils.secureOperation(async () => {
      // Check permissions
      const permission = await SecurityUtils.canPerformAction('read', 'post')
      if (!permission.allowed) {
        throw new Error(permission.message || 'Permission denied')
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Posts table does not exist yet, returning empty array')
          return []
        }
        
        // Enhanced error handling
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          SecurityUtils.logSecurityEvent('unauthorized_access', { 
            action: 'get_posts',
            error: error.message 
          })
          throw new Error('You do not have permission to view posts. Please sign in again.')
        }
        
        throw new Error(`Failed to fetch posts: ${error.message}`)
      }

      if (!data) {
        return []
      }

      // Transform the response to match our Post interface
      const posts: Post[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        content: item.content,
        image_url: item.image_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          name: item.user?.name || 'Unknown User',
          avatar_url: item.user?.avatar_url || null,
        },
      }))

      return posts
    }, {
      requireAuth: true,
      rateLimitKey: 'get_posts',
      maxAttempts: 120 // Allow 120 requests per minute (2 per second)
    })
  }

  /**
   * Get posts for a specific user
   */
  async getUserPosts(userId: string): Promise<Post[]> {
    return SecurityUtils.secureOperation(async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }

      // Check permissions
      const permission = await SecurityUtils.canPerformAction('read', 'post')
      if (!permission.allowed) {
        throw new Error(permission.message || 'Permission denied')
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Posts table does not exist yet, returning empty array')
          return []
        }
        
        // Enhanced error handling
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          SecurityUtils.logSecurityEvent('unauthorized_access', { 
            action: 'get_user_posts',
            targetUserId: userId,
            error: error.message 
          })
          throw new Error('You do not have permission to view user posts. Please sign in again.')
        }
        
        throw new Error(`Failed to fetch user posts: ${error.message}`)
      }

      if (!data) {
        return []
      }

      // Transform the response to match our Post interface
      const posts: Post[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        content: item.content,
        image_url: item.image_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          name: item.user?.name || 'Unknown User',
          avatar_url: item.user?.avatar_url || null,
        },
      }))

      return posts
    }, {
      requireAuth: true,
      rateLimitKey: 'get_user_posts',
      maxAttempts: 120 // Allow 120 requests per minute (2 per second)
    })
  }

  /**
   * Subscribe to real-time post updates
   */
  subscribeToPostUpdates(callback: (posts: Post[]) => void): () => void {
    let subscription: any = null;
    let isSubscribed = false;

    try {
      // Set up real-time subscription for posts
      subscription = supabase
        .channel('posts_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'posts',
          },
          async (payload) => {
            console.log('Real-time post update:', payload)
            
            // Only process updates if we're still subscribed
            if (!isSubscribed) return;
            
            // When we receive an update, fetch fresh posts and call the callback
            try {
              const posts = await this.getPosts()
              callback(posts)
            } catch (error) {
              console.error('Error fetching posts after real-time update:', error)
              // Don't throw here - just log the error to avoid breaking the subscription
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status)
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
          } else if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Real-time subscription error')
            isSubscribed = false;
          } else if (status === 'CLOSED') {
            isSubscribed = false;
          }
        })

      // Return unsubscribe function with proper cleanup
      return () => {
        isSubscribed = false;
        
        if (subscription) {
          try {
            // Check if the subscription is in a valid state before removing
            const currentStatus = subscription.state;
            if (currentStatus && currentStatus !== 'closed') {
              supabase.removeChannel(subscription)
            }
          } catch (error) {
            console.warn('Error unsubscribing from real-time updates:', error)
          } finally {
            subscription = null;
          }
        }
      }
    } catch (error) {
      console.error('Error setting up real-time subscription:', error)
      // Return a no-op unsubscribe function
      return () => {}
    }
  }

  /**
   * Update an existing post (for future use)
   */
  async updatePost(postId: string, content: string, imageUri?: string): Promise<Post> {
    return SecurityUtils.secureOperation(async () => {
      // Validate and sanitize input
      const validation = SecurityUtils.validatePostData(content, imageUri)
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid post data')
      }

      // Get current user ID securely
      const userId = await AuthGuard.getCurrentUserId()

      // Get the existing post to check ownership
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (fetchError || !existingPost) {
        throw new Error('Post not found')
      }

      // Check if user owns the post
      await AuthGuard.requireResourceOwnership(existingPost.user_id)

      // Check permissions
      const permission = await SecurityUtils.canPerformAction('update', 'post', existingPost.user_id)
      if (!permission.allowed) {
        SecurityUtils.logSecurityEvent('unauthorized_access', { 
          action: 'update_post',
          userId,
          postId,
          resourceUserId: existingPost.user_id 
        })
        throw new Error(permission.message || 'Permission denied')
      }

      // Update post in database
      const { data, error } = await supabase
        .from('posts')
        .update({
          content: validation.sanitizedContent,
          image_url: imageUri || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', userId) // Double-check ownership
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        // Enhanced error handling
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          SecurityUtils.logSecurityEvent('unauthorized_access', { 
            action: 'update_post',
            userId,
            postId,
            error: error.message 
          })
          throw new Error('You do not have permission to update this post.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        }
        throw new Error(`Failed to update post: ${error.message}`)
      }

      if (!data) {
        throw new Error('Post not found or you do not have permission to update it')
      }

      // Transform the response to match our Post interface
      const post: Post = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        image_url: data.image_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          name: data.user?.name || 'Unknown User',
          avatar_url: data.user?.avatar_url || null,
        },
      }

      SecurityUtils.logSecurityEvent('auth_success', { 
        action: 'update_post',
        userId,
        postId: post.id 
      })

      return post
    }, {
      requireAuth: true,
      rateLimitKey: 'update_post',
      maxAttempts: 20 // Allow 20 updates per minute
    })
  }

  /**
   * Delete a post (for future use)
   */
  async deletePost(postId: string): Promise<void> {
    return SecurityUtils.secureOperation(async () => {
      // Get current user ID securely
      const userId = await AuthGuard.getCurrentUserId()

      // Get the existing post to check ownership
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (fetchError || !existingPost) {
        throw new Error('Post not found')
      }

      // Check if user owns the post
      await AuthGuard.requireResourceOwnership(existingPost.user_id)

      // Check permissions
      const permission = await SecurityUtils.canPerformAction('delete', 'post', existingPost.user_id)
      if (!permission.allowed) {
        SecurityUtils.logSecurityEvent('unauthorized_access', { 
          action: 'delete_post',
          userId,
          postId,
          resourceUserId: existingPost.user_id 
        })
        throw new Error(permission.message || 'Permission denied')
      }

      // Delete post from database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId) // Double-check ownership

      if (error) {
        // Enhanced error handling
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          SecurityUtils.logSecurityEvent('unauthorized_access', { 
            action: 'delete_post',
            userId,
            postId,
            error: error.message 
          })
          throw new Error('You do not have permission to delete this post.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        }
        throw new Error(`Failed to delete post: ${error.message}`)
      }

      SecurityUtils.logSecurityEvent('auth_success', { 
        action: 'delete_post',
        userId,
        postId 
      })
    }, {
      requireAuth: true,
      rateLimitKey: 'delete_post',
      maxAttempts: 10 // Allow 10 deletions per minute
    })
  }
}

// Export singleton instance
export const postService = new PostServiceImpl()
export default postService