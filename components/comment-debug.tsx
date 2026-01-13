import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { commentService } from '@/lib/services/comment';
import { useAuth } from '@/contexts/auth-context';

interface CommentDebugProps {
  postId: string;
}

export function CommentDebug({ postId }: CommentDebugProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const { state: authState } = useAuth();

  const testCreateComment = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('Testing comment creation...');
      console.log('Post ID:', postId);
      console.log('User:', authState.user);
      
      const comment = await commentService.createComment(postId, 'Test comment from debug component');
      setResult(`✅ Success: Comment created with ID ${comment.id}`);
      console.log('Comment created:', comment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMessage}`);
      console.error('Comment creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetComments = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('Testing get comments...');
      const comments = await commentService.getComments(postId);
      setResult(`✅ Success: Found ${comments.length} comments`);
      console.log('Comments:', comments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMessage}`);
      console.error('Get comments failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comment Debug Panel</Text>
      <Text style={styles.info}>Post ID: {postId}</Text>
      <Text style={styles.info}>User: {authState.user?.email || 'Not logged in'}</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testGetComments}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Get Comments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.createButton]} 
          onPress={testCreateComment}
          disabled={isLoading || !authState.user}
        >
          <Text style={styles.buttonText}>Test Create Comment</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && <Text style={styles.loading}>Loading...</Text>}
      {result && (
        <View style={styles.result}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  createButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  result: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
});