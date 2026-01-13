import { supabase } from '../supabase'
import { Comment } from '../../types'
import { SecurityUtils, AuthGuard } from '../security/security-utils'

export interface CommentService {
  createComment(postId: string, content: string): Promise<Comment>
  getComments(postId: string): Promise<Comment[]>
  updateComment(commentId: string, content: string): Promise<Comment>
  deleteComment(commentId: string): Promise<void>
  subscribeToCommentUpdates(postId: string, callback: (comments: Comment[]) => void): () => void
}

class CommentServiceImpl implements CommentService {
  /**
   * Create a new comment on a post
   */
  async createComment(postId: string, content: string): Promise<Comment> {
    try {
      // Validate input
      if (!postId || !content?.trim()) {
        throw new Error('Post ID and content are required')
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('You must be logged in to comment')
      }

      // Prepare comment data
      const commentData = {
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      }

      console.log('Creating comment:', commentData)

      // Insert comment into database
      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Comment creation error:', error)
        
        // If there's a relationship error, try without the join first
        if (error.message.includes('relationship') || error.message.includes('schema cache')) {
          console.log('Relationship error detected, trying without user join...')
          const { data: basicData, error: basicError } = await supabase
            .from('comments')
            .insert(commentData)
            .select()
            .single()

          if (basicError) {
            console.error('Basic insert also failed:', basicError)
            throw new Error('Comments table not found. Please set up the database first.')
          }

          if (basicData) {
            // Get user info separately
            const { data: userData } = await supabase
              .from('users')
              .select('name, avatar_url')
              .eq('id', user.id)
              .single()

            const comment: Comment = {
              id: basicData.id,
              post_id: basicData.post_id,
              user_id: basicData.user_id,
              content: basicData.content,
              created_at: basicData.created_at,
              updated_at: basicData.updated_at,
              user: {
                name: userData?.name || user.email?.split('@')[0] || 'Unknown User',
                avatar_url: userData?.avatar_url || null,
              },
            }
            return comment
          }
        }
        
        // Enhanced error handling
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          throw new Error('You do not have permission to create comments. Please sign in again.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        } else if (error.message.includes('does not exist') || error.message.includes('schema cache') || error.code === '42P01') {
          // Try to refresh the schema cache by making a simple query first
          console.log('Attempting to refresh schema cache...')
          try {
            await supabase.from('comments').select('count', { count: 'exact', head: true })
            // If this succeeds, retry the original operation once
            console.log('Schema cache refreshed, retrying comment creation...')
            const { data: retryData, error: retryError } = await supabase
              .from('comments')
              .insert(commentData)
              .select(`
                *,
                user:users (
                  name,
                  avatar_url
                )
              `)
              .single()
            
            if (retryError) {
              throw new Error('Comments table not found. Please set up the database first.')
            }
            
            // Use the retry data if successful
            if (retryData) {
              const comment: Comment = {
                id: retryData.id,
                post_id: retryData.post_id,
                user_id: retryData.user_id,
                content: retryData.content,
                created_at: retryData.created_at,
                updated_at: retryData.updated_at,
                user: {
                  name: retryData.user?.name || 'Unknown User',
                  avatar_url: retryData.user?.avatar_url || null,
                },
              }
              return comment
            }
          } catch (cacheError) {
            console.error('Schema cache refresh failed:', cacheError)
          }
          throw new Error('Comments table not found. Please set up the database first.')
        }
        throw new Error(`Failed to create comment: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from comment creation')
      }

      console.log('Comment created successfully:', data)

      // Transform the response to match our Comment interface
      const comment: Comment = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          name: data.user?.name || 'Unknown User',
          avatar_url: data.user?.avatar_url || null,
        },
      }

      return comment
    } catch (error) {
      console.error('Error in createComment:', error)
      throw error
    }
  }

  /**
   * Get all comments for a specific post
   */
  async getComments(postId: string): Promise<Comment[]> {
    try {
      if (!postId) {
        throw new Error('Post ID is required')
      }

      console.log('Getting comments for post:', postId)

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }) // Show oldest comments first

      if (error) {
        console.error('Error getting comments:', error)
        
        // If there's a relationship error, try without the join
        if (error.message.includes('relationship') || error.message.includes('schema cache')) {
          console.log('Relationship error detected, trying without user join...')
          const { data: basicData, error: basicError } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

          if (basicError) {
            console.error('Basic query also failed:', basicError)
            if (basicError.message.includes('does not exist') || basicError.code === '42P01') {
              console.warn('Comments table does not exist yet, returning empty array')
              return []
            }
            console.warn('Unexpected error getting comments, returning empty array:', basicError.message)
            return []
          }

          if (basicData) {
            // Get unique user IDs and fetch user info separately
            const userIds = [...new Set(basicData.map(comment => comment.user_id))]
            const { data: usersData } = await supabase
              .from('users')
              .select('id, name, avatar_url')
              .in('id', userIds)

            // Create a map of user info
            const usersMap = new Map()
            usersData?.forEach(user => {
              usersMap.set(user.id, user)
            })

            // Transform the response to match our Comment interface
            const comments: Comment[] = basicData.map((item: any) => {
              const userInfo = usersMap.get(item.user_id)
              return {
                id: item.id,
                post_id: item.post_id,
                user_id: item.user_id,
                content: item.content,
                created_at: item.created_at,
                updated_at: item.updated_at,
                user: {
                  name: userInfo?.name || 'Unknown User',
                  avatar_url: userInfo?.avatar_url || null,
                },
              }
            })

            return comments
          }
        }
        
        // If table doesn't exist, return empty array instead of throwing
        if (error.message.includes('does not exist') || error.message.includes('schema cache') || error.code === '42P01') {
          console.warn('Comments table does not exist yet, returning empty array')
          return []
        }
        
        // Enhanced error handling for other errors
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          throw new Error('You do not have permission to view comments. Please sign in again.')
        }
        
        // For any other error, log it but return empty array to prevent app crashes
        console.warn('Unexpected error getting comments, returning empty array:', error.message)
        return []
      }

      if (!data) {
        return []
      }

      console.log('Comments loaded:', data.length)

      // Transform the response to match our Comment interface
      const comments: Comment[] = data.map((item: any) => ({
        id: item.id,
        post_id: item.post_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          name: item.user?.name || 'Unknown User',
          avatar_url: item.user?.avatar_url || null,
        },
      }))

      return comments
    } catch (error) {
      console.error('Error in getComments:', error)
      throw error
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    return SecurityUtils.secureOperation(async () => {
      // Validate input
      if (!commentId || !content?.trim()) {
        throw new Error('Comment ID and content are required')
      }

      // Validate and sanitize content
      const validation = SecurityUtils.validatePostData(content.trim())
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid comment content')
      }

      // Get current user ID securely
      const userId = await AuthGuard.getCurrentUserId()

      // Get the existing comment to check ownership
      const { data: existingComment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !existingComment) {
        throw new Error('Comment not found')
      }

      // Check if user owns the comment
      await AuthGuard.requireResourceOwnership(existingComment.user_id)

      // Check permissions
      const permission = await SecurityUtils.canPerformAction('update', 'comment', existingComment.user_id)
      if (!permission.allowed) {
        SecurityUtils.logSecurityEvent('unauthorized_access', { 
          action: 'update_comment',
          userId,
          commentId,
          resourceUserId: existingComment.user_id 
        })
        throw new Error(permission.message || 'Permission denied')
      }

      // Update comment in database
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: validation.sanitizedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
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
            action: 'update_comment',
            userId,
            commentId,
            error: error.message 
          })
          throw new Error('You do not have permission to update this comment.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        }
        throw new Error(`Failed to update comment: ${error.message}`)
      }

      if (!data) {
        throw new Error('Comment not found or you do not have permission to update it')
      }

      // Transform the response to match our Comment interface
      const comment: Comment = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          name: data.user?.name || 'Unknown User',
          avatar_url: data.user?.avatar_url || null,
        },
      }

      SecurityUtils.logSecurityEvent('auth_success', { 
        action: 'update_comment',
        userId,
        commentId: comment.id 
      })

      return comment
    }, {
      requireAuth: true,
      rateLimitKey: 'update_comment',
      maxAttempts: 20 // Allow 20 updates per minute
    })
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    return SecurityUtils.secureOperation(async () => {
      if (!commentId) {
        throw new Error('Comment ID is required')
      }

      // Get current user ID securely
      const userId = await AuthGuard.getCurrentUserId()

      // Get the existing comment to check ownership
      const { data: existingComment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !existingComment) {
        throw new Error('Comment not found')
      }

      // Check if user owns the comment
      await AuthGuard.requireResourceOwnership(existingComment.user_id)

      // Check permissions
      const permission = await SecurityUtils.canPerformAction('delete', 'comment', existingComment.user_id)
      if (!permission.allowed) {
        SecurityUtils.logSecurityEvent('unauthorized_access', { 
          action: 'delete_comment',
          userId,
          commentId,
          resourceUserId: existingComment.user_id 
        })
        throw new Error(permission.message || 'Permission denied')
      }

      // Delete comment from database
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId) // Double-check ownership

      if (error) {
        // Enhanced error handling
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          SecurityUtils.logSecurityEvent('unauthorized_access', { 
            action: 'delete_comment',
            userId,
            commentId,
            error: error.message 
          })
          throw new Error('You do not have permission to delete this comment.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        }
        throw new Error(`Failed to delete comment: ${error.message}`)
      }

      SecurityUtils.logSecurityEvent('auth_success', { 
        action: 'delete_comment',
        userId,
        commentId 
      })
    }, {
      requireAuth: true,
      rateLimitKey: 'delete_comment',
      maxAttempts: 10 // Allow 10 deletions per minute
    })
  }

  /**
   * Subscribe to real-time comment updates for a specific post
   */
  subscribeToCommentUpdates(postId: string, callback: (comments: Comment[]) => void): () => void {
    let subscription: any = null;
    let isSubscribed = false;

    try {
      // Set up real-time subscription for comments on this post
      subscription = supabase
        .channel(`comments_${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`,
          },
          async (payload) => {
            console.log('Real-time comment update:', payload)
            
            // Only process updates if we're still subscribed
            if (!isSubscribed) return;
            
            // When we receive an update, fetch fresh comments and call the callback
            try {
              const comments = await this.getComments(postId)
              callback(comments)
            } catch (error) {
              console.error('Error fetching comments after real-time update:', error)
              // Don't throw here - just log the error to avoid breaking the subscription
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time comment subscription status:', status)
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
          } else if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Real-time comment subscription error')
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
            console.warn('Error unsubscribing from real-time comment updates:', error)
          } finally {
            subscription = null;
          }
        }
      }
    } catch (error) {
      console.error('Error setting up real-time comment subscription:', error)
      // Return a no-op unsubscribe function
      return () => {}
    }
  }
}

// Export singleton instance
export const commentService = new CommentServiceImpl()
export default commentService