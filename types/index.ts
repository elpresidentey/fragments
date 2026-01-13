export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  created_at: string
  updated_at: string
  user: {
    name: string
    avatar_url?: string
  }
}

// Enhanced Post interface with engagement data and user handles
export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user: {
    name: string
    avatar_url?: string
  }
}

export interface EnhancedPost extends Omit<Post, 'user'> {
  engagement?: {
    likes: number;
    retweets: number;
    comments: number;
    isLiked?: boolean;
    isRetweeted?: boolean;
  };
  user: {
    name: string;
    handle?: string;  // Twitter-like handle
    avatar_url?: string;
    verified?: boolean; // Verification badge
  };
}

export interface AuthResult {
  user: User | null
  session: any | null
  error: AuthError | null
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthService {
  signUp(email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  onAuthStateChange(callback: (user: User | null) => void): () => void
  requestPasswordReset(email: string): Promise<{ success: boolean; message: string }>
  resetPassword(newPassword: string): Promise<{ success: boolean; message: string }>
  validateResetToken(): Promise<{ valid: boolean; expired: boolean; message: string }>
}

export interface PostService {
  createPost(content: string, imageUri?: string): Promise<Post>
  getPosts(limit?: number, offset?: number): Promise<Post[]>
  getUserPosts(userId: string): Promise<Post[]>
  subscribeToPostUpdates(callback: (posts: Post[]) => void): () => void
}

export interface StorageService {
  uploadImage(uri: string, path: string): Promise<string>
  getImageUrl(path: string): Promise<string>
  deleteImage(path: string): Promise<void>
}