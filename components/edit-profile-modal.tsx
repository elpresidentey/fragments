import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { User as UserType } from '@/types';
import { Colors, typography as Typography, spacing as Spacing } from '@/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserType;
  onSave: (updatedUser: Partial<UserType>) => Promise<void>;
}

export function EditProfileModal({ visible, onClose, user, onSave }: EditProfileModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(user.name);
    setAvatarUrl(user.avatar_url || '');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              (!name.trim() || isSaving) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!name.trim() || isSaving}
          >
            <Text style={[
              styles.saveButtonText,
              (!name.trim() || isSaving) && { opacity: 0.5 }
            ]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cover Photo Area */}
          <View style={[styles.coverPhotoContainer, { backgroundColor: colors.primary }]}>
            <View style={styles.coverPhotoOverlay}>
              <TouchableOpacity style={styles.coverPhotoButton}>
                <Feather name="camera" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { borderColor: colors.background }]}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={[styles.avatarEditButton, { backgroundColor: colors.background }]}>
                <Feather name="camera" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Feather name="user" size={16} color={colors.primary} />
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Name
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                maxLength={50}
              />
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                {name.length}/50
              </Text>
            </View>

            {/* Avatar URL Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Feather name="globe" size={16} color={colors.primary} />
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Avatar URL (Optional)
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://example.com/avatar.jpg"
                placeholderTextColor={colors.textSecondary}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Bio Section (Future Enhancement) */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Bio (Coming Soon)
                </ThemedText>
              </View>
              <View style={[
                styles.textInput,
                styles.disabledInput,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}>
                <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                  Bio editing will be available in a future update
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
    width: 80,
  },
  headerTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: Typography.h3.fontWeight as any,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  coverPhotoContainer: {
    height: 120,
    position: 'relative',
  },
  coverPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    minHeight: 48,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  disabledInput: {
    opacity: 0.6,
  },
  disabledText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});