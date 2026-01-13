import React, { useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  StyleSheet, 
  SafeAreaView,
  Dimensions 
} from 'react-native'
import { useToast, Toast } from '../contexts/toast-context'

interface ToastItemProps {
  toast: Toast
  onHide: (id: string) => void
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    // Auto-hide after duration
    const duration = toast.duration || 4000
    const timer = setTimeout(() => {
      hideToast()
    }, duration)

    return () => clearTimeout(timer)
  }, [])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id)
    })
  }

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return styles.successToast
      case 'error':
        return styles.errorToast
      case 'warning':
        return styles.warningToast
      case 'info':
      default:
        return styles.infoToast
    }
  }

  const getIconForType = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        getToastStyle(),
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <Text style={styles.toastIcon}>{getIconForType()}</Text>
        <Text style={styles.toastMessage}>{toast.message}</Text>
        {toast.action && (
          <TouchableOpacity
            style={styles.toastAction}
            onPress={() => {
              toast.action?.onPress()
              hideToast()
            }}
          >
            <Text style={styles.toastActionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export function ToastContainer() {
  const { state, hideToast } = useToast()

  if (state.toasts.length === 0) {
    return null
  }

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.toastList}>
        {state.toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onHide={hideToast}
          />
        ))}
      </View>
    </SafeAreaView>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastList: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  toastContainer: {
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  toastIcon: {
    fontSize: 18,
    marginRight: 12,
    color: 'white',
  },
  toastMessage: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    lineHeight: 20,
  },
  toastAction: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toastActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  warningToast: {
    backgroundColor: '#FF9800',
  },
  infoToast: {
    backgroundColor: '#2196F3',
  },
})