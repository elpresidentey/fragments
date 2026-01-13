import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { LoadingIndicator } from './loading-indicator';
import { Colors } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/types';

interface EditPostModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onSave: (content: string, imageUri?: string) => Promise<void>;
}

export function EditPostModal({ visible, post, onClose, onSave }: EditPostModalProps) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Initialize form when post changes
  useEffect(() => {
    if (post) {
      setContent(post.content);
      setSelectedImage(post.image_url || null);
    } else {
      setContent('');
      setSelectedImage(null);
    }
  }, [post]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(content.trim(), selectedImage || undefined);
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (post) {
      setContent(post.content);
      setSelectedImage(post.image_url || null);
    }
    onClose();
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const isValid = content.trim().length > 0;
  const characterCount = content.length;
  const maxCharacters = 280;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <ThemedText style={[styles.cancelText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={[styles.title, { color: colors.text }]}>
            Edit Post
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: isValid ? colors.primary : colors.border,
              },
            ]}
            onPress={handleSave}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <LoadingIndicator size="small" />
            ) : (
              <ThemedText style={styles.saveText}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Text Input */}
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="What's happening?"
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={maxCharacters}
              autoFocus
            />

            {/* Character Count */}
            <View style={styles.characterCountContainer}>
              <ThemedText
                style={[
                  styles.characterCount,
                  {
                    color: characterCount > maxCharacters * 0.9 
                      ? colors.error 
                      : colors.textSecondary,
                  },
                ]}
              >
                {characterCount}/{maxCharacters}
              </ThemedText>
            </View>

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.image}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                  onPress={handleRemoveImage}
                >
                  <ThemedText style={styles.removeImageText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Image Picker Button */}
            <TouchableOpacity
              style={[styles.imagePickerButton, { borderColor: colors.border }]}
              onPress={handleImagePicker}
              disabled={isLoading}
            >
              <ThemedText style={[styles.imagePickerText, { color: colors.primary }]}>
                📷 {selectedImage ? 'Change Image' : 'Add Image'}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 18,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  characterCount: {
    fontSize: 14,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
});