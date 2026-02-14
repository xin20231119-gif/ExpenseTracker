import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

// Toast 类型
type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
}

interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast 展示组件
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [toastOpacity] = useState(new Animated.Value(0));
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Toast 动画
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });

    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [toastOpacity]);

  // 确认弹窗
  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirm({
      title,
      message,
      onConfirm,
      onCancel: () => setConfirm(null),
    });
    setConfirmVisible(true);
  }, []);

  const handleConfirm = () => {
    if (confirm?.onConfirm) {
      confirm.onConfirm();
    }
    setConfirmVisible(false);
    setConfirm(null);
  };

  const handleCancel = () => {
    setConfirmVisible(false);
    setConfirm(null);
  };

  const getToastStyle = () => {
    switch (toast?.type) {
      case 'success':
        return styles.toastSuccess;
      case 'error':
        return styles.toastError;
      default:
        return styles.toastInfo;
    }
  };

  const getToastIcon = () => {
    switch (toast?.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {/* Toast */}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            getToastStyle(),
            { opacity: toastOpacity }
          ]}
        >
          <Text style={styles.toastIcon}>{getToastIcon()}</Text>
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </Animated.View>
      )}
      {/* Confirm Overlay */}
      {confirmVisible && confirm && (
        <View style={styles.overlay} key="confirm-overlay">
          <TouchableOpacity
            style={styles.overlayBg}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>{confirm.title}</Text>
            <Text style={styles.confirmMessage}>{confirm.message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
              >
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.okBtn}
                onPress={handleConfirm}
              >
                <Text style={styles.okText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

// 使用 Toast 的 hook
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: '#34C759',
  },
  toastError: {
    backgroundColor: '#FF3B30',
  },
  toastInfo: {
    backgroundColor: '#007AFF',
  },
  toastIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2744',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#6B7A94',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7A94',
    fontWeight: '500',
  },
  okBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  okText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export { ToastProvider, useToast };
