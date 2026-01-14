import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TwitterHeader } from '@/components/twitter-header';
import { LoadingIndicator } from '@/components/loading-indicator';
import { UploadProgress } from '@/components/progress-indicator';
import { CreatePostStateTransition } from '@/components/state-transition';
import { useThemeColor } from '@/hooks/use-theme-color';
import { postService } from '@/lib/services/post';
import { storageService } from '@/lib/services/storage';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { Colors, themeEngine } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/design-system/hooks/use-accessibility';
import { createSemanticLabel } from '@/design-system/utils/accessibility-utils';

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Animation refs
  const postButtonScale = useRef(new Animated.Value(1)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const characterCountColor = useRef(new Animated.Value(0)).current;

  const { state } = useAuth();
  const { showSuccess, showError } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const theme = themeEngine.getTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Accessibility hooks
  const { getAccessibilityProps, announceForAccessibility, isReduceMotionEnabled } = useAccessibility();

  // Navigation guard - redirect if not authenticated
  useEffect(() => {
    if (!state.isAuthenticated && !state.isLoading) {
      router.replace('/(auth)/login');
    }
  }, [state.isAuthenticated, state.isLoading]);

  // Character count color animation
  useEffect(() => {
    const ratio = content.length / 280;
    let targetValue = 0; // Normal color
    
    if (ratio > 0.9) {
      targetValue = 2; // Error color (over limit or very close)
    } else if (ratio > 0.75) {
      targetValue = 1; // Warning color
    }

    // Only animate if reduce motion is not enabled
    if (!isReduceMotionEnabled) {
      Animated.timing(characterCountColor, {
        toValue: targetValue,
        duration: theme.animations.timing.quick,
        useNativeDriver: false,
      }).start();
    } else {
      characterCountColor.setValue(targetValue);
    }
  }, [content.length, characterCountColor, theme.animations.timing.quick, isReduceMotionEnabled]);

  // Don't render content if not authenticated
  if (!state.isAuthenticated) {
    return <LoadingIndicator text="Checking authentication..." />;
  }

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Camera roll permissions are required to upload images');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      announceForAccessibility('Opening image picker');
      setIsUploadingImage(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Twitter-like aspect ratio
        quality: 1, // Get full quality, we'll compress during upload
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (50MB limit before compression)
        if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
          showError('Image size must be less than 50MB');
          announceForAccessibility('Image too large, please select a smaller image');
          setIsUploadingImage(false);
          return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (asset.mimeType && !validTypes.includes(asset.mimeType)) {
          showError('Please select a valid image file (JPEG, PNG, or WebP)');
          announceForAccessibility('Invalid image format, please select a JPEG, PNG, or WebP image');
          setIsUploadingImage(false);
          return;
        }

        setSelectedImage(asset.uri);
        setError(null);
        showSuccess('Image selected successfully');
        announceForAccessibility('Image selected and ready to post');
      }
    } catch (err) {
      console.error('Error picking image:', err);
      showError('Failed to select image');
      announceForAccessibility('Failed to select image, please try again');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const editImage = async () => {
    if (!selectedImage) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        showSuccess('Image updated successfully');
      }
    } catch (err) {
      console.error('Error editing image:', err);
      showError('Failed to edit image');
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedImage(null);
            setError(null);
            setUploadProgress(0);
            showSuccess('Image removed');
          },
        },
      ]
    );
  };

  const animatePostButton = () => {
    // Only animate if reduce motion is not enabled
    if (!isReduceMotionEnabled) {
      Animated.sequence([
        Animated.timing(postButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(postButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const showSuccessAnimation = () => {
    // Only animate if reduce motion is not enabled
    if (!isReduceMotionEnabled) {
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: theme.animations.timing.medium,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: theme.animations.timing.quick,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Just announce success without animation
      announceForAccessibility('Post created successfully');
    }
  };

  const handleCreatePost = async () => {
    // Clear any previous errors
    setError(null);

    // Validate content - allow posts with only images
    if (!content.trim() && !selectedImage) {
      showError('Please add some text or select an image');
      announceForAccessibility('Please add some text or select an image to create a post');
      return;
    }

    // Validate character limit
    if (content.length > 280) {
      showError('Post is too long. Please keep it under 280 characters.');
      announceForAccessibility('Post is too long, please reduce the text to under 280 characters');
      return;
    }

    announceForAccessibility('Creating post, please wait');
    animatePostButton();
    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if selected with progress tracking
      if (selectedImage) {
        setIsUploadingImage(true);
        setUploadProgress(0);
        announceForAccessibility('Uploading image');
        
        try {
          // Simulate progress updates for better UX
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 100);

          imageUrl = await storageService.uploadImage(selectedImage, selectedImage);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          announceForAccessibility('Image uploaded successfully');
          
          // Brief delay to show 100% progress
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          showError('Failed to upload image. Please try again.');
          announceForAccessibility('Failed to upload image, please try again');
          return;
        } finally {
          setIsUploadingImage(false);
          setUploadProgress(0);
        }
      }

      // Create post with content and optional image
      await postService.createPost(content.trim() || '', imageUrl);
      
      // Show success animation
      showSuccessAnimation();
      
      // Clear the form
      setContent('');
      setSelectedImage(null);
      
      // Show success message and navigate
      showSuccess('Post created successfully!');
      announceForAccessibility('Post created successfully, returning to home feed');
      
      // Navigate to home tab to see the new post
      router.push('/(tabs)');
    } catch (err) {
      console.error('Error creating post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      showError(errorMessage);
      announceForAccessibility(`Error creating post: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || selectedImage) {
      Alert.alert(
        'Discard Post',
        'Are you sure you want to discard this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setContent('');
              setSelectedImage(null);
              setError(null);
              showSuccess('Post discarded');
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const isPostValid = (content.trim() || selectedImage) && !isLoading && content.length <= 280;

  // Get character count color based on animation value
  const getCharacterCountColor = () => {
    return characterCountColor.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [colors.textSecondary, colors.warning || '#FF8C00', colors.error],
    });
  };

  // Render user avatar
  const renderAvatar = () => {
    if (state.user?.avatar_url) {
      return (
        <Image
          source={{ uri: state.user.avatar_url }}
          style={styles.avatar}
          contentFit="cover"
        />
      );
    }
    
    return (
      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
        <ThemedText style={styles.avatarText}>
          {state.user?.name?.charAt(0).toUpperCase() || 'U'}
        </ThemedText>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TwitterHeader 
        title="Compose"
        showBackButton
        onBackPress={handleCancel}
        rightComponent={
          <Animated.View style={{ transform: [{ scale: postButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.postButton,
                {
                  backgroundColor: isPostValid ? colors.primary : colors.border,
                },
              ]}
              onPress={handleCreatePost}
              disabled={!isPostValid}
              {...getAccessibilityProps({
                label: createSemanticLabel([
                  isPostValid ? 'Post' : 'Post button disabled',
                  content.trim() ? `Post content: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}` : undefined,
                  selectedImage ? 'with image' : undefined,
                  `${content.length} of 280 characters`,
                ]),
                hint: isPostValid ? 'Double tap to create your post' : 'Add content or image to enable posting',
                role: 'button',
                state: { disabled: !isPostValid },
              })}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={[
                  styles.postButtonText,
                  { color: isPostValid ? '#FFFFFF' : colors.textSecondary }
                ]}>
                  Post
                </ThemedText>
              )}
            </TouchableOpacity>
          </Animated.View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.formContainer}>
          {/* Twitter-like compose layout with avatar */}
          <View style={styles.composeRow}>
            {renderAvatar()}
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: textColor,
                    borderColor: error ? colors.error : 'transparent',
                  },
                ]}
                placeholder="What's happening?"
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  if (error) setError(null);
                }}
                multiline
                numberOfLines={6}
                maxLength={280}
                textAlignVertical="top"
                editable={!isLoading}
                autoFocus
                {...getAccessibilityProps({
                  label: createSemanticLabel([
                    'Post content text input',
                    `${content.length} of 280 characters used`,
                    content.length > 250 ? 'approaching character limit' : undefined,
                  ]),
                  hint: 'Type your post content here. Maximum 280 characters.',
                  role: 'text',
                })}
              />

              {/* Image Preview Section */}
              {selectedImage && (
                <View 
                  style={styles.imagePreviewContainer}
                  {...getAccessibilityProps({
                    label: 'Selected image preview',
                    role: 'image',
                  })}
                >
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    contentFit="cover"
                    {...getAccessibilityProps({
                      label: 'Preview of selected image for post',
                      role: 'image',
                    })}
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={[styles.imageActionButton, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}
                      onPress={editImage}
                      disabled={isLoading}
                      {...getAccessibilityProps({
                        label: 'Edit image',
                        hint: 'Double tap to edit the selected image',
                        role: 'button',
                        state: { disabled: isLoading },
                      })}
                    >
                      <ThemedText style={styles.imageActionText}>✏️</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageActionButton, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}
                      onPress={removeImage}
                      disabled={isLoading}
                      {...getAccessibilityProps({
                        label: 'Remove image',
                        hint: 'Double tap to remove the selected image',
                        role: 'button',
                        state: { disabled: isLoading },
                      })}
                    >
                      <ThemedText style={styles.imageActionText}>✕</ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Upload Progress */}
                  {isUploadingImage && (
                    <View 
                      style={styles.progressContainer}
                      {...getAccessibilityProps({
                        label: `Uploading image, ${uploadProgress}% complete`,
                        role: 'progressbar',
                      })}
                    >
                      <UploadProgress
                        progress={uploadProgress}
                        fileName="image"
                        onComplete={() => {
                          console.log('Upload complete');
                        }}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Bottom toolbar with media options and character count */}
          <View style={styles.toolbar}>
            <View style={styles.mediaOptions}>
              {!selectedImage && (
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={pickImage}
                  disabled={isLoading || isUploadingImage}
                  {...getAccessibilityProps({
                    label: 'Add image to post',
                    hint: 'Double tap to select an image from your photo library',
                    role: 'button',
                    state: { disabled: isLoading || isUploadingImage },
                  })}
                >
                  <ThemedText style={[styles.mediaButtonText, { color: colors.primary }]}>
                    📷
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Real-time character counter with color changes */}
            <Animated.View 
              style={styles.characterCount}
              {...getAccessibilityProps({
                label: `${content.length} of 280 characters used`,
                role: 'text',
              })}
            >
              <Animated.Text style={[
                styles.countText, 
                { color: getCharacterCountColor() }
              ]}>
                {content.length}/280
              </Animated.Text>
            </Animated.View>
          </View>

          {error && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {error}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      {/* Success Animation Overlay */}
      <Animated.View 
        style={[
          styles.successOverlay,
          {
            opacity: successAnimation,
            transform: [{
              scale: successAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }]
          }
        ]}
        pointerEvents="none"
      >
        <View style={[styles.successBadge, { backgroundColor: colors.success || colors.primary }]}>
          <ThemedText style={styles.successText}>✓ Posted!</ThemedText>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    flex: 1,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  inputContainer: {
    flex: 1,
  },
  textInput: {
    fontSize: 18,
    lineHeight: 24,
    minHeight: 120,
    maxHeight: 200,
    padding: 0,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  imagePreview: {
    width: Dimensions.get('window').width - 100, // Account for avatar and padding
    height: (Dimensions.get('window').width - 100) * 9 / 16, // 16:9 aspect ratio
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    borderRadius: 8,
    padding: 8,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginLeft: 60, // Align with text input
  },
  mediaOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 16,
  },
  mediaButtonText: {
    fontSize: 20,
  },
  characterCount: {
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    marginTop: 16,
    marginLeft: 60, // Align with text input
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  successBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});