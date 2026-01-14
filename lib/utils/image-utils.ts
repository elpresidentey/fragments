/**
 * Image utility functions for compression and optimization
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: SaveFormat;
}

export interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
  size: number; // in bytes
}

/**
 * Compress and optimize an image
 */
export async function compressImage(
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = SaveFormat.JPEG,
  } = options;

  try {
    // Manipulate the image
    const manipResult = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format,
      }
    );

    // Get file size
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      size: blob.size,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Pick an image from the library with automatic compression
 */
export async function pickAndCompressImage(
  options: ImageCompressionOptions = {}
): Promise<OptimizedImage | null> {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera roll permissions are required');
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1, // Get full quality first, we'll compress it
      base64: false,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];

    // Validate file size before compression (50MB limit)
    if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
      throw new Error('Image size must be less than 50MB');
    }

    // Compress the image
    const compressed = await compressImage(asset.uri, options);

    // Ensure compressed image is under 5MB
    if (compressed.size > 5 * 1024 * 1024) {
      // Try again with lower quality
      return await compressImage(asset.uri, {
        ...options,
        quality: 0.6,
      });
    }

    return compressed;
  } catch (error) {
    console.error('Error picking and compressing image:', error);
    throw error;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Validate image file
 */
export function validateImage(asset: ImagePicker.ImagePickerAsset): {
  valid: boolean;
  error?: string;
} {
  // Check file size (5MB limit after compression)
  if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Image size must be less than 50MB',
    };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (asset.mimeType && !validTypes.includes(asset.mimeType)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)',
    };
  }

  return { valid: true };
}
